-- 0007_product_variant_transaction.sql
--
-- TODO.md "Smaller follow-ups" / DECISIONS.md: product/variant writes were
-- multiple sequential Supabase calls from the client (products.service.ts
-- did an insert/update on `products`, then separate insert/update calls per
-- variant), not wrapped in a transaction. Accepted at the time because the
-- failure mode (a product saved with partial/missing variants) was
-- recoverable by re-editing, not data corruption — but flagged to revisit
-- before heavy concurrent admin use. This migration adds that transaction
-- boundary as a single RPC; a plpgsql function body is already atomic, so
-- any exception (e.g. the `reserved_not_over_total` check firing because an
-- edit tried to drop capacity below what's currently reserved) rolls back
-- the product update and every variant change together instead of leaving
-- a half-saved product.
--
-- Deliberately NOT included here: variant deletion. DECISIONS.md already
-- chose explicit `deleteVariant` calls from the form over diffing inside
-- the service layer, to keep write functions single-purpose and the
-- "what changed" logic visible in the form component — this migration
-- keeps that decision, it only makes the create/update path atomic.

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
  p_variants jsonb
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
begin
  if not is_admin() then
    raise exception 'Only admins can save products';
  end if;

  if jsonb_typeof(p_variants) is distinct from 'array' then
    raise exception 'p_variants must be a JSON array';
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

  return v_product_id;
end;
$$;

comment on function admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb
) is
  'Atomically creates/updates a product and upserts its variants in one '
  'transaction (admin_save_product_with_variants). Variant deletion stays '
  'a separate explicit call (delete from product_variants), per '
  'DECISIONS.md — this RPC only covers the create/update path that was '
  'previously several sequential, non-transactional client calls.';

revoke all on function admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb
) from public;
grant execute on function admin_save_product_with_variants(
  uuid, text, text, text, text, uuid, boolean, boolean, integer, jsonb
) to authenticated;
