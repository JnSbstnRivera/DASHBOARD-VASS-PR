import { SeguimientoDashboard } from "@/components/seguimiento/seguimiento-dashboard";
import { fetchSeguimientoData } from "@/lib/queries/seguimiento";

export const revalidate = 0;

export default async function SeguimientoPage() {
  const { seguimiento, error } = await fetchSeguimientoData();

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
        ⚠ Error leyendo seguimiento: {error}
      </div>
    );
  }

  return <SeguimientoDashboard initialSeguimiento={seguimiento} />;
}
