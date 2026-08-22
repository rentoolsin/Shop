export interface BarListItem {
  label: string;
  value: number;
  sublabel?: string;
}

interface BarListChartProps {
  data: BarListItem[];
  formatValue?: (value: number) => string;
  tone?: "accent" | "info" | "danger";
  emptyLabel?: string;
}

const BAR_GRADIENT: Record<NonNullable<BarListChartProps["tone"]>, string> = {
  accent: "bg-gradient-to-r from-accent-300 to-accent-500",
  info: "bg-gradient-to-r from-sky-300 to-sky-500",
  danger: "bg-gradient-to-r from-rose-300 to-rose-500",
};

const RANK_CHIP_TONE: Record<NonNullable<BarListChartProps["tone"]>, string> = {
  accent: "bg-accent-500/10 text-accent-700 dark:text-accent-300",
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

/** Ranked horizontal bar list with gradient fills — used for "top products" style breakdowns. */
export function BarListChart({
  data,
  formatValue = (v) => String(v),
  tone = "accent",
  emptyLabel = "No data yet",
}: BarListChartProps) {
  if (data.length === 0) {
    return <p className="font-body text-[13px] text-graphite-400">{emptyLabel}</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-3.5">
      {data.map((item, i) => (
        <li key={item.label + i} className="flex items-center gap-3">
          <span
            className={[
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold",
              RANK_CHIP_TONE[tone],
            ].join(" ")}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
                {item.label}
                {item.sublabel && (
                  <span className="ml-1.5 font-body text-[11px] font-normal text-graphite-400">{item.sublabel}</span>
                )}
              </span>
              <span className="flex-shrink-0 font-mono text-[13px] font-semibold text-graphite-700 dark:text-graphite-300">
                {formatValue(item.value)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-graphite-100 dark:bg-graphite-800">
              <div
                className={["h-full rounded-full transition-all duration-500 ease-app", BAR_GRADIENT[tone]].join(" ")}
                style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
