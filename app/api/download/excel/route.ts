/**
 * GET /api/download/excel?from=YYYY-MM-DD&to=YYYY-MM-DD&type=all|ventas|seguimiento|apoyo
 */
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const runtime = "nodejs";

function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "vass" },
    },
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const type = searchParams.get("type") ?? "all";

    const supa = adminClient();
    const wb = XLSX.utils.book_new();

    if (type === "all" || type === "ventas") {
      let q = supa.from("ventas").select("*").order("closing_date", { ascending: false });
      if (from) q = q.gte("closing_date", from);
      if (to) q = q.lte("closing_date", to);
      const { data, error } = await q;
      if (error) throw new Error(`ventas: ${error.message}`);
      const sheet = XLSX.utils.json_to_sheet(
        (data ?? []).map((r) => ({
          MES: r.mes,
          PRODUCTO: r.producto,
          PROCEDENCIA: r.procedencia,
          FINANCIAMIENTO: r.financiamiento,
          "CLOSING DATE": r.closing_date,
          TELEFONO: r.telefono,
          "# CONTRATO": r.contrato,
          ASESOR: r.asesor,
          LEAD: r.lead_numero,
          "PROCEDENCIA LEAD": r.procedencia_lead,
          CONSULTOR: r.consultor,
          "TIPO ASISTENCIA": r.tipo_asistencia,
          OBSERVACIONES: r.observaciones,
        })),
      );
      XLSX.utils.book_append_sheet(wb, sheet, "Ventas VASS");
    }

    if (type === "all" || type === "seguimiento") {
      let q = supa.from("seguimiento").select("*").order("fecha", { ascending: false });
      if (from) q = q.gte("fecha", from);
      if (to) q = q.lte("fecha", to);
      const { data, error } = await q;
      if (error) throw new Error(`seguimiento: ${error.message}`);
      const sheet = XLSX.utils.json_to_sheet(
        (data ?? []).map((r) => ({
          MES: r.mes,
          "HOJA ORIGEN": r.hoja_origen,
          FECHA: r.fecha,
          PROCEDENCIA: r.procedencia,
          ASESOR: r.asesor,
          LEAD: r.lead_numero,
          PRODUCTO: r.producto,
          FINANCIAMIENTO: r.financiamiento,
          "ID APLICACION": r.id_aplicacion,
          CONSULTOR: r.consultor,
          CLIENTE: r.cliente,
          TELEFONO: r.telefono,
          STATUS: r.status,
          OBSERVACION: r.observacion,
        })),
      );
      XLSX.utils.book_append_sheet(wb, sheet, "Seguimiento");
    }


    if (wb.SheetNames.length === 0) {
      return NextResponse.json({ ok: false, message: "Sin datos para el rango." }, { status: 422 });
    }

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const fechaStr = from || to ? `_${from || "inicio"}_a_${to || "hoy"}` : "";
    const fileName = `vass-${type}${fechaStr}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[download/excel VASS] error:", err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
