# Notes: Action subsampling supports policy compression in large action spaces

**Liu S, Gershman SJ (2025)**, *PLoS Computational Biology* 21(9): e1013444
[DOI](https://doi.org/10.1371/journal.pcbi.1013444)

> Scaffold. Fill these in from `paper.md` (marker conversion, figures in `paper_assets/`)
> before building the lecture. Keep this neutral/expository; put opinions in `critique.md`
> and `presentation/reflection.md`.

## One-line summary

<!-- What is the core claim in one sentence? Roughly: agents with limited policy-encoding
capacity handle large action spaces by considering only a subsampled subset of actions at
decision time, and the optimal subsample size trades off compression cost against reward. -->

## Background: policy compression & the information bottleneck

<!-- Ties to lab paper #02 (policy-compression / information-bottleneck). Define the
rate–distortion setup: bounded channel capacity on the policy, reward as distortion.
Why large action spaces make the naive policy expensive to encode. -->

## The action-subsampling model

<!-- Formal setup: at each state, sample a consideration set of k actions, then act
(softmax?) within it. What is optimized, and how does k interact with the capacity
constraint C? State-independent vs state-dependent proposal distributions. -->

## Key predictions

<!-- What does the model predict about consideration-set size vs action-space size,
reward, and capacity? Any phase-transition / scaling behavior claimed? -->

## Experiments / evidence

<!-- Human behavioral experiments? Simulations? List each, its design, and the specific
numbers the paper reports (effect sizes, fitted k, model comparison). -->

## Figures

<!-- Reference the extracted figures in paper_assets/ once conversion finishes. -->

## Relation to the rest of the Gershman backlog

<!-- #02 policy compression, #04 action chunking — how does subsampling relate? See the
[[reading_plan]]. The massive-simulation extension lives in
extensions/massive-action-subsampling-engine/spec.md. -->
