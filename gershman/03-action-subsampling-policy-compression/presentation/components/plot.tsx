/**
 * A small self-contained SVG line/scatter plot used by the frontier widgets.
 *
 * Content components may not import charting libraries directly (only `@/primitives/*` and
 * local files — see the pnpm/rolldown aliasing note), and the reward-complexity frontier needs
 * bespoke touches a generic bar chart can't give: a marker that rides a curve, a vertical
 * "suboptimality gap" segment, and overlaid reference dots. So this is hand-rolled SVG, theme
 * aware through CSS variables (`--border`, `--muted-foreground`, `--foreground`).
 */

export interface PlotPoint {
  x: number;
  y: number;
}

export interface PlotSeries {
  points: PlotPoint[];
  color: string;
  label?: string;
  dashed?: boolean;
  width?: number;
  opacity?: number;
}

export interface PlotDot {
  x: number;
  y: number;
  color: string;
  r?: number;
  ring?: boolean;
  label?: string;
}

export interface GapMarker {
  x: number;
  yLow: number;
  yHigh: number;
  color?: string;
  label?: string;
}

export interface LinePlotProps {
  series: PlotSeries[];
  dots?: PlotDot[];
  gap?: GapMarker | null;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: number[];
  yTicks: number[];
  xLabel: string;
  yLabel: string;
  height?: number;
  /** viewBox width; also the max CSS width the `w-full` svg renders at. */
  width?: number;
}

const M = { top: 16, right: 18, bottom: 44, left: 52 };

export function LinePlot({
  series,
  dots = [],
  gap = null,
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  xLabel,
  yLabel,
  height = 380,
  width = 660,
}: LinePlotProps) {
  const H = height;
  const W = width;
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;

  const sx = (x: number) => M.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * iw;
  const sy = (y: number) => M.top + (1 - (y - yDomain[0]) / (yDomain[1] - yDomain[0])) * ih;

  const path = (points: PlotPoint[]) =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxHeight: H }}
      role="img"
      aria-label={`${yLabel} versus ${xLabel}`}
    >
      {/* grid + y ticks */}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line
            x1={M.left}
            x2={W - M.right}
            y1={sy(t)}
            y2={sy(t)}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.5}
          />
          <text
            x={M.left - 8}
            y={sy(t)}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={11}
            fill="var(--muted-foreground)"
          >
            {t}
          </text>
        </g>
      ))}
      {/* x ticks */}
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <text
            x={sx(t)}
            y={H - M.bottom + 16}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted-foreground)"
          >
            {t}
          </text>
        </g>
      ))}
      {/* axis labels */}
      <text
        x={M.left + iw / 2}
        y={H - 6}
        textAnchor="middle"
        fontSize={12}
        fill="var(--muted-foreground)"
      >
        {xLabel}
      </text>
      <text
        transform={`translate(14 ${M.top + ih / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={12}
        fill="var(--muted-foreground)"
      >
        {yLabel}
      </text>

      {/* suboptimality gap marker */}
      {gap && (
        <g>
          <line
            x1={sx(gap.x)}
            x2={sx(gap.x)}
            y1={sy(gap.yLow)}
            y2={sy(gap.yHigh)}
            stroke={gap.color ?? "var(--foreground)"}
            strokeWidth={2}
          />
          <line
            x1={sx(gap.x) - 4}
            x2={sx(gap.x) + 4}
            y1={sy(gap.yHigh)}
            y2={sy(gap.yHigh)}
            stroke={gap.color ?? "var(--foreground)"}
            strokeWidth={2}
          />
          <line
            x1={sx(gap.x) - 4}
            x2={sx(gap.x) + 4}
            y1={sy(gap.yLow)}
            y2={sy(gap.yLow)}
            stroke={gap.color ?? "var(--foreground)"}
            strokeWidth={2}
          />
          {gap.label && (
            <text
              x={sx(gap.x) + 8}
              y={sy((gap.yLow + gap.yHigh) / 2)}
              dominantBaseline="central"
              fontSize={11}
              fontWeight={600}
              fill={gap.color ?? "var(--foreground)"}
            >
              {gap.label}
            </text>
          )}
        </g>
      )}

      {/* series */}
      {series.map((s, i) => (
        <path
          key={i}
          d={path(s.points)}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width ?? 2}
          strokeDasharray={s.dashed ? "5 4" : undefined}
          opacity={s.opacity ?? 1}
          strokeLinejoin="round"
        />
      ))}

      {/* scatter dots */}
      {dots.map((d, i) => (
        <g key={i}>
          {d.ring && (
            <circle cx={sx(d.x)} cy={sy(d.y)} r={(d.r ?? 5) + 3} fill="none" stroke={d.color} strokeWidth={1.5} opacity={0.5} />
          )}
          <circle cx={sx(d.x)} cy={sy(d.y)} r={d.r ?? 5} fill={d.color} />
          {d.label && (
            <text x={sx(d.x) + 9} y={sy(d.y)} dominantBaseline="central" fontSize={11} fill="var(--foreground)">
              {d.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** A compact color-swatch legend row. */
export function PlotLegend({
  items,
}: {
  items: { color: string; label: string; dashed?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <svg width={16} height={8} aria-hidden>
            <line
              x1={0}
              y1={4}
              x2={16}
              y2={4}
              stroke={it.color}
              strokeWidth={2}
              strokeDasharray={it.dashed ? "3 2" : undefined}
            />
          </svg>
          {it.label}
        </span>
      ))}
    </div>
  );
}
