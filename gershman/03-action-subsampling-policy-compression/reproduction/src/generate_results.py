"""Aggregate the policy-compression / action-subsampling simulations into
``presentation/data/results.json`` — the single handoff into the frontend.

Imports the pure engine from ``simulate.py`` (left unchanged), runs the three analyses, and
serializes compact frontier point-lists plus the paper's reported human reference numbers.
Regenerate with::

    uv run python src/generate_results.py

What the frontend does with each block:
  - ``experimentTask`` frontiers drive the interactive ``FrontierExplorer`` and give the
    playable ``BanditTask`` its reward-complexity backdrop. (The reader's own landing point is
    computed in the browser from their empirical choices — a plug-in mutual-information
    estimate — not here.)
  - ``proposalComparison`` (a Monte-Carlo that is too slow to redo live) is the "simulation
    that was run" figure: general-value vs flat vs oracle sampling on a large action space.
  - ``symmetricTask`` backs the static Fig-2 frontier fan.
  - ``paper`` carries the reported LME coefficients, correlations, and per-condition human
    means (the latter digitized from Fig 5D-H and flagged as such — not recomputed).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, SupportsFloat

import numpy as np
from simulate import (
    Frontier,
    experiment_na_frontiers,
    experiment_task,
    frontier,
    general_value,
    proposal_comparison,
    random_task,
    symmetric_task,
)

FloatArray = np.typing.NDArray[np.float64]


def r(x: SupportsFloat, places: int = 4) -> float:
    """Round any float-like (python float or numpy scalar) to keep the JSON compact."""
    return round(float(x), places)


def thin(xs: FloatArray, keep: int = 48) -> list[float]:
    """Round and evenly subsample an array to at most ``keep`` points (endpoints preserved)."""
    if len(xs) <= keep:
        return [r(v) for v in xs]
    idx = np.unique(np.linspace(0, len(xs) - 1, keep).round().astype(int))
    return [r(xs[i]) for i in idx]


def frontier_points(f: Frontier, keep: int = 48) -> dict[str, list[float]]:
    idx = (
        np.arange(len(f.complexity))
        if len(f.complexity) <= keep
        else np.unique(np.linspace(0, len(f.complexity) - 1, keep).round().astype(int))
    )
    return {
        "complexity": [r(f.complexity[i]) for i in idx],
        "reward": [r(f.reward[i]) for i in idx],
    }


def clean_pairs(
    complexity: FloatArray, reward: FloatArray, keep: int = 48
) -> dict[str, list[float]]:
    """Drop NaN (unreachable) points, then round/subsample parallel complexity/reward arrays."""
    finite = np.isfinite(complexity) & np.isfinite(reward)
    c, v = complexity[finite], reward[finite]
    idx = (
        np.arange(len(c))
        if len(c) <= keep
        else np.unique(np.linspace(0, len(c) - 1, keep).round().astype(int))
    )
    return {"complexity": [r(c[i]) for i in idx], "reward": [r(v[i]) for i in idx]}


# ---------------------------------------------------------------------------
# Paper reference numbers (Liu & Gershman 2025). Statistics quoted from the text;
# per-condition means digitized from Fig 5D-H (approximate, flagged `digitized`).
# ---------------------------------------------------------------------------

PAPER: dict[str, Any] = {
    "nParticipants": 75,
    "deadlines": [0.5, 1.0, 2.0],
    "lme": {
        "complexity~deadline": {"beta": 0.762, "se": 0.0778, "t": 9.78, "logp": -18},
        "reward~deadline": {"beta": 0.249, "se": 0.0265, "t": 9.37, "logp": -17},
        "pSafety~deadline": {"beta": -0.309, "se": 0.0325, "t": -9.50, "logp": -17},
        "rt~complexity": {"beta": 0.273, "se": 0.0103, "t": 26.3, "logp": -69},
        "nActions~deadline": {"beta": 1.30, "se": 0.159, "t": 8.19, "logp": -13},
        "reward~complexity*nActions": {
            "complexity": 0.248,
            "interaction": 0.0205,
            "tInteraction": 6.70,
            "logpInteraction": -10,
        },
        "loss~complexity*nActions": {
            "complexity": -0.276,
            "interaction": 0.0571,
            "tInteraction": 16.7,
            "logpInteraction": -40,
        },
    },
    "correlations": {
        "complexity_vs_nActions": {"r": 0.671, "logp": -30, "vif": 1.82},
        "trainAcc_vs_complexity": {"r": 0.792, "logp": -16},
        "trainAcc_vs_nActions": {"r": 0.327, "p": 0.00416},
    },
    # Digitized from Fig 5D-H: mean over participants at each RT deadline.
    "humanMeans": {
        "digitized": True,
        "policyComplexity": [0.18, 1.15, 1.45],
        "reward": [0.20, 0.52, 0.61],
        "pSafety": [0.83, 0.41, 0.31],
        "rt": [0.22, 0.48, 0.60],
        "nActions": [3.0, 4.7, 5.1],
    },
    "suboptimalCluster": {"n": 13, "rewardCutoff": 0.15, "nRemaining": 62},
}


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------


def build_symmetric() -> dict[str, Any]:
    p_s, q = symmetric_task()
    full = frontier(p_s, q)
    n_actions = q.shape[1]

    frontiers: list[dict[str, Any]] = []
    suboptimality: list[dict[str, Any]] = []
    for na in range(1, n_actions + 1):
        f = frontier(p_s, q[:, :na])
        frontiers.append({"na": na, **frontier_points(f)})
        # Deviation from the full frontier at each of this set's own complexity levels (Fig 2C).
        loss = f.reward - full.reward_at(f.complexity)
        suboptimality.append(
            {
                "na": na,
                "complexity": thin(f.complexity),
                "loss": [r(v) for v in thin_arr(loss, f.complexity)],
            }
        )
    return {
        "states": 6,
        "actions": 6,
        "full": frontier_points(full),
        "frontiers": frontiers,
        "suboptimality": suboptimality,
    }


def thin_arr(values: FloatArray, ref: FloatArray, keep: int = 48) -> FloatArray:
    """Subsample ``values`` on the same indices ``thin`` would pick for ``ref``."""
    if len(ref) <= keep:
        return values
    idx = np.unique(np.linspace(0, len(ref) - 1, keep).round().astype(int))
    return values[idx]


def build_experiment() -> dict[str, Any]:
    p_s, q = experiment_task()
    full = frontier(p_s, q)
    na = experiment_na_frontiers()

    na_frontiers: list[dict[str, Any]] = []
    for keep_e, drop_e, max_e in zip(na["keep"], na["drop"], na["max"], strict=True):
        na_frontiers.append(
            {
                "na": keep_e["na"],
                "keep": clean_pairs(np.asarray(keep_e["complexity"]), np.asarray(keep_e["reward"])),
                "drop": clean_pairs(np.asarray(drop_e["complexity"]), np.asarray(drop_e["reward"])),
                "max": clean_pairs(np.asarray(max_e["complexity"]), np.asarray(max_e["reward"])),
            }
        )

    gv = general_value(p_s, q)
    return {
        "states": 6,
        "actions": 7,
        "safetyReward": 0.2,
        "optimalReward": 1.0,
        "offReward": -0.18,
        "safetyGeneralValue": r(float(gv[0])),
        "unsafeGeneralValue": r(float(gv[1])),
        "maxComplexityBits": r(float(np.log2(6))),
        "full": frontier_points(full),
        "naFrontiers": na_frontiers,
    }


def build_proposal_comparison() -> dict[str, Any]:
    rng = np.random.default_rng(0)
    p_s, q = random_task(rng)
    set_sizes = [3, 5, 10]
    betas = np.geomspace(0.03, 6.0, 22)
    curves = proposal_comparison(p_s, q, set_sizes, n_sims=150, betas=betas, seed=1)

    out_curves: list[dict[str, Any]] = []
    for c in curves:
        out_curves.append(
            {
                "proposal": c.proposal,
                "na": c.na,
                "complexity": [r(v) for v in c.complexity_mean],
                "reduction": [r(v) for v in c.reduction_mean],
                "sem": [r(v) for v in c.reduction_sem],
            }
        )
    return {
        "task": "random reward, 16 states x 32 actions (Fig 3)",
        "algorithm": "Blahut-Arimoto on retained set, sampling without replacement",
        "setSizes": set_sizes,
        "nSims": 150,
        "curves": out_curves,
    }


def build_payload() -> dict[str, Any]:
    return {
        "meta": {
            "source": "reproduction/src/generate_results.py",
            "engine": "Blahut-Arimoto reward-complexity frontier with high->low continuation",
            "note": (
                "Frontiers and the proposal-comparison Monte-Carlo are computed here. The "
                "playable task's own landing point (reader's policy complexity and reward) is "
                "computed in the browser from empirical choices. Human means are digitized "
                "from Fig 5D-H and flagged, not recomputed."
            ),
        },
        "paper": PAPER,
        "symmetricTask": build_symmetric(),
        "experimentTask": build_experiment(),
        "proposalComparison": build_proposal_comparison(),
    }


def main() -> None:
    payload = build_payload()
    out_path = Path(__file__).resolve().parents[2] / "presentation" / "data" / "results.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2) + "\n")

    exp = payload["experimentTask"]
    prop = payload["proposalComparison"]
    print(f"Wrote {out_path}")
    print(
        f"  experiment task: safety V(a)={exp['safetyGeneralValue']} (paper 0.2), "
        f"full frontier {len(exp['full']['complexity'])} pts, "
        f"{len(exp['naFrontiers'])} N_a frontiers"
    )
    print(f"  symmetric task: {len(payload['symmetricTask']['frontiers'])} N_a frontiers")
    # Sanity: at the smallest β (lowest complexity), value should be less suboptimal than flat.
    flat3 = next(c for c in prop["curves"] if c["proposal"] == "flat" and c["na"] == 3)
    value3 = next(c for c in prop["curves"] if c["proposal"] == "value" and c["na"] == 3)
    delta = float(np.mean(np.array(value3["reduction"]) - np.array(flat3["reduction"])))
    print(
        f"  proposal comparison (N_a=3): mean[value - flat reduction] = {delta:+.4f} "
        f"({'value advantage' if delta > 0 else 'no advantage'})"
    )


if __name__ == "__main__":
    main()
