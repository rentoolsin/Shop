import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-graphite-200 bg-white px-6 py-16 text-center dark:border-graphite-800 dark:bg-graphite-900">
      {icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-graphite-100 text-graphite-400 dark:bg-graphite-800 dark:text-graphite-500"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="font-display text-[16px] font-semibold text-ink dark:text-ink-inverted">
        {title}
      </h3>
      {description && (
        <p className="max-w-[28ch] font-body text-[14px] text-graphite-500">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
