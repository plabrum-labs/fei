# Reflection

*First-person notes — my own read on the paper, kept separate from the neutral article.
Prompts below are scaffolding; replace them with the real thing after sitting with the
paper and building the lecture.*

## What surprised me

<!-- The OTC localization is the obvious candidate. Why did a reused *policy* signal show
up in visual cortex before the response screen even appeared? What did I actually expect
before reading, and what changed? -->

## Where I'm still unconvinced

<!-- The single-step design collapses successor features to immediate features, so "SF&GPI"
and "model-based with noisy memory" make the same behavioral prediction here. How much of my
belief in the SF&GPI story is carried by the neural data vs. the elegance of the framing?
Would I bet the same way after a multi-step version? -->

## The reproduction, honestly

<!-- The sim reaches the paper's headline numbers (≈68% reuse, ≈93% within-reuse-correct),
but it does so with hand-built structure: rejection-sampled weights, a fixed lapse rate, MF
given a cached average. Which of those are load-bearing assumptions vs. cosmetic? What would
break the match? Note anything I'd want to re-derive rather than take on faith. -->

## What I'd build next (extensions)

<!-- Candidates: (1) a multi-step gem collector that could actually separate SF&GPI from
partial-model MB; (2) fit the lapse/UVFA mixture per-participant instead of a single rate;
(3) push the reuse-vs-recompute gap up and watch where reuse breaks. Which is worth a
spec in extensions/? -->

## How it connects to the through-line

<!-- The efficiency thesis: reuse structure instead of recomputing it. Concretely, how does
this hand off to policy compression (02–04) and key-value memory (05)? Is "a small library
of past-optimal policies" the same object as "a compressed policy," or a different point on
the frontier? Write the sentence I'd open the next lecture with. -->
