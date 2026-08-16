import { supabase } from "../lib/supabase";

export interface ProductListItem {
  id: string;
  name: string;
  imageUrl: string | null;
  fromDailyRate: number | null;
  /** Admin-set "was" rate on the same variant fromDailyRate came from — shown struck
   *  through next to it. Null when unset, or not greater than fromDailyRate. */
  originalFromDailyRate: number | null;
  available: boolean;
  /** Name of the product's category, for the category tag on the card. Null if the join can't resolve it. */
  categoryName: string | null;
  /** Average of approved reviews, rounded to 1 decimal. Null when the product has no reviews yet. */
  rating: number | null;
  /** Count of approved reviews backing `rating`. */
  reviewCount: number;
}

export interface ProductVariantDetail {
  id: string;
  label: string;
  dailyRate: number;
  /** Admin-set "was" rate, shown struck through next to dailyRate. Null = no strikethrough. */
  originalDailyRate: number | null;
  availableQuantity: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  /** Extra gallery photos beyond the cover `imageUrl`, in display order. */
  galleryImageUrls: string[];
  categoryId: string;
  variants: ProductVariantDetail[];
}

type RawVariant = {
  daily_rate: number;
  original_daily_rate: number | null;
  quantity_total: number;
  quantity_reserved: number;
  is_active: boolean;
};

type RawListRow = {
  id: string;
  name: string;
  image_url: string | null;
  product_variants: RawVariant[] | null;
  categories: { name: string } | { name: string }[] | null;
  product_reviews: { rating: number }[] | null;
};

function toListItem(product: RawListRow): ProductListItem {
  const activeVariants = (product.product_variants ?? []).filter((v) => v.is_active);
  const rates = activeVariants.map((v) => v.daily_rate);
  const available = activeVariants.some(
    (v) => v.quantity_total - v.quantity_reserved > 0,
  );

  // Supabase returns an embedded to-one relation as an object, but some
  // client/codegen versions type (and occasionally send) it as a
  // single-item array — handle both shapes defensively.
  const categoryRow = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;

  const reviews = product.product_reviews ?? [];
  const reviewCount = reviews.length;
  const rating = reviewCount
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
    : null;

  const fromDailyRate = rates.length ? Math.min(...rates) : null;
  // The strikethrough price pairs with the same variant fromDailyRate came
  // from — not just "any" original rate across variants.
  const cheapestVariant =
    fromDailyRate != null ? activeVariants.find((v) => v.daily_rate === fromDailyRate) : undefined;
  const originalFromDailyRate =
    cheapestVariant?.original_daily_rate != null && cheapestVariant.original_daily_rate > fromDailyRate!
      ? cheapestVariant.original_daily_rate
      : null;

  return {
    id: product.id,
    name: product.name,
    imageUrl: product.image_url,
    fromDailyRate,
    originalFromDailyRate,
    available,
    categoryName: categoryRow?.name ?? null,
    rating,
    reviewCount,
  };
}

const LIST_SELECT =
  "id, name, image_url, " +
  "product_variants(daily_rate, original_daily_rate, quantity_total, quantity_reserved, is_active), " +
  "categories(name), " +
  "product_reviews(rating)";

// Out-of-stock tools sink to the end of the storefront order automatically,
// then return to wherever their `sort_order` naturally places them once
// restocked — no admin action needed, and admins' own drag/manual ordering
// (see admin-products.service.ts, which reads sort_order directly and is
// unaffected by this) is left completely alone. Array.prototype.sort is
// stable, so within each group (in-stock / out-of-stock) items keep the
// relative order the query already returned them in.
function withOutOfStockLast(items: ProductListItem[]): ProductListItem[] {
  return items.slice().sort((a, b) => Number(!a.available) - Number(!b.available));
}

/** Featured, active products with their lowest active variant rate. */
export async function fetchFeaturedProducts(): Promise<ProductListItem[]> {
  const { data, error } = await supabase
    .from("products")
    .select(LIST_SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(12);

  if (error) throw error;
  return withOutOfStockLast(((data ?? []) as unknown as RawListRow[]).map(toListItem));
}

/** All active products, optionally scoped to a category, optionally text-filtered. */
export async function fetchProducts(options: {
  categoryId?: string;
  query?: string;
} = {}): Promise<ProductListItem[]> {
  let request = supabase.from("products").select(LIST_SELECT).eq("is_active", true);

  if (options.categoryId) {
    request = request.eq("category_id", options.categoryId);
  }
  if (options.query) {
    request = request.ilike("name", `%${options.query}%`);
  }

  const { data, error } = await request.order("sort_order", { ascending: true });
  if (error) throw error;
  return withOutOfStockLast(((data ?? []) as unknown as RawListRow[]).map(toListItem));
}

export interface OutOfStockProduct {
  id: string;
  name: string;
}

/**
 * Active products with zero available quantity across all active variants —
 * powers the "Tool name" picker on the general Request a tool page, so
 * people can only pick something that's genuinely worth requesting.
 */
export async function fetchOutOfStockProducts(): Promise<OutOfStockProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, product_variants(quantity_total, quantity_reserved, is_active)")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  type RawRow = {
    id: string;
    name: string;
    product_variants: { quantity_total: number; quantity_reserved: number; is_active: boolean }[] | null;
  };

  return ((data ?? []) as unknown as RawRow[])
    .filter((row) => {
      const activeVariants = (row.product_variants ?? []).filter((v) => v.is_active);
      if (activeVariants.length === 0) return false;
      return !activeVariants.some((v) => v.quantity_total - v.quantity_reserved > 0);
    })
    .map((row) => ({ id: row.id, name: row.name }));
}

export async function fetchProductById(id: string): Promise<ProductDetail | null> {
  interface RawProductDetailRow {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    category_id: string;
    product_variants:
      | {
          id: string;
          label: string;
          daily_rate: number;
          original_daily_rate: number | null;
          quantity_total: number;
          quantity_reserved: number;
          is_active: boolean;
        }[]
      | null;
    product_images: { image_url: string; sort_order: number }[] | null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, description, image_url, category_id, " +
        "product_variants(id, label, daily_rate, original_daily_rate, quantity_total, quantity_reserved, is_active), " +
        "product_images(image_url, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as RawProductDetailRow;

  const variants = (row.product_variants ?? [])
    .filter((v) => v.is_active)
    .map((v) => ({
      id: v.id,
      label: v.label,
      dailyRate: v.daily_rate,
      originalDailyRate:
        v.original_daily_rate != null && v.original_daily_rate > v.daily_rate ? v.original_daily_rate : null,
      availableQuantity: v.quantity_total - v.quantity_reserved,
    }));

  const galleryImageUrls = (row.product_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.image_url);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    galleryImageUrls,
    categoryId: row.category_id,
    variants,
  };
}

