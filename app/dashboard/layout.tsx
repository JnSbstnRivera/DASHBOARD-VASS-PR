import { Sidebar } from "@/components/sidebar";
import { PageTransition } from "@/components/page-transition";
import { FilterProvider } from "@/components/dashboard/filter-context";
import { TopBar } from "@/components/dashboard/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FilterProvider>
      <div className="relative flex h-screen overflow-hidden bg-background">
        {/* Ambient background — orbes Windmar + grid (solo dark) */}
        <div className="ambient-bg">
          <div className="ambient-orb orb-1" />
          <div className="ambient-orb orb-2" />
          <div className="ambient-orb orb-3" />
          <div className="ambient-orb orb-4" />
        </div>
        <Sidebar />
        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <TopBar />
          <div className="w-full space-y-6 px-6 py-6 lg:px-10 lg:py-8 2xl:px-14">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </FilterProvider>
  );
}
