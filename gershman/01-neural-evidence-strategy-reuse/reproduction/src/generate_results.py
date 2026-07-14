"""Aggregate the gem-collector simulation into presentation/data/results.json.

Imports the pure simulation functions from ``simulate.py`` (which is left unchanged),
runs the Monte-Carlo across ``N_SUBJECTS`` synthetic participants, and emits the
per-city test-choice profiles and headline statistics the frontend renders.

This file is the single "simulation that was run" handoff described in
``docs/ARCHITECTURE.md``: the reproduction writes one JSON file, the presentation reads
it, and nothing crosses the folder boundary in code. Regenerate with::

    uv run python src/generate_results.py

The randomized-feature Monte-Carlo here is the *aggregate* view (100 subjects, random
gem compositions). The interactive widgets in the article instead use the paper's four
canonical training/test weight vectors so a reader can see one concrete dissociation;
both share the same three decision rules, so the qualitative ordering agrees.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from simulate import (
    N_CITIES,
    N_SUBJECTS,
    SF_GPI_LAPSE_PROB,
    SOFTMAX_BETA,
    TRAIN_OPTIMAL,
    TestResults,
    run_subject,
    summarize,
)

AGENTS: tuple[str, ...] = ("mf", "mb", "sfgpi")
AGENT_LABELS: dict[str, str] = {
    "mf": "Model-free",
    "mb": "Model-based",
    "sfgpi": "SF&GPI",
}

# Behavioral headline numbers reported by Hall-McMaster et al. (2025), PLoS Biology.
PAPER: dict[str, float] = {
    "trainOptimal": 82.9,
    "reuse": 68.8,
    "correctWithinReuse": 92.9,
}


def r1(x: float) -> float:
    """Round to one decimal place as a plain float (keeps the JSON compact)."""
    return round(float(x), 1)


def city_profiles(all_results: list[TestResults]) -> dict[str, list[float]]:
    """For each agent, the percentage of test choices that landed on each city.

    City indices are stable across subjects even though gem features are randomized:
    ``run_subject`` always samples weights so cities ``{0, 3}`` are the training-optimal
    (reusable) set and ``{1, 2}`` become the objectively-best set at test.
    """
    profiles: dict[str, list[float]] = {}
    for agent in AGENTS:
        counts = np.zeros(N_CITIES)
        for subject in all_results:
            for choice, _ in subject[agent]:
                counts[choice] += 1
        profiles[agent] = [r1(v) for v in 100 * counts / counts.sum()]
    return profiles


def human_profile() -> list[float]:
    """Reconstruct the human per-city choice split from the paper's reported reuse rate.

    Only the aggregate 68.8% reuse rate is measured; the per-city breakdown is inferred
    from the task's built-in symmetry (two test tasks make city 1 the better reused
    option, two make city 4), so the reuse mass splits evenly across {city 1, city 4}
    and the remainder across {city 2, city 3}. Flagged ``reconstructed`` in the output.
    """
    reuse_each = PAPER["reuse"] / 2
    other_each = (100 - PAPER["reuse"]) / 2
    return [r1(reuse_each if i in TRAIN_OPTIMAL else other_each) for i in range(N_CITIES)]


def build_payload() -> dict[str, object]:
    rng = np.random.default_rng(0)  # same seed/order as simulate.main → identical numbers
    train_optimal_rates: list[float] = []
    all_results: list[TestResults] = []
    for _ in range(N_SUBJECTS):
        rate, test_results = run_subject(rng)
        train_optimal_rates.append(rate)
        all_results.append(test_results)

    stats = summarize(all_results)
    profiles = city_profiles(all_results)

    agents = {
        agent: {
            "label": AGENT_LABELS[agent],
            "reuse": r1(stats[agent]["reuse_rate"]),
            "correctWithinReuse": r1(stats[agent]["correct_within_reuse_rate"]),
            "cityProfile": profiles[agent],
        }
        for agent in AGENTS
    }

    return {
        "meta": {
            "nSubjects": N_SUBJECTS,
            "beta": SOFTMAX_BETA,
            "lapse": SF_GPI_LAPSE_PROB,
            "seed": 0,
            "source": "reproduction/src/generate_results.py",
            "note": (
                "Per-city profiles are choice frequencies from a 100-subject Monte-Carlo "
                "over randomized gem features; cities are 1-indexed in the UI (index 0 = "
                "city 1). Human bars are reconstructed from the paper's reported aggregate "
                "reuse rate under the task's city-1/city-4 symmetry."
            ),
        },
        "reuseSet": sorted(TRAIN_OPTIMAL),
        "mbOptimalSet": [i for i in range(N_CITIES) if i not in TRAIN_OPTIMAL],
        "paper": PAPER,
        "trainOptimalSim": r1(100 * float(np.mean(train_optimal_rates))),
        "agents": agents,
        "human": {
            "label": "Human (paper)",
            "reuse": PAPER["reuse"],
            "correctWithinReuse": PAPER["correctWithinReuse"],
            "cityProfile": human_profile(),
            "reconstructed": True,
        },
    }


def main() -> None:
    payload = build_payload()
    out_path = Path(__file__).resolve().parents[2] / "presentation" / "data" / "results.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2) + "\n")

    agents = payload["agents"]
    assert isinstance(agents, dict)
    print(f"Wrote {out_path}")
    print(f"  train-optimal (sim): {payload['trainOptimalSim']}%  (paper {PAPER['trainOptimal']}%)")
    for agent in AGENTS:
        a = agents[agent]
        print(
            f"  {a['label']:<12} reuse {a['reuse']:>5}%   "
            f"correct-within-reuse {a['correctWithinReuse']:>5}%"
        )
    print(
        f"  paper reference: reuse {PAPER['reuse']}%   "
        f"correct-within-reuse {PAPER['correctWithinReuse']}%"
    )


if __name__ == "__main__":
    main()
