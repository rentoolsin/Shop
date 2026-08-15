/** Shared base classes for text-like form fields (Input, Select, Textarea). */
export function baseFieldClass(hasError: boolean) {
  return [
    "h-11 w-full rounded border bg-white px-3 font-body text-[14px] text-ink outline-none",
    "dark:bg-graphite-900 dark:text-ink-inverted",
    "disabled:opacity-50",
    hasError
      ? "border-state-danger"
      : "border-graphite-200 focus-visible:border-graphite-900 dark:border-graphite-800 dark:focus-visible:border-white",
  ].join(" ");
}
