import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

function slideIndexFromHash(hash: string, slideCount: number): number {
  const n = Number.parseInt(hash.replace(/^#/, ""), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), slideCount - 1);
}

const SWIPE_THRESHOLD_PX = 50;

export function SlideDeck({ slides }: { slides: ReactNode[] }) {
  const [index, setIndex] = useState(() =>
    slideIndexFromHash(window.location.hash, slides.length),
  );
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), slides.length - 1);
      window.location.hash = String(clamped);
    },
    [slides.length],
  );

  useEffect(() => {
    const onHashChange = () => setIndex(slideIndexFromHash(window.location.hash, slides.length));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [slides.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        goTo(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        goTo(index - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, goTo]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    goTo(deltaX < 0 ? index + 1 : index - 1);
  };

  // TODO: print/PDF export path (explicitly deferred, see docs/ARCHITECTURE.md).

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-background font-heading text-foreground"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides[index]}

      <div className="absolute inset-x-0 top-0 h-0.5 bg-border">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${((index + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div className="absolute right-6 bottom-6 font-mono text-xs text-muted-foreground">
        {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>
    </div>
  );
}
