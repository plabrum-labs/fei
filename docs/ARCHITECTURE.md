# Architecture Plan

Planning doc for the `fei` platform. See `README.md` (or the seminar vision doc) for the
educational goals — this covers the technical shape only.

## Frontend

- **Vite + React SPA.** No meta-framework (Next.js/Astro considered and ruled out — the
  SSR/SSG/islands tradeoffs they offer aren't needed yet).
- Each lecture is an `.mdx` file, compiled via `@mdx-js/rollup`.
  - Prose is real Markdown — comfortable to write, not JSX noise.
  - Math via `remark-math` + `rehype-katex`.
  - Widgets/diagrams are React components imported and dropped inline wherever the
    argument needs them (Distill-style: interactivity sits at the load-bearing claim, not
    bolted on as illustration).
  - Each lecture can assign its own layout — pages stay bespoke, not forced into a
    uniform template.

## Reading experience

Target is Distill.pub's inline style (e.g. `distill.pub/2017/momentum`): a slider or live
plot sits directly beneath the sentence making the claim, no separate "launch demo" step.
Rejected alternatives: TensorFlow-Playground-style tool-first pages (weak for carrying a
rigorous argument), and prose-only essays like Anthropic's Transformer Circuits (no
inline experimentation).

**Open question:** true Distill-grade widgets are expensive per paragraph. Proposed but
not yet confirmed: a 90/10 split — one or two load-bearing inline widgets per lecture at
real Distill quality, everything else is prose + static data figures.

## Shared widget/component library

Not built yet — will be extracted from the first real lecture rather than designed
upfront. Expected pieces:

- Slider/control primitive
- Plotting layer (d3 or similar)
- `<Tex>` math component (KaTeX)
- Data-figure component that renders precomputed `demos.data` JSON
- Typography/citation primitives

## Slides

Custom-built deck harness — explicitly not reveal.js or Slidev (styling ceiling was the
complaint with reveal.js previously). Each slide is a full-viewport React component.
Harness (~100-150 lines) handles: current-slide state, arrow-key/swipe navigation, a URL
hash per slide for shareable deep links, and a print/PDF export path.

Slide text is authored separately from article prose — bullet/talking-point mode and
long-form analytical mode are different jobs, not a mechanical compression of one into
the other. Slides *do* reuse the same widget/figure/equation components as the article:
shared assets, not shared text.

## Backend

Deferred, not dropped. The `apps/web` scaffold (see below) proved that every piece of
state the original Postgres design was meant to hold already has a home in the
filesystem: paper/lecture metadata lives in frontmatter or plain prose inside
`article.mdx`, and precomputed demo results live in `presentation/data/*.json`. A live
database has no current consumer, so building one now would be speculative.

What was originally proposed (kept here for when it's actually needed): a minimal
Postgres + small API, no auth/orgs/RLS — single author, public content, the full `snacks`
scaffold (Litestar + Postgres + RLS + org/user model) rejected as overkill for this shape.
Tables sketched: `papers` (title, authors, year, lab, link, abstract), `lectures`
(paper_id, week, notes, reflection, slides_url, video_url, status), `demos` (lecture_id,
name, data).

Revisit only when a concrete feature demands runtime state that the filesystem can't
provide — reader accounts, comments, search at real scale, an admin UI — not built ahead
of that need.

## Project folder structure

Organized by researcher/lab, then by paper, then forked into `reproduction/` (research
code) vs `presentation/` (everything the frontend renders). Both live in this same repo —
not split across repos — with the folder boundary doing the decoupling work instead:
nothing in `apps/web` imports from `reproduction/`, and nothing in `reproduction/` imports
React. The only handoff between the two is a precomputed JSON file.

```
fei/
├── docs/
│   └── ARCHITECTURE.md
│
├── gershman/
│   ├── neural-evidence-strategy-reuse/
│   │   ├── paper.pdf
│   │   ├── paper.md                    # extracted text (scripts/pdf_to_markdown.py)
│   │   ├── reproduction/
│   │   │   ├── README.md
│   │   │   ├── src/                    # the actual reimplementation
│   │   │   ├── notebooks/
│   │   │   └── generate_results.py     # writes ../presentation/data/results.json
│   │   └── presentation/
│   │       ├── article.mdx
│   │       ├── slides.mdx
│   │       ├── reflection.md
│   │       ├── components/             # paper-specific composition, built from
│   │       │                           # shared primitives (e.g. StrategyReuseDemo.tsx)
│   │       └── data/
│   │           └── results.json
│   └── key-value-memory/
│       └── ...
│
├── tenenbaum/
├── friston/
├── hafner/
│
├── apps/
│   ├── web/                            # core framework — generic, no per-paper logic
│   │   ├── src/
│   │   │   ├── primitives/             # Slider, PlotLayer, Tex, Figure, typography, citations
│   │   │   ├── framework/              # paper discovery/loader, MDX pipeline, lecture
│   │   │   │                          # shell, slide deck harness
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   └── api/
│
├── scripts/                            # repo-wide tooling (e.g. pdf_to_markdown.py)
├── pyproject.toml / uv.lock            # env for the Python tooling in scripts/
└── package.json                        # workspace root (apps/web, apps/api)
```

`apps/web` discovers papers by convention — globbing `*/*/presentation/article.mdx` and
`*/*/presentation/slides.mdx` — so adding a new lecture is "add a folder in the right
shape," never "edit the framework."

## Rejected paths (kept for context, not to re-litigate)

- **Next.js / Astro** — unneeded SSR/SSG/islands tradeoffs for a single-author content site.
- **Sanity CMS + Portable Text** — Philip's personal site (`~/repos/website`) uses this
  pattern (typed JSON block array + custom React renderer). Useful as reference for the
  "typed content block" idea, but not adopted directly — MDX covers the same need with
  better prose ergonomics and native component embedding.
- **Full `snacks` scaffold** — multi-tenant org/RLS model not needed for single-author
  public content.
- **Quarto / Jupyter Book / Observable Framework** — Quarto's "one source, multiple
  outputs" model is appealing for article+slides reuse, but its slide output is
  reveal.js-based (already rejected) and its interactivity story (Observable JS, Shiny,
  raw HTML embeds) isn't React-native — would force bridging the widget library into a
  different runtime instead of reusing it directly.
- **Reproduction code as separate repos** — considered, then reversed: folder-level
  separation (`reproduction/` vs `presentation/`) gets the same decoupling without the
  overhead of managing N extra repos.

## Open items before building

1. Decide the 90/10 interactivity-density question (or some other ratio) per lecture.
2. Pick the first concrete widget to build (likely for the Gershman strategy-reuse
   lecture) so the shared component library gets extracted from something real.
