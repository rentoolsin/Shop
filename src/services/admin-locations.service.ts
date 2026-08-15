import { supabase } from "../lib/supabase";

export interface AdminLocation {
  id: string;
  name: string;
  state: string;
  isAvailable: boolean;
  sortOrder: number;
}

export interface LocationFormValues {
  name: string;
  state: string;
  isAvailable: boolean;
  sortOrder: number;
}

function toAdminLocation(row: {
  id: string;
  name: string;
  state: string;
  is_available: boolean;
  sort_order: number;
}): AdminLocation {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    isAvailable: row.is_available,
    sortOrder: row.sort_order,
  };
}

export async function fetchAllAdminLocations(): Promise<AdminLocation[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, state, is_available, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toAdminLocation);
}

export async function fetchLocationById(id: string): Promise<AdminLocation | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, state, is_available, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAdminLocation(data) : null;
}

export async function createLocation(values: LocationFormValues): Promise<void> {
  const { error } = await supabase.from("locations").insert({
    name: values.name,
    state: values.state,
    is_available: values.isAvailable,
    sort_order: values.sortOrder,
  });
  if (error) throw error;
}

export async function updateLocation(id: string, values: LocationFormValues): Promise<void> {
  const { error } = await supabase
    .from("locations")
    .update({
      name: values.name,
      state: values.state,
      is_available: values.isAvailable,
      sort_order: values.sortOrder,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw error;
}
