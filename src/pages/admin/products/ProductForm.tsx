import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminProduct, useAdminCategories } from "../../../hooks/useAdminData";
import {
  createProduct,
  updateProduct,
  deleteVariant,
  deleteProductImage,
  type ProductFormValues,
  type AdminVariant,
} from "../../../services/admin-products.service";
import { slugify } from "../../../utils/slugify";
import { Input } from "../../../components/ui/Input";
import { ImageInput } from "../../../components/ui/ImageInput";
import { ImageGalleryInput } from "../../../components/ui/ImageGalleryInput";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { Switch } from "../../../components/ui/Switch";
import { Button } from "../../../components/ui/Button";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  categoryId: "",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
  variants: [],
  images: [],
};

function emptyVariant(): AdminVariant {
  return { id: null, label: "", dailyRate: 0, originalDailyRate: null, quantityTotal: 1, isActive: true };
}

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const existing = useAdminProduct(id);
  const categories = useAdminCategories();

  const [values, setValues] = useState<ProductFormValues>(EMPTY);
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const variantRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [pendingScrollIndex, setPendingScrollIndex] = useState<number | null>(null);

  useEffect(() => {
    if (existing.status === "success" && existing.data) {
      const { id: _id, ...rest } = existing.data;
      setValues(rest);
      setSlugTouched(true);
    }
  }, [existing.status, existing.data]);

  // New product (not editing an existing one): put the cursor in Name
  // as soon as the page is ready, same as the customer form.
  useEffect(() => {
    if (!isEdit) nameRef.current?.focus();
  }, [isEdit]);

  // After a new variant row is added it lands at the bottom of the list,
  // which is usually below the fold (and can end up hidden behind the
  // sticky Cancel/Save bar). Scroll it into view once it's rendered so
  // the admin sees it immediately instead of having to scroll manually.
  useEffect(() => {
    if (pendingScrollIndex === null) return;
    const node = variantRefs.current[pendingScrollIndex];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    setPendingScrollIndex(null);
  }, [pendingScrollIndex, values.variants.length]);

  if (isEdit && existing.status === "loading") return <LoadingState label="Loading product…" />;
  if (isEdit && existing.status === "error") {
    return <ErrorState title="Couldn't load this product" onRetry={existing.refetch} />;
  }

  const setField = <K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleNameChange = (name: string) => {
    setField("name", name);
    if (!slugTouched) setField("slug", slugify(name));
  };

  const updateVariant = (index: number, patch: Partial<AdminVariant>) => {
    setValues((v) => ({
      ...v,
      variants: v.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    }));
  };

  // New variants start as a copy of the last one instead of a blank row —
  // most products' variants only differ by a couple of fields (e.g. size
  // and rate), so prefilling from whatever was just entered means the admin
  // edits two fields instead of retyping five. `id: null` is what marks it
  // as a new row to save, same as emptyVariant().
  const addVariant = () => {
    setValues((v) => {
      const last = v.variants[v.variants.length - 1];
      const next: AdminVariant = last ? { ...last, id: null } : emptyVariant();
      setPendingScrollIndex(v.variants.length);
      return { ...v, variants: [...v.variants, next] };
    });
  };

  const removeVariant = (index: number) => {
    const variant = values.variants[index];
    if (variant.id) setRemovedVariantIds((ids) => [...ids, variant.id!]);
    setValues((v) => ({ ...v, variants: v.variants.filter((_, i) => i !== index) }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Enter a product name.";
    if (!values.slug.trim()) next.slug = "Enter a URL slug.";
    if (!values.categoryId) next.categoryId = "Choose a category.";
    values.variants.forEach((variant, i) => {
      if (!variant.label.trim()) next[`variant-${i}-label`] = "Enter a size/label.";
      if (variant.dailyRate < 0) next[`variant-${i}-rate`] = "Rate cannot be negative.";
      if (variant.originalDailyRate != null && variant.originalDailyRate < 0) {
        next[`variant-${i}-original-rate`] = "Rate cannot be negative.";
      }
      if (variant.quantityTotal <= 0) next[`variant-${i}-qty`] = "Quantity must be greater than zero.";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      for (const variantId of removedVariantIds) {
        await deleteVariant(variantId);
      }
      for (const imageId of removedImageIds) {
        await deleteProductImage(imageId);
      }
      if (isEdit) {
        await updateProduct(id!, values);
        showToast("Product updated.", "success");
      } else {
        await createProduct(values);
        showToast("Product created.", "success");
      }
      navigate("/admin/products");
    } catch {
      showToast(
        "Couldn't save this product. Some variants may have rental history and can't be removed.",
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        {isEdit ? "Edit product" : "New product"}
      </h1>
      {/* No extra trailing padding needed here: `position: sticky` never
          overlaps sibling content the way a `fixed` bar would, so the
          Cancel/Save bar can't cover the last field even without dead space
          reserved after it. AdminLayout's <main> already adds its own
          pb-16/md:pb-6 below every admin page to clear the fixed mobile tab
          bar — adding another block of padding here just doubled up on
          that and left a large empty gap below the buttons on short forms. */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input ref={nameRef} label="Name" value={values.name} onChange={(e) => handleNameChange(e.target.value)} error={errors.name} />
        <Input
          label="Slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setField("slug", slugify(e.target.value));
          }}
          error={errors.slug}
        />
        <Select
          label="Category"
          value={values.categoryId}
          onChange={(e) => setField("categoryId", e.target.value)}
          error={errors.categoryId}
        >
          <option value="">Choose a category…</option>
          {categories.status === "success" &&
            categories.data.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </Select>
        <Textarea
          label="Description"
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
        />
        <ImageInput
          label="Cover image"
          value={values.imageUrl}
          onChange={(url) => setField("imageUrl", url)}
          folder="products"
          hint="Upload a file or paste a URL — leave blank to show a placeholder. Shown on product cards and first in the gallery."
        />
        <ImageGalleryInput
          label="Gallery photos"
          images={values.images}
          onChange={(images) => setField("images", images)}
          onRemoveExisting={(id) => setRemovedImageIds((ids) => [...ids, id])}
          folder="products"
          hint="Extra photos shown in the swipeable gallery on the tool's detail page, after the cover image."
        />
        <Switch label="Featured on homepage" checked={values.isFeatured} onChange={(v) => setField("isFeatured", v)} />
        <Switch label="Active (visible to customers)" checked={values.isActive} onChange={(v) => setField("isActive", v)} />

        <div className="border-t border-graphite-200 pt-4 dark:border-graphite-800">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-body text-[14px] font-semibold text-ink dark:text-ink-inverted">
              Variants
            </h2>
            <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
              Add variant
            </Button>
          </div>

          {values.variants.length === 0 && (
            <p className="font-body text-[13px] text-graphite-500">
              No variants yet — customers will see "Rate on enquiry" until you add at least one.
            </p>
          )}

          <div className="space-y-3">
            {values.variants.map((variant, index) => (
              <div
                key={variant.id ?? `new-${index}`}
                ref={(el) => (variantRefs.current[index] = el)}
                className="rounded border border-graphite-200 p-3 dark:border-graphite-800 scroll-mt-20"
              >
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Size / label"
                    value={variant.label}
                    onChange={(e) => updateVariant(index, { label: e.target.value })}
                    error={errors[`variant-${index}-label`]}
                  />
                  <Input
                    label="Daily rate (₹)"
                    type="number"
                    min={0}
                    value={variant.dailyRate}
                    onChange={(e) => updateVariant(index, { dailyRate: Number(e.target.value) })}
                    error={errors[`variant-${index}-rate`]}
                  />
                  <Input
                    label="Original rate (₹)"
                    type="number"
                    min={0}
                    value={variant.originalDailyRate ?? ""}
                    onChange={(e) =>
                      updateVariant(index, {
                        originalDailyRate: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    hint="Optional — shown struck through next to the daily rate. Leave blank to hide it."
                    error={errors[`variant-${index}-original-rate`]}
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    min={1}
                    value={variant.quantityTotal}
                    onChange={(e) => updateVariant(index, { quantityTotal: Number(e.target.value) })}
                    error={errors[`variant-${index}-qty`]}
                  />
                  <div className="flex items-end">
                    <Switch
                      label="Active"
                      checked={variant.isActive}
                      onChange={(v) => updateVariant(index, { isActive: v })}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-state-danger-text dark:text-state-danger-text-dark"
                  onClick={() => removeVariant(index)}
                >
                  Remove variant
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky so Cancel/Save stay reachable while scrolling a long
            variants list — sits above the mobile bottom tab bar with a small
            gap (bottom-[76px], vs. the bar's own h-16/64px) so it doesn't
            look flush/cramped against it, and drops back to flush-bottom
            (md:bottom-0) once that tab bar is hidden at md+. */}
        <div className="sticky bottom-[76px] z-10 -mx-4 flex gap-2 rounded-lg border-t border-graphite-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/95 sm:-mx-6 sm:px-6 md:bottom-0 md:rounded-none md:shadow-none lg:-mx-8 lg:px-8">
          <Button variant="secondary" fullWidth type="button" onClick={() => navigate("/admin/products")}>
            Cancel
          </Button>
          <Button fullWidth type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
