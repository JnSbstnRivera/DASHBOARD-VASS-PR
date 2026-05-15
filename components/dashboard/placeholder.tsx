"use client";

import { motion } from "framer-motion";
import { Hammer } from "lucide-react";

export function Placeholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-5">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="kpi-number text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="exec-card-hero flex flex-col items-center justify-center gap-4 rounded-2xl p-12 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-windmar-orange/15 text-windmar-orange">
          <Hammer className="h-7 w-7" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">En construcción</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Este dashboard se está armando. Pronto verás KPIs, gráficas y filtros conectados a los datos de Supabase.
          </p>
        </div>
      </motion.section>
    </div>
  );
}
