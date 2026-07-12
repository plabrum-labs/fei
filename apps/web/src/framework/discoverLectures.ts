import type { ArticleModule, SlidesModule } from "./types";

export interface LectureEntry {
  lab: string;
  slug: string;
  path: string;
  loadArticle: () => Promise<ArticleModule>;
  loadSlides?: () => Promise<SlidesModule>;
}

const articleModules = import.meta.glob<ArticleModule>(
  "/../../*/*/presentation/article.mdx",
);
const slidesModules = import.meta.glob<SlidesModule>(
  "/../../*/*/presentation/slides.mdx",
);

function parseKey(key: string): { lab: string; slug: string } {
  const match = key.match(/([^/]+)\/([^/]+)\/presentation\/(?:article|slides)\.mdx$/);
  if (!match) {
    throw new Error(`discoverLectures: could not parse lab/slug from path: ${key}`);
  }
  const [, lab, slug] = match;
  return { lab, slug };
}

export function discoverLectures(): LectureEntry[] {
  const byPath = new Map<string, LectureEntry>();

  for (const [key, loadArticle] of Object.entries(articleModules)) {
    const { lab, slug } = parseKey(key);
    byPath.set(`${lab}/${slug}`, { lab, slug, path: `${lab}/${slug}`, loadArticle });
  }

  for (const [key, loadSlides] of Object.entries(slidesModules)) {
    const { lab, slug } = parseKey(key);
    const entry = byPath.get(`${lab}/${slug}`);
    if (entry) entry.loadSlides = loadSlides;
  }

  return Array.from(byPath.values()).sort((a, b) => a.path.localeCompare(b.path));
}
