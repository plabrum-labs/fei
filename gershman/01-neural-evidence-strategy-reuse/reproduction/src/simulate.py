"""Behavioral simulation of the "gem collector" task (Hall-McMaster et al. 2025).

Reproduces the core logic used to discriminate model-free (MF), model-based (MB),
and successor-features + generalized policy improvement (SF&GPI) strategies, and
prints simulated results analogous to the paper's key findings:
  - 82.9% optimal choices during training
  - 68.8% test-phase choices within the previously-optimal policy set {city 1, city 4}
  - 92.9% correct choice among reused policies

Scope: behavioral simulation only, no neural/fMRI decoding mock-up.
"""

from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
import numpy.typing as npt

FloatArray = npt.NDArray[np.float64]
Generator = np.random.Generator

RNG: Generator = np.random.default_rng(0)

N_CITIES = 4
N_GEMS = 3
N_SUBJECTS = 100
N_TRAIN_TRIALS = 20
N_TEST_TRIALS = 4
SOFTMAX_BETA = 3.0
SF_GPI_LAPSE_PROB = 0.32

TRAIN_OPTIMAL = {0, 3}  # cities 1 and 4 (0-indexed)
TEST_OPTIMAL = {1, 2}  # cities 2 and 3 (0-indexed)

TestChoice = tuple[int, FloatArray]
TestResults = dict[str, list[TestChoice]]
AgentStats = dict[str, float]


def make_city_features(rng: Generator) -> FloatArray:
    """Fixed per-block gem-composition feature vectors phi(city, gem)."""
    return rng.integers(0, 5, size=(N_CITIES, N_GEMS)).astype(float)


def make_weights_for_target(
    rng: Generator,
    phi: FloatArray,
    target_best: set[int],
    margin: float = 0.2,
    max_tries: int = 200_000,
) -> FloatArray:
    """Sample a reward-weight vector w such that the two `target_best` cities
    score strictly higher than the other two, by at least `margin`."""
    others = [c for c in range(N_CITIES) if c not in target_best]
    best_margin = -np.inf
    best_w: FloatArray | None = None
    for _ in range(max_tries):
        w = rng.uniform(-2, 2, size=N_GEMS)
        values = phi @ w
        best_vals = sorted(values[list(target_best)])
        other_vals = sorted(values[others], reverse=True)
        gap = best_vals[0] - other_vals[0]
        if gap > best_margin:
            best_margin, best_w = gap, w
        if gap > margin:
            return w
    if best_margin > 0 and best_w is not None:
        return best_w
    raise RuntimeError("failed to sample weight vector satisfying target ordering")


def softmax_choice(
    rng: Generator,
    values: FloatArray,
    candidates: list[int],
    beta: float = SOFTMAX_BETA,
) -> int:
    vals = np.array([values[c] for c in candidates])
    vals = vals - vals.max()
    probs = np.exp(beta * vals)
    probs /= probs.sum()
    return int(rng.choice(candidates, p=probs))


def model_based_agent(
    rng: Generator,
    phi: FloatArray,
    w: FloatArray,
    candidates: list[int] | None = None,
) -> int:
    candidates = candidates if candidates is not None else list(range(N_CITIES))
    values = phi @ w
    return softmax_choice(rng, values, candidates)


def model_free_agent(
    rng: Generator,
    avg_train_reward: FloatArray,
    candidates: list[int] | None = None,
) -> int:
    """Ignores current w; perseverates on cached average training reward per city."""
    candidates = candidates if candidates is not None else list(range(N_CITIES))
    return softmax_choice(rng, avg_train_reward, candidates)


def sf_gpi_agent(
    rng: Generator,
    phi: FloatArray,
    w: FloatArray,
    policy_library: set[int],
    lapse_prob: float = SF_GPI_LAPSE_PROB,
) -> int:
    """Evaluates candidates restricted to the policy library learned during
    training (generalized policy improvement over the two learned policies).
    On a fraction of trials (`lapse_prob`) the agent instead explores outside
    the library and evaluates all cities, capturing the trial-to-trial mixture
    of strategies seen in real behavior rather than perfect deterministic reuse."""
    values = phi @ w
    if rng.random() < lapse_prob:
        return softmax_choice(rng, values, list(range(N_CITIES)))
    return softmax_choice(rng, values, list(policy_library))


def run_subject(rng: Generator) -> tuple[float, TestResults]:
    while True:
        phi = make_city_features(rng)
        try:
            w_train = make_weights_for_target(rng, phi, TRAIN_OPTIMAL)
            w_test = make_weights_for_target(rng, phi, TEST_OPTIMAL)
        except RuntimeError:
            continue
        break

    train_values = phi @ w_train
    train_choices_list = [
        softmax_choice(rng, train_values, list(range(N_CITIES))) for _ in range(N_TRAIN_TRIALS)
    ]
    train_choices = np.array(train_choices_list)
    train_optimal_rate = float(np.mean([c in TRAIN_OPTIMAL for c in train_choices]))

    avg_train_reward = np.zeros(N_CITIES)
    for c in range(N_CITIES):
        seen = train_choices == c
        avg_train_reward[c] = train_values[c] if seen.any() else train_values.mean()

    policy_library = TRAIN_OPTIMAL

    test_results: TestResults = {"mf": [], "mb": [], "sfgpi": []}
    for _ in range(N_TEST_TRIALS):
        test_values = phi @ w_test

        mf_choice = model_free_agent(rng, avg_train_reward)
        mb_choice = model_based_agent(rng, phi, w_test)
        sfgpi_choice = sf_gpi_agent(rng, phi, w_test, policy_library)

        test_results["mf"].append((mf_choice, test_values))
        test_results["mb"].append((mb_choice, test_values))
        test_results["sfgpi"].append((sfgpi_choice, test_values))

    return train_optimal_rate, test_results


def summarize(all_results: list[TestResults]) -> dict[str, AgentStats]:
    stats: dict[str, AgentStats] = {}
    for agent in ("mf", "mb", "sfgpi"):
        reuse_flags: list[bool] = []
        correct_within_reuse: list[bool] = []
        for subject_results in all_results:
            for choice, test_values in subject_results[agent]:
                reused = choice in TRAIN_OPTIMAL
                reuse_flags.append(reused)
                if reused:
                    other = (TRAIN_OPTIMAL - {choice}).pop()
                    correct_within_reuse.append(test_values[choice] > test_values[other])
        correct_rate = 100 * np.mean(correct_within_reuse) if correct_within_reuse else float("nan")
        stats[agent] = {
            "reuse_rate": 100 * np.mean(reuse_flags),
            "correct_within_reuse_rate": correct_rate,
        }
    return stats


def main() -> None:
    train_optimal_rates: list[float] = []
    all_results: list[TestResults] = []
    for _ in range(N_SUBJECTS):
        rate, test_results = run_subject(RNG)
        train_optimal_rates.append(rate)
        all_results.append(test_results)

    stats = summarize(all_results)

    print("=== Training phase ===")
    print(
        f"Mean % optimal choices during training: {100 * np.mean(train_optimal_rates):.1f}% "
        f"(paper: 82.9%, chance: 50%)"
    )
    print()
    print("=== Test phase: % choices within previously-optimal set {city 1, city 4} ===")
    print(f"SF&GPI: {stats['sfgpi']['reuse_rate']:.1f}%  (paper: 68.8%, chance: 50%)")
    print(f"MB:     {stats['mb']['reuse_rate']:.1f}%")
    print(f"MF:     {stats['mf']['reuse_rate']:.1f}%")
    print()
    print("=== Of choices within the reused set, % choosing the more-rewarding city ===")
    print(f"SF&GPI: {stats['sfgpi']['correct_within_reuse_rate']:.1f}%  (paper: 92.9%)")
    print(f"MB:     {stats['mb']['correct_within_reuse_rate']:.1f}%")
    print(f"MF:     {stats['mf']['correct_within_reuse_rate']:.1f}%")

    fig, ax = plt.subplots(figsize=(6, 5))
    agents = ["MF", "MB", "SF&GPI"]
    reuse_rates = [
        stats["mf"]["reuse_rate"],
        stats["mb"]["reuse_rate"],
        stats["sfgpi"]["reuse_rate"],
    ]
    bars = ax.bar(agents, reuse_rates, color=["#888888", "#4C72B0", "#55A868"])
    ax.axhline(50, linestyle="--", color="black", linewidth=1, label="Chance (50%)")
    ax.axhline(68.8, linestyle=":", color="red", linewidth=1.5, label="Paper observed (68.8%)")
    ax.set_ylabel("% test choices within previously-optimal set")
    ax.set_ylim(0, 100)
    ax.set_title("Simulated policy reuse at test, by strategy")
    ax.legend()
    for bar, rate in zip(bars, reuse_rates, strict=True):
        ax.text(bar.get_x() + bar.get_width() / 2, rate + 2, f"{rate:.1f}%", ha="center")

    fig.tight_layout()
    out_path = __file__.rsplit("/", 1)[0] + "/results.png"
    fig.savefig(out_path, dpi=150)
    print(f"\nSaved plot to {out_path}")


if __name__ == "__main__":
    main()
