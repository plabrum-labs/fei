"""simharness — a GPU-scalable harness for stress-testing the small-scale
simulations in the cognitive-science / efficient-intelligence literature."""

from simharness.agents import RescorlaWagner, RWParams, RWState
from simharness.core import (
    Agent,
    RolloutResult,
    Task,
    rollout,
    simulate,
    sweep,
)
from simharness.metrics import learning_curve, reward_rate
from simharness.tasks import BanditState, BernoulliBandit

__all__ = [
    "Agent",
    "BanditState",
    "BernoulliBandit",
    "RWParams",
    "RWState",
    "RescorlaWagner",
    "RolloutResult",
    "Task",
    "learning_curve",
    "reward_rate",
    "rollout",
    "simulate",
    "sweep",
]
