import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface LineChartProps {
  data: Array<{ x: number; y: number }>;
  height?: number;
}

const chartConfig = {
  y: {
    label: "y",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function LineChart({ data, height = 320 }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex w-full items-center justify-center border border-border text-sm text-muted-foreground"
      >
        No data
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
      <RechartsLineChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="x" type="number" tickLine={false} axisLine={false} />
        <YAxis dataKey="y" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="y"
          type="monotone"
          stroke="var(--color-y)"
          strokeWidth={2}
          dot={false}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
}
