# simharness

A GPU-scalable harness for taking the small-scale simulations in the
cognitive-science / efficient-intelligence literature and running them **far past
their original regime** — more agents, more trials, bigger task families, whole
parameter sweeps — to ask which of their results are robust, which of their
priors are load-bearing, and where the sample-efficiency actually comes from.

This is net-new research tooling, not a per-paper reproduction. The per-paper
reproductions under each lab folder (`gershman/…/reproduction`, etc.) match a
paper's figure at the paper's N. `simharness` is where we go *off the edge* of
that regime.

## Why this is grounded in science, not just "big numbers"

When you push a model past the regime the paper studied, the **human data no
longer exists out there** — so a result at 10⁶ trials is a statement about the
*model*, not about people. We keep the work honest by sorting questions by how
grounded they are:

| Axis | Question | Grounding |
|------|----------|-----------|
| **A** — scale | Does a reproduced effect survive at 10³→10⁶ agents/trials, or was it a small-sample artifact? | Model-space robustness. Label predictions as predictions. |
| **B** — task space | Does a mechanism that matched humans on one toy task still behave sensibly across a *family* of tasks, or was it overfit? | Generalization. |
| **C** — ablation | Strip out the prior / inductive bias the paper says is doing the work, refit to the **real** human data — does the fit degrade? | **Rock-solid.** Stays in the data regime; genuinely falsifiable. |
| **D** — the bridge | Put the small hand-specified model and a scaled neural agent on the *same* task; measure the sample-efficiency gap directly. | The efficiency question itself. |

Axis C is the scientific core: it's the one claim that stays anchored to real
data. Everything else is model-space exploration and should be framed as such.

## The abstraction

Three things the literature usually conflates are kept separate (`core.py`):

- **`Agent`** — the *structure* of a model (how it acts, how it learns). Static.
- **`params`** — its free parameters (learning rate, temperature). Arrays, so we
  `vmap` over millions of agents or a whole fit/sweep grid at once.
- **`Task`** — the environment; per-episode randomness lives in `TaskState`.

Everything is pure functions over JAX pytrees: trials fold through `lax.scan`,
agents fan out through `vmap`, and the whole experiment `jit`-compiles into one
kernel that runs unchanged on a laptop CPU or a single cloud GPU.

```python
from simharness import BernoulliBandit, RescorlaWagner, RWParams, simulate, reward_rate
import jax, jax.numpy as jnp

task, agent = BernoulliBandit(n_actions=10), RescorlaWagner(n_actions=10)
params = RWParams(learning_rate=jnp.asarray(0.2), inverse_temperature=jnp.asarray(4.0))
result = simulate(task, agent, params, jax.random.key(0), n_trials=200, n_agents=1_000_000)
print(reward_rate(result))
```

## Layout

```
src/simharness/
  core.py      # Task/Agent protocols, rollout / simulate (Axis A) / sweep (Axis C)
  tasks.py     # environments — start with bandits, grow toward task distributions (Axis B)
  agents.py    # models — Rescorla-Wagner + softmax to start
  metrics.py   # dependent measures, kept matched to each paper's reported measure
experiments/
  bandit_smoke.py   # runnable proof it's alive and that it scales
tests/
```

## Running

```bash
cd simharness
uv sync
uv run pytest
uv run python experiments/bandit_smoke.py
```

On AWS, swap the JAX wheel for the CUDA build (`uv pip install -U "jax[cuda12]"`);
nothing else changes. Develop locally on CPU with small N, launch a single spot
GPU instance for the large sweeps, tear it down.

## Roadmap

The intended path is **one paper end-to-end, then extract**: reimplement a
paper's model + task here, reproduce its headline effect at its N (correctness
anchor), then exercise Axes A/C/D. The abstractions that repeat across the first
two papers become the real harness; don't over-design them up front.
