import { useMemo, useState } from "react";
import { BarChart, type BarChartRow, type BarSeries } from "@/primitives/BarChart";
import { Slider } from "@/primitives/Slider";
import {
  AGENT_COLORS,
  SF_GPI_LAPSE,
  SOFTMAX_BETA,
  ensembleReuseRates,
  makeEnsemble,
} from "./taskData";
import results from "../data/results.json";

const CITY_LABELS = ["City 1", "City 2", "City 3", "City 4"];
const REUSE_CITIES = ["City 1", "City 4"];
const round1 = (v: number) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------------------
// (1) Static per-city choice profile — straight from data/results.json
// ---------------------------------------------------------------------------

export function ChoiceProfile() {
  const { agents, human, paper, trainOptimalSim } = results;

  const data: BarChartRow[] = CITY_LABELS.map((category, i) => ({
    category,
    mf: agents.mf.cityProfile[i],
    mb: agents.mb.cityProfile[i],
    sfgpi: agents.sfgpi.cityProfile[i],
    human: human.cityProfile[i],
  }));

  const series: BarSeries[] = [
    { key: "mf", label: "Model-free", color: AGENT_COLORS.mf },
    { key: "mb", label: "Model-based", color: AGENT_COLORS.mb },
    { key: "sfgpi", label: "SF&GPI", color: AGENT_COLORS.sfgpi },
    { key: "human", label: "Human (paper)", color: AGENT_COLORS.human },
  ];

  const stats = [
    { label: "Optimal at training", value: `${paper.trainOptimal}%`, sub: `sim ${trainOptimalSim}%` },
    { label: "Reused at test", value: `${paper.reuse}%`, sub: `sim ${agents.sfgpi.reuse}%` },
    {
      label: "Better of the two reused",
      value: `${paper.correctWithinReuse}%`,
      sub: `sim ${agents.sfgpi.correctWithinReuse}%`,
    },
  ];

  return (
    <div className="not-prose my-8 space-y-4 rounded-xl border border-border bg-background p-5 font-sans shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="font-mono text-xl font-medium tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs leading-tight text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">{s.sub}</div>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">Where each strategy sends its test choices</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Cities 1 and 4 (accent) are the training-optimal set. Model-based spreads onto the
          newly-best cities 2 and 3; model-free perseverates on 1 and 4 but splits them wrongly;
          SF&amp;GPI tracks the human profile.
        </p>
        <BarChart
          data={data}
          series={series}
          accentCategories={REUSE_CITIES}
          yDomain={[0, 60]}
          unit="%"
          showLegend
          height={300}
        />
      </div>
      <p className="border-t border-border pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        Strategy bars: per-city choice frequency from the reproduction&rsquo;s 100-subject
        Monte-Carlo (randomized features). Human bars reconstruct the per-city split from the
        paper&rsquo;s reported 68.8% reuse under the task&rsquo;s city-1/city-4 symmetry.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// (2) Live reuse dial — the same three rules, re-run in the browser
// ---------------------------------------------------------------------------

const ENSEMBLE_SIZE = 300;

export function ReuseDial() {
  const ensemble = useMemo(() => makeEnsemble(ENSEMBLE_SIZE, 0), []);
  const [beta, setBeta] = useState<number>(SOFTMAX_BETA);
  const [lapse, setLapse] = useState<number>(SF_GPI_LAPSE);

  const rates = useMemo(() => ensembleReuseRates(ensemble, beta, lapse), [ensemble, beta, lapse]);

  const data: BarChartRow[] = [
    { category: "Model-free", value: round1(rates.mf), fill: AGENT_COLORS.mf },
    { category: "Model-based", value: round1(rates.mb), fill: AGENT_COLORS.mb },
    { category: "SF&GPI", value: round1(rates.sfgpi), fill: AGENT_COLORS.sfgpi },
  ];

  const atPaperDefault = beta === SOFTMAX_BETA && lapse === SF_GPI_LAPSE;

  return (
    <div className="not-prose my-8 space-y-4 rounded-xl border border-border bg-background p-5 font-sans shadow-sm">
      <div>
        <p className="text-sm font-medium">Reuse rate, recomputed live</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The three decision rules re-run in your browser over a fresh {ENSEMBLE_SIZE}-subject
          ensemble. Only SF&amp;GPI&rsquo;s reuse rate is pinned near the human line by its lapse
          term; model-based switches away, model-free over-reuses.
        </p>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-2">
        <div className="space-y-3 self-center rounded-lg bg-muted/40 px-4 py-3 text-sm">
          <Slider label="softmax β" min={0.5} max={8} step={0.1} value={beta} onChange={setBeta} />
          <Slider label="SF&GPI lapse" min={0} max={1} step={0.01} value={lapse} onChange={setLapse} />
          <button
            type="button"
            onClick={() => {
              setBeta(SOFTMAX_BETA);
              setLapse(SF_GPI_LAPSE);
            }}
            disabled={atPaperDefault}
            className="rounded-md border border-border px-3 py-1 text-xs font-medium transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40"
          >
            Reset to paper values (β={SOFTMAX_BETA}, lapse={SF_GPI_LAPSE})
          </button>
        </div>
        <div>
          <BarChart
            data={data}
            series={[{ key: "value", label: "Reuse rate", color: AGENT_COLORS.sfgpi }]}
            yDomain={[0, 100]}
            unit="%"
            showValueLabels
            referenceLines={[{ y: 68.8, label: "Human 68.8%" }]}
            height={260}
          />
        </div>
      </div>
      <p className="border-t border-border pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        Same softmax + generalized-policy-improvement rules as{" "}
        <span className="text-foreground">simulate.py</span>; expected reuse computed in closed
        form, so the bars are smooth. At the paper&rsquo;s β=3 / lapse=0.32 they reproduce the
        reproduction&rsquo;s ≈68% SF&amp;GPI reuse.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combined view (used by the slide deck)
// ---------------------------------------------------------------------------

export function SimulationView() {
  return (
    <div className="space-y-6">
      <ChoiceProfile />
      <ReuseDial />
    </div>
  );
}
