"""Reference agents. The Rescorla-Wagner + softmax learner is the workhorse of
the reward-learning literature these papers sit in: two interpretable parameters,
yet it fits a huge range of human and animal choice data."""

from __future__ import annotations

from dataclasses import dataclass
from typing import NamedTuple

import jax
import jax.numpy as jnp

from simharness.core import Array, Key


class RWParams(NamedTuple):
    learning_rate: Array  # scalar in [0, 1]
    inverse_temperature: Array  # scalar >= 0; higher = greedier softmax


class RWState(NamedTuple):
    q: Array  # (n_actions,) action-value estimates


@dataclass(frozen=True)
class RescorlaWagner:
    """Incremental value learning with a softmax choice rule.

    ``q <- q + lr * (reward - q)`` on the chosen action; choice is
    ``softmax(inverse_temperature * q)``.
    """

    n_actions: int

    def init_state(self, params: RWParams) -> RWState:
        return RWState(q=jnp.zeros(self.n_actions))

    def act(self, state: RWState, params: RWParams, key: Key) -> Array:
        return jax.random.categorical(key, params.inverse_temperature * state.q)

    def observe(self, state: RWState, params: RWParams, action: Array, reward: Array) -> RWState:
        prediction_error = reward - state.q[action]
        q = state.q.at[action].add(params.learning_rate * prediction_error)
        return RWState(q=q)
