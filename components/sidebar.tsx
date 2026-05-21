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
    <aside className="glass-sidebar flex h-screen w-14 shrink-0 flex-col text-sidebar-foreground md:w-64">
      <div className="flex flex-col items-center gap-3 border-b border-border px-2 py-3 md:px-4 md:py-6">
        <div className="relative h-10 w-10 shrink-0 md:h-36 md:w-36">
          <Image
            src="/windmar-logo-VASS.png"
            alt="Windmar Home VASS"
            fill
            sizes="144px"
            className="object-contain"
            priority
          />
        </div>
        <div className="hidden text-center min-w-0 md:block">
          <p className="truncate text-base font-bold leading-tight text-foreground">
            VASS
          </p>
          <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
            Call Center · Bogotá
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4 md:px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors md:justify-start md:px-3",
                isActive
                  ? "bg-windmar-blue text-white shadow-sm dark:bg-windmar-orange dark:text-windmar-black"
                  : "text-sidebar-foreground hover:bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 md:h-4 md:w-4",
                  isActive ? "" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="hidden flex-1 font-medium md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <SidebarDownload />
    </aside>
  );
}
