import { supabase } from "../lib/supabase";

// Raw shapes for the nested `product_variants(...)` embedded-resource selects
// below. Cast explicitly rather than relying on postgrest-js's nested-select
// inference — same rationale as admin-rentals.service.ts: the hand-written
// Database type has no per-column Relationships metadata, so nested selects
// can't be inferred reliably.
interface RawProductListRow {
  id: string;
  name: string;
  category_id: string;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  product_variants: { id: string }[] | null;
}

interface RawProductEditRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  category_id: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  product_variants:
    | { id: string; label: string; daily_rate: number; quantity_total: number; is_active: boolean }[]
    | null;
  product_images: { id: string; image_url: string; sort_order: number }[] | null;
}

export interface AdminProductListItem {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  variantCount: number;
}

export interface AdminVariant {
  id: string | null; // null = new, not yet saved
  label: string;
  dailyRate: number;
  quantityTotal: number;
  isActive: boolean;
}

export interface AdminProductImage {
  id: string | null; // null = new, not yet saved
  imageUrl: string;
  sortOrder: number;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  variants: AdminVariant[];
  images: AdminProductImage[];
}

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  variants: AdminVariant[];
  images: AdminProductImage[];
}

export async function fetchAllProducts(): Promise<AdminProductListItem[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category_id, image_url, is_featured, is_active, sort_order, product_variants(id)")
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as RawProductListRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    categoryId: p.category_id,
    imageUrl: p.image_url,
    isFeatured: p.is_featured,
    isActive: p.is_active,
    sortOrder: p.sort_order,
    variantCount: (p.product_variants ?? []).length,
  }));
}

export async function fetchProductForEdit(id: string): Promise<AdminProductDetail | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, image_url, category_id, is_featured, is_active, sort_order, " +
        "product_variants(id, label, daily_rate, quantity_total, is_active), " +
        "product_images(id, image_url, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as RawProductEditRow;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    categoryId: row.category_id,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    variants: (row.product_variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      dailyRate: v.daily_rate,
      quantityTotal: v.quantity_total,
      isActive: v.is_active,
    })),
    images: (row.product_images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        id: img.id,
        imageUrl: img.image_url,
        sortOrder: img.sort_order,
      })),
  };
}

/**
 * Creates a product and its variants in a single DB transaction via the
 * `admin_save_product_with_variants` RPC (0007_product_variant_transaction.sql).
 * Previously this was two-plus sequential client calls (insert product,
 * then insert variants) with no atomicity — a failure partway through
 * left an editable-but-partial product rather than corrupting anything,
 * which is why it wasn't urgent, but it's a real gap under concurrent
 * admin use. The RPC closes it: either everything commits, or nothing
 * does. Variant deletion is intentionally NOT part of this call — see
 * `deleteVariant` below and DECISIONS.md.
 */
export async function createProduct(values: ProductFormValues): Promise<string> {
  const { data, error } = await supabase.rpc("admin_save_product_with_variants", {
    p_product_id: null,
    p_name: values.name,
    p_slug: values.slug,
    p_description: values.description || null,
    p_image_url: values.imageUrl || null,
    p_category_id: values.categoryId,
    p_is_featured: values.isFeatured,
    p_is_active: values.isActive,
    p_sort_order: values.sortOrder,
    p_variants: values.variants.map((v) => ({
      id: v.id,
      label: v.label,
      dailyRate: v.dailyRate,
      quantityTotal: v.quantityTotal,
      isActive: v.isActive,
    })),
    p_images: values.images.map((img, index) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      sortOrder: index,
    })),
  });
  if (error) throw error;
  return data as string;
}

/**
 * Updates a product and upserts its variants in one transaction (same RPC
 * as `createProduct` — see its docstring). Variant *removal* still goes
 * through the separate `deleteVariant` call the form already makes
 * explicitly, per DECISIONS.md's "explicit calls, not diffing" choice.
 */
export async function updateProduct(id: string, values: ProductFormValues): Promise<void> {
  const { error } = await supabase.rpc("admin_save_product_with_variants", {
    p_product_id: id,
    p_name: values.name,
    p_slug: values.slug,
    p_description: values.description || null,
    p_image_url: values.imageUrl || null,
    p_category_id: values.categoryId,
    p_is_featured: values.isFeatured,
    p_is_active: values.isActive,
    p_sort_order: values.sortOrder,
    p_variants: values.variants.map((v) => ({
      id: v.id,
      label: v.label,
      dailyRate: v.dailyRate,
      quantityTotal: v.quantityTotal,
      isActive: v.isActive,
    })),
    p_images: values.images.map((img, index) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      sortOrder: index,
    })),
  });
  if (error) throw error;
}

export interface ProductInventorySummary {
  productName: string;
  /** Total capacity across active variants only (inactive variants aren't rentable). */
  totalQuantity: number;
  /** Currently reserved (active/due_today/overdue rentals), per the DB's own `quantity_reserved`. */
  reservedQuantity: number;
  /** totalQuantity - reservedQuantity, floored at 0. */
  availableQuantity: number;
}

interface RawInventoryRow {
  name: string;
  product_variants: { quantity_total: number; quantity_reserved: number; is_active: boolean }[] | null;
}

/**
 * Live per-product capacity snapshot for Reports' "current availability"
 * column. Reuses `quantity_reserved`, the same column the DB inventory
 * trigger (0001_init_schema.sql) maintains as the source of truth — this
 * does not recompute reservations client-side. Keyed by product name to
 * match the existing rentals-by-product grouping convention (Reports.tsx,
 * Dashboard.tsx), since rentals are only joined through to a product name,
 * not a product id.
 */
export async function fetchProductInventorySummary(): Promise<Map<string, ProductInventorySummary>> {
  const { data, error } = await supabase
    .from("products")
    .select("name, product_variants(quantity_total, quantity_reserved, is_active)");
  if (error) throw error;

  const map = new Map<string, ProductInventorySummary>();
  for (const row of (data ?? []) as unknown as RawInventoryRow[]) {
    const activeVariants = (row.product_variants ?? []).filter((v) => v.is_active);
    const totalQuantity = activeVariants.reduce((sum, v) => sum + v.quantity_total, 0);
    const reservedQuantity = activeVariants.reduce((sum, v) => sum + v.quantity_reserved, 0);
    map.set(row.name, {
      productName: row.name,
      totalQuantity,
      reservedQuantity,
      availableQuantity: Math.max(0, totalQuantity - reservedQuantity),
    });
  }
  return map;
}

export async function deleteVariant(variantId: string): Promise<void> {
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
  if (error) throw error;
}

/**
 * Removes one gallery photo. Kept as an explicit call from the form (like
 * deleteVariant above) rather than diffing inside admin_save_product_with_variants —
 * same "what changed" stays visible in the component" rationale as DECISIONS.md.
 * Storage bytes in the `product-images` bucket are intentionally not
 * deleted here — same trade-off already made for the cover `image_url`
 * field, which never garbage-collects replaced files either.
 */
export async function deleteProductImage(imageId: string): Promise<void> {
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
