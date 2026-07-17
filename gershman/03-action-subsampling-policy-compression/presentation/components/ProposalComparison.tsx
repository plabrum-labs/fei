import { useMemo, useState } from "react";
import { LinePlot, PlotLegend, type PlotSeries } from "./plot";
import results from "../data/results.json";

// ---------------------------------------------------------------------------
// Fig 3 (row 1): sampling a consideration set from three proposal distributions, running
// Blahut-Arimoto on what was retained, and measuring the shortfall from the full-action
// frontier. Data precomputed by the Python Monte-Carlo (proposal_comparison in simulate.py).
// ---------------------------------------------------------------------------

interface ProposalCurve {
  proposal: "flat" | "value" | "oracle";
  na: number;
  complexity: number[];
  reduction: number[];
  sem: number[];
}

const PC = results.proposalComparison;
const CURVES = PC.curves as ProposalCurve[];
const SET_SIZES = PC.setSizes as number[];

const PROPOSAL_COLOR: Record<string, string> = {
  flat: "#f97316", // orange
  value: "#0d9488", // teal — the general-value heuristic
  oracle: "#8b5cf6", // violet — the oracle benchmark
};
const PROPOSAL_LABEL: Record<string, string> = {
  flat: "Flat  P₀(a) = const",
  value: "General value  P₀(a) ∝ V(a)",
  oracle: "Oracle  P₀(a) = P*(a)",
};

const toPoints = (c: ProposalCurve) => c.complexity.map((x, i) => ({ x, y: c.reduction[i] }));

export function ProposalComparison() {
  const [na, setNa] = useState(SET_SIZES[0]);

  const shown = useMemo(() => CURVES.filter((c) => c.na === na), [na]);
  const series: PlotSeries[] = shown.map((c) => ({
    points: toPoints(c),
    color: PROPOSAL_COLOR[c.proposal],
    width: 2,
  }));

  // Advantage of general-value over flat at the lowest-complexity third of the sweep.
  const flat = shown.find((c) => c.proposal === "flat");
  const value = shown.find((c) => c.proposal === "value");
  const advantage = useMemo(() => {
    if (!flat || !value) return 0;
    const k = Math.max(2, Math.floor(flat.reduction.length / 3));
    let sum = 0;
    for (let i = 0; i < k; i++) sum += value.reduction[i] - flat.reduction[i];
    return sum / k;
  }, [flat, value]);

  return (
    <div className="not-prose my-8 space-y-4 rounded-xl border border-border bg-background p-5 font-sans shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-sm font-medium">Which actions are worth considering?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A large action space (16 states × 32 actions). Sample <strong>Nₐ</strong> actions
            from a proposal distribution, keep the best policy over them (Blahut-Arimoto), and
            plot how far below the full-space frontier you land. Higher (closer to 0) is better.
            Sampling by <span style={{ color: PROPOSAL_COLOR.value }}>general value</span> beats{" "}
            <span style={{ color: PROPOSAL_COLOR.flat }}>flat</span> sampling at low complexity —
            and the edge shrinks as Nₐ grows.
          </p>
        </div>
        <div className="flex gap-1.5">
          {SET_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setNa(s)}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                s === na
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/60"
              }`}
            >
              Nₐ = {s}
            </button>
          ))}
        </div>
      </div>

      <LinePlot
        series={series}
        xDomain={[0, 3.2]}
        yDomain={[-0.32, 0.02]}
        xTicks={[0, 0.5, 1, 1.5, 2, 2.5, 3]}
        yTicks={[0, -0.1, -0.2, -0.3]}
        xLabel="Policy complexity  I(S;A)  (bits)"
        yLabel="Reduction in trial-averaged reward"
        height={340}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PlotLegend
          items={[
            { color: PROPOSAL_COLOR.flat, label: PROPOSAL_LABEL.flat },
            { color: PROPOSAL_COLOR.value, label: PROPOSAL_LABEL.value },
            { color: PROPOSAL_COLOR.oracle, label: PROPOSAL_LABEL.oracle },
          ]}
        />
        <div className="font-mono text-xs">
          <span className="text-muted-foreground">value − flat, low complexity: </span>
          <span className={advantage > 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium text-rose-600 dark:text-rose-400"}>
            {advantage > 0 ? "+" : ""}
            {advantage.toFixed(3)}
          </span>
        </div>
      </div>

      <p className="border-t border-border pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {PC.nSims} simulations per β, Blahut-Arimoto on the retained set, sampling without
        replacement (Fig 3 row 1). The oracle needs the answer to sample, so it is a benchmark,
        not a strategy. The paper's twist: swap Blahut-Arimoto for the asymptotically{" "}
        <em>unbiased</em> SNIS and the general-value advantage disappears — a better guarantee,
        a worse model of people.
      </p>
    </div>
  );
}
