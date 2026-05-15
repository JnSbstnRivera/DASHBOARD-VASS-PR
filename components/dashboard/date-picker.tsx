"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string; // ISO yyyy-mm-dd
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa", className }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : undefined;
  const isValidDate = selectedDate && isValid(selectedDate);

  // Cierra al click afuera
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "input-exec flex items-center justify-between gap-2 text-xs cursor-pointer min-w-[140px] w-full",
          "hover:border-windmar-orange/40",
        )}
      >
        <span className={cn(isValidDate ? "text-foreground" : "text-muted-foreground")}>
          {isValidDate ? format(selectedDate, "dd / MM / yyyy") : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange("");
                }
              }}
              className="rounded p-0.5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <CalendarIcon className="h-3.5 w-3.5 text-windmar-orange/70" />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 wm-calendar">
          <DayPicker
            mode="single"
            locale={es}
            selected={selectedDate}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            captionLayout="dropdown"
            startMonth={new Date(2024, 0)}
            endMonth={new Date(2030, 11)}
            hideNavigation
            showOutsideDays={false}
          />
        </div>
      )}
    </div>
  );
}
