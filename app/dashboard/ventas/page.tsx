import { VentasDashboard } from "@/components/ventas/ventas-dashboard";
import { fetchVentasData } from "@/lib/queries/ventas";

export const revalidate = 0;

export default async function VentasPage() {
  const { ventas, error } = await fetchVentasData();

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
        ⚠ Error leyendo ventas VASS: {error}
      </div>
    );
  }

  return <VentasDashboard initialVentas={ventas} />;
}
