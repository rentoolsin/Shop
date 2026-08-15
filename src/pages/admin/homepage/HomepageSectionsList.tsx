import { LayoutTemplate } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminHomepageSections } from "../../../hooks/useAdminData";
import { HOMEPAGE_SECTION_LABEL } from "../../../utils/homepage-content";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";

function HomepageIcon() {
  return <LayoutTemplate className="h-6 w-6" strokeWidth={1.5} />;
}

export function HomepageSectionsList() {
  const sections = useAdminHomepageSections();

  return (
    <div>
      <h1 className="mb-1 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        Homepage
      </h1>
      <p className="mb-4 font-body text-[13px] text-graphite-500">
        Edit content shown on the public homepage. Changes are saved as a draft until you publish
        them.
      </p>

      {sections.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded" />
          ))}
        </div>
      )}

      {sections.status === "error" && (
        <ErrorState description="Couldn't load homepage sections." onRetry={sections.refetch} />
      )}

      {sections.status === "success" && sections.data.length === 0 && (
        <EmptyState
          icon={<HomepageIcon />}
          title="No sections found"
          description="Homepage sections will appear here once configured."
        />
      )}

      {sections.status === "success" && sections.data.length > 0 && (
        <ul className="space-y-2">
          {sections.data.map((section) => (
            <li key={section.sectionKey}>
              <Link to={`/admin/homepage/${section.sectionKey}`}>
                <Card interactive className="flex items-center justify-between gap-3 p-4 hover:border-graphite-300 dark:hover:border-graphite-700">
                  <div>
                    <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                      {HOMEPAGE_SECTION_LABEL[section.sectionKey]}
                    </p>
                    <p className="mt-0.5 font-body text-[12px] text-graphite-500">
                      {section.isUnconfigured
                        ? "Using default content"
                        : section.updatedAt
                          ? `Updated ${new Date(section.updatedAt).toLocaleDateString()}`
                          : "Not yet edited"}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5">
                    {!section.isEnabled && <StatusBadge label="Hidden" tone="neutral" />}
                    {section.isPublished ? (
                      <StatusBadge label="Published" tone="success" />
                    ) : (
                      <StatusBadge label="Draft" tone="warning" />
                    )}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
