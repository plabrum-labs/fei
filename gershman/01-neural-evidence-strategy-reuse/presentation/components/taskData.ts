/**
 * Single source of truth for the "gem collector" lecture widgets.
 *
 * Two representations of the same task live here, and the article is explicit about
 * which is which:
 *
 *   1. The paper's **canonical** feature/weight vectors (PHI, W_TRAIN, W_TEST). These
 *      reproduce the exact dissociation the authors engineered — the interactive
 *      `GemCollector` lets a reader play them.
 *
 *   2. A **randomized-feature** generative process, ported from the reproduction's
 *      `simulate.py`, used by the live reuse dial to re-run the three decision rules
 *      in-browser. It is the same process that `generate_results.py` runs offline, so
 *      the dial's numbers track `data/results.json`.
 *
 * Nothing here imports React — it is pure data + math, shared by every widget.
 */

export type Vec3 = readonly [number, number, number];
export type Vec4 = readonly [number, number, number, number];

export const N_CITIES = 4;
export const N_GEMS = 3;

/** Softmax inverse-temperature and SF&GPI lapse rate — identical to `simulate.py`. */
export const SOFTMAX_BETA = 3;
export const SF_GPI_LAPSE = 0.32;

/** Cities are 0-indexed internally, 1-indexed in the UI ("City 1" = index 0). */
export const CITY_NAMES = ["Sydney", "Tokyo", "New York", "London"] as const;

/** The two cities that are optimal across every training task (the reusable set). */
export const TRAIN_OPTIMAL: readonly number[] = [0, 3];
/** The two cities that become objectively best at test (the model-based switch). */
export const TEST_OPTIMAL: readonly number[] = [1, 2];

export type GemKind = "triangle" | "square" | "circle";
export interface Gem {
  name: string;
  kind: GemKind;
  color: string;
}

/** The three gem shapes; features `phi` count these per city. */
export const GEMS: readonly Gem[] = [
  { name: "Triangle", kind: "triangle", color: "#6366f1" },
  { name: "Square", kind: "square", color: "#f59e0b" },
  { name: "Circle", kind: "circle", color: "#10b981" },
];

/**
 * Canonical per-city gem counts φ (rows = cities, cols = triangle/square/circle).
 * Verified to reproduce the paper's design: cities {0,3} are optimal on all four
 * training weights; cities {1,2} become best at test while {0,3} stay barely-suboptimal.
 */
export const PHI: readonly Vec3[] = [
  [120, 50, 110], // City 1 — Sydney
  [90, 80, 190], // City 2 — Tokyo
  [140, 150, 40], // City 3 — New York
  [60, 200, 20], // City 4 — London
];

/** Four training reward-weight vectors w (market prices per gem). Optimal city ∈ {0,3}. */
export const W_TRAIN: readonly Vec3[] = [
  [1, -1, 0],
  [-1, 1, 0],
  [1, -2, 0],
  [-2, 1, 0],
];

/** Four test reward-weight vectors. Objective best flips to {1,2}; {0,3} stay strong. */
export const W_TEST: readonly Vec3[] = [
  [2, -1, -1],
  [-1, 1, 1],
  [1, -1, 1],
  [1, 1, -1],
];

/** Categorical colours for the three modelled strategies plus the human reference. */
export const AGENT_COLORS: Record<string, string> = {
  mf: "#94a3b8", // slate — model-free
  mb: "#6366f1", // indigo — model-based
  sfgpi: "#f59e0b", // amber — SF&GPI (the protagonist)
  human: "#10b981", // emerald — measured behaviour
};

// ---------------------------------------------------------------------------
// Reward + softmax (shared math)
// ---------------------------------------------------------------------------

/** reward = φ · w for a single city. */
export function dot(phi: Vec3, w: Vec3): number {
  return phi[0] * w[0] + phi[1] * w[1] + phi[2] * w[2];
}

/** Per-city reward vector under weight `w`. */
export function cityValues(w: Vec3, phi: readonly Vec3[] = PHI): number[] {
  return phi.map((row) => dot(row, w));
}

/**
 * Softmax probabilities over `candidates` (city indices), returned as a full
 * `N_CITIES`-length vector with zeros for cities outside the candidate set. Mirrors
 * `softmax_choice` in `simulate.py` (same max-shift for numerical stability).
 */
export function softmaxOver(
  values: readonly number[],
  candidates: readonly number[],
  beta: number,
): number[] {
  const max = Math.max(...candidates.map((c) => values[c]));
  const weights = candidates.map((c) => Math.exp(beta * (values[c] - max)));
  const total = weights.reduce((a, b) => a + b, 0);
  const probs = new Array<number>(values.length).fill(0);
  candidates.forEach((c, i) => {
    probs[c] = weights[i] / total;
  });
  return probs;
}

const ALL_CITIES = Array.from({ length: N_CITIES }, (_, i) => i);

function reuseMass(probs: readonly number[], reuseSet: readonly number[]): number {
  return reuseSet.reduce((sum, c) => sum + probs[c], 0);
}

// ---------------------------------------------------------------------------
// The three decision rules, as closed-form reuse probabilities (port of simulate.py)
// ---------------------------------------------------------------------------

/** Model-based: softmax over all cities under the current weights. */
export function mbReuseProb(
  testValues: readonly number[],
  beta: number,
  reuseSet: readonly number[] = TRAIN_OPTIMAL,
): number {
  return reuseMass(softmaxOver(testValues, ALL_CITIES, beta), reuseSet);
}

/** Model-free: softmax over cached training reward; ignores the new weights entirely. */
export function mfReuseProb(
  cachedValues: readonly number[],
  beta: number,
  reuseSet: readonly number[] = TRAIN_OPTIMAL,
): number {
  return reuseMass(softmaxOver(cachedValues, ALL_CITIES, beta), reuseSet);
}

/**
 * SF&GPI: with probability `1 − lapse`, restrict the softmax to the learned policy
 * library (`reuseSet`) → all mass lands in the reuse set; on a lapse, evaluate all
 * cities exactly like the model-based rule. Expected reuse probability is therefore a
 * closed-form mixture.
 */
export function sfgpiReuseProb(
  testValues: readonly number[],
  beta: number,
  lapse: number,
  reuseSet: readonly number[] = TRAIN_OPTIMAL,
): number {
  return (1 - lapse) * 1 + lapse * mbReuseProb(testValues, beta, reuseSet);
}

// ---------------------------------------------------------------------------
// Randomized-feature ensemble for the live dial (mirrors simulate.py's generator)
// ---------------------------------------------------------------------------

/** Deterministic PRNG (mulberry32) so the in-browser ensemble is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [lo, hi) — matches numpy's `integers(lo, hi)`. */
function randInt(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo));
}

/** Random gem-count feature matrix, entries in {0,…,4} (cf. `make_city_features`). */
function makeCityFeatures(rng: () => number): Vec3[] {
  return Array.from(
    { length: N_CITIES },
    () => [randInt(rng, 0, 5), randInt(rng, 0, 5), randInt(rng, 0, 5)] as Vec3,
  );
}

/**
 * Rejection-sample a weight vector so the two `targetBest` cities each beat both others
 * by at least `margin` (cf. `make_weights_for_target`). Returns the best-separating draw
 * if the margin is never hit; `null` if even a positive gap never appears.
 */
function makeWeightsForTarget(
  rng: () => number,
  phi: readonly Vec3[],
  targetBest: readonly number[],
  margin = 0.2,
  maxTries = 20000,
): Vec3 | null {
  const others = ALL_CITIES.filter((c) => !targetBest.includes(c));
  let bestGap = -Infinity;
  let bestW: Vec3 | null = null;
  for (let i = 0; i < maxTries; i++) {
    const w: Vec3 = [rng() * 4 - 2, rng() * 4 - 2, rng() * 4 - 2];
    const values = cityValues(w, phi);
    const worstTarget = Math.min(...targetBest.map((c) => values[c]));
    const bestOther = Math.max(...others.map((c) => values[c]));
    const gap = worstTarget - bestOther;
    if (gap > bestGap) {
      bestGap = gap;
      bestW = w;
    }
    if (gap > margin) return w;
  }
  return bestGap > 0 ? bestW : null;
}

export interface Subject {
  /** Per-city reward under this subject's test weights. */
  testValues: number[];
  /** Model-free cache: true training reward for optimal cities, block mean elsewhere. */
  cachedValues: number[];
}

/**
 * Build a fixed ensemble of synthetic subjects (same generative process as
 * `simulate.py`), each carrying the two vectors the dial needs. Generated once per seed.
 */
export function makeEnsemble(nSubjects: number, seed = 0): Subject[] {
  const rng = mulberry32(seed);
  const subjects: Subject[] = [];
  while (subjects.length < nSubjects) {
    const phi = makeCityFeatures(rng);
    const wTrain = makeWeightsForTarget(rng, phi, TRAIN_OPTIMAL);
    const wTest = makeWeightsForTarget(rng, phi, TEST_OPTIMAL);
    if (!wTrain || !wTest) continue;

    const trainValues = cityValues(wTrain, phi);
    const meanTrain = trainValues.reduce((a, b) => a + b, 0) / N_CITIES;
    // Model-free remembers the reward of cities it actually visited (the training-optimal
    // ones) and falls back to the block mean for the rest — the deterministic counterpart
    // of `simulate.py`'s "seen ? value : mean" cache.
    const cachedValues = trainValues.map((v, c) =>
      TRAIN_OPTIMAL.includes(c) ? v : meanTrain,
    );
    subjects.push({ testValues: cityValues(wTest, phi), cachedValues });
  }
  return subjects;
}

export interface ReuseRates {
  mf: number;
  mb: number;
  sfgpi: number;
}

/** Expected per-strategy reuse rate (%) over the ensemble at the given β and lapse. */
export function ensembleReuseRates(
  ensemble: readonly Subject[],
  beta: number,
  lapse: number,
): ReuseRates {
  let mf = 0;
  let mb = 0;
  let sfgpi = 0;
  for (const s of ensemble) {
    mf += mfReuseProb(s.cachedValues, beta);
    mb += mbReuseProb(s.testValues, beta);
    sfgpi += sfgpiReuseProb(s.testValues, beta, lapse);
  }
  const n = ensemble.length;
  return { mf: (100 * mf) / n, mb: (100 * mb) / n, sfgpi: (100 * sfgpi) / n };
}
