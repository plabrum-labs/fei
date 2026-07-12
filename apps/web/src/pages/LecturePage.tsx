import { lazy, Suspense } from "react";
import type { LectureEntry } from "@/framework/discoverLectures";

export function LecturePage({ lecture }: { lecture: LectureEntry }) {
  const Article = lazy(lecture.loadArticle);

  return (
    <article className="prose mx-auto max-w-3xl px-4 py-12">
      <Suspense fallback={<p>Loading…</p>}>
        <Article />
      </Suspense>
    </article>
  );
}
