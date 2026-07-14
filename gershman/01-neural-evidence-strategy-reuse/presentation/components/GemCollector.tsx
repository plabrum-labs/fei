import { useState } from "react";
import {
  CITY_NAMES,
  GEMS,
  PHI,
  TRAIN_OPTIMAL,
  W_TEST,
  W_TRAIN,
  cityValues,
  dot,
  type Gem,
  type Vec3,
} from "./taskData";

// ---------------------------------------------------------------------------
// Gem shapes (rendered from the `kind` metadata in taskData)
// ---------------------------------------------------------------------------

export function GemIcon({ gem, size = 18 }: { gem: Gem; size?: number }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-label={gem.name} role="img">
      {gem.kind === "triangle" && <polygon points="12,3 22,21 2,21" fill={gem.color} />}
      {gem.kind === "square" && <rect x="3" y="3" width="18" height="18" rx="2" fill={gem.color} />}
      {gem.kind === "circle" && <circle cx="12" cy="12" r="10" fill={gem.color} />}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const money = (v: number) => (v < 0 ? `−$${Math.abs(v)}` : `$${v}`);
const signed = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `+${v}`);

function argmax(xs: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[best]) best = i;
  return best;
}

/** The more-rewarding of the two training-optimal cities under the given values. */
function betterReuseCity(values: readonly number[]): number {
  return TRAIN_OPTIMAL.reduce((a, b) => (values[b] > values[a] ? b : a));
}

// ---------------------------------------------------------------------------
// Presentational pieces
// ---------------------------------------------------------------------------

function PriceBoard({ w }: { w: Vec3 }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {GEMS.map((gem, g) => (
        <span key={gem.name} className="inline-flex items-center gap-1.5 text-sm">
          <GemIcon gem={gem} size={16} />
          <span className="font-mono tabular-nums">
            <span
              className={
                w[g] > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : w[g] < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground"
              }
            >
              {signed(w[g])}
            </span>
            <span className="text-muted-foreground">/gem</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function CityCard({
  city,
  revealed,
  onClick,
  disabled,
  state,
}: {
  city: number;
  revealed: boolean;
  onClick: () => void;
  disabled: boolean;
  state: "idle" | "chosen" | "best" | "dimmed";
}) {
  const ring =
    state === "chosen"
      ? "border-accent ring-2 ring-accent"
      : state === "best"
        ? "border-emerald-500 ring-2 ring-emerald-500/60"
        : "border-border hover:border-accent/60";
  const dim = state === "dimmed" ? "opacity-45" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col gap-2 rounded-lg border bg-card px-4 py-3 text-left transition-all ${ring} ${dim} disabled:cursor-default enabled:hover:-translate-y-0.5`}
    >
      <span className="flex items-baseline justify-between">
        <span className="font-medium">City {city + 1}</span>
        <span className="font-mono text-xs text-muted-foreground">{CITY_NAMES[city]}</span>
      </span>
      <span className="flex gap-3">
        {GEMS.map((gem, g) => (
          <span key={gem.name} className="inline-flex items-center gap-1 text-sm tabular-nums">
            <GemIcon gem={gem} size={14} />
            {revealed ? (
              <span>{PHI[city][g]}</span>
            ) : (
              <span className="text-muted-foreground">?</span>
            )}
          </span>
        ))}
      </span>
    </button>
  );
}

function PhaseBar({ phase, round, total }: { phase: string; round: number; total: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <span className="font-mono text-xs tracking-[0.15em] text-accent uppercase">{phase}</span>
      <span className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${i < round ? "bg-accent" : i === round ? "bg-accent/50" : "bg-border"}`}
          />
        ))}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The widget
// ---------------------------------------------------------------------------

type Phase = "intro" | "training" | "test" | "summary";
interface Feedback {
  choice: number;
  profit: number;
  best: number;
}

const ALL_REVEALED = [true, true, true, true];
const NONE_REVEALED = [false, false, false, false];

export function GemCollector() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [revealed, setRevealed] = useState<boolean[]>(NONE_REVEALED);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [testChoices, setTestChoices] = useState<number[]>([]);

  function reset() {
    setPhase("intro");
    setRound(0);
    setRevealed(NONE_REVEALED);
    setFeedback(null);
    setTestChoices([]);
  }

  function chooseTraining(city: number) {
    if (feedback) return;
    const w = W_TRAIN[round];
    const values = cityValues(w);
    const best = argmax(values);
    setRevealed((r) => r.map((v, i) => v || i === city || i === best));
    setFeedback({ choice: city, profit: dot(PHI[city], w), best });
  }

  function nextTraining() {
    setFeedback(null);
    if (round < W_TRAIN.length - 1) {
      setRound(round + 1);
    } else {
      setRevealed(ALL_REVEALED); // enter the test knowing the full map
      setRound(0);
      setPhase("test");
    }
  }

  function chooseTest(city: number) {
    const next = [...testChoices, city];
    setTestChoices(next);
    if (next.length === W_TEST.length) {
      setPhase("summary");
    } else {
      setRound(next.length);
    }
  }

  return (
    <div className="not-prose my-8 rounded-xl border border-border bg-background p-5 font-sans shadow-sm">
      {phase === "intro" && <Intro onStart={() => setPhase("training")} />}

      {phase === "training" && (
        <div className="space-y-4">
          <PhaseBar phase="Training · with feedback" round={round} total={W_TRAIN.length} />
          <p className="text-sm text-muted-foreground">
            Gem prices change each round. Pick the city you think sells for the most — you
            reveal a city&rsquo;s gem stock (and see the round&rsquo;s best city) once feedback
            comes in.
          </p>
          <div className="space-y-1.5">
            <span className="font-mono text-xs text-muted-foreground uppercase">
              This round&rsquo;s prices
            </span>
            <PriceBoard w={W_TRAIN[round]} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((c) => (
              <CityCard
                key={c}
                city={c}
                revealed={revealed[c]}
                disabled={feedback !== null}
                onClick={() => chooseTraining(c)}
                state={
                  !feedback
                    ? "idle"
                    : c === feedback.choice
                      ? "chosen"
                      : c === feedback.best
                        ? "best"
                        : "dimmed"
                }
              />
            ))}
          </div>
          {feedback && (
            <div className="space-y-3 rounded-lg bg-muted/60 p-4">
              <p className="text-sm">
                You sold in <strong>City {feedback.choice + 1}</strong> for{" "}
                <strong className={feedback.profit < 0 ? "text-rose-600 dark:text-rose-400" : ""}>
                  {money(feedback.profit)}
                </strong>
                .{" "}
                {feedback.choice === feedback.best ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    That was the best city this round.
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    The best was <strong>City {feedback.best + 1}</strong> at{" "}
                    {money(cityValues(W_TRAIN[round])[feedback.best])} (outlined in green).
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={nextTraining}
                className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                {round < W_TRAIN.length - 1 ? "Next round →" : "On to the test →"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "test" && (
        <div className="space-y-4">
          <PhaseBar phase="Test · no feedback" round={round} total={W_TEST.length} />
          <p className="text-sm text-muted-foreground">
            New prices you&rsquo;ve never seen — and no feedback this time. You know every
            city&rsquo;s gem stock now. Just pick where you&rsquo;d sell.
          </p>
          <div className="space-y-1.5">
            <span className="font-mono text-xs text-muted-foreground uppercase">
              New prices ({round + 1} of {W_TEST.length})
            </span>
            <PriceBoard w={W_TEST[round]} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((c) => (
              <CityCard
                key={c}
                city={c}
                revealed
                disabled={false}
                onClick={() => chooseTest(c)}
                state="idle"
              />
            ))}
          </div>
        </div>
      )}

      {phase === "summary" && <Summary testChoices={testChoices} onReset={reset} />}
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {GEMS.map((gem) => (
          <GemIcon key={gem.name} gem={gem} size={22} />
        ))}
      </div>
      <h4 className="text-lg font-medium">Play the gem collector</h4>
      <p className="text-sm leading-relaxed text-muted-foreground">
        You trade gems across four cities. Each city holds a fixed stock of three gem shapes;
        each round the market sets a price per shape, and your profit is the stock times the
        prices. First you&rsquo;ll <strong>train</strong> on four price lists with feedback,
        then face four <strong>new</strong> price lists with none. What you do on the test is
        the whole experiment.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Start training →
      </button>
    </div>
  );
}

function Summary({ testChoices, onReset }: { testChoices: number[]; onReset: () => void }) {
  const rows = testChoices.map((choice, i) => {
    const values = cityValues(W_TEST[i]);
    const reused = TRAIN_OPTIMAL.includes(choice);
    const mbBest = argmax(values);
    const reuseBest = betterReuseCity(values);
    return { i, choice, values, reused, mbBest, reuseBest };
  });
  const reuseCount = rows.filter((r) => r.reused).length;
  const reusePct = Math.round((100 * reuseCount) / rows.length);

  return (
    <div className="space-y-5">
      <PhaseBar phase="Your results" round={W_TEST.length} total={W_TEST.length} />
      <div>
        <p className="text-sm leading-relaxed">
          On the test you <strong>reused</strong> a training-optimal city (City 1 or City 4)
          on <strong>{reuseCount} of {rows.length}</strong> tasks ({reusePct}%). A fully
          model-based chooser would have <em>switched</em> every time to City 2 or City 3 —
          the objectively best-paying option under the new prices.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Across the study&rsquo;s 38 participants, 68.8% of test choices stayed within those
          two previously-optimal cities — even though switching paid slightly more. Reuse,
          not recomputation, was the rule.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-xs text-muted-foreground uppercase">
              <th className="py-2 pr-3 font-normal">Task</th>
              <th className="py-2 pr-3 font-normal">Your city</th>
              <th className="py-2 pr-3 font-normal">You did</th>
              <th className="py-2 pr-3 font-normal">Best reuse</th>
              <th className="py-2 font-normal">Objective best</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.i} className="border-b border-border/60">
                <td className="py-2 pr-3 tabular-nums">{r.i + 1}</td>
                <td className="py-2 pr-3">
                  City {r.choice + 1}{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    ({money(r.values[r.choice])})
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      r.reused
                        ? "bg-accent/15 text-accent"
                        : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                    }`}
                  >
                    {r.reused ? "Reused" : "Switched"}
                  </span>
                </td>
                <td className="py-2 pr-3 font-mono text-xs text-muted-foreground tabular-nums">
                  City {r.reuseBest + 1} · {money(r.values[r.reuseBest])}
                </td>
                <td className="py-2 font-mono text-xs text-muted-foreground tabular-nums">
                  City {r.mbBest + 1} · {money(r.values[r.mbBest])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
      >
        ↺ Play again
      </button>
    </div>
  );
}
