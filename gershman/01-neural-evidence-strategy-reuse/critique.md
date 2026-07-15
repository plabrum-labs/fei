# Skeptical critique: Neural evidence that humans reuse strategies

**Hall-McMaster, Tomov, Gershman & Schuck (2025)**, *PLoS Biology* 23(6): e3003174

A reviewer's-eye critique to sit beside `notes.md` (the neutral summary). Grounded in the
paper's own methods and numbers. Feeds the article's §7 (*Cracks and alternatives*) and the
first-person `reflection.md`.

**One-line verdict:** the behavioral result is clean but modest, and the neural headline is
carried by the one region whose involvement is easiest to explain away. Careful, candid work
— the complaint is with the *confidence* of the interpretation, not the rigor of execution.

## The critiques, roughly in order of how much they bite

### 1. The neural story leans on visual cortex, and the authors half-concede it's attention
The a priori prediction was DLPFC (policy encoding). But DLPFC underperforms on every
downstream test: weaker activation (25.9% vs OTC's 28.1% against 25% chance), it *does not
survive the choice-control analysis*, and it has no brain–behavior correlation (ρ = 0.115,
n.s.). The result is carried by **OTC — early visual cortex** — which the authors call
"surprising." The parsimonious reading of "the good familiar option is decoded more strongly
in visual cortex during the response screen" is *selective attention to the option you're
about to pick*, not reactivation of an abstract policy. Their own section is titled
"Reactivation **and stimulus processing** contributed to the decoding effects." The rescue —
OTC carries the signal ~3.75 s *earlier* on test than the training baseline, implying
pre-response reactivation — is a timing inference from a sluggish hemodynamic signal across
two conditions (feedback vs no-feedback) that plausibly have different HRF latencies. A
delicate hook for the headline.

### 2. The "no feature reactivation" null is probably underpowered by construction
The clean story — "whole policies return, their features don't" — is what separates *compact
policy reuse* from a *feature-based partial model*, so the null does real theoretical work.
But the policy decoder is trained **in-task** (4 classes, chance 25%, on the actual gem-game
feedback screens), while the feature decoder is trained on a **separate associative-memory
paradigm** (12 classes, chance 8.3%) and transferred in — and it *failed even on its own
held-out data in MTL*. That is a strong instrument vs a weak, out-of-domain one, not an
apples-to-apples dissociation. And OTC features were numerically *above* chance (8.71% vs
8.33%, uncorrected p ≈ .05), just killed by correction. "Features aren't represented" and
"our feature decoder couldn't see them" are not distinguishable here.

### 3. It can't separate SF&GPI from noisy-memory model-based — and its own data point that way
The paper only rules out *full-model, low-noise* MB. Their post-scan result is the tell:
participants with **worse memory for the suboptimal cities' features reused more**
(ρ = 0.493, p = .016). That is exactly what "model-based computation running on forgotten
inputs falls back to cached solutions" predicts. So "reuse, not recomputation" may
substantially be "recomputation with degraded inputs," and the design cannot adjudicate.

### 4. The efficiency rationale doesn't actually apply to this experiment
Reuse is supposed to be resource-rational because recomputing is expensive. Here
recomputation was *trivially cheap*: four dot products with every number visible on screen,
and the stakes were tiny (objective-best beat best-reuse by only 10–20 points on trials
averaging ~147). When computing is nearly free and the penalty for not computing is ~10%,
"people reuse anyway" reads less like an efficient shortcut and more like familiarity bias,
risk aversion, or plain memory noise. The compute-saving interpretation needs a regime where
recomputation actually costs something — which this isn't. (This is a direct tension with the
lecture's closing efficient-intelligence framing, and worth making explicit in §7.)

### 5. "SF&GPI" oversells what was tested
Single-step ⇒ successor features collapse to immediate features, so the *successor* part —
the predictive, multi-step core of the SR lineage — is **untested**. And the policy library
has exactly **two** experimenter-installed, drilled members, so "generalized policy
improvement" here is "pick the better of the two things that worked." The grand framing is
imported theory; the demonstrated computation is policy reuse over a hand-built pair.

### 6. Small n for the claims that matter most
The functional-relevance linchpins are single correlations at **n = 38** (OTC↔reuse
ρ = 0.447; OTC↔MB-choice ρ = −0.375) — the estimates recent work (Marek et al. 2022) shows
are unstable at this sample size, with wide CIs. And the decoding effect sizes are small: a
~3-point activation bump over chance, ~1–4 points for "prioritization" (OFC's is 0.97%).

### 7. Generalizability
The title is about "solving new tasks"; the task is a 1-step linear bandit over 4 options
with 3 features. The interesting regime — many stored policies, genuinely costly
recomputation, sequential structure — is untouched.

## What is genuinely solid (in fairness)

- The behavioral dissociation is clever and tight. The **92.9% "picked the better of the two
  reused"** is a real control — pure perseveration (model-free) cannot produce reward-sensitive
  selection *within* the reused set, and they show the model-free account fails directly.
- Cross-block shuffling of the city↔feature mapping defends against the crudest visual confound.
- A priori ROIs and predictions; multiple-comparison correction; pipeline parameters chosen on
  held-out data; choice-control analyses; cluster-based permutation for timing.
- Candid limitations section (single-step; small gap). Open data and code.

## Bottom line

Believe **"people reuse previously-good policies in a reward-sensitive way, and it isn't
habit"** — well supported. Hold **"the brain reactivates stored policies in visual cortex as
an efficient alternative to recomputation"** at arm's length: the region is suspicious, the
key null is likely underpowered, the efficiency framing doesn't fit a task where computing was
free, and a noisy-memory model-based account survives — one the paper's own memory correlation
quietly supports. The multi-step, costly-recomputation, many-policy version of this experiment
is the one that would actually earn the title.
