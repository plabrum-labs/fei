import { Link } from "react-router-dom";
import type { LectureEntry } from "@/framework/discoverLectures";
import { LABS, titleCase } from "@/framework/labs";

export function HomePage({ lectures }: { lectures: LectureEntry[] }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <header className="mb-20">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          A self-directed graduate seminar
        </p>
        <h1 className="mt-3 font-heading text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl">
          Foundations of
          <br />
          Efficient Intelligence
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Why is biological intelligence so computationally and sample efficient — and
          how do we build AI systems with those properties? An interactive graduate
          textbook built one paper, one lecture at a time, drawing on computational
          cognitive science, neuroscience, ML, and systems.
        </p>
        <div className="mt-10 h-px w-full bg-border" />
      </header>

      <div className="space-y-14">
        {LABS.map((lab) => {
          const labLectures = lectures.filter((l) => l.lab === lab.key);
          return (
            <section key={lab.key}>
              <div className="flex items-baseline gap-3">
                <h2 className="font-heading text-2xl">{lab.title}</h2>
                <span className="ml-auto font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  {lab.month}
                </span>
              </div>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">{lab.blurb}</p>

              {labLectures.length > 0 ? (
                <div className="mt-4 border-t border-border">
                  {labLectures.map((lecture, i) => (
                    <div
                      key={lecture.path}
                      className="group flex items-baseline justify-between gap-6 border-b border-border py-4"
                    >
                      <div className="flex min-w-0 items-baseline gap-4">
                        <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate font-heading text-lg">
                          {titleCase(lecture.slug)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 font-mono text-xs tracking-wide uppercase">
                        {lecture.loadArticle ? (
                          <Link
                            to={`/${lecture.path}`}
                            className="text-muted-foreground transition-colors hover:text-accent"
                          >
                            Article
                          </Link>
                        ) : (
                          <span className="cursor-not-allowed text-muted-foreground/40">
                            Article
                          </span>
                        )}
                        {lecture.loadSlides ? (
                          <Link
                            to={`/${lecture.path}/slides`}
                            className="text-muted-foreground transition-colors hover:text-accent"
                          >
                            Slides
                          </Link>
                        ) : (
                          <span className="cursor-not-allowed text-muted-foreground/40">
                            Slides
                          </span>
                        )}
                        {lecture.paperUrl && (
                          <a
                            href={lecture.paperUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors hover:text-accent"
                          >
                            Paper
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 border-t border-dashed border-border pt-4 font-mono text-xs text-muted-foreground italic">
                  In development.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
