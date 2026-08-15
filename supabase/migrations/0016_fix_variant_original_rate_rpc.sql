-- 0016_fix_variant_original_rate_rpc.sql
--
-- Fixes a bug in 0015_variant_original_rate.sql: it recreated
-- admin_save_product_with_variants using the old 10-argument signature
-- from before 0010_product_images.sql added p_images (11 args). Postgres
-- treats different argument counts as different overloads, so 0015 did
-- NOT replace the real function — it created a second, unreachable one.
-- The app calls the RPC with p_images included, so it kept hitting the
-- original 11-arg function, which has no idea about original_daily_rate.
-- That's why "Original rate" wasn't saving.
--
-- This migration: drops the stray 10-arg overload 0015 left behind, then
-- (re)installs the correct 11-arg function with original_daily_rate
-- support. Safe to run even if your DB never had the stray overload —
-- `drop function if exists` is a no-op in that case.

drop function if exists admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb
);

drop function if exists admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb, jsonb
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
  -- originalDailyRate: number|null, quantityTotal: integer, isActive: boolean}.
  -- id null = new variant.
  p_variants jsonb,
  -- jsonb array of {id: uuid|null, imageUrl: text, sortOrder: integer}.
  -- id null = new gallery photo.
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
        product_id, label, daily_rate, original_daily_rate, quantity_total, is_active
      )
      values (
        v_product_id,
        v_variant->>'label',
        (v_variant->>'dailyRate')::numeric,
        nullif(v_variant->>'originalDailyRate', '')::numeric,
        (v_variant->>'quantityTotal')::integer,
        (v_variant->>'isActive')::boolean
      );
    else
      update product_variants set
        label = v_variant->>'label',
        daily_rate = (v_variant->>'dailyRate')::numeric,
        original_daily_rate = nullif(v_variant->>'originalDailyRate', '')::numeric,
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
  'Atomically creates/updates a product and upserts its variants '
  '(including the optional original_daily_rate strikethrough price) and '
  'gallery images in one transaction. Variant/image deletion stay separate '
  'explicit calls (delete from product_variants / product_images), per '
  'DECISIONS.md.';

revoke all on function admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb, jsonb
) from public;
grant execute on function admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb, jsonb
) to authenticated;
