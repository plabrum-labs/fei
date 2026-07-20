// @ts-check
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Lecture content lives at the repo root, colocated with its Python reproduction.
// apps/web is a sibling under the pnpm workspace, so the content root is two levels up.
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const src = fileURLToPath(new URL("./src", import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: "static",
  // Math authoring (`$…$`) plus KaTeX rendering, applied to both .md and .mdx
  // (the mdx integration extends this markdown config by default).
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [mdx(), react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Collapse every React import (repo-root content, islands, the SSR renderer) to a
      // single copy. Repo-root content imports React from outside apps/web in a pnpm
      // workspace; dedupe by realpath is what prevents a second React instance (which
      // shows up as a null hooks dispatcher during SSR). @astrojs/react owns the rest of
      // React resolution, so no manual react/jsx-runtime aliases here (known landmine).
      dedupe: ["react", "react-dom"],
      alias: {
        "@": src,
        "@content": repoRoot,
      },
    },
    server: {
      // Dev server must be allowed to read repo-root content (mirrors old vite config).
      fs: { allow: [repoRoot] },
    },
  },
});
