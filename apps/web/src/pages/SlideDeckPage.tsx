import { lazy, Suspense } from "react";
import { SlideDeck } from "@/framework/SlideDeck";
import type { LectureEntry } from "@/framework/discoverLectures";
import type { SlidesModule } from "@/framework/types";

export function SlideDeckPage({ lecture }: { lecture: LectureEntry }) {
  if (!lecture.loadSlides) return null;
  const loadSlides = lecture.loadSlides;

  const Slides = lazy(async () => {
    const mod: SlidesModule = await loadSlides();
    return { default: () => <SlideDeck slides={mod.slides} /> };
  });

  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Slides />
    </Suspense>
  );
}
