import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const VALUE_TONE_CLASSES: Record<Tone, string> = {
  neutral: "text-ink dark:text-ink-inverted",
  success: "text-state-success",
  warning: "text-state-warning",
  danger: "text-state-danger",
  info: "text-state-info",
};

interface StatCardProps {
  label: string;
  /** Pre-formatted display value, e.g. "12" or "₹4,500". */
  value: ReactNode;
  /** Optional route — renders the card as a Link when present. */
  to?: string;
  /** Color the value to draw attention (e.g. "danger" for overdue counts). Defaults to neutral ink. */
  tone?: Tone;
}

/**
 * Single stat card used across Dashboard and Reports. Do not re-create this
 * markup locally in a page — extend this component with props instead.
 */
export function StatCard({ label, value, to, tone = "neutral" }: StatCardProps) {
  const content = (
    <>
      <p className={["font-mono text-[24px] font-semibold", VALUE_TONE_CLASSES[tone]].join(" ")}>
        {value}
      </p>
      <p className="font-body text-[13px] text-graphite-500">{label}</p>
    </>
  );

  const className =
    "block rounded-lg border border-graphite-200 bg-white p-4 shadow-card dark:border-graphite-800 dark:bg-graphite-900";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
