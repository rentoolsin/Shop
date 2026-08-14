-- 0009_product_images_storage.sql
-- Public storage bucket backing the new "Upload" option on the Product and
-- Category image fields (previously URL-paste only, see ImageInput.tsx /
-- storage.service.ts). Uploading writes bytes here and the resulting public
-- URL is what actually lands in products.image_url / categories.image_url —
-- this bucket never needs to be queried directly by the app, only through
-- that stored URL, same as when an admin pastes a URL by hand instead.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Product/category photos are public-facing on the storefront regardless of
-- how they got uploaded, so anyone (including anonymous customers) can read.
create policy "public read product images"
  on storage.objects
  for select
  using (bucket_id = 'product-images');

-- Only admins can add, replace, or remove files.
create policy "admin insert product images"
  on storage.objects
  for insert
  with check (bucket_id = 'product-images' and is_admin());

create policy "admin update product images"
  on storage.objects
  for update
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

create policy "admin delete product images"
  on storage.objects
  for delete
  using (bucket_id = 'product-images' and is_admin());
