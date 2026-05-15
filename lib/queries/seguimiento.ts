import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Seguimiento = Database["vass"]["Tables"]["seguimiento"]["Row"];

const PAGE = 1000;

export async function fetchSeguimientoData() {
  const supabase = await createSupabaseServerClient();
  const all: Seguimiento[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("seguimiento")
      .select("*")
      .order("fecha", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("[fetchSeguimientoData VASS] error", error);
      return { seguimiento: all, error: error.message };
    }
    if (!data || data.length === 0) break;
    all.push(...(data as Seguimiento[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return { seguimiento: all, error: null };
}
