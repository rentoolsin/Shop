import { useState } from "react";

export interface DonutSlice {
  label: string;
  value: number;
  /** Hex color for the ring segment and legend dot. */
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  emptyLabel?: string;
}

const GAP_DEGREES = 3;

/** Premium hand-rolled SVG donut with gapped, rounded segments and a hover lift. */
export function DonutChart({
  data,
  size = 172,
  strokeWidth = 18,
  centerLabel,
  centerValue,
  emptyLabel = "No data yet",
}: DonutChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gapLength = (GAP_DEGREES / 360) * circumference;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <p className="font-body text-[13px] text-graphite-400">{emptyLabel}</p>
      </div>
    );
  }

  let offsetSoFar = 0;
  const nonZero = data.filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-graphite-100 dark:stroke-graphite-800/70"
          />
          {nonZero.map((slice) => {
            const fraction = slice.value / total;
            const rawDash = fraction * circumference;
            const dash = Math.max(0, rawDash - gapLength);
            const gap = circumference - dash;
            const dashOffset = -offsetSoFar * circumference;
            offsetSoFar += fraction;
            const isHovered = hovered === slice.label;
            return (
              <circle
                key={slice.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="cursor-default transition-[stroke-width] duration-150 ease-app"
                style={{ opacity: hovered && !isHovered ? 0.45 : 1 }}
                onMouseEnter={() => setHovered(slice.label)}
                onMouseLeave={() => setHovered((c) => (c === slice.label ? null : c))}
              >
                <title>
                  {slice.label}: {slice.value}
                </title>
              </circle>
            );
          })}
        </svg>

        {centerValue && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-mono text-[24px] font-bold leading-none tracking-tight text-ink dark:text-ink-inverted">
              {hovered ? nonZero.find((d) => d.label === hovered)?.value : centerValue}
            </p>
            {centerLabel && (
              <p className="mt-1 max-w-[76px] text-center font-body text-[10.5px] leading-tight text-graphite-500">
                {hovered ?? centerLabel}
              </p>
            )}
          </div>
        )}
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((slice) => (
          <li
            key={slice.label}
            className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-1 transition-colors duration-150 ease-app"
            style={{ backgroundColor: hovered === slice.label ? `${slice.color}14` : "transparent" }}
            onMouseEnter={() => setHovered(slice.label)}
            onMouseLeave={() => setHovered((c) => (c === slice.label ? null : c))}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate font-body text-[12.5px] font-medium text-graphite-600 dark:text-graphite-300">
                {slice.label}
              </span>
            </span>
            <span className="flex-shrink-0 font-mono text-[12.5px] font-semibold text-ink dark:text-ink-inverted">
              {slice.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
