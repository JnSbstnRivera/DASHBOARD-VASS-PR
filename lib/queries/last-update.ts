import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Obtiene el timestamp más reciente de `inserted_at` entre las 2 tablas
 * del schema `vass` (ventas + seguimiento).
 */
export async function fetchLastUpdate(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const [v, s] = await Promise.all([
    supabase.from("ventas").select("inserted_at").order("inserted_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("seguimiento").select("inserted_at").order("inserted_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const ts = [v.data?.inserted_at, s.data?.inserted_at]
    .filter((t): t is string => !!t)
    .map((t) => new Date(t).getTime());
  if (ts.length === 0) return null;
  return new Date(Math.max(...ts)).toISOString();
}
