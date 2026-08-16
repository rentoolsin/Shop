import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminCategory } from "../../../hooks/useAdminData";
import { createCategory, updateCategory, type CategoryFormValues } from "../../../services/admin-categories.service";
import { slugify } from "../../../utils/slugify";
import { Input } from "../../../components/ui/Input";
import { ImageInput } from "../../../components/ui/ImageInput";
import { Switch } from "../../../components/ui/Switch";
import { Button } from "../../../components/ui/Button";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

const EMPTY: CategoryFormValues = {
  name: "",
  slug: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
};

export function CategoryForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const existing = useAdminCategory(id);

  const [values, setValues] = useState<CategoryFormValues>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing.status === "success" && existing.data) {
      setValues({
        name: existing.data.name,
        slug: existing.data.slug,
        imageUrl: existing.data.imageUrl ?? "",
        sortOrder: existing.data.sortOrder,
        isActive: existing.data.isActive,
      });
      setSlugTouched(true);
    }
  }, [existing.status, existing.data]);

  useEffect(() => {
    if (!isEdit) nameRef.current?.focus();
  }, [isEdit]);

  if (isEdit && existing.status === "loading") return <LoadingState label="Loading category…" />;
  if (isEdit && existing.status === "error") {
    return <ErrorState title="Couldn't load this category" onRetry={existing.refetch} />;
  }

  const setField = <K extends keyof CategoryFormValues>(field: K, value: CategoryFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleNameChange = (name: string) => {
    setField("name", name);
    if (!slugTouched) setField("slug", slugify(name));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Enter a category name.";
    if (!values.slug.trim()) next.slug = "Enter a URL slug.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCategory(id!, values);
        showToast("Category updated.", "success");
      } else {
        await createCategory(values);
        showToast("Category created.", "success");
      }
      navigate("/admin/categories");
    } catch {
      showToast("Couldn't save this category. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        {isEdit ? "Edit category" : "New category"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          ref={nameRef}
          label="Name"
          value={values.name}
          onChange={(e) => handleNameChange(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setField("slug", slugify(e.target.value));
          }}
          error={errors.slug}
          hint="Used in the product URL — lowercase, hyphenated."
        />
        <ImageInput
          label="Image"
          value={values.imageUrl}
          onChange={(url) => setField("imageUrl", url)}
          folder="categories"
          hint="Upload a file or paste a URL — leave blank to show a placeholder."
        />
        <Input
          label="Sort order"
          type="number"
          value={values.sortOrder}
          onChange={(e) => setField("sortOrder", Number(e.target.value))}
          hint="Lower numbers appear first."
        />
        <Switch
          label="Active (visible to customers)"
          checked={values.isActive}
          onChange={(checked) => setField("isActive", checked)}
        />
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" fullWidth type="button" onClick={() => navigate("/admin/categories")}>
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
