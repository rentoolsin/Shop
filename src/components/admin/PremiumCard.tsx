import type { HTMLAttributes } from "react";

interface PremiumCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

/**
 * Elevated surface for the redesigned admin Dashboard — larger radius,
 * layered shadow, and a hairline border. Deliberately kept separate from
 * the shared `ui/Card` (rounded-6px, single-layer shadow) which the rest
 * of the admin app relies on, so this "ultra premium" treatment stays
 * scoped to the Dashboard instead of rippling into every list/detail page.
 */
export function PremiumCard({ interactive, className = "", ...rest }: PremiumCardProps) {
  return (
    <div
      className={[
        "rounded border border-graphite-200/70 bg-white shadow-premium",
        "dark:border-white/[0.06] dark:bg-graphite-900",
        interactive
          ? "transition-all duration-200 ease-app hover:-translate-y-0.5 hover:border-graphite-300 hover:shadow-premium-lg dark:hover:border-white/[0.12]"
          : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
