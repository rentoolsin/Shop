import type { HTMLAttributes } from "react";

interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

/**
 * Elevated surface for the redesigned admin Dashboard — layered shadow, but
 * using the same 6px radius and border color as the shared `ui/Card` for
 * visual consistency across the admin app. Only the shadow treatment stays
 * scoped to the Dashboard.
 */
export function PremiumCard({ interactive, className = "", ...rest }: PremiumCardProps) {
  return (
    <div
      className={[
        "rounded border border-graphite-200/80 bg-white shadow-premium",
        "dark:border-graphite-800 dark:bg-graphite-900",
        interactive
          ? "transition-all duration-200 ease-app hover:-translate-y-0.5 hover:border-graphite-300 hover:shadow-premium-lg dark:hover:border-graphite-700"
          : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
