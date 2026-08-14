-- 0010_product_images.sql
--
-- Adds a product photo gallery. `products.image_url` stays exactly as-is —
-- it remains the cover photo used everywhere a single thumbnail is needed
-- (product cards, admin list, cart/rental rows). This table only holds the
-- *additional* photos shown in the detail-page carousel, so every existing
-- call site that reads `products.image_url` keeps working unchanged.

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_id_idx on product_images (product_id);

alter table product_images enable row level security;

-- Same visibility rule as the parent product: public can read gallery
-- photos for active products (or any product, if admin).
create policy "public read active product images" on product_images
  for select using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id
        and (p.is_active = true or is_admin())
    )
  );

create policy "admin full access product images" on product_images
  for all using (is_admin()) with check (is_admin());

-- ==========================================================================
-- Extend the atomic product save to also upsert gallery images, same
-- id-null-means-new convention as p_variants. Image *deletion* stays a
-- separate explicit client call (see deleteProductImage in
-- admin-products.service.ts), matching the deleteVariant precedent from
-- 0007_product_variant_transaction.sql / DECISIONS.md.
--
-- Signature is changing (new p_images param), so the old overload is
-- dropped first rather than left behind.
drop function if exists admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb
);

create or replace function admin_save_product_with_variants(
  p_product_id uuid, -- null = create a new product
  p_name text,
  p_slug text,
  p_description text,
  p_image_url text,
  p_category_id uuid,
  p_is_featured boolean,
  p_is_active boolean,
  p_sort_order integer,
  -- jsonb array of {id: uuid|null, label: text, dailyRate: number,
  -- quantityTotal: integer, isActive: boolean}. id null = new variant.
  p_variants jsonb,
  -- jsonb array of {id: uuid|null, imageUrl: text, sortOrder: integer}.
  -- id null = new gallery photo. Defaults to '[]' so any caller not yet
  -- updated to pass it keeps working.
  p_images jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_variant jsonb;
  v_variant_id uuid;
  v_image jsonb;
  v_image_id uuid;
begin
  if not is_admin() then
    raise exception 'Only admins can save products';
  end if;

  if jsonb_typeof(p_variants) is distinct from 'array' then
    raise exception 'p_variants must be a JSON array';
  end if;
  if jsonb_typeof(p_images) is distinct from 'array' then
    raise exception 'p_images must be a JSON array';
  end if;

  if p_product_id is null then
    insert into products (
      name, slug, description, image_url, category_id,
      is_featured, is_active, sort_order
    )
    values (
      p_name, p_slug, p_description, p_image_url, p_category_id,
      p_is_featured, p_is_active, p_sort_order
    )
    returning id into v_product_id;
  else
    update products set
      name = p_name,
      slug = p_slug,
      description = p_description,
      image_url = p_image_url,
      category_id = p_category_id,
      is_featured = p_is_featured,
      is_active = p_is_active,
      sort_order = p_sort_order
    where id = p_product_id
    returning id into v_product_id;

    if v_product_id is null then
      raise exception 'Product % not found', p_product_id;
    end if;
  end if;

  for v_variant in select * from jsonb_array_elements(p_variants)
  loop
    v_variant_id := nullif(v_variant->>'id', '')::uuid;

    if v_variant_id is null then
      insert into product_variants (
        product_id, label, daily_rate, quantity_total, is_active
      )
      values (
        v_product_id,
        v_variant->>'label',
        (v_variant->>'dailyRate')::numeric,
        (v_variant->>'quantityTotal')::integer,
        (v_variant->>'isActive')::boolean
      );
    else
      update product_variants set
        label = v_variant->>'label',
        daily_rate = (v_variant->>'dailyRate')::numeric,
        quantity_total = (v_variant->>'quantityTotal')::integer,
        is_active = (v_variant->>'isActive')::boolean
      where id = v_variant_id
        and product_id = v_product_id;

      if not found then
        raise exception 'Variant % not found on product %', v_variant_id, v_product_id;
      end if;
    end if;
  end loop;

  for v_image in select * from jsonb_array_elements(p_images)
  loop
    v_image_id := nullif(v_image->>'id', '')::uuid;

    if v_image_id is null then
      insert into product_images (product_id, image_url, sort_order)
      values (
        v_product_id,
        v_image->>'imageUrl',
        (v_image->>'sortOrder')::integer
      );
    else
      update product_images set
        image_url = v_image->>'imageUrl',
        sort_order = (v_image->>'sortOrder')::integer
      where id = v_image_id
        and product_id = v_product_id;

      if not found then
        raise exception 'Image % not found on product %', v_image_id, v_product_id;
      end if;
    end if;
  end loop;

  return v_product_id;
end;
$$;

comment on function admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb, jsonb
) is
  'Atomically creates/updates a product and upserts its variants and '
  'gallery images in one transaction. Variant/image deletion stay separate '
  'explicit calls (delete from product_variants / product_images), per '
  'DECISIONS.md.';

revoke all on function admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb, jsonb
) from public;
grant execute on function admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb, jsonb
) to authenticated;
