"""Core simulation harness: Task/Agent interfaces and vectorized rollouts.

The design deliberately separates three things the cognitive-modeling literature
usually conflates:

  * an ``Agent``  — the *structure* of a model (how it acts and how it learns).
                    Static: it holds no free parameters, only shape (n_actions).
  * ``params``    — the model's free parameters (learning rate, temperature, ...).
                    Arrays, so we can ``vmap`` over millions of agents at once, or
                    over a whole grid when fitting to / sweeping against data.
  * a ``Task``    — the environment. Its per-episode randomness (which arm is best,
                    where the goal is) lives in the ``TaskState`` pytree, not on the
                    instance, so the instance stays static and jit-friendly.

Everything is expressed as pure functions over ``NamedTuple`` state (JAX pytrees),
so a whole experiment ``jit``-compiles end to end and runs unchanged on CPU locally
or on a single cloud GPU. There are no Python-level loops over trials or agents on
the hot path — trials fold through ``lax.scan``, agents fan out through ``vmap``.
"""

from __future__ import annotations

import functools
from typing import NamedTuple, Protocol

import jax

type Array = jax.Array
type Key = jax.Array


class Task[S](Protocol):
    """An environment. ``S`` is its per-episode state (a pytree NamedTuple)."""

    @property
    def n_actions(self) -> int: ...

    def reset(self, key: Key) -> S: ...

    def step(self, state: S, action: Array, key: Key) -> tuple[S, Array]:
        """Advance one step. Returns ``(next_state, reward)``."""
        ...


class Agent[P, S](Protocol):
    """A model family. ``P`` is its free parameters, ``S`` its internal state."""

    def init_state(self, params: P) -> S: ...

    def act(self, state: S, params: P, key: Key) -> Array:
        """Return a chosen action (an integer array)."""
        ...

    def observe(self, state: S, params: P, action: Array, reward: Array) -> S:
        """Return the updated agent state after seeing ``reward`` for ``action``."""
        ...


class RolloutResult(NamedTuple):
    """One episode's trajectory. After ``simulate`` each field gains a leading
    agent axis, so shapes are ``(n_agents, n_trials)``."""

    actions: Array
    rewards: Array


def _step_trial[P, TS, AS](
    task: Task[TS],
    agent: Agent[P, AS],
    params: P,
    carry: tuple[TS, AS],
    key: Key,
) -> tuple[tuple[TS, AS], RolloutResult]:
    # Pulled out to module scope (rather than a scan-body closure) so it stays
    # independently testable; ``task``/``agent``/``params`` are bound via partial.
    task_state, agent_state = carry
    act_key, step_key = jax.random.split(key)
    action = agent.act(agent_state, params, act_key)
    next_task_state, reward = task.step(task_state, action, step_key)
    next_agent_state = agent.observe(agent_state, params, action, reward)
    return (next_task_state, next_agent_state), RolloutResult(action, reward)


def rollout[P, TS, AS](
    task: Task[TS],
    agent: Agent[P, AS],
    params: P,
    key: Key,
    n_trials: int,
) -> RolloutResult:
    """Run a single agent through ``n_trials`` of ``task``. Pure and jit-able."""
    task_key, run_key = jax.random.split(key)
    init_carry = (task.reset(task_key), agent.init_state(params))
    keys = jax.random.split(run_key, n_trials)
    body = functools.partial(_step_trial, task, agent, params)
    _, trajectory = jax.lax.scan(body, init_carry, keys)
    return trajectory


def simulate[P, TS, AS](
    task: Task[TS],
    agent: Agent[P, AS],
    params: P,
    key: Key,
    n_trials: int,
    n_agents: int,
) -> RolloutResult:
    """Run ``n_agents`` independent agents that share one parameter set.

    This is the Axis-A primitive: crank ``n_agents`` and ``n_trials`` far past a
    paper's original regime to ask whether a reproduced effect is robust or was a
    small-sample artifact. For per-agent parameters (fits, sweeps) use ``sweep``.
    """
    keys = jax.random.split(key, n_agents)
    return jax.vmap(lambda k: rollout(task, agent, params, k, n_trials))(keys)


def sweep[P, TS, AS](
    task: Task[TS],
    agent: Agent[P, AS],
    params_grid: P,
    key: Key,
    n_trials: int,
) -> RolloutResult:
    """Run one agent per parameter set in ``params_grid``.

    ``params_grid`` is a ``params`` pytree whose leaves each carry a leading axis
    of length ``n_points``; ``vmap`` maps over it. This is the Axis-C primitive:
    sweep the prior / inductive-bias parameter the paper claims is load-bearing and
    watch the behavioural signature move.
    """
    leaves = jax.tree_util.tree_leaves(params_grid)
    n_points = leaves[0].shape[0]
    keys = jax.random.split(key, n_points)
    return jax.vmap(lambda p, k: rollout(task, agent, p, k, n_trials))(params_grid, keys)
