"""Smoke experiment: demonstrate the harness is alive and that it scales.

Runs the Rescorla-Wagner learner on a 10-armed bandit at increasing agent counts,
times each (the whole thing is one jit-compiled kernel), and saves the learning
curve for the largest run. This is the Axis-A skeleton: the same call runs at 1e3
agents on a laptop and 1e6+ on a GPU with no code change.

    uv run python experiments/bandit_smoke.py
"""

from __future__ import annotations

import time
from pathlib import Path

import jax
import jax.numpy as jnp
import matplotlib.pyplot as plt
from simharness.agents import RescorlaWagner, RWParams
from simharness.core import simulate
from simharness.metrics import learning_curve, reward_rate
from simharness.tasks import BernoulliBandit

N_ACTIONS = 10
N_TRIALS = 200
AGENT_COUNTS = (1_000, 50_000, 500_000)


def main() -> None:
    bandit = BernoulliBandit(n_actions=N_ACTIONS)
    agent = RescorlaWagner(n_actions=N_ACTIONS)
    params = RWParams(
        learning_rate=jnp.asarray(0.2, dtype=jnp.float32),
        inverse_temperature=jnp.asarray(4.0, dtype=jnp.float32),
    )
    sim = jax.jit(simulate, static_argnames=("task", "agent", "n_trials", "n_agents"))

    print(f"device: {jax.devices()[0].platform}")
    result = None
    for n_agents in AGENT_COUNTS:
        key = jax.random.key(0)
        start = time.perf_counter()
        result = sim(bandit, agent, params, key, n_trials=N_TRIALS, n_agents=n_agents)
        result.rewards.block_until_ready()
        elapsed = time.perf_counter() - start
        steps = n_agents * N_TRIALS
        print(
            f"{n_agents:>9,} agents | reward_rate={float(reward_rate(result)):.3f} "
            f"| {elapsed:6.2f}s | {steps / elapsed / 1e6:8.1f}M env-steps/s"
        )

    assert result is not None
    curve = learning_curve(result)
    out = Path(__file__).parent / "bandit_learning_curve.png"
    plt.figure(figsize=(6, 4))
    plt.plot(curve)
    plt.xlabel("trial")
    plt.ylabel("mean reward")
    plt.title(f"Rescorla-Wagner on {N_ACTIONS}-armed bandit ({AGENT_COUNTS[-1]:,} agents)")
    plt.tight_layout()
    plt.savefig(out, dpi=120)
    print(f"saved {out}")


if __name__ == "__main__":
    main()
