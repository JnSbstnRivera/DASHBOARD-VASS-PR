"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Headphones, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarDownload } from "@/components/dashboard/sidebar-download";

const NAV_ITEMS = [
  {
    href: "/dashboard/resumen",
    label: "Resumen",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/ventas",
    label: "Ventas",
    icon: BarChart3,
  },
  {
    href: "/dashboard/seguimiento",
    label: "Seguimiento",
    icon: Headphones,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-sidebar flex h-screen w-64 shrink-0 flex-col text-sidebar-foreground">
      <div className="flex flex-col items-center gap-3 border-b border-border px-4 py-6">
        <div className="relative h-36 w-36 shrink-0">
          <Image
            src="/windmar-logo-VASS.png"
            alt="Windmar Home VASS"
            fill
            sizes="144px"
            className="object-contain"
            priority
          />
        </div>
        <div className="text-center min-w-0">
          <p className="truncate text-base font-bold leading-tight text-foreground">
            VASS
          </p>
          <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
            Call Center · Bogotá
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-windmar-blue text-white shadow-sm dark:bg-windmar-orange dark:text-windmar-black"
                  : "text-sidebar-foreground hover:bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="flex-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <SidebarDownload />
    </aside>
  );
}
