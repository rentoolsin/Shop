type Tone = "neutral" | "success" | "warning" | "danger" | "info";

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral:
    "bg-graphite-100 text-graphite-700 dark:bg-graphite-800 dark:text-graphite-300",
  success: "bg-state-success/10 text-state-success",
  warning: "bg-state-warning/10 text-state-warning",
  danger: "bg-state-danger/10 text-state-danger",
  info: "bg-state-info/10 text-state-info",
};

/**
 * Status is always paired with a text label (never color alone) so it reads
 * correctly without color vision or a screen.
 */
export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-sm px-2 py-0.5 font-body text-[12px] font-medium leading-tight",
        toneClasses[tone],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
