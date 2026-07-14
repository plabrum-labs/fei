# Notes: Neural evidence that humans reuse strategies to solve new tasks

**Hall-McMaster, Tomov, Gershman, Schuck (2025)**, *PLoS Biology* 23(6): e3003174
[DOI](https://doi.org/10.1371/journal.pbio.3003174)

## One-line summary

Humans solving novel tasks don't recompute optimal behavior from scratch (model-based) or default to habit (model-free) — they reuse whole solutions ("policies") learned on earlier, related tasks, weighing them by expected reward. This reuse strategy — **successor features + generalized policy improvement (SF&GPI)** — is detectable not just in behavior but in fMRI activity in occipitotemporal cortex (OTC) and dorsolateral prefrontal cortex (DLPFC).

## Background: the three candidate strategies

| Strategy | How it generalizes | Cost |
|---|---|---|
| **Model-free (MF)** | Perseverate on cached action values; no real transfer | Cheap, inflexible |
| **Model-based (MB), full model** | Recompute expected reward for every option from a complete model of the environment | Expensive, optimal |
| **SF&GPI** | Store a small set of past *policies* (solutions); at decision time, evaluate only those stored policies against the new reward function and pick the best one | Cheap-ish, near-optimal when good policies are already in the library |

**Generalized policy improvement (GPI):** given a library of policies π₁...πₙ (each optimal for some past task), and a new reward function, evaluate each stored policy under the new reward and pick the best-performing one. **Successor features (SF)** make this evaluation efficient: instead of storing values, you store a decomposition where state/action "features" (φ) are separated from the reward weights (w) that turn features into rewards (reward = φ·w). This lets you cheaply re-score old policies against new reward weights without relearning anything.

Key distinction the paper hinges on: SF&GPI only reuses **whole policies that were optimal during training**. A full model-based agent recomputes from the environment model and can select policies that were *never* optimal before.

## Task design ("gem collector" game)

- Cover story: sell gems found in 4 cities (Sydney, Tokyo, NY, London) at fluctuating market prices.
- Each trial: see market values (reward weights **w**, range −$2 to $2/gem) for 3 gem shapes → choose one of 4 cities → profit = Σ(gem count in city × market price).
- Each city has a fixed, block-specific gem composition (state features **φ**) — this is the reusable "environment structure."
- **Training tasks (4 per block, with feedback):** reward weights designed so 2 of the 4 cities are optimal across all training tasks (φ(1) and φ(4) win; φ(2)/φ(3) cities are always suboptimal/losing).
- **Test tasks (4 per block, no feedback):** new reward weights (never seen) that flip the ranking — φ(2)/φ(3) cities are now the *actually* best choices, while φ(1)/φ(4) remain merely "good options from training."
- This design cleanly separates the two hypotheses:
  - **Full MB agent** → switches to the objectively best city (φ(2) or φ(3)) on test.
  - **SF&GPI agent** → keeps choosing among the previously-optimal cities (φ(1)/φ(4)), just picking whichever of those two is more rewarding under the new weights.
- 38 participants (fMRI), 6 blocks × 68 trials, real monetary bonus tied to performance.

## Behavioral results

- Training: participants learned near-optimal policies (82.9% optimal choices, far above chance).
- Test: **68.8%** of choices stayed within the two previously-optimal policies (chance = 50%), and among those, the more-rewarding one was picked 92.9% of the time — classic SF&GPI signature, not MB (which predicts switching away from old policies).
- Not explainable by simple model-free perseveration (ruled out via supplementary analysis).
- Individual differences: ~half of participants showed full SF&GPI recapitulation, half partial — plus hints of an additional strategy (Universal Value Function Approximator / UVFA-like generalization via task-cue similarity) on one specific test task.
- Suggestive link: worse memory for gem counts in the *suboptimal* training cities correlated with *more* SF&GPI-consistent reuse — consistent with reuse being partly a fallback when the full environment model is remembered noisily.

## Neural results (fMRI decoding)

Three predictions tested in 4 ROIs (OTC, DLPFC, MTL, OFC), via logistic-regression decoders trained on which city was chosen during training feedback, then applied to test-trial time courses:

1. **Activation** — are old optimal policies reactivated when a new task appears?
   - Yes, significantly, in **OTC** and **DLPFC** (not MTL/OFC).
2. **Prioritization** — are they favored over the objectively-best (never-reinforced) policy?
   - Yes in OTC (strongest), DLPFC, and OFC — old, previously-successful policies were decoded *more strongly* than the truly optimal but untrained option.
3. **Feature reactivation** — are the underlying state features (φ) of those policies also represented?
   - **No** — features could not be decoded above chance in any ROI. Only whole policies, not their component features, showed evidence of reuse.

Timing (cluster-based permutation tests): OTC showed policy decoding evidence from ~5s after cue onset (and even earlier — at response-phase onset — implying reactivation before the response screen even appeared, not purely stimulus-driven attention). DLPFC evidence emerged later (~8.75s), more consistent with attention/selection at response time than early memory reactivation.

**Brain-behavior link:** the strength of OTC decoding for the more-rewarding training policy correlated with how often that participant actually reused it at test (Spearman ρ=0.45). No such correlation for DLPFC. OTC decoding also negatively correlated with MB-optimal choice — i.e., more OTC "reuse signal" → less model-based behavior.

## Interpretation

- **OTC** (visual cortex) — surprising region for this kind of finding, but reactivation there resembles work linking OTC replay to successor-representation formation. May reflect visual expectation/attention biased by reward history.
- **DLPFC** — consistent with its known role in policy encoding / context-dependent action; interpreted as generalizing "which response mapping applies" to novel-but-structurally-similar contexts.
- **MTL/OFC** — predicted (as predictive-map regions) to carry feature information but showed nothing; authors discuss possible methodological reasons (localizer-to-task decoder transfer was weaker) rather than concluding the theory is wrong here.
- A pure MB account is rejected because participants systematically failed to switch to the objectively best (but never-reinforced) option, even though it was clearly signaled and only slightly better in absolute reward.
- A heuristic ("just chase the single best-reward-weight feature") is also rejected because it wouldn't predict decoding of the *less*-rewarding of the two training policies, which was observed in OTC.

## Limitations (authors' own)

- Single-step task → can't distinguish SF&GPI (multi-step successor features) from a partial-model MB account; also can't distinguish "compact policy reuse" from "MB with noisy/partial memory."
- The gap between the objectively-best option and the more-rewarding trained option was small (10–20 points) — reuse might look different if the incentive to fully recompute were larger (ties into meta-control / effort-based arbitration literature).
- No feature decoding could reflect either "features truly weren't used" or a decoder-transfer sensitivity issue (localizer task ≠ main task neural patterns).

## Why this matters for the study (Gershman / efficient intelligence framing)

This is a clean empirical case for **policy-level reuse as a resource-rational shortcut**: instead of a full internal-model computation (expensive, always-optimal) or pure caching (cheap, inflexible), the brain appears to maintain a small library of past solutions and cheaply re-rank them — the SF&GPI compromise. Directly motivates later readings on successor representations/key-value memory and world models (Friston/Hafner) as alternative points on the same accuracy/cost tradeoff curve.
