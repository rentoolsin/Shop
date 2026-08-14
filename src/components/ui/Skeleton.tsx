interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse rounded bg-graphite-200 dark:bg-graphite-800",
        className,
      ].join(" ")}
    />
  );
}
