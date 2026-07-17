"""Normative reproduction of Liu & Gershman (2025), *Action subsampling supports
policy compression in large action spaces* (PLoS Comput Biol 21(9): e1013444).

The paper's central results are *computational* — reward-complexity frontiers traced by
the Blahut-Arimoto (BA) algorithm, and Monte-Carlo comparisons of action-proposal
distributions — so unlike a pure behavioral fit these can be reproduced exactly from the
task structure. This module implements that engine and the three analyses it drives:

  1. The **symmetric task** (Fig 2): 6 states, 6 actions, identity reward. Frontiers for each
     action-consideration-set size ``N_a`` and the suboptimality (deviation) they incur.
  2. The **experiment task** (Fig 4B, 4D-F): 6 states, 7 actions, a safety action worth +0.2
     everywhere plus one uniquely-optimal (+1 / -0.18) action per state. The ``N_a``-specific
     frontiers, taking the better of "keep the safety action" vs "drop it".
  3. The **proposal-distribution comparison** (Fig 3, S4-S5): sample a consideration set from a
     flat / general-value / oracle proposal, run BA on what was retained, and measure how far
     the resulting policy falls below the full-action-space frontier.

Scope: the normative framework only. We reproduce the frontiers and the general-value-sampling
advantage the paper *derives*; we do not refit the human linear-mixed-effects models (the
per-participant data are not needed to reproduce the theory — the paper's reported human means
are carried through to the presentation as a labeled reference overlay, not recomputed here).

Pure functions over numpy arrays; no plotting, no JSON. ``generate_results.py`` is the only
place results leave this folder.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

FloatArray = npt.NDArray[np.float64]
IntArray = npt.NDArray[np.int_]
Generator = np.random.Generator

# ---------------------------------------------------------------------------
# Blahut-Arimoto: the reward-complexity frontier engine
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Policy:
    """A solved capacity-constrained policy and its two scalar summaries.

    ``pi`` is ``pi(a|s)`` with shape (n_states, n_actions); ``complexity`` is the mutual
    information ``I(S;A)`` in bits; ``reward`` is the trial-averaged reward ``V``.
    """

    beta: float
    pi: FloatArray
    marginal: FloatArray
    complexity: float
    reward: float


def _entropy_terms(pi: FloatArray, p_a: FloatArray, p_s: FloatArray) -> float:
    """Mutual information I(S;A) in bits for policy ``pi`` with marginal ``p_a``."""
    # 0 * log(0/·) := 0; guard both the numerator mask and the ratio.
    mask = pi > 0
    ratio = np.zeros_like(pi)
    ratio[mask] = pi[mask] / p_a[np.newaxis, :].repeat(pi.shape[0], axis=0)[mask]
    contrib = np.zeros_like(pi)
    contrib[mask] = pi[mask] * np.log2(ratio[mask])
    return float((p_s[:, np.newaxis] * contrib).sum())


def blahut_arimoto(
    p_s: FloatArray,
    q: FloatArray,
    beta: float,
    *,
    p_a_init: FloatArray | None = None,
    tol: float = 1e-10,
    max_iter: int = 50_000,
) -> Policy:
    """Solve the capacity-constrained policy ``pi*(a|s) ∝ P*(a) exp(β Q(s,a))`` (Eq 2).

    Alternates the two fixed-point updates — the policy given the marginal, then the marginal
    given the policy — until the marginal stops moving. ``p_a_init`` warm-starts the marginal;
    at small ``beta`` the marginal has several fixed points (the spurious uniform one and a
    stable point mass on the best-general-value action), so the frontier sweep hands in the
    previous solution to keep BA on the reward-maximizing branch (see ``frontier``).
    """
    n_actions = q.shape[1]
    p_a = np.full(n_actions, 1.0 / n_actions) if p_a_init is None else p_a_init.copy()
    pi = np.empty_like(q)

    for _ in range(max_iter):
        with np.errstate(divide="ignore"):
            log_p_a = np.where(p_a > 0, np.log(p_a), -np.inf)
        # Stable softmax of (β Q + log P(a)) across actions, per state.
        logits = beta * q + log_p_a[np.newaxis, :]
        logits -= logits.max(axis=1, keepdims=True)
        weights = np.exp(logits)
        pi = weights / weights.sum(axis=1, keepdims=True)

        new_p_a = p_s @ pi
        moved = float(np.abs(new_p_a - p_a).max())
        p_a = new_p_a
        if moved < tol:
            break

    complexity = _entropy_terms(pi, p_a, p_s)
    reward = float((p_s[:, np.newaxis] * pi * q).sum())
    return Policy(beta=beta, pi=pi, marginal=p_a, complexity=max(complexity, 0.0), reward=reward)


def default_betas() -> FloatArray:
    """A β grid that resolves the low-complexity elbow (where the action-set effects live)
    and still reaches the deterministic high-complexity corner."""
    return np.geomspace(0.02, 25.0, 90)


@dataclass(frozen=True)
class Frontier:
    """A reward-complexity frontier as parallel arrays, sorted by complexity."""

    complexity: FloatArray
    reward: FloatArray

    def reward_at(self, complexity: FloatArray | float) -> FloatArray:
        """Linear-interpolate the attainable reward at a given complexity (bits).

        ``np.interp`` returns a scalar for scalar input and an array otherwise; coerce to an
        array so the return type is uniform (a 0-d array still floats cleanly at call sites)."""
        return np.asarray(np.interp(complexity, self.complexity, self.reward), dtype=np.float64)


def frontier(p_s: FloatArray, q: FloatArray, betas: FloatArray | None = None) -> Frontier:
    """Trace the reward-complexity frontier by sweeping β through Blahut-Arimoto.

    Two robustness steps handle the low-complexity corner, where BA is delicate:
      - **Continuation.** β is swept high→low, each solve warm-started from the previous
        marginal, so the sweep tracks the reward-maximizing branch down to I≈0 instead of
        collapsing onto the spurious uniform fixed point.
      - **Envelope.** The analytic endpoint ``(0 bits, max_a V(a))`` is added and the upper
        (Pareto) envelope kept, discarding any dominated point.
    """
    grid = np.unique(default_betas() if betas is None else betas)

    points: list[Policy] = []
    p_a: FloatArray | None = None
    for b in grid[::-1]:
        pol = blahut_arimoto(p_s, q, float(b), p_a_init=p_a)
        p_a = pol.marginal
        points.append(pol)

    complexity = np.array([p.complexity for p in points] + [0.0])
    reward = np.array([p.reward for p in points] + [float(general_value(p_s, q).max())])

    order = np.argsort(complexity)
    complexity, reward = complexity[order], reward[order]

    keep_c: list[float] = []
    keep_r: list[float] = []
    running = -np.inf
    for c, r in zip(complexity, reward, strict=True):
        if r >= running - 1e-12:
            keep_c.append(float(c))
            keep_r.append(float(r))
            running = max(running, r)
    return Frontier(complexity=np.array(keep_c), reward=np.array(keep_r))


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


def symmetric_task() -> tuple[FloatArray, FloatArray]:
    """Fig 2A: 6 equiprobable states, 6 actions, identity reward (one +1 action per state)."""
    n = 6
    p_s = np.full(n, 1.0 / n)
    q = np.eye(n)
    return p_s, q


def experiment_task() -> tuple[FloatArray, FloatArray]:
    """Fig 4B: 6 equiprobable states, 7 actions. Action 0 is the safety action (+0.2 in every
    state); actions 1..6 are each uniquely optimal for one state (+1), else -0.18."""
    n_states = 6
    n_actions = 7
    safety_reward = 0.2
    optimal_reward = 1.0
    off_reward = -0.18

    q = np.full((n_states, n_actions), off_reward)
    q[:, 0] = safety_reward
    for s in range(n_states):
        q[s, s + 1] = optimal_reward
    p_s = np.full(n_states, 1.0 / n_states)
    return p_s, q


SAFETY_ACTION = 0


def random_task(
    rng: Generator, n_states: int = 16, n_actions: int = 32
) -> tuple[FloatArray, FloatArray]:
    """Fig 3A: a large action space with random reward structure, ``Q ∈ [0, 1]``."""
    p_s = np.full(n_states, 1.0 / n_states)
    q = rng.random((n_states, n_actions))
    return p_s, q


# ---------------------------------------------------------------------------
# Action consideration sets
# ---------------------------------------------------------------------------


def subset_frontier(
    p_s: FloatArray, q: FloatArray, actions: list[int], betas: FloatArray | None = None
) -> Frontier:
    """Frontier when only ``actions`` may be used — drop the other columns and re-run BA."""
    return frontier(p_s, q[:, actions], betas)


def experiment_na_frontiers(
    n_grid: int = 200,
) -> dict[str, list[dict[str, object]]]:
    """The ``N_a``-specific frontiers of the experiment task (Fig 4D-F).

    For each set size ``N_a``: one frontier keeping the safety action (and ``N_a - 1`` unsafe
    actions), one dropping it (``N_a`` unsafe actions), and their upper envelope on a shared
    complexity grid. The unsafe actions are symmetric, so *which* ones are kept is immaterial.
    """
    p_s, q = experiment_task()
    unsafe = list(range(1, q.shape[1]))
    max_bits = float(np.log2(q.shape[1]))
    grid = np.linspace(0.0, max_bits, n_grid)

    out: dict[str, list[dict[str, object]]] = {"keep": [], "drop": [], "max": []}
    for na in range(1, q.shape[1] + 1):
        keep_actions = [SAFETY_ACTION, *unsafe[: na - 1]]
        keep = subset_frontier(p_s, q, keep_actions)
        drop = subset_frontier(p_s, q, unsafe[:na])

        keep_v = _clip_frontier(keep, grid)
        drop_v = _clip_frontier(drop, grid)
        # fmax (not maximum): one sub-frontier is NaN past its own reach, and the envelope
        # should take the other there rather than propagate the NaN (Fig 4F).
        env = np.fmax(keep_v, drop_v)

        out["keep"].append({"na": na, "complexity": keep.complexity, "reward": keep.reward})
        out["drop"].append({"na": na, "complexity": drop.complexity, "reward": drop.reward})
        out["max"].append({"na": na, "complexity": grid, "reward": env})
    return out


def _clip_frontier(f: Frontier, grid: FloatArray) -> FloatArray:
    """Interpolate a frontier onto ``grid``; NaN where the set cannot reach that complexity."""
    reachable = grid <= f.complexity.max() + 1e-9
    out = np.full_like(grid, np.nan)
    out[reachable] = f.reward_at(grid[reachable])
    return out


# ---------------------------------------------------------------------------
# Proposal distributions and the general-value-sampling advantage (Fig 3)
# ---------------------------------------------------------------------------


def general_value(p_s: FloatArray, q: FloatArray) -> FloatArray:
    """V(a) = Σ_s P(s) Q(s,a): each action's value averaged over states."""
    return p_s @ q


def _proposal(kind: str, p_s: FloatArray, q: FloatArray, oracle: FloatArray) -> FloatArray:
    """An action-sampling distribution P_0(a). ``oracle`` is the full-space P*(a) at this β.

    A tiny uniform floor (ε) is mixed in so every action keeps strictly positive probability —
    the oracle collapses to a near–point-mass at small β, and without the floor there would be
    fewer non-zero entries than a large consideration set needs to sample distinct actions."""
    n = q.shape[1]
    eps = 1e-6
    match kind:
        case "flat":
            base = np.full(n, 1.0 / n)
        case "value":
            v = general_value(p_s, q)
            v = v - v.min() + 1e-9  # shift to non-negative so it is a valid sampling weight
            base = v / v.sum()
        case "oracle":
            base = oracle
        case _:
            raise ValueError(f"unknown proposal kind: {kind}")
    floored = (1.0 - eps) * base + eps / n
    return floored / floored.sum()


def _policy_on_full_space(
    p_s: FloatArray, q: FloatArray, actions: IntArray, beta: float
) -> tuple[float, float]:
    """Run BA on the retained ``actions``, then score the resulting policy on the *full* task
    (excluded actions get zero probability). Returns (complexity, reward). Uses a looser
    tolerance than the frontier sweep — this runs tens of thousands of times in the
    Monte-Carlo, and the reduction estimate does not need frontier-grade precision."""
    sub = blahut_arimoto(p_s, q[:, actions], beta, tol=1e-6, max_iter=800)
    pi_full = np.zeros_like(q)
    pi_full[:, actions] = sub.pi
    p_a = p_s @ pi_full
    complexity = _entropy_terms(pi_full, p_a, p_s)
    reward = float((p_s[:, np.newaxis] * pi_full * q).sum())
    return max(complexity, 0.0), reward


@dataclass(frozen=True)
class ProposalCurve:
    """Mean±SEM (complexity, reduction-from-frontier) for one proposal at one set size."""

    proposal: str
    na: int
    complexity_mean: FloatArray
    reduction_mean: FloatArray
    reduction_sem: FloatArray


def proposal_comparison(
    p_s: FloatArray,
    q: FloatArray,
    set_sizes: list[int],
    *,
    n_sims: int = 200,
    betas: FloatArray | None = None,
    seed: int = 0,
) -> list[ProposalCurve]:
    """Reproduce Fig 3 row 1: for each proposal and set size ``N_a``, sample ``N_a`` distinct
    actions (without replacement), run BA on them, and record how far below the full-action
    frontier the policy lands, aggregated over ``n_sims`` samples sharing each β."""
    rng = np.random.default_rng(seed)
    grid = np.unique(default_betas() if betas is None else betas)
    full = frontier(p_s, q, grid)
    n_actions = q.shape[1]

    # The oracle proposal is the full-space marginal at each β — compute it once, not per
    # (proposal, N_a). Continuation keeps the low-β marginals on the reward-maximizing branch.
    oracle_by_beta: dict[float, FloatArray] = {}
    p_a: FloatArray | None = None
    for b in grid[::-1]:
        pol = blahut_arimoto(p_s, q, float(b), p_a_init=p_a)
        p_a = pol.marginal
        oracle_by_beta[float(b)] = pol.marginal

    # Each BA solve depends only on (β, retained action set); concentrated proposals resample
    # the same few sets, so memoizing on that key collapses most of the work.
    solve_cache: dict[tuple[float, tuple[int, ...]], tuple[float, float]] = {}

    def solve(actions: IntArray, beta: float) -> tuple[float, float]:
        key = (beta, tuple(sorted(int(a) for a in actions)))
        cached = solve_cache.get(key)
        if cached is None:
            cached = _policy_on_full_space(p_s, q, actions, beta)
            solve_cache[key] = cached
        return cached

    curves: list[ProposalCurve] = []
    for kind in ("flat", "value", "oracle"):
        for na in set_sizes:
            comp_by_beta: list[float] = []
            red_mean_by_beta: list[float] = []
            red_sem_by_beta: list[float] = []
            for b in grid:
                p0 = _proposal(kind, p_s, q, oracle_by_beta[float(b)])
                comps = np.empty(n_sims)
                reds = np.empty(n_sims)
                for i in range(n_sims):
                    actions = rng.choice(n_actions, size=na, replace=False, p=p0)
                    comp, reward = solve(actions, float(b))
                    comps[i] = comp
                    reds[i] = reward - float(full.reward_at(comp))
                comp_by_beta.append(float(comps.mean()))
                red_mean_by_beta.append(float(reds.mean()))
                red_sem_by_beta.append(float(reds.std(ddof=1) / np.sqrt(n_sims)))
            curves.append(
                ProposalCurve(
                    proposal=kind,
                    na=na,
                    complexity_mean=np.array(comp_by_beta),
                    reduction_mean=np.array(red_mean_by_beta),
                    reduction_sem=np.array(red_sem_by_beta),
                )
            )
    return curves


# ---------------------------------------------------------------------------
# Headline numbers (printed by __main__ and re-checked in generate_results.py)
# ---------------------------------------------------------------------------


def headline_numbers() -> dict[str, float]:
    """Scalar checks against the paper's stated task structure and frontiers."""
    p_s, q = experiment_task()
    full = frontier(p_s, q)
    _, q_sym = symmetric_task()
    p_sym = np.full(6, 1.0 / 6)
    sym_full = frontier(p_sym, q_sym)

    # General-value vs flat at low complexity on the random task: the paper's core claim.
    rng = np.random.default_rng(0)
    p_r, q_r = random_task(rng)
    low_betas = np.geomspace(0.05, 1.0, 12)
    curves = proposal_comparison(p_r, q_r, [5], n_sims=100, betas=low_betas, seed=1)
    flat = next(c for c in curves if c.proposal == "flat")
    value = next(c for c in curves if c.proposal == "value")

    return {
        "safety_general_value": float(general_value(p_s, q)[SAFETY_ACTION]),
        "unsafe_general_value": float(general_value(p_s, q)[1]),
        "experiment_reward_at_0_bits": float(full.reward_at(0.0)),
        "experiment_max_reward": float(full.reward.max()),
        "experiment_max_bits": float(np.log2(q.shape[1])),
        "symmetric_reward_at_0_bits": float(sym_full.reward_at(0.0)),
        "symmetric_max_bits": float(np.log2(6)),
        "value_minus_flat_low_complexity": float(
            np.nanmean(value.reduction_mean - flat.reduction_mean)
        ),
    }


def main() -> None:
    nums = headline_numbers()
    checks: list[tuple[str, float, str]] = [
        ("V(safety) general value", nums["safety_general_value"], "paper 0.2"),
        ("V(unsafe) general value", nums["unsafe_general_value"], "= (1 - 5·0.18)/6"),
        ("experiment reward @ 0 bits", nums["experiment_reward_at_0_bits"], "paper 0.2 (safety)"),
        ("experiment max reward", nums["experiment_max_reward"], "paper 1.0"),
        ("experiment max complexity", nums["experiment_max_bits"], "log2(7) bits"),
        ("symmetric reward @ 0 bits", nums["symmetric_reward_at_0_bits"], "paper ≈0.167"),
        ("symmetric max complexity", nums["symmetric_max_bits"], "log2(6) bits"),
    ]
    for label, value, note in checks:
        print(f"  {label:<30} {value:>8.4f}   ({note})")

    delta = nums["value_minus_flat_low_complexity"]
    verdict = "value LESS suboptimal (advantage)" if delta > 0 else "no advantage"
    print(f"  {'value − flat @ low complexity':<30} {delta:>+8.4f}   ({verdict})")


if __name__ == "__main__":
    main()
