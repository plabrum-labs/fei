import { useCallback, useEffect, useRef, useState } from "react";
import { LinePlot, PlotLegend, type PlotDot } from "./plot";
import { StateGlyph } from "./StateGlyph";
import {
  MISS_REWARD,
  RT_DEADLINES,
  SAFETY_ACTION,
  blockStats,
  optimalKey,
  reward,
  rewardColor,
  type Deadline,
  type Trial,
} from "./banditModel";
import results from "../data/results.json";

// Fixed, reproducible trial orders — each state appears twice in training, three times in test.
const TRAIN_SEQ = [0, 1, 2, 3, 4, 5, 3, 0, 5, 2, 4, 1];
const TEST_SEQ = [2, 0, 4, 1, 5, 3, 0, 3, 1, 4, 2, 5, 4, 1, 0, 5, 3, 2];

// Action 0 is the safety key "E"; actions 1..6 are number keys.
const KEY_LABELS = ["E", "1", "2", "3", "4", "5", "6"];

function keyToAction(key: string): number | null {
  if (key === "e" || key === "E") return SAFETY_ACTION;
  const n = Number.parseInt(key, 10);
  return n >= 1 && n <= 6 ? n : null;
}

type Phase = "intro" | "train" | "test" | "summary";
interface Feedback {
  action: number; // -1 for a miss
  reward: number;
  correctKey: number; // 1..6
}

const money = (v: number) => (v < 0 ? `−${Math.abs(v).toFixed(2)}` : `+${v.toFixed(2)}`);

export function BanditTask() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [deadline, setDeadline] = useState<Deadline>(1);
  const [idx, setIdx] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [remaining, setRemaining] = useState(1);
  const answered = useRef(false);

  const reset = useCallback((toPhase: Phase) => {
    setIdx(0);
    setTrials([]);
    setFeedback(null);
    answered.current = false;
    setPhase(toPhase);
  }, []);

  // ---- training (self-paced, with feedback) ----
  function answerTrain(action: number) {
    if (feedback) return;
    const state = TRAIN_SEQ[idx];
    setFeedback({ action, reward: reward(state, action), correctKey: optimalKey(state) });
  }
  function nextTrain() {
    setFeedback(null);
    if (idx + 1 >= TRAIN_SEQ.length) reset("test");
    else setIdx(idx + 1);
  }

  // ---- test (deadline-enforced) ----
  const respond = useCallback(
    (action: number | null) => {
      if (answered.current) return;
      answered.current = true;
      const state = TEST_SEQ[idx];
      const r = action === null ? MISS_REWARD : reward(state, action);
      setFeedback({ action: action ?? -1, reward: r, correctKey: optimalKey(state) });
      setTrials((prev) => [...prev, { state, action: action ?? -1, reward: r }]);
    },
    [idx],
  );

  // deadline countdown via rAF: drives the bar and fires the miss at time-out
  useEffect(() => {
    if (phase !== "test" || feedback !== null) return;
    answered.current = false;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      setRemaining(Math.max(0, deadline - elapsed));
      if (elapsed >= deadline) {
        respond(null);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, idx, feedback, deadline, respond]);

  // after feedback flashes, advance to the next test trial (or the summary)
  useEffect(() => {
    if (phase !== "test" || feedback === null) return;
    const t = window.setTimeout(() => {
      setFeedback(null);
      if (idx + 1 >= TEST_SEQ.length) setPhase("summary");
      else setIdx(idx + 1);
    }, 800);
    return () => window.clearTimeout(t);
  }, [phase, feedback, idx]);

  // keyboard capture during the test
  useEffect(() => {
    if (phase !== "test") return;
    const onKey = (e: KeyboardEvent) => {
      const a = keyToAction(e.key);
      if (a !== null) respond(a);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, respond]);

  return (
    <div className="not-prose my-8 rounded-xl border border-border bg-background p-5 font-sans shadow-sm">
      {phase === "intro" && <Intro deadline={deadline} setDeadline={setDeadline} onStart={() => reset("train")} />}
      {phase === "train" && (
        <Training idx={idx} feedback={feedback} onAnswer={answerTrain} onNext={nextTrain} />
      )}
      {phase === "test" && (
        <Testing idx={idx} deadline={deadline} remaining={remaining} feedback={feedback} onAnswer={respond} />
      )}
      {phase === "summary" && (
        <Summary trials={trials} deadline={deadline} onReplay={(d) => { setDeadline(d); reset("test"); }} onRestart={() => reset("intro")} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function KeyPad({ onPress, disabled }: { onPress: (a: number) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[1, 2, 3, 4, 5, 6].map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onPress(k)}
          className="h-11 w-11 rounded-md border border-border bg-card font-mono text-lg font-medium transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40"
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onPress(SAFETY_ACTION)}
        className="h-11 rounded-md border border-dashed border-border bg-card px-3 font-mono text-sm font-medium transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40"
      >
        E · safe
      </button>
    </div>
  );
}

function Intro({
  deadline,
  setDeadline,
  onStart,
}: {
  deadline: Deadline;
  setDeadline: (d: Deadline) => void;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <StateGlyph key={s} state={s} size={40} />
        ))}
      </div>
      <h4 className="text-lg font-medium">Play the contextual bandit</h4>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Six images, seven keys. Each image has one <strong>correct</strong> key worth{" "}
        <strong>+1</strong>; press the wrong number and you lose <strong>−0.18</strong>. One key,{" "}
        <strong className="font-mono">E</strong>, is a <strong>safety key</strong>: it always pays{" "}
        a small <strong>+0.2</strong>, whatever the image. First you&rsquo;ll learn the mapping
        with feedback; then you&rsquo;ll be tested <strong>against a clock</strong> — miss the
        deadline and you get <strong>−1</strong>. Watch which keys you actually reach for when
        time is short.
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Test deadline:</span>
        <div className="flex gap-1.5">
          {RT_DEADLINES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDeadline(d)}
              className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                d === deadline ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/60"
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Learn the mapping →
      </button>
    </div>
  );
}

function Training({
  idx,
  feedback,
  onAnswer,
  onNext,
}: {
  idx: number;
  feedback: Feedback | null;
  onAnswer: (a: number) => void;
  onNext: () => void;
}) {
  const state = TRAIN_SEQ[idx];
  return (
    <div className="space-y-4">
      <PhaseBar phase="Training · with feedback" round={idx} total={TRAIN_SEQ.length} />
      <p className="text-sm text-muted-foreground">
        No clock yet. Press the key you think is correct for this image — feedback will show the
        right one.
      </p>
      <div className="flex flex-col items-center gap-4 py-2">
        <StateGlyph state={state} size={96} />
        {!feedback ? (
          <KeyPad onPress={onAnswer} />
        ) : (
          <div className="w-full space-y-3">
            <div className="rounded-lg p-3 text-center" style={{ background: `${rewardColor(feedback.reward)}22` }}>
              <span className="text-sm">
                You pressed <strong className="font-mono">{KEY_LABELS[feedback.action]}</strong> ·{" "}
                <strong style={{ color: rewardColor(feedback.reward) }}>{money(feedback.reward)}</strong>.{" "}
                {feedback.action === feedback.correctKey ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Correct key.</span>
                ) : feedback.action === SAFETY_ACTION ? (
                  <span className="text-muted-foreground">
                    Safe, but the +1 key here was <strong className="font-mono">{feedback.correctKey}</strong>.
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    The +1 key here was <strong className="font-mono">{feedback.correctKey}</strong>.
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={onNext}
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              {idx + 1 >= TRAIN_SEQ.length ? "Start the timed test →" : "Next →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Testing({
  idx,
  deadline,
  remaining,
  feedback,
  onAnswer,
}: {
  idx: number;
  deadline: Deadline;
  remaining: number;
  feedback: Feedback | null;
  onAnswer: (a: number) => void;
}) {
  const state = TEST_SEQ[idx];
  const frac = Math.max(0, Math.min(1, remaining / deadline));
  return (
    <div className="space-y-4">
      <PhaseBar phase={`Test · ${deadline}s deadline`} round={idx} total={TEST_SEQ.length} />
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-none"
          style={{ width: `${frac * 100}%`, background: frac > 0.3 ? "var(--accent)" : "#ef4444" }}
        />
      </div>
      <div className="flex flex-col items-center gap-4 py-2">
        <StateGlyph state={state} size={96} />
        {feedback ? (
          <div className="rounded-lg px-4 py-2 text-center" style={{ background: `${rewardColor(feedback.reward)}22` }}>
            <span className="text-sm">
              {feedback.action < 0 ? (
                <span className="text-rose-600 dark:text-rose-400">Too slow · −1.00</span>
              ) : (
                <>
                  <strong className="font-mono">{KEY_LABELS[feedback.action]}</strong> ·{" "}
                  <strong style={{ color: rewardColor(feedback.reward) }}>{money(feedback.reward)}</strong>
                </>
              )}
            </span>
          </div>
        ) : (
          <KeyPad onPress={onAnswer} />
        )}
      </div>
      <p className="text-center font-mono text-xs text-muted-foreground">
        Use the keyboard (1–6, or E) or tap. {remaining.toFixed(1)}s left.
      </p>
    </div>
  );
}

function Summary({
  trials,
  deadline,
  onReplay,
  onRestart,
}: {
  trials: Trial[];
  deadline: Deadline;
  onReplay: (d: Deadline) => void;
  onRestart: () => void;
}) {
  const stats = blockStats(trials);
  const full = results.experimentTask.full;
  const na = results.experimentTask.naFrontiers.find((f) => f.na === Math.max(1, stats.nActions));
  const human = results.paper.humanMeans;
  const hi = RT_DEADLINES.indexOf(deadline);

  const dots: PlotDot[] = [
    { x: human.policyComplexity[hi], y: human.reward[hi], color: "#94a3b8", r: 5, ring: true, label: "human avg" },
    { x: stats.policyComplexity, y: stats.meanReward, color: "#f59e0b", r: 7, ring: true, label: "you" },
  ];

  return (
    <div className="space-y-5">
      <PhaseBar phase="Your block" round={TEST_SEQ.length} total={TEST_SEQ.length} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="policy complexity" value={`${stats.policyComplexity.toFixed(2)} bits`} />
        <Stat label="distinct actions Nₐ" value={`${stats.nActions}`} />
        <Stat label="mean reward" value={stats.meanReward.toFixed(2)} />
        <Stat label="safety key" value={`${Math.round(stats.pSafety * 100)}%`} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">Where you landed</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Your block on the reward-complexity plane. The black curve is the best reward possible
          at each complexity. If you leaned on the safety key you sit low-left; if you tracked all
          six mappings you sit up-right — at the cost of a more complex, slower policy.
        </p>
        <LinePlot
          series={[
            { points: full.complexity.map((x: number, i: number) => ({ x, y: full.reward[i] })), color: "#0f172a", width: 2.5 },
            ...(na
              ? [{ points: na.max.complexity.map((x: number, i: number) => ({ x, y: na.max.reward[i] })), color: "#f59e0b", width: 1.5, dashed: true }]
              : []),
          ]}
          dots={dots}
          xDomain={[0, 2.7]}
          yDomain={[-0.1, 1.05]}
          xTicks={[0, 0.5, 1, 1.5, 2, 2.5]}
          yTicks={[0, 0.25, 0.5, 0.75, 1]}
          xLabel="Policy complexity  I(S;A)  (bits)"
          yLabel="Mean reward"
          height={300}
        />
        <PlotLegend
          items={[
            { color: "#0f172a", label: "Full-action frontier" },
            { color: "#f59e0b", label: `Frontier at Nₐ = ${Math.max(1, stats.nActions)}`, dashed: true },
            { color: "#94a3b8", label: `Human avg @ ${deadline}s` },
          ]}
        />
      </div>

      {stats.misses > 0 && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          You missed the deadline on {stats.misses} of {TEST_SEQ.length} trials (−1 each) — the
          time cost of a policy that is too complex for the clock.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Try another deadline:</span>
        {RT_DEADLINES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onReplay(d)}
            className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
              d === deadline ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent/60"
            }`}
          >
            {d}s
          </button>
        ))}
        <button
          type="button"
          onClick={onRestart}
          className="ml-auto rounded-md border border-border px-3 py-1 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          ↺ Restart
        </button>
      </div>
      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
        Policy complexity is the mutual information I(S;A) of your choices, estimated exactly as
        the paper does (Dirichlet-smoothed plug-in). Shorter deadlines push most people toward
        the safety key: lower complexity, lower reward — a rational retreat down the frontier.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
      <div className="font-mono text-lg font-medium tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}

function PhaseBar({ phase, round, total }: { phase: string; round: number; total: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <span className="font-mono text-xs tracking-[0.15em] text-accent uppercase">{phase}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {Math.min(round + 1, total)} / {total}
      </span>
    </div>
  );
}
