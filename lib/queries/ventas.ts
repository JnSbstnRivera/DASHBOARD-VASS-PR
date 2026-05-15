import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Venta = Database["vass"]["Tables"]["ventas"]["Row"];

const PAGE = 1000;

export async function fetchVentasData() {
  const supabase = await createSupabaseServerClient();
  const all: Venta[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .order("closing_date", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("[fetchVentasData VASS] error", error);
      return { ventas: all, error: error.message };
    }
    if (!data || data.length === 0) break;
    all.push(...(data as Venta[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return { ventas: all, error: null };
}
