import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/**
 * Shared bar-chart primitive. Wraps `recharts` through the shadcn chart wrapper so that
 * lecture content components import only aliased paths (`@/primitives/*`) — the bare
 * `recharts` import stays inside `apps/web`, where Vite resolves it, avoiding the
 * "bare npm import in a content file" build landmine.
 *
 * Handles two shapes with one API:
 *   - grouped multi-series bars (pass several `series`), and
 *   - single-series bars with a distinct colour per row (pass one `series`; give each
 *     data row a `fill`), optionally with reference lines and on-bar value labels.
 */

export interface BarSeries {
  /** Key read from each data row. */
  key: string;
  /** Legend / tooltip label. */
  label: string;
  /** Bar colour (any CSS colour). Per-row `fill` overrides this when one series. */
  color: string;
}

export interface ReferenceLineSpec {
  y: number;
  label: string;
  color?: string;
}

export interface BarChartRow {
  /** Category label shown on the x-axis. */
  category: string;
  /** Per-row bar colour, used only in the single-series case. */
  fill?: string;
  /** Series values, keyed by `BarSeries.key`. */
  [seriesKey: string]: string | number | undefined;
}

export interface BarChartProps {
  data: BarChartRow[];
  series: BarSeries[];
  height?: number;
  /** Fixed y range, e.g. `[0, 100]` for percentages. */
  yDomain?: [number, number];
  /** Suffix appended to axis ticks and tooltip values, e.g. `"%"`. */
  unit?: string;
  referenceLines?: ReferenceLineSpec[];
  /** Category labels to emphasise on the x-axis (drawn in the accent colour). */
  accentCategories?: string[];
  /** Show the numeric value on top of each bar (single-series charts). */
  showValueLabels?: boolean;
  /** Show a legend below the chart (grouped charts). */
  showLegend?: boolean;
}

export function BarChart({
  data,
  series,
  height = 300,
  yDomain,
  unit = "",
  referenceLines = [],
  accentCategories = [],
  showValueLabels = false,
  showLegend = false,
}: BarChartProps) {
  const chartConfig: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  );

  const singleSeries = series.length === 1;
  const accent = new Set(accentCategories);

  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
      <RechartsBarChart data={data} margin={{ top: 16, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={(props) => {
            const x = Number(props.x ?? 0);
            const y = Number(props.y ?? 0);
            const value = String(props.payload?.value ?? "");
            return (
              <text
                x={x}
                y={y + 14}
                textAnchor="middle"
                className={
                  accent.has(value) ? "fill-accent font-medium" : "fill-muted-foreground"
                }
                fontSize={12}
              >
                {value}
              </text>
            );
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          domain={yDomain}
          width={40}
          tickFormatter={(v: number) => `${v}${unit}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {referenceLines.map((rl) => (
          <ReferenceLine
            key={rl.label}
            y={rl.y}
            stroke={rl.color ?? "var(--foreground)"}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: rl.label,
              position: "insideTopRight",
              fill: rl.color ?? "var(--foreground)",
              fontSize: 11,
            }}
          />
        ))}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={s.color} radius={4} isAnimationActive={false}>
            {singleSeries &&
              data.map((row, i) => (
                <Cell key={i} fill={row.fill ?? s.color} />
              ))}
            {showValueLabels && (
              <LabelList
                dataKey={s.key}
                position="top"
                className="fill-foreground"
                fontSize={11}
                formatter={(value) => `${value ?? ""}${unit}`}
              />
            )}
          </Bar>
        ))}
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsBarChart>
    </ChartContainer>
  );
}
