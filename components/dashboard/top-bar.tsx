"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { useFilters } from "@/components/dashboard/filter-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { DatePicker } from "@/components/dashboard/date-picker";
import { LastUpdateBadge } from "@/components/dashboard/last-update-badge";

export function TopBar({ lastUpdate = null }: { lastUpdate?: string | null }) {
  const { preset, customFrom, customTo, setPreset, setCustomFrom, setCustomTo, clearFilters } = useFilters();
  const [pendingFrom, setPendingFrom] = useState(customFrom);
  const [pendingTo, setPendingTo] = useState(customTo);

  function aplicarFechas() {
    setCustomFrom(pendingFrom);
    setCustomTo(pendingTo);
    if (pendingFrom || pendingTo) setPreset("custom");
  }

  const hayFiltros = preset !== "all" || customFrom || customTo;

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-10 2xl:px-14">
        <div className="flex flex-wrap items-center gap-2">
          <span className="exec-label hidden sm:inline">Filtro fecha</span>
          <button
            type="button"
            data-active={preset === "thisMonth"}
            onClick={() => setPreset(preset === "thisMonth" ? "all" : "thisMonth")}
            className="btn-exec"
          >
            <Calendar className="h-3.5 w-3.5" /> Mes actual
          </button>
          <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
            <DatePicker value={pendingFrom} onChange={setPendingFrom} className="min-w-0 flex-1 sm:w-[150px] sm:flex-none" />
            <span className="text-xs text-muted-foreground">→</span>
            <DatePicker value={pendingTo} onChange={setPendingTo} className="min-w-0 flex-1 sm:w-[150px] sm:flex-none" />
            <button
              type="button"
              onClick={aplicarFechas}
              disabled={!pendingFrom && !pendingTo}
              className="btn-exec btn-exec-primary disabled:opacity-40 disabled:pointer-events-none"
            >
              Aplicar
            </button>
          </div>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setPendingFrom("");
                setPendingTo("");
              }}
              className="btn-exec text-rose-500"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LastUpdateBadge iso={lastUpdate} />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
