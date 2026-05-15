import { ResumenDashboard } from "@/components/resumen/resumen-dashboard";
import { fetchVentasData } from "@/lib/queries/ventas";
import { fetchSeguimientoData } from "@/lib/queries/seguimiento";

export const revalidate = 0;

export default async function ResumenPage() {
  const [ventasResp, segResp] = await Promise.all([
    fetchVentasData(),
    fetchSeguimientoData(),
  ]);

  return (
    <ResumenDashboard
      ventas={ventasResp.ventas}
      seguimiento={segResp.seguimiento}
    />
  );
}
