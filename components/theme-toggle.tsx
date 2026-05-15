"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

type ViewTransition = { ready: Promise<void> };
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const isDark = theme === "dark";

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";

    const doc = document as DocumentWithViewTransition;
    const button = buttonRef.current;

    // Fallback: navegador sin View Transitions o sin ref → cambio plano
    if (!doc.startViewTransition || !button) {
      setTheme(nextTheme);
      return;
    }

    // Coordenadas exactas del centro del botón para que el círculo nazca de ahí
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Radio máximo: la esquina más lejana de la pantalla desde el botón
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    doc.documentElement.style.setProperty("--theme-x", `${x}px`);
    doc.documentElement.style.setProperty("--theme-y", `${y}px`);
    doc.documentElement.style.setProperty("--theme-r", `${endRadius}px`);

    // startViewTransition toma snapshot del estado actual, aplica el cambio
    // (dentro del callback) y anima del snapshot al nuevo estado.
    doc.startViewTransition(() => {
      flushSync(() => setTheme(nextTheme));
    });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-muted"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
