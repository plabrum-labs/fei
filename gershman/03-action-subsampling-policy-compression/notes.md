# Notes: Action subsampling supports policy compression in large action spaces

**Liu S, Gershman SJ (2025)**, *PLoS Computational Biology* 21(9): e1013444
[DOI](https://doi.org/10.1371/journal.pcbi.1013444) ·
[code + data](https://github.com/LSZ2001/policycompression_actionconsiderationsets)

## One-line summary

Real decisions face *two* cognitive bottlenecks, not one: how finely you map states to
actions (**policy complexity**, the rate-distortion cost of Lai & Gershman's policy-compression
framework) and how many actions you even bother to consider (**action consideration set size**,
`N_a`). This paper folds the second into the first — you solve a rate-distortion problem over a
*subsampled* action set — and shows (a) via simulation, that sampling actions by their
*general value* is a good heuristic precisely in the regime humans live in (low complexity,
few actions), and (b) via a contextual-bandit experiment with RT-deadline pressure, that
humans trade the two constraints off against each other near-optimally, spontaneously
simplifying the task without being told to.

## Background: policy compression as rate–distortion

The predecessor framework (Lai & Gershman 2024 [24]; Gershman 2020 [21]; ties to lab paper
[[reading_plan]] #02) treats the policy `π(a|s)` as a capacity-limited channel from states to
actions. The cost of a policy is the mutual information

<!-- I(S;A) = Σ_s P(s) Σ_a π(a|s) log[ π(a|s) / P(a) ]  -->

**policy complexity** `I^π(S;A) = Σ_s P(s) Σ_a π(a|s) log[π(a|s)/P(a)]` (Eq 1). A deterministic
state→action map is expensive (high mutual information); a state-independent habit is free
(zero). Under a capacity bound `I^π(S;A) ≤ C`, the reward-maximizing policy is

`π*(a|s) ∝ exp[β Q(s,a) + log P*(a)]` (Eq 2),

with `P*(a) = Σ_s P(s)π*(a|s)` the marginal action distribution and `β` a Lagrange multiplier
set by `C`. Two things to notice:

- The extra `log P*(a)` term (vs. a plain softmax `π ∝ exp[βQ]`) is a **perseveration** bias:
  at low complexity (small `β`) it dominates, pushing all states toward the same
  globally-frequent action. This is the behavioral fingerprint of policy compression that
  plain softmax cannot produce, and the paper replicates it.
- Sweeping `β` and solving Eq 2 to convergence (the **Blahut-Arimoto** algorithm) traces the
  **reward–complexity frontier** `V(I)` — the most reward attainable at each complexity level.
  Its slope is `β⁻¹ = dV/dI` (Eq 10).

The framework's blind spot: it assumes the agent already knows the *entire* action space. That
is fine for 2–4-option lab tasks but false for real, large action spaces — which is the gap
this paper fills.

## The extension: subsample the action space first

Operationalizing an action consideration set is almost trivial in this framework: **drop the
excluded actions' columns from `Q(s,a)` and re-run Blahut-Arimoto.** The resulting frontier
lies below the full-action-space frontier; the vertical gap between them at each complexity
level is the **suboptimality** the agent pays for not considering everything (Fig 2C).

But which actions should enter the set? Enumerating all subsets is infeasible in large spaces,
so the paper studies *heuristics* — an action **proposal distribution** `P_0(a)` from which the
set is sampled, followed by a **downstream algorithm** that builds a policy over the retained
actions.

### The candidate models it compares

| Component | Candidate | What it is |
|---|---|---|
| Proposal `P_0(a)` | **Flat** | `P_0(a) = const` — sample actions uniformly |
| | **General-value** | `P_0(a) ∝ V(a) = Σ_s P(s)Q(s,a)` — favor actions good *on average across states* |
| | **Oracle** | `P_0(a) = P*(a)` — the optimal marginal at that `β` (needs the answer; a benchmark only) |
| Sampling | with / without replacement | replacement changes the resource unit (`n` samples vs. `N_a` distinct actions) |
| Downstream | **BA** | Blahut-Arimoto on the retained set — maximizes reward, *ignores* sampling frequencies, no bias correction |
| | **SNIS** | self-normalized importance sampling (Eq 3) — asymptotically *unbiased* estimate of the full-space `π*`, corrects for `P_0`'s bias |

The general-value heuristic is the empirically documented human tendency (Morris et al. 2021
[7]; Phillips et al. 2019 [19]): people generate options that are good in general, then
evaluate them in context. The paper's job is to say *when that is normatively justified*.

## The simulation results (normative core)

**Symmetric task (Fig 2):** 6 states, 6 actions, `Q` = identity (each state has one unique
+1 action), flat `P(s)`. Exhaustively enumerable. Frontiers for `N_a = 1…6` fan out: larger
`N_a` reaches higher max complexity (`log₂(max(|S|, N_a))` bits) and higher reward; the
suboptimality gap *widens with complexity* and is *mitigated by larger `N_a`* (Fig 2C).

**Random task (Fig 3):** 16 states, 32 actions, random `Q`. The headline dissociation:

- Under **BA** (rows 1 & 3), the **general-value proposal beats flat** at low policy
  complexity and small `N_a`, sitting closer to the oracle — exactly the ecologically relevant
  regime. As complexity or `N_a` grows the advantage fades (state-specific value stops
  correlating with general value).
- Under **SNIS** (row 2), bias correction *erases* the general-value advantage: by design SNIS
  discounts frequently-proposed actions, cancelling the very bias that made general-value
  sampling helpful. It also converges to the full-space policy more *slowly* than BA.

So general-value sampling is adaptive **only conditional on a non-bias-correcting downstream
algorithm (BA)** — a genuinely surprising, falsifiable qualifier. The same pattern holds on a
scarce-reward task (S2/S3) and the experiment task (S4/S5).

**The interplay, stated normatively:**
1. Larger consideration sets *raise the ceiling* on policy complexity → more attainable reward.
2. Larger consideration sets *flatten the suboptimality slope* → each extra bit of complexity
   is "spent" more efficiently.
   Both push the agent to grow `N_a` and `I(S;A)` *together*.

## The human experiment

**Task (Fig 4):** contextual multi-armed bandit. 6 states (fractal images), 7 actions (keys).
Deterministic reward: a **safety action** ("E") pays **+0.2** in every state; each of the other
6 actions is the unique optimal (+1) for exactly one state and pays **−0.18** elsewhere;
missing the RT deadline pays **−1**. Flat `P(s)` (counterbalanced). Because the safety action
has the highest *general* value (0.2 vs. an average of `(1 + 5·(−0.18))/6 ≈ 0.017` for an
unsafe action), rate-distortion says it should absorb all the probability mass at 0 bits — the
`N_a`-specific frontiers (Fig 4D–F) confirm the same complexity×`N_a` interplay the simulations
found.

**Manipulation:** 3 test blocks (96 trials each) with **RT deadlines 0.5 s / 1 s / 2 s** in
random order; 4 unanalyzed training blocks first. 101 recruited → **75 analyzed** (26 excluded
for ≥20 missed deadlines). Policy complexity estimated per block via the Hutter estimator
(Dirichlet prior α = 0.01); `N_a` = number of distinct actions chosen.

**Predictions & results (all supported; LME fixed effects, longer deadline = positive coding):**

| # | Prediction (longer RT deadline →) | Result |
|---|---|---|
| 1 | ↑ policy complexity | `0.762 ± 0.078`, t(223)=9.78, p<10⁻¹⁸ |
| 2 | ↑ trial-averaged reward | `0.249 ± 0.027`, t(223)=9.37, p<10⁻¹⁷ |
| 3 | ↓ P(safety action) | `−0.309 ± 0.033`, t(223)=−9.50, p<10⁻¹⁷ |
| 4 | ↑ complexity → ↑ RT | `0.273 ± 0.010`, t(223)=26.3, p<10⁻⁶⁹ |
| 5 | ↑ number of distinct actions `N_a` | `1.30 ± 0.159`, t(223)=8.19, p<10⁻¹³ |
| 6 | ↑ `N_a` → ↑ RT | `0.0861 ± 0.0067`, t(223)=12.8, p<10⁻²⁷ |

**The two interplay predictions (the paper's most important test):**
- **Reward ~ complexity × `N_a`:** complexity positive (`0.248`, t(221)=11.8, p<10⁻²⁴), and the
  **interaction positive** (`0.0205`, t(221)=6.70, p<10⁻¹⁰) — more actions *amplify* the reward
  return on complexity.
- **Reward-loss ~ complexity × `N_a`:** complexity negative/worsens loss (`−0.276`,
  t(221)=12.4, p<10⁻²⁶), **interaction positive/mitigates** (`0.0571`, t(221)=16.7, p<10⁻⁴⁰) —
  more actions blunt the suboptimality that complexity incurs. Both match the simulation.
- **Correlation of complexity and `N_a`:** `R = 0.671`, p<10⁻³⁰ (VIF 1.82, so not mere
  collinearity). KS tests reject "uniform complexity within the `N_a`-allowed range" for
  `N_a = 2,3,6,7` (p<10⁻⁴) — participants genuinely raise both together.
- **Metacognition:** higher *training* accuracy → higher test complexity (`R = 0.792`,
  p<10⁻¹⁶) and higher `N_a` (`R = 0.327`, p = 0.004).

**A suboptimal cluster:** `N = 13` participants earned ≤0.15 reward (below the 0.2 you'd get by
always pressing safety) despite low complexity and high `N_a` — they lie *off* any
`N_a`-frontier. Re-running everything without them leaves conclusions intact (S1 Appendix).
Authors attribute the cluster to **noisy `Q`-value learning** (S9: adding Gaussian noise to `Q`
reproduces exactly this off-frontier collapse, and can even make *more* actions *hurt*).

## Interpretation

Two cognitive constraints that prior work studied separately (option generation vs. policy
compression) are two knobs on one resource-rational optimization, and humans turn both. The
framework *rationalizes* the general-value sampling bias (good heuristic in the low-complexity,
few-actions regime), *rationalizes* why answers get more correlated across contexts under time
pressure (converging on the high-general-value action = the optimal 0-bit policy, not added
noise), and predicts a synergistic complexity×`N_a` interaction that the human data show
strongly. The negative result on SNIS is a deliberate cautionary tale: an algorithm with a
*better* asymptotic guarantee (unbiasedness) is a *worse* model of adaptive behavior in the
low-sample regime humans occupy.

## Limitations (authors' own)

- The framework explains movement *along* and *deviation from* the frontier, but **not the
  suboptimal cluster** — that needs a process model of noisy `Q`-value learning the framework
  lacks.
- `N_a` (distinct actions chosen) is a coarse readout of the latent consideration set; the
  paper leans on it being a lower bound and shows robustness to counting thresholds (S1).
- No process account of *how* an agent decides to add an action (discrete) vs. sharpen an
  existing mapping (continuous); whether the two constraints share one resource pool or two
  (slot-vs-continuous, as in working memory) is left open.
- Continuous action spaces need discretization not tackled here.

## Relation to the rest of the Gershman backlog

This is the **bridge paper** of the policy-compression cluster. It sits directly on top of
[[reading_plan]] #02 (Lai & Gershman, the rate-distortion foundation) and generalizes it from
small known action spaces to large ones. It is the natural sibling of #04 (**action chunking as
conditional policy compression**) — chunking and subsampling are two different moves for making
a policy cheaper (compose actions vs. prune them), and comparing their frontiers is an obvious
synthesis. It also rhymes with lecture #01 (**strategy reuse / SF&GPI**): both are about
carrying a *small* reusable structure (a policy library there, a general-value proposal here)
instead of recomputing over the full problem — different bargains on the same accuracy–compute
frontier the whole study is organized around. The SNIS-vs-BA result connects to the broader
sampling-as-cognition literature (importance sampling for concept learning, RL, parsing;
[52–55]). The `extensions/massive-action-subsampling-engine/` spec pushes the open scaling
question — can learned proposals stay near-optimal as action spaces grow to billions? — which
the paper motivates but does not test.
