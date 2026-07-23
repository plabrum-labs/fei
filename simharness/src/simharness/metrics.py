"""Dependent measures. Keep these matched to the *paper's own* reported measure
so that scaling up stays comparable to the original figure."""

from __future__ import annotations

from simharness.core import Array, RolloutResult


def reward_rate(result: RolloutResult) -> Array:
    """Mean reward per trial, averaged over agents and trials (a scalar)."""
    return result.rewards.mean()


def learning_curve(result: RolloutResult) -> Array:
    """Mean reward at each trial, averaged over agents. Shape ``(n_trials,)``."""
    return result.rewards.mean(axis=0)
