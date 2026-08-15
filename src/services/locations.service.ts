import { supabase } from "../lib/supabase";

export interface LocationListItem {
  id: string;
  name: string;
  state: string;
  isAvailable: boolean;
}

export async function fetchAllLocations(): Promise<LocationListItem[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, state, is_available")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    state: l.state,
    isAvailable: l.is_available,
  }));
}
