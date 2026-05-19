"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type PresetRange = "all" | "thisMonth" | "custom";

type FilterState = {
  preset: PresetRange;
  customFrom: string;
  customTo: string;
};

type FilterContextValue = FilterState & {
  setPreset: (p: PresetRange) => void;
  setCustomFrom: (s: string) => void;
  setCustomTo: (s: string) => void;
  /** Helper: setea preset=custom con el rango completo de un mes (0-indexed). */
  setMonthRange: (monthIdx: number, year: number) => void;
  clearFilters: () => void;
};

const FilterContext = createContext<FilterContextValue | null>(null);

const STORAGE_KEY = "windmar-dash-filters";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<PresetRange>("all");
  const [customFrom, setCustomFromState] = useState("");
  const [customTo, setCustomToState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FilterState;
        setPresetState(parsed.preset ?? "all");
        setCustomFromState(parsed.customFrom ?? "");
        setCustomToState(parsed.customTo ?? "");
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ preset, customFrom, customTo }),
      );
    } catch {}
  }, [preset, customFrom, customTo, hydrated]);

  function setPreset(p: PresetRange) {
    setPresetState(p);
  }
  function setCustomFrom(s: string) {
    setCustomFromState(s);
  }
  function setCustomTo(s: string) {
    setCustomToState(s);
  }
  function setMonthRange(monthIdx: number, year: number) {
    const from = `${year}-${pad2(monthIdx + 1)}-01`;
    const last = new Date(year, monthIdx + 1, 0).getDate();
    const to = `${year}-${pad2(monthIdx + 1)}-${pad2(last)}`;
    setCustomFromState(from);
    setCustomToState(to);
    setPresetState("custom");
  }
  function clearFilters() {
    setPresetState("all");
    setCustomFromState("");
    setCustomToState("");
  }

  return (
    <FilterContext.Provider
      value={{
        preset,
        customFrom,
        customTo,
        setPreset,
        setCustomFrom,
        setCustomTo,
        setMonthRange,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilters debe usarse dentro de FilterProvider");
  }
  return ctx;
}
