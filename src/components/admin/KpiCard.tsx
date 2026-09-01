import { Link } from "react-router-dom";
import { TrendDown, TrendUp } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const ICON_TILE_TONE: Record<Tone, string> = {
  neutral: "bg-gradient-to-br from-graphite-700 to-graphite-900 text-white dark:from-graphite-600 dark:to-graphite-800",
  success: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  warning: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
  danger: "bg-gradient-to-br from-rose-400 to-rose-600 text-white",
  info: "bg-gradient-to-br from-sky-400 to-sky-600 text-white",
};

const TOP_BAR_TONE: Record<Tone, string> = {
  neutral: "from-graphite-400 to-graphite-600",
  success: "from-emerald-400 to-emerald-600",
  warning: "from-amber-400 to-amber-600",
  danger: "from-rose-400 to-rose-600",
  info: "from-sky-400 to-sky-600",
};

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  to?: string;
  tone?: Tone;
  /** Optional comparison note, e.g. "vs last month". Sign of `delta` drives the arrow + color. */
  delta?: { value: number; note: string };
  /** Positive framing to invert delta coloring for metrics where "up" is bad (e.g. overdue count). */
  invertDeltaTone?: boolean;
}

/**
 * Premium KPI tile for the redesigned Dashboard — gradient icon tile, thin
 * gradient top accent, soft layered shadow, hover lift. Deliberately kept
 * separate from the shared `ui/StatCard` that Reports.tsx still relies on
 * for its plainer grid, so this treatment stays scoped to the Dashboard.
 */
export function KpiCard({ label, value, icon, to, tone = "neutral", delta, invertDeltaTone }: KpiCardProps) {
  const deltaIsUp = delta ? delta.value >= 0 : null;
  const deltaIsGood = deltaIsUp === null ? null : invertDeltaTone ? !deltaIsUp : deltaIsUp;

  const content = (
    <>
      <span className={["absolute inset-x-0 top-0 h-[3px] rounded-t bg-gradient-to-r", TOP_BAR_TONE[tone]].join(" ")} />

      <div className="mb-4 flex items-start justify-between">
        <span
          className={[
            "flex h-10 w-10 items-center justify-center rounded shadow-[0_4px_12px_-2px_rgb(0_0_0_/_0.25)]",
            ICON_TILE_TONE[tone],
          ].join(" ")}
        >
          {icon}
        </span>
        {delta && (
          <span
            className={[
              "flex items-center gap-0.5 rounded-full px-2 py-1 font-body text-[11px] font-semibold",
              deltaIsGood
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            ].join(" ")}
          >
            {deltaIsUp ? <TrendUp className="h-3 w-3" weight="bold" /> : <TrendDown className="h-3 w-3" weight="bold" />}
            {Math.abs(delta.value)}%
          </span>
        )}
      </div>

      <p className="font-mono text-[28px] font-bold leading-none tracking-tight text-ink dark:text-ink-inverted">
        {value}
      </p>
      <p className="mt-2 font-body text-[13px] font-medium text-graphite-500">{label}</p>
      {delta && <p className="mt-0.5 font-body text-[11px] text-graphite-400">{delta.note}</p>}
    </>
  );

  const className =
    "group relative overflow-hidden rounded border border-graphite-200/80 bg-white p-4 shadow-premium transition-all duration-200 ease-app dark:border-graphite-800 dark:bg-graphite-900" +
    (to ? " hover:-translate-y-0.5 hover:border-graphite-300 hover:shadow-premium-lg dark:hover:border-graphite-700" : "");

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
