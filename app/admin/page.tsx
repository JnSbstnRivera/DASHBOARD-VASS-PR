import { AdminPanel } from "@/components/admin/admin-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

type DataStats = {
  ventas: number;
  seguimiento: number;
  ultimaVenta: string | null;
  ultimoSeguimiento: string | null;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const [ventasRes, seguRes, lastLogRes] = await Promise.all([
    supabase.from("ventas").select("closing_date", { count: "exact" }).order("closing_date", { ascending: false }).limit(1),
    supabase.from("seguimiento").select("fecha", { count: "exact" }).order("fecha", { ascending: false }).limit(1),
    supabase
      .from("upload_log")
      .select("uploaded_at, archivo, filas_cargadas, notas, uploaded_by")
      .order("uploaded_at", { ascending: false })
      .limit(5),
  ]);

  const stats: DataStats = {
    ventas: ventasRes.count ?? 0,
    seguimiento: seguRes.count ?? 0,
    ultimaVenta: ventasRes.data?.[0]?.closing_date ?? null,
    ultimoSeguimiento: seguRes.data?.[0]?.fecha ?? null,
  };

  return <AdminPanel stats={stats} lastLogs={lastLogRes.data ?? []} />;
}
