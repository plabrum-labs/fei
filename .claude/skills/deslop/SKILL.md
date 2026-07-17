---
name: deslop
description: Score an article/slide deck for LLM prose tics ("AI slop"), then rewrite in place to fix them — tuned for technical science writing, so it leaves legitimate passive voice, non-human subjects, and earned parallelism alone. Use when the user asks to "deslop", "de-slop", clean up AI tone, or make a lecture's prose sound less machine-generated.
---

Removes the machine-generated *tone* from lecture prose — the enumerate-then-balance
templates, antithesis tics, and metronomic rhythm that read as "written by Claude" — without
flattening the technical voice. Built for `fei` lecture content (`<lab>/<NN-slug>/presentation/
article.mdx` and `slides.mdx`), where a lot of what a generic deslop tool would "fix" is
actually correct scientific register.

Informed by the `stop-slop` skill (hardikpandya, MIT) and Stephen Turner's de-slop writeup,
but re-tuned: their rules assume marketing/bureaucratic copy and ban all passive voice, all
adverbs, and every non-human subject. Those bans are wrong here (see
`references/science-allowances.md`). What's kept is the pattern catalog; what's added is a
"don't flag when" clause on every rule and a house rule for Phil's top tic.

## Contract

**Score → rewrite in place → show the diff.** Not flag-only. Steps:

1. Read the target file(s) fully before touching anything.
2. **Score** it on the five dimensions below (1–10 each, 50 max). Report the score with a
   one-line justification per dimension.
3. **Rewrite in place** with `Edit`, fixing the flagged tics. Preserve meaning, numbers,
   citations, `<Tex>`/JSX/MDX, and the author's voice. Never invent facts to "improve density."
4. **Show a compact diff summary** — what changed and why, grouped by rule. The user reviews
   via git; you are not silently clobbering.
5. Re-score after rewriting so the delta is visible (aim to clear 40/50).

**Scope.** In scope: `article.mdx`, `slides.mdx`, `notes.md`. **Out of scope, do not touch:**
`reflection.md` (first-person by design — Willison's rule: if it has "I" and opinions, a human
owns it), any block quoting the paper verbatim, figure captions that are direct paper
paraphrase, and code/`<Tex>` expressions. When unsure whether a line is quoted paper text,
leave it.

## The five dimensions (score 1–10 each; below 35 = heavy revision, 35–40 = light)

| Dimension | Question |
|---|---|
| **Directness** | Does it state things, or announce that it's about to? |
| **Rhythm** | Varied sentence length/shape, or metronomic? |
| **Trust** | Does it respect the reader, or over-explain and hand-hold? |
| **Authenticity** | Sounds like a person thought it, or assembled from templates? |
| **Density** | Anything cuttable without losing meaning? |

## House rules — the tics that actually show up in this repo

Full catalog with "don't flag when" clauses in `references/patterns.md`. The load-bearing ones:

1. **Enumerate-then-balance (Phil's #1 tic).** A decorative count used as a punchy fragment
   or heading: *"Two knobs, two kinds of cost."* / *"Two constraints, one frontier."* / *"Two
   structural facts fall out…"*. The tell is the count is *rhetorical scaffolding*, not a list
   the reader needs. It's worst in **section headers** — that's the markdown-heading reflex
   leaking into prose. **Fix:** fold the count into the sentence that does the real work, or
   cut it. **Don't flag when** you genuinely then walk a numbered list ("two predictions
   follow: first… second…") — enumerating a real two-item list is fine; a standalone
   count-fragment for rhythm is not. And never let more than one survive per piece even if
   each is individually okay — repetition is the tell.

2. **Antithesis-by-negation.** *"not just X, but Y"*, *"not X, but Y"*, *"it's not that… it's
   that…"*. **Fix:** state Y directly. **Don't flag when** the contrast is doing real scoping
   work the paper hinges on (e.g. *"the claim is not just that reuse happens, but that a
   specific algorithm does it"* — that IS the paper's thesis; leave it). One earned use per
   piece; kill the reflexive rest.

3. **Em-dash overuse.** Fine as punctuation; a tell in bulk (this repo's articles run ~36 per
   piece). **Fix:** convert some to periods, colons, or commas; keep em-dashes only for true
   parenthetical breaks. **Target ≤ ~1 per 250 words.** Don't mechanically purge — vary.

4. **Announce-then-reveal / demonstrative payoff.** *"This is the payoff of the whole
   framing:"*, *"Here's the key point:"*, *"What's interesting is…"*. **Fix:** just say the
   point. **Don't flag** a plain "This is the rate–distortion picture…" where "this" has a
   clear referent and no drum-roll.

5. **Metronomic parallelism.** *"It is always optimal in principle. It is also the most
   expensive option."* — anaphora as a rhythm crutch. **Fix:** break the parallel; merge or
   revary. **Don't flag** deliberate parallelism used once for genuine emphasis.

See `references/patterns.md` for the rest (throat-clearing openers, negative listing,
dramatic fragments, false agency, rule-of-three, lazy extremes) and `references/examples.md`
for before/after rewrites drawn from this repo's own articles.

## Science-writing allowances (read before rewriting)

`references/science-allowances.md` is the guardrail that separates this from a generic deslop
tool. In short: **keep** passive voice when the actor is irrelevant or the measurement is the
subject ("DLPFC evidence emerged at ≈8.75 s"), **keep** non-human/abstract subjects ("a dot
product re-scores the policy"), **keep** hedges that carry real statistical uncertainty
("consistent with", "suggests"), **keep** precise numbers and jargon. Do not trade accuracy
for "flow." If a deslop edit would make a true sentence vaguer, don't make it.

## Don't

- Don't rewrite `reflection.md` or quoted paper text.
- Don't strip numbers, citations, effect sizes, or hedges that encode real uncertainty.
- Don't mechanically zero out em-dashes/adverbs/passives — vary, don't ban.
- Don't add filler to hit a density target; cutting is the density fix.
- Don't change MDX/JSX/`<Tex>`; deslop prose only.
