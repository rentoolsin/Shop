import { useId, useMemo, useState } from "react";

export interface AreaTrendPoint {
  label: string;
  value: number;
}

interface AreaTrendChartProps {
  data: AreaTrendPoint[];
  /** Formats the hovered/axis value, e.g. currency. Defaults to plain number. */
  formatValue?: (value: number) => string;
  height?: number;
  /** Tailwind-adjacent hex driving the stroke/fill/dots — kept to the app's existing palette. */
  tone?: "accent" | "info" | "success";
  emptyLabel?: string;
}

const TONE_HEX: Record<NonNullable<AreaTrendChartProps["tone"]>, string> = {
  accent: "#F0A81B",
  info: "#4C6B8A",
  success: "#3B8156",
};

const WIDTH = 640;

/** Builds a smooth cubic-bezier path through a set of points (simple symmetric tangents). */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return points.length === 1 ? `M${points[0].x},${points[0].y}` : "";
  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Hand-rolled SVG area chart with a smoothed curve, soft glow under the
 * line, and a crosshair tooltip on hover — mirrors the codebase's existing
 * convention of hand-rolling small pieces of UI (see date-range.ts,
 * relative-time.ts) instead of pulling in a charting library.
 */
export function AreaTrendChart({
  data,
  formatValue = (v) => String(v),
  height = 240,
  tone = "accent",
  emptyLabel = "No data yet",
}: AreaTrendChartProps) {
  const gradientId = useId();
  const glowId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const color = TONE_HEX[tone];

  const padding = { top: 20, right: 12, bottom: 26, left: 12 };
  const chartWidth = WIDTH - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { points, maxValue, minValue } = useMemo(() => {
    if (data.length === 0) return { points: [] as { x: number; y: number }[], maxValue: 0, minValue: 0 };
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const step = data.length > 1 ? chartWidth / (data.length - 1) : 0;
    const pts = data.map((d, i) => ({
      x: padding.left + step * i,
      y: padding.top + chartHeight - ((d.value - min) / range) * chartHeight,
    }));
    return { points: pts, maxValue: max, minValue: min };
  }, [data, chartWidth, chartHeight, padding.left, padding.top]);

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div
        className="flex items-center justify-center rounded border border-dashed border-graphite-200 font-body text-[13px] text-graphite-400 dark:border-graphite-800"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  const linePath = smoothPath(points);
  const areaPath =
    `${linePath} L${points[points.length - 1].x.toFixed(2)},${(padding.top + chartHeight).toFixed(2)} ` +
    `L${points[0].x.toFixed(2)},${(padding.top + chartHeight).toFixed(2)} Z`;

  // Show at most ~6 x-axis labels so dense ranges (30 days) don't collide.
  const labelStride = Math.max(1, Math.ceil(data.length / 6));

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      {hovered && hoveredPoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded border border-graphite-200 bg-white px-3 py-2 shadow-premium-lg dark:border-graphite-700 dark:bg-graphite-800"
          style={{
            left: `${(hoveredPoint.x / WIDTH) * 100}%`,
            top: Math.max(0, (hoveredPoint.y / height) * 100 - 16) + "%",
          }}
        >
          <p className="whitespace-nowrap font-mono text-[13px] font-bold text-ink dark:text-ink-inverted">
            {formatValue(hovered.value)}
          </p>
          <p className="whitespace-nowrap font-body text-[10px] text-graphite-500">{hovered.label}</p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="h-auto w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.38" />
            <stop offset="65%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-60%" width="140%" height="240%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gridlines: baseline + midline */}
        <line
          x1={padding.left}
          x2={WIDTH - padding.right}
          y1={padding.top + chartHeight}
          y2={padding.top + chartHeight}
          className="stroke-graphite-200 dark:stroke-graphite-800"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          x2={WIDTH - padding.right}
          y1={padding.top + chartHeight / 2}
          y2={padding.top + chartHeight / 2}
          className="stroke-graphite-100 dark:stroke-graphite-800/60"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        {/* Crosshair */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            x2={hoveredPoint.x}
            y1={padding.top}
            y2={padding.top + chartHeight}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.4"
          />
        )}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />

        {points.map((p, i) => (
          <g key={i}>
            {/* Wide invisible hit target for hover, since raw dots are small. */}
            <rect
              x={i === 0 ? 0 : (points[i - 1].x + p.x) / 2}
              y={0}
              width={
                (i === points.length - 1 ? WIDTH : (p.x + (points[i + 1]?.x ?? p.x)) / 2) -
                (i === 0 ? 0 : (points[i - 1].x + p.x) / 2)
              }
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((c) => (c === i ? null : c))}
            />
            {hoverIndex === i && <circle cx={p.x} cy={p.y} r={7} fill={color} opacity="0.18" />}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 4.5 : 2.5}
              fill={hoverIndex === i ? color : "white"}
              stroke={color}
              strokeWidth="2"
              className="transition-all duration-100 ease-app dark:fill-graphite-900"
              style={hoverIndex === i ? { fill: color } : undefined}
            />
          </g>
        ))}

        {data.map((d, i) =>
          i % labelStride === 0 || i === data.length - 1 ? (
            <text
              key={d.label + i}
              x={points[i].x}
              y={height - 6}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              className="fill-graphite-400 font-body text-[10px] font-medium"
            >
              {d.label}
            </text>
          ) : null,
        )}
      </svg>

      <div className="mt-1 flex items-center justify-between font-body text-[10px] font-medium text-graphite-400">
        <span>Low {formatValue(minValue)}</span>
        <span>High {formatValue(maxValue)}</span>
      </div>
    </div>
  );
}
