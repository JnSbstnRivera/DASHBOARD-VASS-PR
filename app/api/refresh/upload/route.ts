/**
 * POST /api/refresh/upload
 *
 * Recibe VASS.xlsx y carga:
 *   - "VENTAS VASS"            → vass.ventas
 *   - "ENERO"/"FEBRERO"/...    → vass.seguimiento (consolidado, con hoja_origen)
 *   - "APOYO VENTAS"           → vass.apoyo_ventas
 *
 * Filtra solo registros con fecha >= 2026-01-01.
 * Normaliza headers de pestañas mensuales (ASESOR/ASCESOR/AGENTE → asesor).
 */
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MESES_2026 = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const CORTE_2026 = "2026-01-01";

function serialToISO(s: unknown): string | null {
  if (typeof s !== "number") return null;
  const date = new Date(Date.UTC(1899, 11, 30) + s * 86400000);
  if (isNaN(date.getTime()) || date.getUTCFullYear() < 2000) return null;
  return date.toISOString().slice(0, 10);
}
function asText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.trim() || null;
  return String(v);
}
function asInt(v: unknown): number | null {
  if (typeof v === "number") return Math.round(v);
  if (typeof v === "string") {
    const n = parseInt(v.trim(), 10);
    return isNaN(n) ? null : n;
  }
  return null;
}
function normMes(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return v.trim().toUpperCase();
}
function isAfter2026(iso: string | null): boolean {
  if (!iso) return false;
  return iso >= CORTE_2026;
}

function supabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "vass" },
    },
  );
}

export async function POST(req: Request) {
  try {
    // Modo 1 (nuevo): JSON con { path } — descarga del Supabase Storage
    // Modo 2 (legacy): FormData con file directo (para archivos chicos / dev)
    const contentType = req.headers.get("content-type") ?? "";
    let buf: Buffer;
    let storagePath: string | null = null;
    // phase: "ventas" (procesa VENTAS VASS + APOYO) | "seguimiento" (procesa pestañas mensuales) | undefined (todo)
    let phase: "ventas" | "seguimiento" | "all" = "all";
    let keepStorage = false;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      storagePath = body.path;
      if (body.phase === "ventas" || body.phase === "seguimiento") {
        phase = body.phase;
      }
      keepStorage = body.keepStorage === true;
      if (!storagePath) {
        return NextResponse.json(
          { ok: false, error: "MISSING_PATH", message: "Falta path del archivo en Storage" },
          { status: 400 },
        );
      }
      const t0 = Date.now();
      const storageClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const { data: blob, error: dlErr } = await storageClient.storage
        .from("vass-uploads")
        .download(storagePath);
      if (dlErr || !blob) {
        return NextResponse.json(
          { ok: false, error: "STORAGE_DOWNLOAD", message: dlErr?.message ?? "no blob" },
          { status: 500 },
        );
      }
      buf = Buffer.from(await blob.arrayBuffer());
      console.log(`[upload] downloaded ${buf.length} bytes from Storage in ${Date.now() - t0}ms`);
    } else {
      // Modo legacy
      const form = await req.formData();
      const file = form.get("file");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { ok: false, error: "MISSING_FILE", message: "Falta el archivo VASS.xlsx" },
          { status: 400 },
        );
      }
      const t0 = Date.now();
      buf = Buffer.from(await file.arrayBuffer());
      console.log(`[upload] file received ${buf.length} bytes in ${Date.now() - t0}ms`);
    }

    const t1 = Date.now();
    // Solo parseamos las hojas que nos interesan — descarta pivot/aux tables
    const HOJAS_NECESARIAS = [
      "VENTAS VASS", "APOYO VENTAS",
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO",
      "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
    ];
    const wb = XLSX.read(buf, {
      type: "buffer",
      cellDates: false,
      cellHTML: false,
      cellFormula: false,
      cellStyles: false,
      cellNF: false,
      sheets: HOJAS_NECESARIAS,
    });
    console.log(`[upload] xlsx parsed in ${Date.now() - t1}ms · sheets: ${wb.SheetNames.join(", ")}`);
    const present = new Set(wb.SheetNames);

    const issues: { sheet: string; problem: string; columns?: string[] }[] = [];
    const supa = supabaseAdmin();

    // Helper: inserta filas en batches secuenciales pero grandes (500 cabe en 1 req)
    async function insertBatched<T>(
      table: "ventas" | "seguimiento",
      rows: T[],
      batchSize = 500,
    ) {
      if (rows.length === 0) return;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const { error } = await supa.from(table).insert(chunk as never);
        if (error) throw new Error(`insertando ${table} (lote ${i}): ${error.message}`);
      }
    }

    // ═══════ Fase 1: PARSEAR según `phase` (solo lo necesario, ahorra memoria) ═══════

    // VENTAS VASS — solo si phase=all o phase=ventas
    let ventasDescartadas2025 = 0;
    const ventasRows: Database["vass"]["Tables"]["ventas"]["Insert"][] = [];
    if ((phase === "all" || phase === "ventas") && present.has("VENTAS VASS")) {
      const sheet = wb.Sheets["VENTAS VASS"];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
      for (const r of raw) {
        const closing = serialToISO(r["CLOSING DATE"]);
        if (!closing) continue;
        if (!isAfter2026(closing)) { ventasDescartadas2025++; continue; }
        ventasRows.push({
          mes: normMes(r["MES"]),
          producto: asText(r["PRODUCTO"]),
          procedencia: asText(r["Procedencia"] ?? r["PROCEDENCIA"]),
          financiamiento: asText(r["Financiamiento"] ?? r["FINANCIAMIENTO"]),
          closing_date: closing,
          telefono: asText(r["TELEFONO"]),
          contrato: asText(r["# CONTRATO"]),
          asesor: asText(r["ASESOR"]),
          comision: asInt(r["COMISION"]),
          lead_numero: asText(r["LEAD"]),
          procedencia_lead: asText(r["Procedencia lead"] ?? r["PROCEDENCIA LEAD"]),
          consultor: asText(r["CONSULTOR"]),
          tipo_asistencia: asText(r["TIPO DE ASISTENCIA"]),
          observaciones: asText(r["OBSERVACIONES"]),
          source_file: "VASS.xlsx",
        });
      }
    } else if (phase === "all" || phase === "ventas") {
      issues.push({ sheet: "VENTAS VASS", problem: "missing_sheet" });
    }

    // SEGUIMIENTO (pestañas mensuales) — solo si phase=all o phase=seguimiento
    const mesesEncontrados: string[] = [];
    const seguimientoRows: Database["vass"]["Tables"]["seguimiento"]["Insert"][] = [];
    if (phase === "all" || phase === "seguimiento") for (const sheetName of wb.SheetNames) {
      const upper = sheetName.trim().toUpperCase();
      if (!MESES_2026.includes(upper)) continue;
      mesesEncontrados.push(upper);
      const sheet = wb.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
      for (const r of raw) {
        const fecha = serialToISO(r["FECHA"] ?? r["Fecha"]);
        if (!fecha || !isAfter2026(fecha)) continue;
        seguimientoRows.push({
          hoja_origen: upper,
          mes: normMes(r["MES"] ?? r["Mes"]),
          fecha,
          procedencia: asText(r["PROCEDENCIA"] ?? r["Procedencia"]),
          asesor: asText(r["ASESOR"] ?? r["ASCESOR"] ?? r["AGENTE"] ?? r["Maria Paula"]),
          lead_numero: asText(r["LEAD"]),
          producto: asText(r["PRODUCTO"] ?? r["Producto"]),
          financiamiento: asText(r["FINANCIAMIENTO"] ?? r["Financiamiento"]),
          id_aplicacion: asText(r["ID APLICACION"] ?? r["ID APLICACIÓN"] ?? r["Numero de Aplicacion"]),
          consultor: asText(r["CONSULTOR"] ?? r["NOMBRE CONSULTOR"]),
          cliente: asText(r["CLIENTE"] ?? r["NOMBRE CLIENTE"]),
          telefono: asText(r["TELEFONO DE CLIENTE"] ?? r["TELEFONO CLIENTE"] ?? r["TELEFONO"]),
          status: asText(r["STATUS"]),
          observacion: asText(r["OBSERVACION"] ?? r["OBSERVACION "] ?? r["OBSERVACIÓN"]),
          seguimiento_extra: asText(r["Seguimiento"] ?? r["Seguimiento "]),
          source_file: "VASS.xlsx",
        });
      }
    }

    // APOYO VENTAS → se mete dentro de vass.ventas con tipo_asistencia="APOYO VENTAS"
    // Solo si phase=all o phase=ventas
    const apoyoRows: Database["vass"]["Tables"]["ventas"]["Insert"][] = [];
    if ((phase === "all" || phase === "ventas") && present.has("APOYO VENTAS")) {
      const sheet = wb.Sheets["APOYO VENTAS"];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
      for (const r of raw) {
        const closing = serialToISO(r["CLOSING DATE"]);
        if (!closing || !isAfter2026(closing)) continue;
        apoyoRows.push({
          mes: normMes(r["MES"]),
          producto: asText(r["PRODUCTO"]),
          procedencia: asText(r["Procedencia"] ?? r["PROCEDENCIA"]),
          financiamiento: asText(r["Financiamiento"] ?? r["FINANCIAMIENTO"]),
          closing_date: closing,
          telefono: asText(r["TELEFONO"]),
          contrato: asText(r["# CONTRATO"]),
          asesor: asText(r["ASESOR"]),
          comision: asInt(r["COMISION"]),
          lead_numero: asText(r["LEAD"]),
          procedencia_lead: asText(r["Procedencia2"]),
          consultor: asText(r["CONSULTOR"]),
          tipo_asistencia: "APOYO VENTAS",
          observaciones: asText(r["OBSERVACIONES"]),
          source_file: "VASS.xlsx",
        });
      }
    } else {
      issues.push({ sheet: "APOYO VENTAS", problem: "missing_sheet" });
    }

    // ═══════ Fase 2: TRUNCATE en paralelo (RPC en public, instantáneo) ═══════
    const rpcClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    await Promise.all([
      ventasRows.length + apoyoRows.length > 0
        ? rpcClient.rpc("vass_truncate_ventas").then(({ error }) => {
            if (error) throw new Error(`truncate ventas: ${error.message}`);
          })
        : Promise.resolve(),
      seguimientoRows.length > 0
        ? rpcClient.rpc("vass_truncate_seguimiento").then(({ error }) => {
            if (error) throw new Error(`truncate seguimiento: ${error.message}`);
          })
        : Promise.resolve(),
    ]);

    // ═══════ Fase 3: INSERT — paralelo entre tablas, secuencial dentro de cada tabla ═══════
    await Promise.all([
      insertBatched("ventas", [...ventasRows, ...apoyoRows]),
      insertBatched("seguimiento", seguimientoRows),
    ]);

    const ventasInserted = ventasRows.length;
    const apoyoInserted = apoyoRows.length;
    const seguimientoInserted = seguimientoRows.length;

    await supa.from("upload_log").insert({
      archivo: "VASS.xlsx",
      filas_cargadas: ventasInserted + seguimientoInserted + apoyoInserted,
      uploaded_by: "web-upload",
      notas: `${ventasInserted} ventas + ${seguimientoInserted} seguimiento (${mesesEncontrados.join(", ")}) + ${apoyoInserted} apoyo`,
    });

    // Cleanup: borrar el archivo del Storage después de procesar (a menos que el cliente pida mantenerlo)
    if (storagePath && !keepStorage) {
      const cleanupClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      await cleanupClient.storage.from("vass-uploads").remove([storagePath]);
    }

    return NextResponse.json({
      ok: true,
      phase,
      ventas: ventasInserted,
      seguimiento: seguimientoInserted,
      apoyoVentas: apoyoInserted,
      mesesSeguimiento: mesesEncontrados,
      descartados2025: ventasDescartadas2025,
      uploaded_at: new Date().toISOString(),
      issues,
      sheetsEncontradas: wb.SheetNames,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[upload VASS] error:", err);
    return NextResponse.json(
      { ok: false, error: "EXCEPTION", message: msg },
      { status: 500 },
    );
  }
}
