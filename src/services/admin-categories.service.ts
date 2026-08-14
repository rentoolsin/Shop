import { supabase } from "../lib/supabase";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CategoryFormValues {
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

function toAdminCategory(row: {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export async function fetchAllCategories(): Promise<AdminCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_url, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toAdminCategory);
}

export async function fetchCategoryById(id: string): Promise<AdminCategory | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_url, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAdminCategory(data) : null;
}

export async function createCategory(values: CategoryFormValues): Promise<void> {
  const { error } = await supabase.from("categories").insert({
    name: values.name,
    slug: values.slug,
    image_url: values.imageUrl || null,
    sort_order: values.sortOrder,
    is_active: values.isActive,
  });
  if (error) throw error;
}

export async function updateCategory(id: string, values: CategoryFormValues): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update({
      name: values.name,
      slug: values.slug,
      image_url: values.imageUrl || null,
      sort_order: values.sortOrder,
      is_active: values.isActive,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
