# Science-writing allowances

The guardrail that separates this skill from a generic deslop tool. Generic tools (stop-slop et
al.) are built for marketing/bureaucratic copy and ban constructions that are *correct* in
technical prose. Apply every rule in `patterns.md` through these allowances. When a deslop edit
would make a true sentence vaguer, less precise, or wrong: **don't make it.**

## Keep passive voice when the actor is irrelevant or the measurement is the subject
The generic rule "every sentence needs a human subject doing something" is wrong for methods
and results writing.
- KEEP: "DLPFC evidence emerged later (≈8.75 s)." — the signal is the subject; who recorded it
  is noise.
- KEEP: "Policies were re-scored under the new reward weights." — the operation matters, not
  the agent.
- Rewrite passive only when it's genuinely hiding a relevant actor ("mistakes were made" →
  name who).

## Keep non-human / abstract subjects
Standard scientific and modeling idiom, not "false agency."
- KEEP: "A dot product re-scores the old policy." · "The prior pulls the estimate toward the
  mean." · "The consideration set grows with the action space."
- These are the field's register. Only flag personification that's doing rhetorical
  cutesiness, not mechanism ("the model *wants* to be lazy" → "the model minimizes cost").

## Keep hedges that encode real statistical uncertainty
Deslop tools treat "suggests / consistent with / tends to" as weasel words. In science they are
precision.
- KEEP: "consistent with policy reuse", "suggests", "on average", "tends to" when they reflect
  what the statistics actually license.
- Only cut hedging that's *reflexive throat-clearing* with no uncertainty behind it ("it's
  worth noting that arguably this might suggest…").

## Keep numbers, jargon, and precision
- Never round away or vague-ify a reported statistic to improve "flow." `r = 0.62`, `p < .001`,
  `≈8.75 s`, `n = 24` stay exact.
- Keep established jargon (rate–distortion, policy complexity, DLPFC, free energy). Don't
  "simplify" a technical term into an imprecise gloss. Explaining a term once is good; replacing
  it is not.

## Keep "always/never/optimal" when the claim is literally that
"Lazy extremes" are only slop when they're hyperbole. "Exhaustive planning is always optimal in
principle" is a precise theoretical claim — keep it.

## The overriding rule
Accuracy > flow. Voice > rules. If you can't deslop a sentence without risking its meaning,
leave it and note it in the diff summary as "left for accuracy."
