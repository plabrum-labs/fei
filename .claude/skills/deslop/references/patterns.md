# Pattern catalog

Each pattern has a **fix** and a **don't-flag-when** clause. The don't-flag clause is the
point: in technical prose most of these fire as false positives on legitimate sentences. The
tell is almost always *repetition or density within one piece*, not a single instance.

Taxonomy adapted from `stop-slop` (hardikpandya, MIT license) and Stephen Turner's de-slop
rubric; exceptions authored for `fei`'s science-writing register.

---

## Tier 1 — structural / rhetorical (the ones that actually read as "AI")

### Enumerate-then-balance  ← the house's #1 tic
A decorative cardinality deployed as a punchy fragment or heading.
- Tells: `Two knobs, two kinds of cost.` · `Two constraints, one frontier.` · `Two structural
  facts fall out, and both show up in the human data.` · section headers like `## Two ways to
  spend less`.
- Why it reads as machine: it's the markdown-heading instinct (announce a count, then balance
  it) leaking into body prose. One is a nice line; the repetition across a piece is the tell.
- **Fix:** fold the count into the working sentence, or cut it. `Two knobs, two kinds of cost.
  Policy complexity moves you along the frontier…` → `Policy complexity and set size are
  separate costs: complexity moves you along the frontier…`
- **Don't flag when:** you immediately walk a real numbered list ("two predictions follow:
  first…, second…"). Enumerating a genuine list is fine. A count-as-rhythm fragment is not.
- **Hard cap:** at most one survives per article, even if each is individually acceptable.

### Antithesis-by-negation
`not just X, but Y` · `not X, but Y` · `it's not that… it's that…` · `less about A than B`.
- **Fix:** state Y directly.
- **Don't flag when:** the contrast carries real scoping the argument depends on (`the claim is
  not just that reuse happens, but that a specific algorithm does it` — that's the thesis).
  One earned use per piece.

### Announce-then-reveal
`Here's the key point:` · `What's interesting is…` · `This is the payoff of the whole framing:`
· `The crucial thing to notice:`.
- **Fix:** delete the announcement, keep the point.
- **Don't flag:** `This is the rate–distortion picture…` where "this" has a concrete referent
  and there's no drum-roll.

### Negative listing
Making the reader wait through what something *isn't* before the reveal: "Not A. Not B. C."
- **Fix:** open with C.
- **Don't flag:** ruling out specific competing hypotheses by name when that IS the analysis
  (methods sections legitimately do this).

### Dramatic fragmentation
Sentence fragments for false profundity: "[Noun]. That's it." / "No free lunch."
- **Fix:** complete sentences.
- **Don't flag:** an occasional short sentence for genuine emphasis after long ones — that's
  good rhythm, not slop. The tell is fragments used *as a habit*.

### False agency
"The data tells us…", "the model wants to…" when a person did the acting.
- **Fix:** name the actor, OR — in science writing — keep it if it's standard modeling idiom.
- **Don't flag:** established technical personification ("the agent maximizes reward", "the
  prior pulls the estimate toward…") — that's the field's register, not a tic.

### Metronomic parallelism / anaphora
`It is always optimal. It is also the most expensive.` — repeated openers as rhythm crutch.
- **Fix:** break the parallel, merge, or re-vary sentence shape.
- **Don't flag:** one deliberate parallel pair for real emphasis.

---

## Tier 2 — rhythm and texture

### Em-dash density
Fine as punctuation; a tell in bulk (repo articles run ~36/piece).
- **Fix:** convert some to periods/colons/commas; keep only true parenthetical breaks.
- **Target:** ≤ ~1 per 250 words. Vary — do not purge to zero.

### Rule-of-three
Three-item lists everywhere ("faster, cheaper, and more robust").
- **Fix:** use two, or four, or restructure — when every list is a triple it reads assembled.
- **Don't flag:** a three-item list when there are genuinely three things.

### Metronomic sentence length
Every sentence 15–25 words. **Fix:** vary — some short, some long.

---

## Tier 3 — words and phrases (lightest touch; never a blind find/replace)

- **Throat-clearing openers:** "It's worth noting that", "Here's the thing", "At its core".
  Cut.
- **Lazy extremes:** always/never/everyone/vast/countless — when not literally true.
  **Don't flag** "always optimal in principle" when the paper's claim is literally that it's
  always optimal.
- **Empty adverbs:** really, just, actually, simply, literally. Cut when they add nothing.
  **Keep** adverbs that carry meaning ("emerged *later*", "scales *linearly*").
- **Corporate/vague verbs:** leverage, navigate, delve, unpack, foster. Swap for plain verbs.

**Note on adverbs and passive voice:** generic deslop tools ban these outright. This skill does
not. See `science-allowances.md`.
