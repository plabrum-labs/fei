import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import type { LectureEntry } from "@/framework/discoverLectures";
import { labFor, titleCase } from "@/framework/labs";

export function LecturePage({ lecture }: { lecture: LectureEntry }) {
  if (!lecture.loadArticle) {
    throw new Error(`LecturePage: no article for ${lecture.path}`);
  }
  const Article = lazy(lecture.loadArticle);
  const lab = labFor(lecture.lab);

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10">
        <Link
          to="/"
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-accent"
        >
          ← Foundations of Efficient Intelligence
        </Link>
        <p className="mt-6 font-mono text-xs tracking-[0.2em] text-accent uppercase">
          {lab ? lab.title : titleCase(lecture.lab)}
        </p>
        <div className="mt-2 flex gap-4 font-mono text-xs">
          {lecture.loadSlides && (
            <Link
              to={`/${lecture.path}/slides`}
              className="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              View slides →
            </Link>
          )}
          {lecture.paperUrl && (
            <a
              href={lecture.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              Read the paper →
            </a>
          )}
        </div>
      </div>

      <Suspense
        fallback={<p className="font-mono text-sm text-muted-foreground">Loading…</p>}
      >
        <div className="prose prose-lg max-w-none font-heading prose-headings:font-heading prose-headings:font-medium prose-code:font-mono prose-pre:font-mono">
          <Article />
        </div>
      </Suspense>
    </article>
  );
}
