"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Users2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/ventas/animated-counter";
import { useFilters } from "@/components/dashboard/filter-context";
import { cn } from "@/lib/utils";
import type { Venta } from "@/lib/queries/ventas";

const MES_NAMES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];
const MESES_ORDEN: Record<string, number> = Object.fromEntries(
  MES_NAMES.map((m, i) => [m, i + 1]),
);

const PALETTE = {
  orange: "#f89b24",
  orangeBright: "#ffb547",
  blue: "#1d429b",
  cyan: "#22d3ee",
  emerald: "#10b981",
  amber: "#fbbf24",
  rose: "#f43f5e",
  violet: "#a78bfa",
  violetDark: "#7c3aed",
  slate: "#64748b",
};

type Props = {
  initialVentas: Venta[];
};

export function VentasDashboard({ initialVentas }: Props) {
  const { preset, customFrom, customTo, setMonthRange, clearFilters } = useFilters();

  const [selectedAsesores, setSelectedAsesores] = useState<Set<string>>(new Set());
  const [selectedConsultor, setSelectedConsultor] = useState<string | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<string | null>(null);
  const [selectedProcedencia, setSelectedProcedencia] = useState<string | null>(null);
  const [tablaAbierta, setTablaAbierta] = useState(false);
  const [tablaQuery, setTablaQuery] = useState("");

  // Mes activo derivado del contexto compartido — propaga el filtro entre dashboards de VASS.
  const drillMes = useMemo(() => {
    if (preset === "thisMonth") return MES_NAMES[new Date().getMonth()];
    if (preset === "custom" && customFrom) {
      const d = parseISO(customFrom);
      if (isValid(d)) return MES_NAMES[d.getMonth()];
    }
    return null;
  }, [preset, customFrom]);

  function handleTimelineClick(data: { activeLabel?: string | number } | null) {
    if (showDaily) return;
    const label = data?.activeLabel;
    if (typeof label === "string") {
      const monthIdx = MES_NAMES.findIndex((m) => capitalize(m) === label);
      if (monthIdx >= 0) {
        const first = initialVentas.find((v) => v.closing_date)?.closing_date;
        const year = first ? parseISO(first).getFullYear() : new Date().getFullYear();
        setMonthRange(monthIdx, year);
      }
    }
  }

  const filtered = useMemo(() => {
    const today = new Date();
    let from: Date | null = null;
    let to: Date | null = null;
    if (preset === "thisMonth") {
      from = startOfMonth(today);
      to = endOfMonth(today);
    } else if (preset === "custom") {
      if (customFrom) from = parseISO(customFrom);
      if (customTo) to = endOfDay(parseISO(customTo));
    }
    return initialVentas.filter((v) => {
      if (!v.closing_date) return false;
      const d = parseISO(v.closing_date);
      if (!isValid(d)) return false;
      if (from && d < startOfDay(from)) return false;
      if (to && d > to) return false;
      if (selectedAsesores.size > 0 && (!v.asesor || !selectedAsesores.has(v.asesor))) return false;
      if (selectedConsultor && v.consultor !== selectedConsultor) return false;
      if (selectedProducto && v.producto !== selectedProducto) return false;
      if (selectedProcedencia && v.procedencia !== selectedProcedencia) return false;
      return true;
    });
  }, [initialVentas, preset, customFrom, customTo, selectedAsesores, selectedConsultor, selectedProducto, selectedProcedencia]);

  const kpis = useMemo(() => {
    const asesores = new Set(filtered.map((v) => v.asesor).filter(Boolean));
    const consultores = new Set(filtered.map((v) => v.consultor).filter(Boolean));
    const pendientesDeal = filtered.filter((v) =>
      (v.contrato ?? "").toLowerCase().includes("pendiente")
    ).length;
    const contratosFirmes = filtered.length - pendientesDeal;
    return {
      total: filtered.length,
      asesores: asesores.size,
      consultores: consultores.size,
      pendientesDeal,
      contratosFirmes,
    };
  }, [filtered]);

  const topAsesores = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filtered) {
      const a = (v.asesor ?? "(sin)").trim();
      m.set(a, (m.get(a) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([asesor, ventas]) => ({ asesor, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 10);
  }, [filtered]);

  const topConsultores = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filtered) {
      const c = (v.consultor ?? "").trim();
      if (!c) continue;
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([consultor, ventas]) => ({ consultor, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 10);
  }, [filtered]);

  const topProductos = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filtered) {
      const p = (v.producto ?? "(sin)").trim();
      m.set(p, (m.get(p) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([producto, ventas]) => ({ producto, ventas }))
      .sort((a, b) => b.ventas - a.ventas);
  }, [filtered]);

  const topProcedencia = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filtered) {
      const p = (v.procedencia ?? "").trim();
      if (!p) continue;
      m.set(p, (m.get(p) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([procedencia, ventas]) => ({ procedencia, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 8);
  }, [filtered]);

  const topProcedenciaLead = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filtered) {
      const p = (v.procedencia_lead ?? "").trim();
      if (!p) continue;
      m.set(p, (m.get(p) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([procedenciaLead, ventas]) => ({ procedenciaLead, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 8);
  }, [filtered]);

  const showDaily =
    drillMes !== null || preset === "thisMonth" || preset === "custom";

  const timelineData = useMemo(() => {
    if (showDaily) {
      const m = new Map<string, number>();
      for (const v of filtered) {
        if (!v.closing_date) continue;
        m.set(v.closing_date, (m.get(v.closing_date) ?? 0) + 1);
      }
      return [...m.entries()]
        .map(([fecha, ventas]) => ({ key: fecha, label: format(parseISO(fecha), "dd MMM", { locale: es }), ventas }))
        .sort((a, b) => a.key.localeCompare(b.key));
    }
    const m = new Map<string, number>();
    for (const v of filtered) {
      const mes = v.mes ?? "";
      if (!mes) continue;
      m.set(mes, (m.get(mes) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([mes, ventas]) => ({ key: mes, label: capitalize(mes), orden: MESES_ORDEN[mes] ?? 99, ventas }))
      .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
  }, [filtered, showDaily]);

  const asesoresUnicos = useMemo(() => {
    const today = new Date();
    let from: Date | null = null;
    let to: Date | null = null;
    if (preset === "thisMonth") {
      from = startOfMonth(today);
      to = endOfMonth(today);
    } else if (preset === "custom") {
      if (customFrom) from = parseISO(customFrom);
      if (customTo) to = endOfDay(parseISO(customTo));
    }
    const set = new Set<string>();
    for (const v of initialVentas) {
      if (!v.asesor) continue;
      if (!v.closing_date) continue;
      const d = parseISO(v.closing_date);
      if (!isValid(d)) continue;
      if (from && d < startOfDay(from)) continue;
      if (to && d > to) continue;
      set.add(v.asesor);
    }
    return [...set].sort();
  }, [initialVentas, preset, customFrom, customTo]);

  function toggleAsesor(a: string) {
    const next = new Set(selectedAsesores);
    if (next.has(a)) next.delete(a); else next.add(a);
    setSelectedAsesores(next);
  }
  function clearChartFilters() {
    setSelectedAsesores(new Set());
    setSelectedConsultor(null);
    setSelectedProducto(null);
    setSelectedProcedencia(null);
    clearFilters();
  }
  const hayChartFilters =
    selectedAsesores.size > 0 || selectedConsultor || selectedProducto || selectedProcedencia || drillMes;

  return (
    <div className="space-y-5">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <h1 className="kpi-number text-2xl font-bold text-foreground sm:text-3xl">
            Ventas VASS
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="kpi-number font-semibold text-foreground">{filtered.length}</span> ventas cerradas ·{" "}
            <span className="kpi-number font-semibold text-emerald-500">{kpis.asesores}</span> asesores ·{" "}
            <span className="kpi-number font-semibold text-windmar-orange">{kpis.consultores}</span> consultores
          </p>
        </div>
        {hayChartFilters && (
          <button onClick={clearChartFilters} className="btn-exec text-xs">
            Limpiar filtros
          </button>
        )}
      </motion.header>

      {/* KPIs */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <Kpi label="Total Ventas" value={kpis.total} icon={BarChart3} hero sub="registros VENTAS VASS" />
        <Kpi label="Contratos firmes" value={kpis.contratosFirmes} icon={BarChart3} emerald sub="con # de contrato" />
        <Kpi label="Pendientes Deal" value={kpis.pendientesDeal} icon={AlertCircle} amber sub="sin # contrato aún" />
        <Kpi label="Asesores · Consultores" value={`${kpis.asesores} / ${kpis.consultores}`} icon={Users2} isText />
      </motion.section>

      {/* Chips asesores */}
      <section className="exec-card p-3 md:p-4">
        <p className="exec-label mb-2">Filtrar por asesor</p>
        <div className="flex flex-wrap gap-1.5">
          {asesoresUnicos.map((a) => (
            <button
              key={a}
              onClick={() => toggleAsesor(a)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                selectedAsesores.has(a)
                  ? "border-windmar-orange bg-windmar-orange/15 text-windmar-orange"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      {/* Row 1: Ranking Asesores izq + Timeline der */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartBox title="🏆 Ranking de Asesores · ventas cerradas">
          {topAsesores.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topAsesores} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="asesor" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(248,155,36,0.08)" }} />
                <Bar
                  dataKey="ventas"
                  radius={[0, 4, 4, 0]}
                  onClick={(d) => { const x = (d as { asesor?: string }).asesor; if (x && x !== "(sin)") toggleAsesor(x); }}
                  style={{ cursor: "pointer" }}
                  label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                >
                  {topAsesores.map((d) => (
                    <Cell key={d.asesor} fill={selectedAsesores.has(d.asesor) ? PALETTE.orangeBright : PALETTE.orange} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBox>

        <div className="lg:col-span-2">
          <ChartBox title={`Pipeline ${showDaily ? "diario" : "mensual"} · ventas`}>
            {timelineData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={timelineData}
                  margin={{ top: 24, right: 32, left: 0, bottom: 8 }}
                  onClick={handleTimelineClick}
                  style={{ cursor: showDaily ? "default" : "pointer" }}
                >
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    name="Ventas"
                    stroke={PALETTE.violetDark}
                    strokeWidth={2.5}
                    dot={{ fill: PALETTE.violetDark, r: 4, strokeWidth: 0 }}
                    activeDot={{
                      r: 7,
                      fill: PALETTE.violetDark,
                      stroke: "#fff",
                      strokeWidth: 2,
                      style: { filter: "drop-shadow(0 0 8px rgba(124,58,237,0.6))" },
                    }}
                    label={{ position: "top", fill: "var(--foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartBox>
        </div>
      </section>

      {/* Row 2: Consultor + Producto + Procedencia */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ChartBox title="🏅 Ranking de Consultores">
          {topConsultores.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topConsultores} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="consultor" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={120} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(167,139,250,0.08)" }} />
                <Bar
                  dataKey="ventas"
                  radius={[0, 4, 4, 0]}
                  onClick={(d) => { const x = (d as { consultor?: string }).consultor; if (x) setSelectedConsultor(selectedConsultor === x ? null : x); }}
                  style={{ cursor: "pointer" }}
                  label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                >
                  {topConsultores.map((d) => (
                    <Cell key={d.consultor} fill={selectedConsultor === d.consultor ? PALETTE.orangeBright : PALETTE.violet} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBox>

        <ChartBox title="Producto · más vendidos">
          {topProductos.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProductos} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="producto" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(29,66,155,0.08)" }} />
                <Bar
                  dataKey="ventas"
                  radius={[0, 4, 4, 0]}
                  onClick={(d) => { const x = (d as { producto?: string }).producto; if (x && x !== "(sin)") setSelectedProducto(selectedProducto === x ? null : x); }}
                  style={{ cursor: "pointer" }}
                  label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                >
                  {topProductos.map((d) => (
                    <Cell key={d.producto} fill={selectedProducto === d.producto ? PALETTE.orangeBright : PALETTE.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBox>

        <ChartBox title="Procedencia · origen de la venta">
          {topProcedencia.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProcedencia} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="procedencia" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(248,155,36,0.08)" }} />
                <Bar
                  dataKey="ventas"
                  radius={[0, 4, 4, 0]}
                  onClick={(d) => { const x = (d as { procedencia?: string }).procedencia; if (x) setSelectedProcedencia(selectedProcedencia === x ? null : x); }}
                  style={{ cursor: "pointer" }}
                  label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                >
                  {topProcedencia.map((d) => (
                    <Cell key={d.procedencia} fill={selectedProcedencia === d.procedencia ? PALETTE.orangeBright : PALETTE.orange} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBox>
      </section>

      {/* Row 3: Procedencia Lead full-width */}
      <ChartBox title="Procedencia del Lead · de dónde vienen los leads">
        {topProcedenciaLead.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={Math.max(220, topProcedenciaLead.length * 36)}>
            <BarChart data={topProcedenciaLead} layout="vertical" margin={{ top: 4, right: 60, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="procedenciaLead" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={180} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
              <Bar
                dataKey="ventas"
                fill={PALETTE.violetDark}
                radius={[0, 4, 4, 0]}
                label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartBox>


      {/* TABLA */}
      <TablaDetalle
        rows={filtered}
        abierta={tablaAbierta}
        onToggle={() => setTablaAbierta((v) => !v)}
        query={tablaQuery}
        onQueryChange={setTablaQuery}
      />
    </div>
  );
}

function TablaDetalle({
  rows, abierta, onToggle, query, onQueryChange,
}: {
  rows: Venta[];
  abierta: boolean;
  onToggle: () => void;
  query: string;
  onQueryChange: (v: string) => void;
}) {
  const filtradas = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((v) =>
      [v.asesor, v.consultor, v.producto, v.lead_numero, v.contrato, v.procedencia, v.tipo_asistencia, v.financiamiento]
        .some((c) => (c ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query]);

  return (
    <section className="exec-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div>
          <h3 className="exec-label">Detalle de Ventas VASS</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="kpi-number text-foreground">{rows.length}</span> contratos
          </p>
        </div>
        {abierta ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-3">
              <input
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Buscar por asesor, consultor, producto, lead, contrato…"
                className="input-exec w-full text-sm"
              />
              {query && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {filtradas.length} de {rows.length} coinciden
                </p>
              )}
            </div>

            <div className="max-h-[600px] overflow-auto">
              <table className="exec-table">
                <thead>
                  <tr>
                    <th>Fecha cierre</th>
                    <th>Asesor</th>
                    <th>Consultor</th>
                    <th>Producto</th>
                    <th>Procedencia</th>
                    <th>Proc. Lead</th>
                    <th>Financiamiento</th>
                    <th>Lead</th>
                    <th>Contrato</th>
                    <th>Tipo</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.slice(0, 300).map((v) => (
                    <tr key={v.id}>
                      <td className="text-muted-foreground">{v.closing_date ?? "—"}</td>
                      <td className="text-foreground">{v.asesor ?? "—"}</td>
                      <td className="text-foreground">{v.consultor ?? "—"}</td>
                      <td className="text-muted-foreground">{v.producto ?? "—"}</td>
                      <td className="text-muted-foreground">{v.procedencia ?? "—"}</td>
                      <td className="text-muted-foreground">{v.procedencia_lead ?? "—"}</td>
                      <td className="text-muted-foreground">{v.financiamiento ?? "—"}</td>
                      <td className="text-muted-foreground">{v.lead_numero ?? "—"}</td>
                      <td className="text-xs text-muted-foreground truncate max-w-[180px]">{v.contrato ?? "—"}</td>
                      <td className="text-muted-foreground">{v.tipo_asistencia ?? "—"}</td>
                      <td className="text-xs text-muted-foreground truncate max-w-[200px]">{v.observaciones ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtradas.length > 300 && (
                <p className="px-5 py-2 text-center text-[11px] text-muted-foreground">
                  Mostrando primeras 300 de {filtradas.length}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── helpers ─────────────────────────────────────────

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
  fontFamily: "var(--font-mono), monospace",
  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)",
};

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

function Kpi({
  label, value, sub, icon: Icon, hero = false, isText = false, emerald = false, amber = false,
}: {
  label: string; value: number | string; sub?: string; icon: React.ElementType; hero?: boolean; isText?: boolean; emerald?: boolean; amber?: boolean;
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
        <Icon className={cn("h-4 w-4", hero ? "text-windmar-orange" : emerald ? "text-emerald-500" : amber ? "text-amber-500" : "text-muted-foreground")} />
      </div>
      <p className={cn(
        "kpi-number mt-2 truncate text-2xl font-bold",
        hero ? "neon-text-orange" : emerald ? "text-emerald-500" : amber ? "text-amber-500" : "text-foreground",
      )}>
        {isText || typeof value === "string" ? value : <AnimatedCounter value={value as number} decimals={0} />}
      </p>
      {sub && <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

function capitalize(s: string) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}
