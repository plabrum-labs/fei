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
const paperMeta = import.meta.glob<{ order?: number }>("/../../*/*/paper.json", {
  eager: true,
  import: "default",
});

function parseKey(key: string): { lab: string; slug: string } {
  const match = key.match(/([^/]+)\/([^/]+)\/presentation\/(?:article|slides)\.mdx$/);
  if (!match) {
    throw new Error(`discoverLectures: could not parse lab/slug from path: ${key}`);
  }
  const [, lab, slug] = match;
  return { lab, slug };
}

function parsePaperKey(key: string): { lab: string; slug: string } {
  const match = key.match(/([^/]+)\/([^/]+)\/paper\.(?:pdf|json)$/);
  if (!match) {
    throw new Error(`discoverLectures: could not parse lab/slug from path: ${key}`);
  }
  const [, lab, slug] = match;
  return { lab, slug };
}

export function discoverLectures(): LectureEntry[] {
  const byPath = new Map<string, LectureEntry>();

  function entryFor(lab: string, slug: string): LectureEntry {
    const path = `${lab}/${slug}`;
    let entry = byPath.get(path);
    if (!entry) {
      entry = { lab, slug, path, order: Number.POSITIVE_INFINITY };
      byPath.set(path, entry);
    }
    return entry;
  }

  for (const [key, paperUrl] of Object.entries(paperUrls)) {
    const { lab, slug } = parsePaperKey(key);
    entryFor(lab, slug).paperUrl = paperUrl;
  }

  for (const [key, meta] of Object.entries(paperMeta)) {
    const { lab, slug } = parsePaperKey(key);
    if (typeof meta.order === "number") {
      entryFor(lab, slug).order = meta.order;
    }
  }

  for (const [key, loadArticle] of Object.entries(articleModules)) {
    const { lab, slug } = parseKey(key);
    entryFor(lab, slug).loadArticle = loadArticle;
  }

  for (const [key, loadSlides] of Object.entries(slidesModules)) {
    const { lab, slug } = parseKey(key);
    entryFor(lab, slug).loadSlides = loadSlides;
  }

  return Array.from(byPath.values()).sort(
    (a, b) => a.lab.localeCompare(b.lab) || a.order - b.order || a.slug.localeCompare(b.slug),
  );
}
