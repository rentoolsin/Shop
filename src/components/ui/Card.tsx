import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className = "", ...rest }: CardProps) {
  return (
    <div
      className={[
        "rounded-lg border border-graphite-200/80 bg-white shadow-card",
        "dark:border-graphite-800 dark:bg-graphite-900",
        interactive
          ? "transition-all duration-150 ease-app active:scale-[0.98] active:shadow-none hover:shadow-raised hover:border-graphite-300 dark:hover:border-graphite-700"
          : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
