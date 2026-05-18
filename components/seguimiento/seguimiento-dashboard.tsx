"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Headphones,
  Users2,
  Package,
  CheckCircle2,
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
import type { Seguimiento } from "@/lib/queries/seguimiento";

const MES_NAMES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

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

const STATUS_COLOR: Record<string, string> = {
  VENDIDO: PALETTE.emerald,
  APROBADO: PALETTE.cyan,
  "INFORMACIÓN GENERAL": PALETTE.violet,
  "INFORMACION GENERAL": PALETTE.violet,
  "EN SEGUIMIENTO": PALETTE.amber,
  "NO LE INTERESA": PALETTE.rose,
  "CREDIT FAIL": PALETTE.rose,
  "PENDIENTE": PALETTE.slate,
};
function statusColor(s: string): string {
  return STATUS_COLOR[s.toUpperCase()] ?? PALETTE.slate;
}

type Props = {
  initialSeguimiento: Seguimiento[];
};

export function SeguimientoDashboard({ initialSeguimiento }: Props) {
  const { preset, customFrom, customTo } = useFilters();

  const [selectedAsesores, setSelectedAsesores] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<string | null>(null);
  const [selectedHojaMes, setSelectedHojaMes] = useState<string | null>(null);
  const [drillMes, setDrillMes] = useState<string | null>(null);
  const [tablaAbierta, setTablaAbierta] = useState(false);
  const [tablaQuery, setTablaQuery] = useState("");

  useEffect(() => {
    if (preset === "thisMonth") {
      setDrillMes(MES_NAMES[new Date().getMonth()]);
    } else if (preset === "all") {
      setDrillMes(null);
    }
  }, [preset]);

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
    return initialSeguimiento.filter((r) => {
      if (!r.fecha) return false;
      const d = parseISO(r.fecha);
      if (!isValid(d)) return false;
      if (from && d < startOfDay(from)) return false;
      if (to && d > to) return false;
      if (selectedAsesores.size > 0 && (!r.asesor || !selectedAsesores.has(r.asesor))) return false;
      if (selectedStatus && r.status !== selectedStatus) return false;
      if (selectedProducto && r.producto !== selectedProducto) return false;
      if (selectedHojaMes && r.hoja_origen !== selectedHojaMes) return false;
      return true;
    });
  }, [initialSeguimiento, preset, customFrom, customTo, selectedAsesores, selectedStatus, selectedProducto, selectedHojaMes]);

  const kpis = useMemo(() => {
    const asesores = new Set(filtered.map((r) => r.asesor).filter(Boolean));
    const consultores = new Set(filtered.map((r) => r.consultor).filter(Boolean));
    const vendidos = filtered.filter((r) => (r.status ?? "").toUpperCase() === "VENDIDO").length;
    const aprobados = filtered.filter((r) => (r.status ?? "").toUpperCase() === "APROBADO").length;
    return {
      total: filtered.length,
      asesores: asesores.size,
      consultores: consultores.size,
      vendidos,
      aprobados,
    };
  }, [filtered]);

  const topAsesores = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const a = (r.asesor ?? "(sin)").trim();
      m.set(a, (m.get(a) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([asesor, gestiones]) => ({ asesor, gestiones }))
      .sort((a, b) => b.gestiones - a.gestiones)
      .slice(0, 10);
  }, [filtered]);

  const statusData = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const s = (r.status ?? "(sin)").trim();
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const productoData = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const p = (r.producto ?? "").trim().toUpperCase();
      if (!p) continue;
      m.set(p, (m.get(p) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([producto, count]) => ({ producto, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const topConsultores = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const c = (r.consultor ?? "").trim();
      if (!c) continue;
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([consultor, count]) => ({ consultor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered]);

  const volumenMes = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const h = (r.hoja_origen ?? "").trim();
      if (!h) continue;
      m.set(h, (m.get(h) ?? 0) + 1);
    }
    const ORDEN: Record<string, number> = Object.fromEntries(MES_NAMES.map((m, i) => [m, i + 1]));
    return [...m.entries()]
      .map(([mes, count]) => ({ mes: capitalize(mes), key: mes, count, orden: ORDEN[mes] ?? 99 }))
      .sort((a, b) => a.orden - b.orden);
  }, [filtered]);

  const showDaily =
    drillMes !== null || preset === "thisMonth" || preset === "custom";

  const timelineData = useMemo(() => {
    if (showDaily) {
      const m = new Map<string, number>();
      for (const r of filtered) {
        if (!r.fecha) continue;
        m.set(r.fecha, (m.get(r.fecha) ?? 0) + 1);
      }
      return [...m.entries()]
        .map(([fecha, gest]) => ({ key: fecha, label: format(parseISO(fecha), "dd MMM", { locale: es }), gest }))
        .sort((a, b) => a.key.localeCompare(b.key));
    }
    return volumenMes.map((v) => ({ key: v.key, label: v.mes, gest: v.count }));
  }, [filtered, showDaily, volumenMes]);

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
    for (const r of initialSeguimiento) {
      if (!r.asesor) continue;
      if (!r.fecha) continue;
      const d = parseISO(r.fecha);
      if (!isValid(d)) continue;
      if (from && d < startOfDay(from)) continue;
      if (to && d > to) continue;
      set.add(r.asesor);
    }
    return [...set].sort();
  }, [initialSeguimiento, preset, customFrom, customTo]);

  const hojasUnicas = useMemo(() => {
    const set = new Set<string>();
    for (const r of initialSeguimiento) if (r.hoja_origen) set.add(r.hoja_origen);
    const ORDEN: Record<string, number> = Object.fromEntries(MES_NAMES.map((m, i) => [m, i + 1]));
    return [...set].sort((a, b) => (ORDEN[a] ?? 99) - (ORDEN[b] ?? 99));
  }, [initialSeguimiento]);

  function toggleAsesor(a: string) {
    const next = new Set(selectedAsesores);
    if (next.has(a)) next.delete(a); else next.add(a);
    setSelectedAsesores(next);
  }
  function clearChartFilters() {
    setSelectedAsesores(new Set());
    setSelectedStatus(null);
    setSelectedProducto(null);
    setSelectedHojaMes(null);
    setDrillMes(null);
  }
  const hayChartFilters =
    selectedAsesores.size > 0 || selectedStatus || selectedProducto || selectedHojaMes || drillMes;

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
            Seguimiento
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Gestiones diarias del equipo VASS · consolidado de pestañas mensuales
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
        <Kpi label="Total Gestiones" value={kpis.total} icon={Headphones} hero />
        <Kpi label="Asesores activos" value={kpis.asesores} icon={Users2} />
        <Kpi label="Vendidos" value={kpis.vendidos} icon={CheckCircle2} emerald />
        <Kpi label="Aprobados" value={kpis.aprobados} icon={CheckCircle2} />
      </motion.section>

      {/* Chips de mes-origen (pestañas Excel) */}
      <section className="exec-card p-3 md:p-4">
        <p className="exec-label mb-2">Filtrar por mes (pestaña del Excel)</p>
        <div className="flex flex-wrap gap-1.5">
          {hojasUnicas.map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHojaMes(selectedHojaMes === h ? null : h)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                selectedHojaMes === h
                  ? "border-violet-500 bg-violet-500/15 text-violet-400"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {capitalize(h)}
            </button>
          ))}
        </div>
      </section>

      {/* Chips asesores */}
      <section className="exec-card p-3 md:p-4">
        <p className="exec-label mb-2">Filtrar por asesor / agente</p>
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
        <ChartBox title="🏆 Ranking de Agentes · gestiones">
          {topAsesores.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topAsesores} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="asesor" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(248,155,36,0.08)" }} />
                <Bar
                  dataKey="gestiones"
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
          <ChartBox title={`Pipeline ${showDaily ? "diario" : "mensual"} · gestiones`}>
            {timelineData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData} margin={{ top: 24, right: 32, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="gest"
                    name="Gestiones"
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

      {/* Row 2: Status donut + Producto + Volumen mes */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ChartBox title="Status · resultado de la gestión">
          {statusData.length === 0 ? <EmptyChart /> : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="48%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    onClick={(d) => {
                      const s = (d as { status?: string }).status;
                      if (s) setSelectedStatus(selectedStatus === s ? null : s);
                    }}
                    style={{ cursor: "pointer" }}
                    label={(p: { percent?: number }) => `${((p.percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((d) => (
                      <Cell key={d.status} fill={selectedStatus === d.status ? PALETTE.orangeBright : statusColor(d.status)} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {statusData.slice(0, 8).map((d) => (
                  <div key={d.status} className="flex items-center gap-1 text-[10px]">
                    <span className="h-2 w-2 rounded-sm" style={{ background: statusColor(d.status) }} />
                    <span className="text-muted-foreground">{d.status} · {d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartBox>

        <ChartBox title="Producto · más gestionado">
          {productoData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productoData} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="producto" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(29,66,155,0.08)" }} />
                <Bar
                  dataKey="count"
                  radius={[0, 4, 4, 0]}
                  onClick={(d) => { const x = (d as { producto?: string }).producto; if (x) setSelectedProducto(selectedProducto === x ? null : x); }}
                  style={{ cursor: "pointer" }}
                  label={{ position: "right", fill: "var(--foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                >
                  {productoData.map((d) => (
                    <Cell key={d.producto} fill={selectedProducto === d.producto ? PALETTE.orangeBright : PALETTE.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBox>

        <ChartBox title="Volumen por mes · pestaña Excel">
          {volumenMes.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumenMes} margin={{ top: 24, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(167,139,250,0.08)" }} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onClick={(d) => { const k = (d as { key?: string }).key; if (k) setSelectedHojaMes(selectedHojaMes === k ? null : k); }}
                  style={{ cursor: "pointer" }}
                  label={{ position: "top", fill: "var(--foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                >
                  {volumenMes.map((d) => (
                    <Cell key={d.key} fill={selectedHojaMes === d.key ? PALETTE.orangeBright : PALETTE.violet} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBox>
      </section>

      {/* Row 3: Top Consultores */}
      <ChartBox title="🏅 Top Consultores · mencionados en gestiones">
        {topConsultores.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={Math.max(220, topConsultores.length * 28)}>
            <BarChart data={topConsultores} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="consultor" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={170} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(167,139,250,0.08)" }} />
              <Bar
                dataKey="count"
                fill={PALETTE.violet}
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
  rows: Seguimiento[];
  abierta: boolean;
  onToggle: () => void;
  query: string;
  onQueryChange: (v: string) => void;
}) {
  const filtradas = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.asesor, r.consultor, r.cliente, r.lead_numero, r.producto, r.status, r.observacion, r.financiamiento]
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
          <h3 className="exec-label">Detalle de Seguimiento</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="kpi-number text-foreground">{rows.length}</span> gestiones
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
                placeholder="Buscar por asesor, cliente, consultor, lead, observación…"
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
                    <th>Fecha</th>
                    <th>Mes</th>
                    <th>Asesor</th>
                    <th>Lead</th>
                    <th>Cliente</th>
                    <th>Consultor</th>
                    <th>Producto</th>
                    <th>Financ.</th>
                    <th>Status</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.slice(0, 300).map((r) => (
                    <tr key={r.id}>
                      <td className="text-muted-foreground">{r.fecha ?? "—"}</td>
                      <td className="text-muted-foreground">{r.hoja_origen ?? "—"}</td>
                      <td className="text-foreground">{r.asesor ?? "—"}</td>
                      <td className="text-muted-foreground">{r.lead_numero ?? "—"}</td>
                      <td className="text-muted-foreground truncate max-w-[180px]">{r.cliente ?? "—"}</td>
                      <td className="text-foreground">{r.consultor ?? "—"}</td>
                      <td className="text-muted-foreground">{r.producto ?? "—"}</td>
                      <td className="text-muted-foreground">{r.financiamiento ?? "—"}</td>
                      <td className="text-foreground">{r.status ?? "—"}</td>
                      <td className="text-xs text-muted-foreground truncate max-w-[300px]">{r.observacion ?? "—"}</td>
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
  label, value, sub, icon: Icon, hero = false, emerald = false,
}: {
  label: string; value: number; sub?: string; icon: React.ElementType; hero?: boolean; emerald?: boolean;
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
        <AnimatedCounter value={value} decimals={0} />
      </p>
      {sub && <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

function capitalize(s: string) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}
