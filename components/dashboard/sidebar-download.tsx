"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Loader2, Check } from "lucide-react";
import { useFilters } from "@/components/dashboard/filter-context";
import { startOfMonth, endOfMonth, format } from "date-fns";

type Estado = "idle" | "loading" | "done" | "error";

export function SidebarDownload() {
  const pathname = usePathname();
  const { preset, customFrom, customTo } = useFilters();
  const [estado, setEstado] = useState<Estado>("idle");

  function tipoActual(): "all" | "ventas" | "seguimiento" {
    if (pathname?.includes("/ventas")) return "ventas";
    if (pathname?.includes("/seguimiento")) return "seguimiento";
    return "all";
  }

  function rangoActual(): { from: string; to: string } {
    if (preset === "thisMonth") {
      const today = new Date();
      return {
        from: format(startOfMonth(today), "yyyy-MM-dd"),
        to: format(endOfMonth(today), "yyyy-MM-dd"),
      };
    }
    return { from: customFrom, to: customTo };
  }

  async function descargar() {
    if (estado === "loading") return;
    setEstado("loading");
    try {
      const { from, to } = rangoActual();
      const type = tipoActual();
      const params = new URLSearchParams({ type });
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/download/excel?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Error al descargar");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const cd = res.headers.get("Content-Disposition") ?? "";
      const m = cd.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = m?.[1] ?? `vass-${type}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      setEstado("done");
      setTimeout(() => setEstado("idle"), 2200);
    } catch (err) {
      console.error(err);
      setEstado("error");
      setTimeout(() => setEstado("idle"), 2500);
    }
  }

  const tipoLabel =
    tipoActual() === "ventas"
      ? "Ventas"
      : tipoActual() === "seguimiento"
      ? "Seguimiento"
      : "Todo";

  const rangoLabel = (() => {
    if (preset === "thisMonth") return "Mes actual";
    if (customFrom || customTo) {
      const f = customFrom || "—";
      const t = customTo || "hoy";
      return `${f} → ${t}`;
    }
    return "Todos los datos";
  })();

  return (
    <div className="border-t border-border px-3 py-3">
      <button
        type="button"
        onClick={descargar}
        disabled={estado === "loading"}
        className="group flex w-full items-center gap-2.5 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-left transition-all hover:border-windmar-orange/40 hover:bg-windmar-orange/5 disabled:opacity-60"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-windmar-orange/15 text-windmar-orange">
          {estado === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : estado === "done" ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-foreground">
            {estado === "loading"
              ? "Generando…"
              : estado === "done"
              ? "Descargado ✓"
              : estado === "error"
              ? "Error, intenta de nuevo"
              : "Descargar Excel"}
          </span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {tipoLabel} · {rangoLabel}
          </span>
        </span>
      </button>
    </div>
  );
}
