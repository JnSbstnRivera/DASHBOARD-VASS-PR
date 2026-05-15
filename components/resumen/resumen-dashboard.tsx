"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Headphones, CheckCircle2, Users2, FileCheck } from "lucide-react";
import { parseISO, isValid, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ventas/animated-counter";
import { useFilters } from "@/components/dashboard/filter-context";
import { cn } from "@/lib/utils";
import type { Venta } from "@/lib/queries/ventas";
import type { Seguimiento } from "@/lib/queries/seguimiento";

const PALETTE = {
  orange: "#f89b24",
  blue: "#1d429b",
  cyan: "#22d3ee",
  emerald: "#10b981",
  violet: "#a78bfa",
  violetDark: "#7c3aed",
  amber: "#fbbf24",
  rose: "#f43f5e",
  slate: "#64748b",
};

type Props = {
  ventas: Venta[];
  seguimiento: Seguimiento[];
};

export function ResumenDashboard({ ventas, seguimiento }: Props) {
  const { preset, customFrom, customTo } = useFilters();

  const range = useMemo(() => {
    const today = new Date();
    if (preset === "thisMonth") return { from: startOfMonth(today), to: endOfMonth(today) };
    if (preset === "custom") {
      return {
        from: customFrom ? parseISO(customFrom) : null,
        to: customTo ? endOfDay(parseISO(customTo)) : null,
      };
    }
    return { from: null, to: null };
  }, [preset, customFrom, customTo]);

  function inRange(iso: string | null | undefined): boolean {
    if (!iso) return false;
    const d = parseISO(iso);
    if (!isValid(d)) return false;
    if (range.from && d < startOfDay(range.from)) return false;
    if (range.to && d > range.to) return false;
    return true;
  }

  const m = useMemo(() => {
    const ventasF = ventas.filter((v) => inRange(v.closing_date));
    const segF = seguimiento.filter((r) => inRange(r.fecha));

    const totalVentas = ventasF.length;
    const totalGestiones = segF.length;
    const vendidosSeg = segF.filter((r) => (r.status ?? "").toUpperCase() === "VENDIDO").length;
    const conContrato = ventasF.filter((v) => !!(v.contrato ?? "").trim()).length;

    const asesores = new Set(ventasF.map((v) => v.asesor).filter(Boolean));
    const consultores = new Set(ventasF.map((v) => v.consultor).filter(Boolean));

    // Top asesores (ventas)
    const asesorMap = new Map<string, number>();
    for (const v of ventasF) {
      const a = (v.asesor ?? "").trim();
      if (!a) continue;
      asesorMap.set(a, (asesorMap.get(a) ?? 0) + 1);
    }
    const topAsesores = [...asesorMap.entries()]
      .map(([asesor, ventas]) => ({ asesor, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 8);

    // Top consultores
    const consultorMap = new Map<string, number>();
    for (const v of ventasF) {
      const c = (v.consultor ?? "").trim();
      if (!c) continue;
      consultorMap.set(c, (consultorMap.get(c) ?? 0) + 1);
    }
    const topConsultores = [...consultorMap.entries()]
      .map(([consultor, ventas]) => ({ consultor, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 8);

    // Productos
    const prodMap = new Map<string, number>();
    for (const v of ventasF) {
      const p = (v.producto ?? "(sin)").trim();
      prodMap.set(p, (prodMap.get(p) ?? 0) + 1);
    }
    const topProductos = [...prodMap.entries()]
      .map(([producto, ventas]) => ({ producto, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 6);

    return {
      totalVentas, totalGestiones, vendidosSeg, conContrato,
      nAsesores: asesores.size, nConsultores: consultores.size,
      topAsesores, topConsultores, topProductos,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventas, seguimiento, preset, customFrom, customTo]);

  return (
    <div className="space-y-5">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="kpi-number text-2xl font-bold text-foreground sm:text-3xl">
          Resumen Ejecutivo
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Pipeline VASS · {m.totalGestiones} gestiones · {m.totalVentas} ventas · {m.nAsesores} asesores
        </p>
      </motion.header>

      {/* HERO funnel */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="exec-card-hero relative overflow-hidden rounded-2xl p-5 md:p-7"
      >
        <div className="exec-label text-windmar-orange mb-4">Pipeline · Gestión → Venta</div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FunnelStep
            icon={Headphones}
            label="GESTIONES"
            value={m.totalGestiones}
            color={PALETTE.violetDark}
            pct={100}
            sublabel="interacciones del día a día"
          />
          <FunnelStep
            icon={BarChart3}
            label="VENTAS"
            value={m.totalVentas}
            color={PALETTE.emerald}
            pct={m.totalGestiones > 0 ? Math.round((m.totalVentas / m.totalGestiones) * 100) : 0}
            sublabel="contratos cerrados (VENTAS VASS)"
          />
        </div>
      </motion.section>

      {/* KPIs */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <Kpi label="Asesores activos" value={m.nAsesores} icon={Users2} hero />
        <Kpi label="Consultores" value={m.nConsultores} icon={Users2} />
        <Kpi label="Vendidos (seg.)" value={m.vendidosSeg} icon={CheckCircle2} emerald />
        <Kpi label="Contratos firmados" value={m.conContrato} icon={FileCheck} emerald />
      </motion.section>

      {/* Top asesores + Top consultores */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartBox title="🏆 Top Asesores · ventas cerradas">
          {m.topAsesores.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={m.topAsesores} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="asesor" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(16,185,129,0.08)" }} />
                <Bar dataKey="ventas" fill={PALETTE.emerald} radius={[0, 4, 4, 0]}
                  label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBox>

        <ChartBox title="🏅 Top Consultores · ventas en sitio">
          {m.topConsultores.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={m.topConsultores} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="consultor" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(167,139,250,0.08)" }} />
                <Bar dataKey="ventas" fill={PALETTE.violet} radius={[0, 4, 4, 0]}
                  label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBox>
      </section>

      {/* Productos */}
      <ChartBox title="Producto · más vendidos">
        {m.topProductos.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={m.topProductos} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="producto" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={120} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(29,66,155,0.08)" }} />
              <Bar dataKey="ventas" radius={[0, 4, 4, 0]}
                label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              >
                {m.topProductos.map((d) => <Cell key={d.producto} fill={PALETTE.blue} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartBox>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
  fontFamily: "var(--font-mono), monospace",
  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)",
};

function FunnelStep({
  icon: Icon, label, value, color, pct, sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  pct: number;
  sublabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}22`, color }}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="exec-label">{label}</span>
      </div>
      <p className="kpi-number text-4xl font-bold text-foreground">
        <AnimatedCounter value={value} decimals={0} />
      </p>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span style={{ color }} className="kpi-number font-bold">{pct}%</span>
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">{sublabel}</p>
    </div>
  );
}

function Kpi({
  label, value, sub, icon: Icon, hero = false, isText = false, emerald = false,
}: {
  label: string; value: number | string; sub?: string; icon: React.ElementType; hero?: boolean; isText?: boolean; emerald?: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      }}
      className={cn("px-5 py-4 transition-transform hover:-translate-y-[2px]", hero ? "exec-card-hero" : "exec-card")}
    >
      <div className="flex items-start justify-between">
        <span className="exec-label">{label}</span>
        <Icon className={cn("h-4 w-4", hero ? "text-windmar-orange" : emerald ? "text-emerald-500" : "text-muted-foreground")} />
      </div>
      <p className={cn(
        "kpi-number mt-2 truncate text-2xl font-bold",
        hero ? "neon-text-orange" : emerald ? "text-emerald-500" : "text-foreground",
      )}>
        {isText || typeof value === "string" ? value : <AnimatedCounter value={value as number} decimals={0} />}
      </p>
      {sub && <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="exec-card p-4 h-full">
      <h3 className="exec-label mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[240px] items-center justify-center text-xs text-muted-foreground">
      Sin datos en la selección
    </div>
  );
}
