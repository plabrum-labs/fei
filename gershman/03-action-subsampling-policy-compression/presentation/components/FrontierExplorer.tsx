import { useMemo, useState } from "react";
import { Slider } from "@/primitives/Slider";
import { LinePlot, PlotLegend, type PlotDot, type PlotSeries } from "./plot";
import results from "../data/results.json";

// ---------------------------------------------------------------------------
// Read the precomputed experiment-task frontiers (Blahut-Arimoto, from the Python repro).
// ---------------------------------------------------------------------------

interface Curve {
  complexity: number[];
  reward: number[];
}
interface NaFrontier {
  na: number;
  keep: Curve;
  drop: Curve;
  max: Curve;
}

const EXP = results.experimentTask;
const FULL: Curve = EXP.full;
const NA: NaFrontier[] = EXP.naFrontiers as NaFrontier[];
const MAX_BITS = EXP.maxComplexityBits;

// Fig 5A condition colors: red = 0.5 s, green = 1 s, blue = 2 s deadline.
const DEADLINE_COLORS = ["#ef4444", "#10b981", "#3b82f6"];
const FULL_COLOR = "#0f172a";
const NA_COLOR = "#f59e0b";

const toPoints = (c: Curve) => c.complexity.map((x, i) => ({ x, y: c.reward[i] }));

/** Linear-interpolate a frontier's reward at a given complexity (clamped to its support). */
function rewardAt(c: Curve, x: number): number {
  const xs = c.complexity;
  const ys = c.reward;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let i = 1;
  while (i < xs.length && xs[i] < x) i++;
  const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
  return ys[i - 1] + t * (ys[i] - ys[i - 1]);
}

export function FrontierExplorer() {
  const [na, setNa] = useState(3);
  const [complexity, setComplexity] = useState(0.8);

  const naFrontier = useMemo(() => NA.find((f) => f.na === na) ?? NA[NA.length - 1], [na]);
  const naMaxBits = naFrontier.max.complexity[naFrontier.max.complexity.length - 1];
  const clampedC = Math.min(complexity, naMaxBits);

  const naReward = rewardAt(naFrontier.max, clampedC);
  const fullReward = rewardAt(FULL, clampedC);
  const gapValue = fullReward - naReward;
  const naMaxReward = Math.max(...naFrontier.max.reward);

  const human = results.paper.humanMeans;
  const humanDots: PlotDot[] = human.policyComplexity.map((x, i) => ({
    x,
    y: human.reward[i],
    color: DEADLINE_COLORS[i],
    r: 5,
    ring: true,
  }));

  const series: PlotSeries[] = [
    { points: toPoints(FULL), color: FULL_COLOR, width: 2.5, label: "Full action space" },
    { points: toPoints(naFrontier.max), color: NA_COLOR, width: 2.5, label: `Nₐ = ${na}` },
  ];

  const marker: PlotDot[] = [{ x: clampedC, y: naReward, color: NA_COLOR, r: 6, ring: true }];

  return (
    <div className="not-prose my-8 space-y-4 rounded-xl border border-border bg-background p-5 font-sans shadow-sm">
      <div>
        <p className="text-sm font-medium">Two constraints, one frontier</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The black curve is the best reward attainable at each policy complexity when every
          action is on the table. Shrink the consideration set to <strong>Nₐ</strong> actions and
          the reachable frontier (amber) drops below it — that vertical gap is the{" "}
          <strong>suboptimality</strong> you pay for not considering everything. Raising
          complexity moves you right along the amber curve; raising Nₐ lifts the amber curve
          toward the black one.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div>
          <LinePlot
            series={series}
            dots={[...humanDots, ...marker]}
            gap={gapValue > 0.005 ? { x: clampedC, yLow: naReward, yHigh: fullReward, color: "#ef4444", label: `−${gapValue.toFixed(2)}` } : null}
            xDomain={[0, 2.7]}
            yDomain={[0, 1.05]}
            xTicks={[0, 0.5, 1, 1.5, 2, 2.5]}
            yTicks={[0, 0.25, 0.5, 0.75, 1]}
            xLabel="Policy complexity  I(S;A)  (bits)"
            yLabel="Trial-averaged reward"
            height={360}
          />
          <div className="mt-1">
            <PlotLegend
              items={[
                { color: FULL_COLOR, label: "Full action space" },
                { color: NA_COLOR, label: `Consideration set Nₐ = ${na}` },
                { color: DEADLINE_COLORS[0], label: "human 0.5 s" },
                { color: DEADLINE_COLORS[1], label: "human 1 s" },
                { color: DEADLINE_COLORS[2], label: "human 2 s" },
              ]}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg bg-muted/40 px-4 py-3 text-sm">
          <Slider label="actions considered  Nₐ" min={1} max={7} step={1} value={na} onChange={setNa} />
          <Slider
            label="policy complexity"
            min={0}
            max={Number(MAX_BITS.toFixed(2))}
            step={0.05}
            value={clampedC}
            onChange={setComplexity}
          />
          <div className="space-y-1.5 border-t border-border pt-3 font-mono text-xs">
            <Row label="attainable reward" value={naReward.toFixed(3)} />
            <Row label="suboptimality gap" value={`−${gapValue.toFixed(3)}`} accent />
            <Row label="max reward at this Nₐ" value={naMaxReward.toFixed(3)} />
            <Row label="ceiling on complexity" value={`${naMaxBits.toFixed(2)} bits`} />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            At Nₐ = 1 the only sane action is the safety key: reward pins to 0.2 at 0 bits. Each
            extra action lifts the ceiling and flattens the gap — so reward and Nₐ have to climb
            together.
          </p>
        </div>
      </div>

      <p className="border-t border-border pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        Frontiers: Blahut-Arimoto on the experiment task (6 states × 7 actions), computed in{" "}
        <span className="text-foreground">simulate.py</span>. Human dots are per-deadline means
        digitized from Fig 5D–F — they sit below the full frontier, exactly the suboptimality the
        framework attributes to finite consideration sets.
      </p>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "font-medium text-rose-600 dark:text-rose-400" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
