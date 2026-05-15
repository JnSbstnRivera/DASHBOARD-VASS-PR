"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, XCircle, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Issue = {
  sheet: string;
  problem: "missing_sheet" | "missing_columns";
  columns?: string[];
};

type UploadResult = {
  ok: boolean;
  ventas?: number;
  seguimiento?: number;
  apoyoVentas?: number;
  mesesSeguimiento?: string[];
  descartados2025?: number;
  uploaded_at?: string;
  error?: string;
  message?: string;
  issues?: Issue[];
  sheetsEncontradas?: string[];
};

type Estado = "idle" | "drag" | "uploading" | "parsing" | "saving" | "done" | "error";

const FASES: { key: Estado; label: string; icon: React.ElementType }[] = [
  { key: "uploading", label: "Subiendo archivo…", icon: Upload },
  { key: "parsing", label: "Leyendo Excel…", icon: FileSpreadsheet },
  { key: "saving", label: "Actualizando Supabase…", icon: Loader2 },
];

export type ExcelUploadProps = {
  forceType?: string;
  title: string;
  subtitle: string;
};

export function ExcelUpload({ forceType, title, subtitle }: ExcelUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [fileName, setFileName] = useState<string>("");

  function pickFile() {
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setResult({ ok: false, error: "BAD_FORMAT", message: "El archivo debe ser .xlsx" });
      setEstado("error");
      return;
    }

    setFileName(file.name);
    setResult(null);

    setEstado("uploading");
    await new Promise((r) => setTimeout(r, 350));
    setEstado("parsing");

    try {
      // ── Paso 1: pedir signed URL para subir directo a Supabase Storage ──
      const urlRes = await fetch("/api/refresh/get-upload-url", { method: "POST" });
      if (!urlRes.ok) {
        const text = await urlRes.text();
        throw new Error(`signed URL: ${urlRes.status} ${text.slice(0, 100)}`);
      }
      const urlData: { ok: boolean; path: string; signedUrl: string; token: string; message?: string } = await urlRes.json();
      if (!urlData.ok) throw new Error(urlData.message ?? "no signed url");

      // ── Paso 2: subir archivo directo a Supabase (no pasa por Vercel) ──
      const putRes = await fetch(urlData.signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
      if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error(`upload Storage: ${putRes.status} ${text.slice(0, 100)}`);
      }

      // ── Paso 3: pedirle al servidor que procese el archivo desde Storage ──
      setEstado("saving");
      await new Promise((r) => setTimeout(r, 400));

      const res = await fetch("/api/refresh/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: urlData.path, type: forceType ?? null }),
      });

      // Vercel puede devolver HTML cuando hay timeout (504) — protegemos el parse
      let data: UploadResult;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        const isTimeout = text.includes("FUNCTION_INVOCATION_TIMEOUT") || res.status === 504;
        data = {
          ok: false,
          error: isTimeout ? "TIMEOUT" : "SERVER_ERROR",
          message: isTimeout
            ? "El servidor tardó demasiado procesando el Excel (límite 60s en Vercel). Intentá de nuevo — los datos sí pueden haberse cargado."
            : `El servidor devolvió un error (HTTP ${res.status}). Probá de nuevo.`,
        };
      } else {
        data = await res.json();
      }

      if (!res.ok || !data.ok) {
        setResult(data);
        setEstado("error");
        return;
      }

      setResult(data);
      setEstado("done");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setResult({ ok: false, message: msg });
      setEstado("error");
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setEstado("idle");
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setEstado("drag");
  }

  function onDragLeave() {
    if (estado === "drag") setEstado("idle");
  }

  function reset() {
    setEstado("idle");
    setResult(null);
    setFileName("");
  }

  const isProcessing = estado === "uploading" || estado === "parsing" || estado === "saving";

  return (
    <section className="exec-card p-6">
      <div className="flex items-center gap-3 mb-1">
        <Upload className="h-5 w-5 text-windmar-orange" />
        <h2 className="exec-label text-windmar-orange">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">{subtitle}</p>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        onChange={onChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {(estado === "idle" || estado === "drag") && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={pickFile}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "group relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all",
              estado === "drag"
                ? "border-windmar-orange bg-windmar-orange/10 scale-[1.02]"
                : "border-border hover:border-windmar-orange/60 hover:bg-windmar-orange/5",
            )}
          >
            <motion.div
              animate={estado === "drag" ? { y: -4 } : { y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="rounded-full bg-windmar-orange/15 p-4 transition-transform group-hover:scale-110">
                <FileSpreadsheet className="h-8 w-8 text-windmar-orange" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Click para seleccionar o arrastra el .xlsx aquí
              </p>
              <p className="text-xs text-muted-foreground">
                TM.xlsx → actualiza Citas + Ventas · MEDIA TOUR.xlsx → actualiza Media Tour
              </p>
            </motion.div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border-2 border-windmar-orange/40 bg-windmar-orange/5 p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
              <span className="text-[11px] uppercase tracking-wider text-windmar-orange">Procesando</span>
            </div>

            <div className="space-y-3">
              {FASES.map((fase, idx) => {
                const currentIdx = FASES.findIndex((f) => f.key === estado);
                const status: "pending" | "active" | "done" =
                  idx < currentIdx ? "done" : idx === currentIdx ? "active" : "pending";
                const Icon = fase.icon;
                return (
                  <div key={fase.key} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                        status === "done" && "bg-emerald-500 text-white",
                        status === "active" && "bg-windmar-orange text-white",
                        status === "pending" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {status === "done" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : status === "active" ? (
                        <Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        status === "done" && "text-foreground",
                        status === "active" && "font-semibold text-foreground",
                        status === "pending" && "text-muted-foreground",
                      )}
                    >
                      {fase.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-windmar-orange"
                initial={{ width: "0%" }}
                animate={{
                  width:
                    estado === "uploading" ? "30%" : estado === "parsing" ? "65%" : "90%",
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {estado === "done" && result?.ok && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-6"
          >
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring" }}
                className="rounded-full bg-emerald-500 p-2 text-white"
              >
                <CheckCircle2 className="h-6 w-6" />
              </motion.div>
              <div className="flex-1">
                <p className="text-base font-bold text-foreground">
                  VASS.xlsx procesado
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(result.uploaded_at ?? Date.now()).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="Ventas VASS" value={result.ventas ?? 0} emerald />
                  <Stat label="Seguimiento" value={result.seguimiento ?? 0} />
                  <Stat label="Apoyo Ventas" value={result.apoyoVentas ?? 0} />
                  <Stat label="Descartados 2025" value={result.descartados2025 ?? 0} amber />
                </div>

                {result.mesesSeguimiento && result.mesesSeguimiento.length > 0 && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Pestañas mensuales procesadas: <span className="font-mono text-foreground">{result.mesesSeguimiento.join(" · ")}</span>
                  </p>
                )}

                <IssuesBanner issues={result.issues ?? []} />

                <button onClick={reset} type="button" className="btn-exec mt-4 text-xs">
                  Subir otro archivo
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {estado === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border-2 border-rose-500/40 bg-rose-500/5 p-6"
          >
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 shrink-0 text-rose-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Algo falló</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result?.message ?? "Error desconocido"}
                </p>

                {result?.sheetsEncontradas && result.sheetsEncontradas.length > 0 && (
                  <div className="mt-3 rounded-md border border-rose-500/30 bg-background/40 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-500">
                      Hojas encontradas en tu archivo
                    </p>
                    <p className="mt-1 text-xs text-foreground font-mono">
                      {result.sheetsEncontradas.join(" · ")}
                    </p>
                  </div>
                )}

                <IssuesBanner issues={result?.issues ?? []} variant="danger" />

                <button onClick={reset} type="button" className="btn-exec mt-3 text-xs">
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function IssuesBanner({ issues, variant = "warning" }: { issues: Issue[]; variant?: "warning" | "danger" }) {
  if (!issues || issues.length === 0) return null;

  const isDanger = variant === "danger";
  const sheetIssues = issues.filter((i) => i.problem === "missing_sheet");
  const columnIssues = issues.filter((i) => i.problem === "missing_columns");

  return (
    <div
      className={cn(
        "mt-3 rounded-md border px-3 py-2.5",
        isDanger
          ? "border-rose-500/40 bg-rose-500/10"
          : "border-amber-500/40 bg-amber-500/10",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider",
          isDanger ? "text-rose-600 dark:text-rose-400" : "text-amber-700 dark:text-amber-400",
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Revisar el archivo: faltan datos
      </p>

      <ul className="mt-2 space-y-1.5 text-xs">
        {sheetIssues.map((i) => (
          <li key={`s-${i.sheet}`} className="text-foreground">
            <span className="font-semibold">Hoja faltante:</span>{" "}
            <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-[11px]">
              {i.sheet}
            </code>{" "}
            <span className="text-muted-foreground">— esta tabla no se actualizó.</span>
          </li>
        ))}
        {columnIssues.map((i) => (
          <li key={`c-${i.sheet}`} className="text-foreground">
            <span className="font-semibold">En</span>{" "}
            <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-[11px]">
              {i.sheet}
            </code>{" "}
            <span className="font-semibold">faltan columnas:</span>{" "}
            <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400">
              {i.columns?.join(", ")}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Verificá que el nombre de las hojas y columnas coincida{" "}
        <span className="font-semibold text-foreground">exactamente</span> (mayúsculas, espacios, acentos).
      </p>
    </div>
  );
}

function Stat({ label, value, emerald = false, amber = false }: { label: string; value: number; emerald?: boolean; amber?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="exec-label text-[10px]">{label}</p>
      <p
        className={cn(
          "kpi-number mt-0.5 text-xl font-bold",
          emerald && "text-emerald-500",
          amber && "text-amber-500",
          !emerald && !amber && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
