/**
 * Single source of truth for the action-subsampling lecture widgets.
 *
 * This file holds the *experiment task* the reader plays (Fig 4B) plus the two behavioral
 * read-outs the paper defines — policy complexity (a Dirichlet-smoothed plug-in estimate of
 * the mutual information I(S;A), matching the paper's Hutter estimator) and the number of
 * distinct actions chosen N_a. It is pure data + math; nothing here imports React, and the
 * reward-complexity frontiers it is plotted against are precomputed by the Python
 * reproduction and read from ../data/results.json.
 */

export const N_STATES = 6;
export const N_ACTIONS = 7; // six response keys + one safety key
export const SAFETY_ACTION = 0; // action index 0 is the safety key ("E")

export const SAFETY_REWARD = 0.2;
export const OPTIMAL_REWARD = 1.0;
export const OFF_REWARD = -0.18;
export const MISS_REWARD = -1.0;

/** Dirichlet smoothing for the plug-in policy-complexity estimate (paper uses α = 0.01). */
export const DIRICHLET_ALPHA = 0.01;

export const RT_DEADLINES = [0.5, 1, 2] as const;
export type Deadline = (typeof RT_DEADLINES)[number];

/**
 * Reward matrix Q(s, a). Action 0 is the safety key (+0.2 in every state); the other six keys
 * are each uniquely optimal for one state (+1) and cost −0.18 elsewhere. This is the abstract
 * structure of Fig 4B; the reader's state→key mapping (below) plays the role of the paper's
 * per-participant randomized assignment.
 */
export const Q: number[][] = Array.from({ length: N_STATES }, (_, s) =>
  Array.from({ length: N_ACTIONS }, (_, a) => {
    if (a === SAFETY_ACTION) return SAFETY_REWARD;
    return a === s + 1 ? OPTIMAL_REWARD : OFF_REWARD;
  }),
);

export function reward(state: number, action: number): number {
  return Q[state][action];
}

/** The unique optimal (non-safety) key for a state, as a 1-indexed key label. */
export function optimalKey(state: number): number {
  return state + 1;
}

// ---------------------------------------------------------------------------
// The six states. Rendered as distinct "fractal" badges (a stand-in for the paper's
// fractal image stimuli — the actual images are not redistributed here).
// ---------------------------------------------------------------------------

export type GlyphKind = "burst" | "bloom" | "star" | "gear" | "orbit" | "prism";

export interface StateGlyph {
  color: string;
  kind: GlyphKind;
}

export const STATE_GLYPHS: readonly StateGlyph[] = [
  { color: "#e11d48", kind: "burst" }, // rose
  { color: "#f59e0b", kind: "bloom" }, // amber
  { color: "#10b981", kind: "star" }, // emerald
  { color: "#6366f1", kind: "gear" }, // indigo
  { color: "#06b6d4", kind: "orbit" }, // cyan
  { color: "#a855f7", kind: "prism" }, // violet
];

// ---------------------------------------------------------------------------
// Reward feedback colors (mirrors the paper's border-color feedback scheme).
// ---------------------------------------------------------------------------

export function rewardColor(value: number): string {
  if (value >= OPTIMAL_REWARD) return "#15803d"; // dark green +1
  if (value > 0) return "#86efac"; // light green +0.2
  if (value > MISS_REWARD) return "#f9a8d4"; // pink −0.18
  return "#ef4444"; // red −1 (miss)
}

// ---------------------------------------------------------------------------
// Behavioral read-outs from a block of play
// ---------------------------------------------------------------------------

export interface Trial {
  state: number;
  action: number; // chosen action, or -1 for a missed deadline
  reward: number;
}

export interface BlockStats {
  nTrials: number;
  meanReward: number;
  policyComplexity: number; // bits, I(S;A)
  nActions: number; // distinct actions chosen (N_a), safety included
  pSafety: number;
  misses: number;
}

/**
 * Policy complexity as the mutual information of the *posterior-mean* policy under a symmetric
 * Dirichlet(α) prior — the paper's estimator (Methods; Hutter 2001). Counts are smoothed by α
 * per state, giving π(a|s); P(a) is the state-weighted marginal; I(S;A) = Σ_s P(s) Σ_a
 * π(a|s) log2[π(a|s)/P(a)]. Missed-deadline trials do not count toward any action.
 */
export function policyComplexity(trials: Trial[], alpha: number = DIRICHLET_ALPHA): number {
  const counts: number[][] = Array.from({ length: N_STATES }, () =>
    new Array<number>(N_ACTIONS).fill(0),
  );
  const stateTotals = new Array<number>(N_STATES).fill(0);
  for (const t of trials) {
    if (t.action < 0) continue;
    counts[t.state][t.action] += 1;
    stateTotals[t.state] += 1;
  }

  // States actually visited, and their empirical frequencies P(s).
  const visited = stateTotals.map((n, s) => ({ s, n })).filter((x) => x.n > 0);
  const grandTotal = visited.reduce((sum, x) => sum + x.n, 0);
  if (grandTotal === 0) return 0;

  const pS = new Array<number>(N_STATES).fill(0);
  const policy: number[][] = counts.map((row, s) => {
    const denom = stateTotals[s] + alpha * N_ACTIONS;
    return row.map((c) => (denom > 0 ? (c + alpha) / denom : 1 / N_ACTIONS));
  });
  for (const { s, n } of visited) pS[s] = n / grandTotal;

  const pA = new Array<number>(N_ACTIONS).fill(0);
  for (const { s } of visited) {
    for (let a = 0; a < N_ACTIONS; a++) pA[a] += pS[s] * policy[s][a];
  }

  let mi = 0;
  for (const { s } of visited) {
    for (let a = 0; a < N_ACTIONS; a++) {
      const p = policy[s][a];
      if (p > 0 && pA[a] > 0) mi += pS[s] * p * Math.log2(p / pA[a]);
    }
  }
  return Math.max(mi, 0);
}

export function blockStats(trials: Trial[]): BlockStats {
  const scored = trials.filter((t) => t.action >= 0);
  const distinct = new Set(scored.map((t) => t.action));
  const misses = trials.length - scored.length;
  const safety = scored.filter((t) => t.action === SAFETY_ACTION).length;
  const meanReward =
    trials.length > 0 ? trials.reduce((sum, t) => sum + t.reward, 0) / trials.length : 0;
  return {
    nTrials: trials.length,
    meanReward,
    policyComplexity: policyComplexity(trials),
    nActions: distinct.size,
    pSafety: trials.length > 0 ? safety / trials.length : 0,
    misses,
  };
}

// ---------------------------------------------------------------------------
// General value V(a) = Σ_s P(s) Q(s,a) for the experiment task (flat P(s)).
// The safety key has the highest general value — this is why it dominates at 0 bits.
// ---------------------------------------------------------------------------

export function generalValue(): number[] {
  return Array.from({ length: N_ACTIONS }, (_, a) => {
    let v = 0;
    for (let s = 0; s < N_STATES; s++) v += Q[s][a] / N_STATES;
    return v;
  });
}
