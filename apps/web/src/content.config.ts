import { fileURLToPath } from "node:url";
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Lecture content lives at the repo root. This file is at apps/web/src/, so the
// repo root is three levels up (src → web → apps → repo root).
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

// Articles are `NN-slug/presentation/article.mdx` under a lab folder at the repo
// root. The entry id is kept as the raw `lab/NN-slug` folder path so lab/order/slug
// can be parsed from it downstream (see src/lib/content.ts).
const articles = defineCollection({
  loader: glob({
    pattern: "*/*/presentation/article.mdx",
    base: repoRoot,
    generateId: ({ entry }) => entry.replace(/\/presentation\/article\.mdx$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    draft: z.boolean().default(false),
    // Optional override for the paper link; presence is otherwise inferred from paper.pdf.
    paper: z.string().optional(),
  }),
});

// Lab-level metadata: `<lab>/lab.json`. Entry id is the lab key (folder name).
const labs = defineCollection({
  loader: glob({
    pattern: "*/lab.json",
    base: repoRoot,
    generateId: ({ entry }) => entry.replace(/\/lab\.json$/, ""),
  }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    blurb: z.string(),
  }),
});

export const collections = { articles, labs };
