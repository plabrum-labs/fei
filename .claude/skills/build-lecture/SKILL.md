---
name: build-lecture
description: Turn a paper's paper.md into a full lecture — notes, a behavioral/computational reproduction, an interactive article, a slide deck, and a skeptical critique. Use when the user asks to "build a lecture" for a paper, "propose an article and slides", or wants a lab-presentation writeup of a paper already in the repo.
---

Builds everything under `<lab>/<NN-slug>/` that `apps/web` renders, from an already-extracted
`paper.md` (run `pdf-to-markdown` first if only `paper.pdf` exists). Mirrors the shape of
`gershman/01-neural-evidence-strategy-reuse/` — read that folder's `notes.md`, `critique.md`,
`reproduction/src/{simulate,generate_results}.py`, and `presentation/{article,slides}.mdx` as
the reference implementation before writing a new one; match its density and rigor, not just
its file layout.

This is a big, opinionated writing task — read the whole paper (`paper.md` plus its
`<stem>_assets/` figures) before drafting anything, and check `docs/ARCHITECTURE.md` for the
current framework shape (primitives available, MDX conventions) since it may have evolved
since this skill was written.

## The two-phase flow

Phil's usual request comes in two turns; follow the same split unless told to do both at once:

1. **"Read the paper, propose an article and slides."** → Phases 1–4 below (notes,
   reproduction, article + demo + simulation, slides). Contextualize among other papers in
   the field and Gershman's other work as you go — don't leave that for a final section
   only, weave it into the framing and close with it (see `article.mdx` §8, "Where this
   sits").
2. **"If you had to critique the paper as a good skeptical academic, what would you say?"**
   → Phase 5 (critique + reflection). Wait for this to be asked, or ask whether the user
   wants it now, rather than always bundling it into the first pass — it reads better as a
   deliberate follow-up than a preemptive hedge.

## Phase 1 — Read and take notes

Write `<lab>/<NN-slug>/notes.md`: a neutral summary. Follow the structure in the reference
`notes.md` — one-line summary, a table of the candidate strategies/models the paper compares
(if any), task/experiment design, results (behavioral and neural/other), interpretation,
authors' own stated limitations, and a closing "why this matters for the study" paragraph
tying it to the Gershman/efficient-intelligence throughline and to specific other papers in
the reading plan. Ground every number in the paper's own reporting — pull real statistics
(percentages, effect sizes, p-values, correlation coefficients), not paraphrase.

## Phase 2 — Build the reproduction

Under `<lab>/<NN-slug>/reproduction/`:

- `uv init --no-workspace` inside that folder if it needs Python deps (its own
  `pyproject.toml`/`uv.lock`/`.venv` — never add deps to the root `pyproject.toml`, which is
  reserved for `scripts/` + repo dev tools). Add an entry to the root `pyrightconfig.json`'s
  `executionEnvironments` pointing at this project's venv `site-packages` (see
  `docs/ARCHITECTURE.md` for the exact shape).
- `src/simulate.py`: a faithful behavioral/computational reimplementation of the paper's core
  comparison (the competing strategies/models it discriminates between), pure functions, no
  React/JSON output concerns. Reproduce the paper's headline numbers as closely as principled
  choices allow, and say in a module docstring what's in scope vs not (e.g. "behavioral
  simulation only, no neural decoding mock-up").
- `src/generate_results.py`: imports from `simulate.py` unchanged, runs the Monte-Carlo /
  simulation, and writes `../presentation/data/results.json` — the **only** handoff into the
  frontend. Nothing in `presentation/` may import Python; nothing in `reproduction/` may
  import React. Document in the file whether the interactive widgets in the article use this
  aggregate JSON directly or a smaller canonical-example version of the same rules (both are
  fine — say which, and why, per the reference file's own comment on this tradeoff).
- Run it (`uv run python src/generate_results.py`) and sanity-check the numbers against the
  paper before moving on.

## Phase 3 — Write the interactive article

`<lab>/<NN-slug>/presentation/article.mdx`, imported by `apps/web`'s framework
(Astro's content layer globs `*/*/presentation/article.mdx` in
`apps/web/src/content.config.ts`) — folder name must be
`NN-slug` (numeric prefix + kebab-case), which becomes the URL slug with the prefix stripped.

Available primitives (`apps/web/src/primitives/`): `Tex` (KaTeX, `expr` prop, add `block` for
display math), `Figure`, `BarChart`/`LineChart`, `Slider`, `typography` (`Callout`, etc.),
`PyRepl`/`PyCodeEditor` (in-browser Python via Pyodide, for live-executable demos). Check
what else exists before assuming a primitive doesn't — the library grows with each lecture,
per `docs/ARCHITECTURE.md`'s "extract from the first real lecture, not upfront" plan.
Paper-specific components go in `presentation/components/` (e.g. a task-specific game
component, a simulation-comparison widget) and stay out of `apps/web`, which is generic.

Structure, following the reference article's section flow (adapt section count to the
paper, don't force exactly eight):

1. **Frame the question** the paper answers, in plain terms, before naming the paper's own
   jargon.
2. **Explain the candidate models/strategies** being discriminated, if the paper is a
   discrimination study (most Gershman-lab papers are) — what each one costs and predicts.
3. **Explain the experiment design** — what participants actually saw and did. This is where
   the interactive demo goes:
   - **Build a demo of the actual experiment participants did.** Not a toy — reproduce the
     real trial structure (real stimuli/parameters where feasible) so the reader plays the
     task the same way a participant did, then notice what strategy their own play falls
     into. See `GemCollector.tsx` in the reference for the target shape: a real playable
     instance of the task, inline in the prose at the point the design is being explained.
   - Call out precisely what distinguishes the competing models' predictions on this task —
     the article should make the reader feel the tension before reporting results.
4. **Report what happened** (behavior, and neural/other measures if present), inline with the
   real numbers.
5. **Visualize the simulation that was run.** Build a small widget (bar chart, dial/slider,
   comparison plot) driven by `presentation/data/results.json` that lets a reader compare the
   competing models' predicted behavior against the human result — see `SimulationView.tsx`
   (`ChoiceProfile`, `ReuseDial`) for the pattern: a live-adjustable rerun of the same
   decision rule the Python reproduction encodes, not just a static figure.
6. **Report the paper's own math/model mechanics** if there's a formal model — show the
   actual equations (`<Tex>`) the paper or your reproduction implements, tied to the specific
   lines of `simulate.py` that encode them.
7. **Contextualize.** Situate the paper among (a) other papers already in the reading plan
   (check `gershman/lab.json` and sibling `<lab>/NN-*` folders — cite them by name and say
   concretely how this paper's result relates, not just "see also"), and (b) the wider
   Gershman-lab / field lineage the paper itself cites (its intro/discussion sections name
   the precedents — use those, don't invent a lineage). Close by saying where this sits on
   the accuracy/compute/reuse tradeoff the whole study is organized around, per
   `docs/ARCHITECTURE.md`'s framing.
8. Leave room for a `## Cracks and alternatives` section reference (numbered, don't title
   it yet) — Phase 5 fills it in; don't invent placeholder critique content now.

Distill-style interactivity: widgets sit inline at the sentence making the claim, not
bolted on as a separate "demo" section. Aim for the article's own 90/10 rule — one or two
load-bearing widgets at real quality (the playable task, the simulation visualizer), the
rest prose plus static/data-driven figures.

## Phase 4 — Write the slide deck

`<lab>/<NN-slug>/presentation/slides.mdx`. Custom deck harness (`apps/web/src/framework/
SlideDeck.tsx`) — each slide is a full-viewport component, exported as a `slides` array (see
reference for the `Slide`/`WideSlide` local helper-component pattern). **Write slide text
separately from the article** — bullet/talking-point mode, not a mechanical shortening of
article prose. Slides *do* reuse the article's widgets/components/`<Tex>` (import from
`./components/...`), never duplicate their logic.

One slide per beat: title, the question, the candidate strategies, the task (with the same
playable demo dropped onto a `WideSlide`), the twist/design logic, the headline numbers, the
simulation widget again, the model equations, results detail, and a closing "where this
sits" slide. Leave the critique/cracks slide for Phase 5.

## Phase 5 — Skeptical critique (on request or as an explicit follow-up)

`<lab>/<NN-slug>/critique.md`: a reviewer's-eye critique, grounded in the paper's own methods
and numbers — not a generic limitations list. Re-read `gershman/01-.../critique.md` for the
target register: concrete, numbered, ranked by how much each point bites, citing the paper's
own stats against each other (e.g. one analysis's effect size vs. another's, a stated n vs.
what recent methodology work says is stable at that n). Include a genuine "what's solid, in
fairness" section — the critique should read as careful, not dismissive. See the
`skeptical-critique-approach` memory for Phil's specific standard here: methods-level, cite
the paper's own numbers, not "the sample size is small" boilerplate.

Then:
- Fold a condensed version into `article.mdx`'s cracks/alternatives section (the section left
  open in Phase 3) — the article gets the fair, load-bearing version; `critique.md` gets the
  full unfiltered one.
- Add a `## Cracks` slide to `slides.mdx` (see reference deck) summarizing the top 2–4 points.
- Fill in `presentation/reflection.md`'s prompts (what surprised you, what you're still
  unconvinced by, honest notes on the reproduction's assumptions, what you'd build next, how
  it connects to the throughline) with real first-person content — this file is scaffolding
  with HTML-comment prompts until then; replace them, don't leave them as placeholders.

## Don't

- Don't invent simulation results or paper statistics — pull numbers from `paper.md`, and
  have `generate_results.py` actually compute anything reported as a simulated number.
- Don't put React in `reproduction/` or Python in `presentation/` — the JSON file is the only
  handoff.
- Don't skip the playable-experiment demo or the simulation visualizer in favor of prose —
  both are the point of this framework (see `docs/ARCHITECTURE.md`'s Distill-inline target).
- Don't write the critique preemptively into Phase 3's article — wait for Phase 5, or an
  explicit request to do both at once.
