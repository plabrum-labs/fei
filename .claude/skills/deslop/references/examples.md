# Before / after

Drawn from this repo's own articles. Each shows the tic, the rewrite, and — as important — the
cases where the right move is to **leave it**.

---

### 1. Enumerate-then-balance (fix)
**Before** (`gershman/03-…/article.mdx:60`):
> Two knobs, two kinds of cost. Policy complexity is a movement *along* the frontier; …

**After:**
> Policy complexity and action-set size are separate costs: complexity moves you *along* the
> frontier, while …

Why: the standalone count-fragment is heading-reflex leaking into prose. Folding the two costs
into the sentence that already names them keeps the content, drops the drum-roll.

---

### 2. Enumerate-then-balance in a section header (fix)
**Before:** `## 1. Two ways to spend less`
**After:** `## 1. Where the savings come from` (or name the two mechanisms directly:
`## 1. Fewer options, cheaper policies`)

Why: headers are the worst offenders — a bare cardinality as a title is the strongest "AI"
signal. Section titles should name the idea, not count it.

---

### 3. Enumerate-then-balance (DON'T flag)
**Leave:**
> Two structural facts fall out, and both show up in the human data. First, a bigger
> consideration set… Second, …

Borderline. The count here is redundant with a real "First… Second…" list that follows, so it's
*closer* to legitimate — but "fall out" + the standalone announce still reads assembled. Prefer
tightening to `Two predictions follow, and the data bears out both: first…, second…`. If a real
enumerated list genuinely follows, keeping "two" is acceptable — just don't let it be the third
"two X" opener in the same article.

---

### 4. Antithesis-by-negation (DON'T flag)
**Leave** (`gershman/01-…/article.mdx:17`):
> The claim is not just that reuse happens, but that a specific algorithm, successor-feature
> re-scoring, does it.

This is the paper's actual thesis — the "not just… but…" is doing real scoping, not rhythm.
Earned. Leave it. (But if the same article opens three paragraphs with "not just… but…", kill
the other two.)

---

### 5. Announce-then-reveal (fix)
**Before** (`gershman/03-…/article.mdx:159`):
> This is the payoff of the whole framing: it lets state-specific value decouple from general
> value.

**After:**
> State-specific value can now decouple from general value.

Why: "This is the payoff of the whole framing:" is a drum-roll. The sentence after it is the
actual point — lead with it.

---

### 6. Passive voice (DON'T flag — science allowance)
**Leave:**
> DLPFC evidence emerged later (≈8.75 s), consistent with retrieval from memory.

Non-human subject + passive-ish + a hedge — and all three are correct. The signal is the
subject; "consistent with" reports what the stats license. A generic tool would mangle this;
leave it exactly as is.

---

### 7. Em-dash thinning (fix by variation, not purge)
**Before:**
> The work scales with the number of actions — it is always optimal in principle — but it is
> also the most expensive option — because re-scoring is cheap by comparison.

**After:**
> The work scales with the number of actions. It is optimal in principle, but also the most
> expensive option, because re-scoring is cheap by comparison.

Why: four em-dashes in one sentence is the tell. Convert to sentence breaks and commas; keep an
em-dash only where a true aside needs it.
