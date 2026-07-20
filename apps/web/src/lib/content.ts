import { getCollection } from "astro:content";

export interface LabMeta {
  key: string;
  order: number;
  title: string;
  blurb: string;
}

export interface LectureEntry {
  lab: string;
  slug: string;
  path: string;
  order: number;
  title: string;
  hasArticle: boolean;
  hasSlides: boolean;
  /** Collection entry id (`lab/NN-slug`) for the article, when one exists. */
  articleId?: string;
  paperUrl?: string;
}

// Presence/URL flags for content that has no content-collection entry:
// paper.pdf gives a link URL, slides.mdx gives a presence flag. These use Vite's
// import.meta.glob (root-relative `/../../`) rather than the content layer because
// PDFs and React-MDX slides aren't modeled as Astro collections.
const paperUrls = import.meta.glob<string>("/../../*/*/paper.pdf", {
  eager: true,
  query: "?url",
  import: "default",
});
const slidesModules = import.meta.glob("/../../*/*/presentation/slides.mdx");

// Lecture folders are named `NN-slug`; the numeric prefix drives sort order and is
// stripped from the URL slug.
function parseFolder(folder: string): { order: number; slug: string } {
  const match = folder.match(/^(\d+)-(.+)$/);
  if (!match) {
    return { order: Number.POSITIVE_INFINITY, slug: folder };
  }
  const [, order, slug] = match;
  return { order: Number(order), slug };
}

function parsePathKey(key: string): { lab: string; slug: string; order: number } {
  const match = key.match(/([^/]+)\/([^/]+)\/(?:presentation\/slides\.mdx|paper\.pdf)$/);
  if (!match) {
    throw new Error(`content: could not parse lab/slug from path: ${key}`);
  }
  const [, lab, folder] = match;
  return { lab, ...parseFolder(folder) };
}

// The article collection id is the raw `lab/NN-slug` folder path (see content.config.ts).
function parseArticleId(id: string): { lab: string; slug: string; order: number } {
  const [lab, folder] = id.split("/");
  if (!lab || !folder) {
    throw new Error(`content: could not parse lab/slug from article id: ${id}`);
  }
  return { lab, ...parseFolder(folder) };
}

// Slides are authored as React MDX (`slides.mdx` exports a ReactNode[]), which collides
// with Astro's own MDX integration on the `.mdx` extension — Astro's mdx() plugin claims
// every .mdx file and offers no exclude, so a second, scoped @mdx-js/rollup can't coexist
// cleanly. Per the migration plan's sanctioned fallback, slides are parked unrouted: the
// files are kept on disk but no /slides route is generated and the links stay hidden.
// Flip this to true (and add src/pages/[lab]/[slug]/slides.astro) to re-enable them.
export const SLIDES_ENABLED = false;

export function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getLabs(): Promise<LabMeta[]> {
  const labs = await getCollection("labs");
  return labs
    .map((lab) => ({ key: lab.id, ...lab.data }))
    .sort((a, b) => a.order - b.order);
}

export async function labFor(key: string): Promise<LabMeta | undefined> {
  return (await getLabs()).find((lab) => lab.key === key);
}

// Union-merge of every lecture: article-collection entries plus the paper-only and
// slides-only folders that have no article.mdx, keyed by `lab/slug`.
export async function getLectures(): Promise<LectureEntry[]> {
  const byPath = new Map<string, LectureEntry>();

  function entryFor(lab: string, slug: string, order: number): LectureEntry {
    const path = `${lab}/${slug}`;
    let entry = byPath.get(path);
    if (!entry) {
      entry = {
        lab,
        slug,
        path,
        order,
        title: titleCase(slug),
        hasArticle: false,
        hasSlides: false,
      };
      byPath.set(path, entry);
    }
    return entry;
  }

  for (const key of Object.keys(paperUrls)) {
    const { lab, slug, order } = parsePathKey(key);
    entryFor(lab, slug, order).paperUrl = paperUrls[key];
  }

  for (const key of Object.keys(slidesModules)) {
    const { lab, slug, order } = parsePathKey(key);
    entryFor(lab, slug, order).hasSlides = true;
  }

  const articles = await getCollection("articles");
  for (const article of articles) {
    if (article.data.draft) continue;
    const { lab, slug, order } = parseArticleId(article.id);
    const entry = entryFor(lab, slug, order);
    entry.hasArticle = true;
    entry.articleId = article.id;
    entry.title = article.data.title;
  }

  return Array.from(byPath.values()).sort(
    (a, b) =>
      a.lab.localeCompare(b.lab) || a.order - b.order || a.slug.localeCompare(b.slug),
  );
}
