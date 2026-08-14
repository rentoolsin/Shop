interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-graphite-500"
    >
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-graphite-300 border-t-graphite-700 dark:border-graphite-700 dark:border-t-graphite-300"
        aria-hidden="true"
      />
      <p className="font-body text-[14px]">{label}</p>
    </div>
  );
}
