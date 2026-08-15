type Tone = "neutral" | "success" | "warning" | "danger" | "info";

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral:
    "bg-graphite-100 text-graphite-700 dark:bg-graphite-800 dark:text-graphite-300",
  // Label text uses the *-text token pair, not the base tone — the base
  // tones (used below for the tinted background and the dot) read below
  // 4.5:1 as 12px text against the tint in at least one theme. See
  // tailwind.config.ts and docs/DESIGN-AUDIT.md.
  success: "bg-state-success/10 text-state-success-text dark:text-state-success-text-dark",
  warning: "bg-state-warning/10 text-state-warning-text dark:text-state-warning-text-dark",
  danger: "bg-state-danger/10 text-state-danger-text dark:text-state-danger-text-dark",
  info: "bg-state-info/10 text-state-info-text dark:text-state-info-text-dark",
};

const dotClasses: Record<Tone, string> = {
  neutral: "bg-graphite-400",
  success: "bg-state-success",
  warning: "bg-state-warning",
  danger: "bg-state-danger",
  info: "bg-state-info",
};

/**
 * Status is always paired with a text label (never color alone) so it reads
 * correctly without color vision or a screen. The leading dot is a purely
 * decorative reinforcement, not a substitute for the label.
 */
export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[12px] font-medium leading-tight",
        toneClasses[tone],
      ].join(" ")}
    >
      <span aria-hidden="true" className={["h-1.5 w-1.5 flex-shrink-0 rounded-full", dotClasses[tone]].join(" ")} />
      {label}
    </span>
  );
}
