"use client";

import { BarChart3, Headphones, FileCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ExcelUpload } from "@/components/admin/excel-upload";

type DataStats = {
  ventas: number;
  seguimiento: number;
  ultimaVenta: string | null;
  ultimoSeguimiento: string | null;
};

type LogEntry = {
  uploaded_at: string | null;
  archivo: string | null;
  filas_cargadas: number | null;
  notas: string | null;
  uploaded_by: string | null;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd MMM yyyy", { locale: es }) : "—";
}

export function AdminPanel({
  stats,
  lastLogs,
}: {
  stats: DataStats;
  lastLogs: LogEntry[];
}) {
  return (
    <div className="space-y-5">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="kpi-number text-2xl font-bold text-foreground sm:text-3xl">
          Admin
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Subir VASS.xlsx · Solo se cargan datos de 2026 en adelante
        </p>
      </motion.header>

      <ExcelUpload
        title="VASS.xlsx · Ventas + Seguimiento mensual + Apoyo"
        subtitle="Soltá el Excel completo. El sistema carga VENTAS VASS, las pestañas mensuales (Enero, Febrero, ...) consolidadas, y APOYO VENTAS. Filas anteriores a 2026-01-01 se descartan."
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <AdminKpi label="Ventas VASS" value={stats.ventas} icon={BarChart3} hero sub={`última: ${fmtDate(stats.ultimaVenta)}`} />
        <AdminKpi label="Seguimiento" value={stats.seguimiento} icon={Headphones} sub={`última: ${fmtDate(stats.ultimoSeguimiento)}`} />
        <AdminKpi label="Última carga" value={lastLogs[0]?.uploaded_at ? format(new Date(lastLogs[0].uploaded_at), "dd MMM · HH:mm", { locale: es }) : "—"} icon={Clock} isText />
        <AdminKpi label="Filas 2026+" value={stats.ventas + stats.seguimiento} icon={FileCheck} sub="total VASS" />
      </section>

      <section className="exec-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h2 className="exec-label">Historial de cargas (últimas 5)</h2>
        </div>
        {lastLogs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Aún no hay registros en upload_log.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="exec-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Archivo</th>
                  <th>Filas</th>
                  <th>Por</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {lastLogs.map((log, i) => (
                  <tr key={i}>
                    <td className="text-muted-foreground">
                      {log.uploaded_at
                        ? format(new Date(log.uploaded_at), "dd MMM yyyy · HH:mm", { locale: es })
                        : "—"}
                    </td>
                    <td className="text-foreground">{log.archivo ?? "—"}</td>
                    <td className="kpi-number font-medium text-foreground">{log.filas_cargadas ?? "—"}</td>
                    <td className="text-muted-foreground">{log.uploaded_by ?? "—"}</td>
                    <td className="text-xs text-muted-foreground">{log.notas ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AdminKpi({
  label, value, sub, icon: Icon, hero = false, isText = false,
}: {
  label: string; value: number | string; sub?: string; icon: React.ElementType;
  hero?: boolean; isText?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("px-5 py-4 transition-transform hover:-translate-y-[2px]", hero ? "exec-card-hero" : "exec-card")}
    >
      <div className="flex items-start justify-between">
        <span className="exec-label">{label}</span>
        <Icon className={cn("h-4 w-4", hero ? "text-windmar-orange" : "text-muted-foreground")} />
      </div>
      <p
        className={cn(
          "kpi-number mt-2 truncate text-2xl font-bold",
          hero ? "neon-text-orange" : "text-foreground",
        )}
      >
        {isText ? value : value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}
