import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-graphite-400" aria-hidden="true">{icon}</div>}
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
