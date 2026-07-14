import type { ArticleModule, SlidesModule } from "./types";

export interface LectureEntry {
  lab: string;
  slug: string;
  path: string;
  order: number;
  loadArticle?: () => Promise<ArticleModule>;
  loadSlides?: () => Promise<SlidesModule>;
  paperUrl?: string;
}

const articleModules = import.meta.glob<ArticleModule>(
  "/../../*/*/presentation/article.mdx",
);
const slidesModules = import.meta.glob<SlidesModule>(
  "/../../*/*/presentation/slides.mdx",
);
const paperUrls = import.meta.glob<string>("/../../*/*/paper.pdf", {
  eager: true,
  query: "?url",
  import: "default",
});

// Lecture folders are named `NN-slug` (e.g. `01-neural-evidence-strategy-reuse`);
// the numeric prefix drives sort order and is stripped from the URL slug.
function parseFolder(folder: string): { order: number; slug: string } {
  const match = folder.match(/^(\d+)-(.+)$/);
  if (!match) {
    return { order: Number.POSITIVE_INFINITY, slug: folder };
  }
  const [, order, slug] = match;
  return { order: Number(order), slug };
}

function parseKey(key: string): { lab: string; slug: string; order: number } {
  const match = key.match(/([^/]+)\/([^/]+)\/presentation\/(?:article|slides)\.mdx$/);
  if (!match) {
    throw new Error(`discoverLectures: could not parse lab/slug from path: ${key}`);
  }
  const [, lab, folder] = match;
  return { lab, ...parseFolder(folder) };
}

function parsePaperKey(key: string): { lab: string; slug: string; order: number } {
  const match = key.match(/([^/]+)\/([^/]+)\/paper\.pdf$/);
  if (!match) {
    throw new Error(`discoverLectures: could not parse lab/slug from path: ${key}`);
  }
  const [, lab, folder] = match;
  return { lab, ...parseFolder(folder) };
}

export function discoverLectures(): LectureEntry[] {
  const byPath = new Map<string, LectureEntry>();

  function entryFor(lab: string, slug: string, order: number): LectureEntry {
    const path = `${lab}/${slug}`;
    let entry = byPath.get(path);
    if (!entry) {
      entry = { lab, slug, path, order };
      byPath.set(path, entry);
    }
    return entry;
  }

  for (const [key, paperUrl] of Object.entries(paperUrls)) {
    const { lab, slug, order } = parsePaperKey(key);
    entryFor(lab, slug, order).paperUrl = paperUrl;
  }

  for (const [key, loadArticle] of Object.entries(articleModules)) {
    const { lab, slug, order } = parseKey(key);
    entryFor(lab, slug, order).loadArticle = loadArticle;
  }

  for (const [key, loadSlides] of Object.entries(slidesModules)) {
    const { lab, slug, order } = parseKey(key);
    entryFor(lab, slug, order).loadSlides = loadSlides;
  }

  return Array.from(byPath.values()).sort(
    (a, b) => a.lab.localeCompare(b.lab) || a.order - b.order || a.slug.localeCompare(b.slug),
  );
}
