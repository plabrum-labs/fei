# fei — Foundations of Efficient Intelligence

## Go-forward folder structure

This is a pnpm + uv monorepo. **Lecture content lives at the repo root, colocated with
its Python reproduction; `apps/web` is only the renderer** (Astro reads content from the
root via the content layer — "Option A"). Content is never moved into `apps/web`.

```
fei/
  <lab>/                         # one dir per lab (gershman, tenenbaum, friston, hafner…)
    lab.json                     # { order, title, blurb } — validated by the labs collection
    <NN-slug>/                   # one dir per lecture; NN drives order, slug is the URL
      paper.pdf                  # the source paper (linked from the site)
      paper.md  paper_assets/    # extracted markdown for reading (see pdf-to-markdown skill)
      notes.md  critique.md      # reading notes + skeptical, methods-level critique
      reproduction/              # self-contained Python (uv): pyproject.toml, src/, uv.lock
      extensions/                # optional follow-on experiments
      presentation/
        article.mdx              # THE published surface: YAML frontmatter + prose + math
        components/*.tsx         # React islands for this lecture (import ./ + @/primitives)
        data/results.json        # committed; read by components. Decouples build from Python.
        slides.mdx               # React-MDX slide deck (currently parked; see below)
  apps/web/                      # Astro renderer (the "thin presentation layer")
    astro.config.mjs
    src/
      content.config.ts          # articles + labs collections (glob from repo root)
      lib/content.ts             # merges collections + paper/slides globs → lecture index
      layouts/{Base,Article}.astro
      pages/{index,404}.astro, [lab]/[slug].astro
      primitives/                # shared, reusable widgets (Tex, charts, Slider, Pyodide…)
      components/ui/             # shadcn primitives
      framework/SlideDeck.tsx    # kept for when slides are re-enabled
      styles/global.css          # Tailwind v4 + tokens; @source registers root content
  infra/                         # Terraform → Cloudflare Pages (builds apps/web → dist/)
  docs/ARCHITECTURE.md           # longer-form rationale
```

## Rules of thumb

- **A lecture becomes a published article** the moment its `presentation/article.mdx` has
  valid frontmatter (`title`, `description`, `draft`). Frontmatter is the single source of
  truth for title/citation — do not re-derive titles from the slug. Set `draft: true` to
  keep it off the site while in progress.
- **Paper-only lectures** (a `paper.pdf` but no `article.mdx`) still appear on the home page
  as a row with a Paper link and disabled Article/Slides — no extra wiring needed.
- **New lecture** = new `<NN-slug>/` folder under a lab; **new lab** = new top-level dir with
  a `lab.json`. Both are auto-discovered by the content layer; no registry to edit.
- **Interactivity:** a component only ships JS if its MDX call-site has a `client:*` directive
  (e.g. `<BanditTask client:visible />`). Leave static components (`<Tex>`, plots) directive-
  free so they render to HTML at build with zero JS — that's the whole point of the migration.
- **Shared, reusable UI** goes in `apps/web/src/primitives`; **lecture-specific** components
  stay in that lecture's `presentation/components/`. Content may import `@/primitives/*` and
  `./…` but not charting/npm libs directly (pnpm isolation landmine).
- **Python** lives only under `reproduction/` and writes `presentation/data/results.json`; the
  web build never runs Python.
- Slides are authored but currently **parked unrouted** (`SLIDES_ENABLED` in `lib/content.ts`)
  because Astro MDX and React-MDX collide on the `.mdx` extension.
