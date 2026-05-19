"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { format, parseISO, differenceInMinutes, isValid } from "date-fns";
import { es } from "date-fns/locale";

type Props = {
  iso: string | null;
};

/**
 * Badge "Última actualización HH:MM AM/PM" con color según antigüedad:
 *   • verde     dentro de la 1ra hora (0-59 min)
 *   • naranja   2ª hora (60-119 min)
 *   • rojo      3ª hora en adelante (120+ min)
 */
export function LastUpdateBadge({ iso }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!iso) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/40 px-2.5 py-1 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        Sin datos cargados
      </span>
    );
  }

  const d = parseISO(iso);
  if (!isValid(d)) return null;

  const mins = differenceInMinutes(now, d.getTime());
  const { color, bg, border } =
    mins < 60
      ? { color: "#16A34A", bg: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.35)" }
      : mins < 120
      ? { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.40)" }
      : { color: "#DC2626", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.40)" };

  const horaTxt = format(d, "hh:mm a", { locale: es });
  const fechaTxt = format(d, "dd MMM", { locale: es });

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-medium"
      style={{ background: bg, border: `1px solid ${border}`, color }}
      title={`Hace ${mins} min · ${format(d, "dd MMM yyyy 'a las' hh:mm a", { locale: es })}`}
    >
      <Clock className="h-3 w-3" />
      <span className="text-foreground/80">Última actualización</span>
      <span className="font-semibold" style={{ color }}>
        {fechaTxt} · {horaTxt}
      </span>
    </span>
  );
}
