import { supabase } from "../lib/supabase";

const BUCKET = "product-images";

/**
 * Uploads a file to the `product-images` bucket (public read, admin-only
 * write — see 0009_product_images_storage.sql) and returns its public URL.
 * That URL is what actually gets saved on `products.image_url` /
 * `categories.image_url` — the bucket only holds the bytes, the DB column
 * stays a plain string either way, same as when an admin pastes a URL
 * directly.
 */
export async function uploadImage(file: File, folder: "products" | "categories"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
