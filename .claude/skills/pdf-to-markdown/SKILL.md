---
name: pdf-to-markdown
description: Convert a paper's paper.pdf into paper.md using scripts/pdf_to_markdown.py (Marker), for AI reading and later use by build-lecture. Use when the user adds a new paper PDF and wants it extracted, or asks to "convert the pdf", "extract the paper", "run pdf_to_markdown".
---

Converts an academic PDF into markdown (real LaTeX equations, tables, figures saved to a
`<stem>_assets/` folder) using `scripts/pdf_to_markdown.py`, which wraps
[Marker](https://github.com/datalab-to/marker). This is step zero for a new paper — run it
before `build-lecture`, which reads `paper.md` (not the PDF) as its source.

## When invoked

1. **Find the PDF.** If the user names a lab/paper (e.g. "gershman 05" or "the key-value
   memory paper"), locate it: `find . -iname paper.pdf | grep -i <hint>`. Papers live at
   `<lab>/<NN-slug>/paper.pdf` (e.g. `gershman/05-key-value-memory-in-the-brain/paper.pdf`).
   If the user gives a bare PDF path not yet in this structure, ask where it belongs (which
   lab folder, what `NN-slug` name) before running anything — folder placement drives the
   whole downstream pipeline (Astro's content layer globs `*/*/presentation/article.mdx` in
   `apps/web/src/content.config.ts` and `*/*/paper.pdf` in `apps/web/src/lib/content.ts` by
   this same `<lab>/<NN-slug>` shape).
2. **Check the output doesn't already exist** (`paper.md` next to `paper.pdf`). If it does,
   confirm with the user before overwriting — Marker conversion is slow (loads ML models) and
   a prior conversion may have been hand-edited.
3. **Run the conversion** from the repo root with the shared root `uv` environment (this
   script is the one consumer of the root `pyproject.toml`'s `marker-pdf` dependency, not a
   per-paper `reproduction/` venv):
   ```
   uv run python scripts/pdf_to_markdown.py <lab>/<NN-slug>/paper.pdf
   ```
   Omit the second argument — it defaults to the same path with a `.md` suffix. Pass an
   explicit output path only if the user wants markdown somewhere other than
   `<lab>/<NN-slug>/paper.md`.
4. **First run is slow.** Marker downloads model weights on first use; expect it to take
   noticeably longer than subsequent conversions. Don't kill it early — let it finish or use
   a generous timeout (5+ minutes) / run in background and check back.
5. **Verify the output**: confirm `paper.md` was written and skim it for garbled tables or
   missing figures (`<stem>_assets/` should contain the paper's real figures — Marker drops
   small decorative images like journal logos via a pixel-area threshold, so an empty or
   near-empty assets folder for a figure-heavy paper is worth a second look, not necessarily
   a bug).
6. **Report** the output path and figure count, and note that `build-lecture` is the natural
   next step.

## Notes

- Don't hand-roll a different PDF extraction method (pdftotext, PyMuPDF text dump, etc.) —
  the whole point of this script is faithful LaTeX/table/figure extraction for later reuse
  in `article.mdx`/`notes.md`. If Marker garbles a specific paper badly, say so and ask the
  user how they want to proceed rather than silently falling back to a worse extractor.
- This script lives outside `apps/web` and outside any per-paper `reproduction/` venv — it's
  repo-wide tooling, run with the root environment only.
