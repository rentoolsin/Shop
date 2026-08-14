import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminCategories } from "../../../hooks/useAdminData";
import { deleteCategory } from "../../../services/admin-categories.service";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";

function CategoryIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6">
      <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3.5" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function CategoriesList() {
  const categories = useAdminCategories();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      showToast("Category deleted.", "success");
      setPendingDelete(null);
      categories.refetch();
    } catch {
      showToast(
        "Couldn't delete this category — it may still have products in it.",
        "danger",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Categories
        </h1>
        <Link to="/admin/categories/new">
          <Button size="sm"><svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>New category</Button>
        </Link>
      </div>

      {categories.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {categories.status === "error" && (
        <ErrorState title="Couldn't load categories" onRetry={categories.refetch} />
      )}

      {categories.status === "success" && categories.data.length === 0 && (
        <EmptyState
          icon={<CategoryIcon />}
          title="No categories yet"
          description="Create your first category to start organizing products."
          action={
            <Link to="/admin/categories/new">
              <Button size="sm"><svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>New category</Button>
            </Link>
          }
        />
      )}

      {categories.status === "success" && categories.data.length > 0 && (
        <div className="space-y-2">
          {categories.data.map((category) => (
            <Card key={category.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                  {category.name}
                </p>
                <p className="font-mono text-[12px] text-graphite-400">/{category.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={category.isActive ? "Active" : "Inactive"}
                  tone={category.isActive ? "success" : "neutral"}
                />
                <Link to={`/admin/categories/${category.id}/edit`}>
                  <Button variant="ghost" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete({ id: category.id, name: category.name })}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete category?"
        description={pendingDelete ? `"${pendingDelete.name}" will be permanently removed.` : undefined}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
