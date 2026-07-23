from __future__ import annotations

import jax
import jax.numpy as jnp
from simharness.agents import RescorlaWagner, RWParams
from simharness.core import simulate, sweep
from simharness.metrics import learning_curve
from simharness.tasks import BernoulliBandit


def test_agent_learns_above_chance() -> None:
    bandit = BernoulliBandit(n_actions=4)
    agent = RescorlaWagner(n_actions=4)
    params = RWParams(
        learning_rate=jnp.asarray(0.3, dtype=jnp.float32),
        inverse_temperature=jnp.asarray(5.0, dtype=jnp.float32),
    )
    result = simulate(bandit, agent, params, jax.random.key(0), n_trials=200, n_agents=2_000)
    curve = learning_curve(result)
    early = float(curve[:20].mean())
    late = float(curve[-20:].mean())
    assert late > early + 0.05


def test_sweep_maps_over_param_grid() -> None:
    bandit = BernoulliBandit(n_actions=4)
    agent = RescorlaWagner(n_actions=4)
    grid = RWParams(
        learning_rate=jnp.linspace(0.05, 0.9, 8, dtype=jnp.float32),
        inverse_temperature=jnp.full((8,), 5.0, dtype=jnp.float32),
    )
    result = sweep(bandit, agent, grid, jax.random.key(0), n_trials=200)
    assert result.rewards.shape == (8, 200)
