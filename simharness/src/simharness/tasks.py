"""Reference tasks. Start small (bandits) and grow the family toward the
parameterized task *distributions* that Axis-B generalization tests need."""

from __future__ import annotations

from dataclasses import dataclass
from typing import NamedTuple

import jax
import jax.numpy as jnp

from simharness.core import Array, Key


class BanditState(NamedTuple):
    reward_prob: Array  # (n_actions,) success probability of each arm


@dataclass(frozen=True)
class BernoulliBandit:
    """A stationary k-armed Bernoulli bandit. Arm probabilities are drawn i.i.d.
    uniform at ``reset``, so every agent (or episode) faces a fresh problem."""

    n_actions: int

    def reset(self, key: Key) -> BanditState:
        return BanditState(reward_prob=jax.random.uniform(key, (self.n_actions,)))

    def step(self, state: BanditState, action: Array, key: Key) -> tuple[BanditState, Array]:
        reward = (jax.random.uniform(key) < state.reward_prob[action]).astype(jnp.float32)
        return state, reward
