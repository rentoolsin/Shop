import { supabase } from "../lib/supabase";

export interface CategoryListItem {
  id: string;
  name: string;
  imageUrl: string | null;
}

export async function fetchActiveCategories(): Promise<CategoryListItem[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.image_url,
  }));
}
