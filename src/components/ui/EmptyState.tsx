import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  /** "md" (default) matches the standard list empty state; "lg" gives a bigger, more
   * illustrative presentation for primary/hero empty states (e.g. a section's main panel). */
  size?: "md" | "lg";
  className?: string;
}

export function EmptyState({ title, description, action, icon, size = "md", className = "" }: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-3 rounded border border-dashed border-graphite-200 bg-white text-center dark:border-graphite-800 dark:bg-graphite-900",
        size === "lg" ? "px-6 py-14" : "px-6 py-16",
        className,
      ].join(" ")}
    >
      {icon && (
        <div
          className={[
            "flex items-center justify-center rounded-full bg-graphite-100 text-graphite-400 dark:bg-graphite-800 dark:text-graphite-500",
            size === "lg" ? "h-24 w-24" : "h-12 w-12",
          ].join(" ")}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className={["font-display font-semibold text-ink dark:text-ink-inverted", size === "lg" ? "text-[19px]" : "text-[16px]"].join(" ")}>
        {title}
      </h3>
      {description && (
        <p className="max-w-[30ch] font-body text-[14px] text-graphite-500">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
