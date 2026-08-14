import { Link } from "react-router-dom";
import { useAdminHomepageSections } from "../../../hooks/useAdminData";
import { HOMEPAGE_SECTION_LABEL } from "../../../utils/homepage-content";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";

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
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {sections.status === "error" && (
        <ErrorState description="Couldn't load homepage sections." onRetry={sections.refetch} />
      )}

      {sections.status === "success" && (
        <ul className="space-y-2">
          {sections.data.map((section) => (
            <li key={section.sectionKey}>
              <Link
                to={`/admin/homepage/${section.sectionKey}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900"
              >
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
