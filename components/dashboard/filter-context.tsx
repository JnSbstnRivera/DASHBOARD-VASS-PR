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
  clearFilters: () => void;
};

const FilterContext = createContext<FilterContextValue | null>(null);

const STORAGE_KEY = "windmar-dash-filters";

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<PresetRange>("all");
  const [customFrom, setCustomFromState] = useState("");
  const [customTo, setCustomToState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Cargar de sessionStorage en mount
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

  // Persistir en sessionStorage
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
