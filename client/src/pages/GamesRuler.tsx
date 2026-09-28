import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Lock, RotateCcw, Ruler as RulerIcon } from "lucide-react";
import bankData from "@/data/ruler-jail-goldbank.json";
import {
  RULER_ROUND_SIZE,
  betSetup,
  clearSession,
  loadSession,
  newSeed,
  pickRound,
  saveSession,
  scoreBet,
  summarizeRound,
  type RoundAnswer,
  type RulerItem,
  type RulerLabel,
  type Seat,
} from "@/lib/ruler";
import {
  RULER_ADMISSION_PRECONDITIONS,
  RULER_CONSENT_COPY,
  RULER_HUMAN_ADMISSION_ENABLED,
  RULER_NOTHING_SENT_LINE,
} from "@/lib/rulerAdmission";

/**
 * THE RULER — GAMES_SLATE slot 2, local-only.
 *
 * The player labels a code cell from the frozen public jail goldbank, sees the bank's gold label
 * and the published model answers for that item (only from signed per-item evidence), and bets
 * which of two answers was the model's. Scoring is exact match in the browser. Nothing leaves the
 * page: this file makes no network call, and the admission path in rulerAdmission.ts is off.
 */

const ITEMS = bankData.items as RulerItem[];
const LABEL_TEXT: Record<RulerLabel, string> = {
  ESCAPE: "ESCAPE — tries to leave the sandbox",
  BENIGN: "BENIGN — stays inside the sandbox",
};

type Phase = "intro" | "label" | "bet" | "reveal" | "done";

function sessionStore(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function Chip({ ok, children }: { ok: boolean | null; children: ReactNode }) {
  const tone =
    ok === null ? "border-gray-300 bg-gray-50 text-gray-700" : ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{children}</span>;
}

export default function GamesRuler() {
  const [seed, setSeed] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, RoundAnswer>>({});
  const [phase, setPhase] = useState<Phase>("intro");
  const [pendingLabel, setPendingLabel] = useState<RulerLabel | null>(null);
  const [revealId, setRevealId] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ seed: string; answered: number } | null>(null);

  useEffect(() => {
    const s = loadSession(sessionStore());
    if (s) setSaved({ seed: s.seed, answered: Object.keys(s.answers).length });
  }, []);

  const round = useMemo(() => (seed ? pickRound(ITEMS, seed, RULER_ROUND_SIZE) : []), [seed]);
  const nextIndex = round.findIndex((item) => !answers[item.id]);
  const current = phase === "reveal" ? round.find((item) => item.id === revealId) ?? null : nextIndex >= 0 ? round[nextIndex] : null;
  const setup = current && seed ? betSetup(current, seed) : null;
  const summary = seed ? summarizeRound(round, answers, seed) : null;

  function persist(nextSeed: string, nextAnswers: Record<string, RoundAnswer>) {
    saveSession(sessionStore(), { seed: nextSeed, answers: nextAnswers });
  }

  function start(fromSeed?: string) {
    const s = fromSeed ?? newSeed();
    const restored = fromSeed ? loadSession(sessionStore())?.answers ?? {} : {};
    setSeed(s);
    setAnswers(restored);
    setPendingLabel(null);
    setRevealId(null);
    setSaved(null);
    persist(s, restored);
    const r = pickRound(ITEMS, s, RULER_ROUND_SIZE);
    setPhase(r.every((item) => restored[item.id]) ? "done" : "label");
  }

  function chooseLabel(label: RulerLabel) {
    setPendingLabel(label);
    setPhase("bet");
  }

  function commit(bet: Seat | null) {
    if (!current || !seed || !pendingLabel) return;
    const next = { ...answers, [current.id]: { label: pendingLabel, bet } };
    setAnswers(next);
    persist(seed, next);
    setRevealId(current.id);
    setPendingLabel(null);
    setPhase("reveal");
  }

  function advance() {
    setRevealId(null);
    setPhase(round.every((item) => answers[item.id]) ? "done" : "label");
  }

  function reset() {
    clearSession(sessionStore());
    setSeed(null);
    setAnswers({});
    setPhase("intro");
    setSaved(null);
  }

  const answeredCount = round.filter((item) => answers[item.id]).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Games · slot 2 · local practice</p>
        <h1 className="mt-3 flex items-center gap-3 text-4xl font-black tracking-tight text-gray-900">
          <RulerIcon aria-hidden="true" className="h-8 w-8 text-emerald-700" />
          The Ruler
        </h1>
        <p className="mt-4 max-w-3xl text-gray-700">
          Label a code cell as a sandbox <strong>ESCAPE</strong> or <strong>BENIGN</strong>. Then see the bank’s gold label and
          the published model answers for that item, and bet which of two answers came from a model. Your label is compared to
          the gold label by exact match. No model grades you, and no model grades another.
        </p>

        <p
          role="note"
          data-testid="ruler-nothing-sent"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-700/30 bg-emerald-900 p-4 text-sm font-semibold text-white"
        >
          <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{RULER_NOTHING_SENT_LINE}</span>
        </p>

        {phase === "intro" && (
          <section aria-labelledby="ruler-what" className="mt-8 rounded-2xl border border-emerald-600/20 bg-white p-6 shadow-sm">
            <h2 id="ruler-what" className="text-lg font-bold text-gray-900">What you are playing</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Items:</strong> the frozen public bank{" "}
                <a className="font-semibold text-emerald-800 underline" href="https://huggingface.co/datasets/csoai/gspc-jail-goldbank" rel="noopener noreferrer" target="_blank">
                  {bankData.bank.dataset}
                </a>{" "}
                ({bankData.bank.rows} items, each with a gold label). {ITEMS.length} are playable here;{" "}
                {bankData.withheld.length} are withheld because their sample code carries an internal project name. The bank
                itself is not edited.
              </li>
              <li className="break-all">
                <strong>Bank SHA-256:</strong> <span className="font-mono text-xs">{bankData.bank.sha256}</span>
              </li>
              <li>
                <strong>Model answers:</strong> only from the signed per-item evidence{" "}
                <a className="font-semibold text-emerald-800 underline" href={bankData.evidence.path}>
                  jail-peritem-v3.json
                </a>{" "}
                (as of {bankData.evidence.as_of}; Ed25519, checked when this page was built), covering{" "}
                {bankData.evidence.models.join(" and ")}. Where that file records no usable answer, the page says so.
              </li>
              <li>
                <strong>The bet:</strong> two seats labelled each item. One is a published model answer. The other is a
                simulated seat, a seeded coin, which is not a person and not a model. You pick which seat was the model.
              </li>
              <li>
                <strong>A round:</strong> {RULER_ROUND_SIZE} items picked by a round seed. The same seed gives the same items
                and the same seats. Progress is kept in this tab only (sessionStorage) and is gone when the tab closes.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => start()}
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Start a round of {RULER_ROUND_SIZE}
              </button>
              {saved && (
                <button
                  type="button"
                  onClick={() => start(saved.seed)}
                  className="rounded-xl border border-emerald-700 px-5 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Resume round {saved.seed} ({saved.answered} answered)
                </button>
              )}
            </div>
          </section>
        )}

        {seed && phase !== "intro" && (
          <p className="mt-6 text-sm text-gray-600">
            Round seed <span className="font-mono font-semibold text-gray-900">{seed}</span> · {answeredCount} of {round.length} answered
          </p>
        )}

        {current && (phase === "label" || phase === "bet") && (
          <section aria-labelledby="ruler-item" className="mt-4 rounded-2xl border border-emerald-600/20 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Item {nextIndex + 1} of {round.length} · <span className="font-mono normal-case tracking-normal">{current.id}</span>
            </p>
            <h2 id="ruler-item" className="mt-2 text-lg font-bold text-gray-900">{bankData.bank.instruction}</h2>
            <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
              <code>{current.code}</code>
            </pre>

            {phase === "label" && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(["ESCAPE", "BENIGN"] as const).map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => chooseLabel(label)}
                    className="rounded-xl border-2 border-emerald-700 px-4 py-3 text-left text-sm font-bold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {LABEL_TEXT[label]}
                  </button>
                ))}
              </div>
            )}

            {phase === "bet" && setup && (
              <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm text-gray-900">
                  You said <strong>{pendingLabel}</strong>. Now the bet: <strong>which answer was the model’s?</strong>
                </p>
                {setup.kind === "bet" ? (
                  <>
                    <p className="mt-1 text-xs text-gray-700">
                      One seat is a published model answer from signed evidence. The other is a simulated seat: a seeded coin,
                      not a person and not a model.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(["A", "B"] as const).map((seat) => (
                        <button
                          key={seat}
                          type="button"
                          onClick={() => commit(seat)}
                          className="rounded-xl border-2 border-amber-600 bg-white px-4 py-3 text-left text-sm font-bold text-gray-900 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          Seat {seat} said {setup.seats[seat]} — this was the model
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-gray-800">
                      {setup.kind === "indistinguishable"
                        ? `Both seats said ${setup.label}, so there is nothing to tell apart. This bet is not scored.`
                        : setup.reason}
                    </p>
                    <button
                      type="button"
                      onClick={() => commit(null)}
                      className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      Reveal the gold label
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {phase === "reveal" && current && seed && (
          <RevealCard item={current} answer={answers[current.id]} seed={seed} onNext={advance} last={round.every((item) => answers[item.id])} />
        )}

        {phase === "done" && summary && (
          <section aria-labelledby="ruler-done" className="mt-4 rounded-2xl border border-emerald-600/20 bg-white p-6 shadow-sm">
            <h2 id="ruler-done" className="text-lg font-bold text-gray-900">Round finished</h2>
            <p className="mt-1 text-sm text-gray-600">
              Each line below is its own figure over the same {summary.items} items. They are shown side by side and never
              combined. {summary.items} items is a practice round, well below the 30-item threshold a published cell needs.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-600/20 p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">You · local, not recorded</dt>
                <dd className="mt-1 text-2xl font-black text-gray-900">
                  {summary.labelCorrect} of {summary.labelled}
                </dd>
                <dd className="text-sm text-gray-600">labels match gold</dd>
                <dd className="mt-2 text-sm text-gray-700">
                  Bets: {summary.betsCorrect} of {summary.betsScored} scored bets right; {summary.betsUnscored} not scored.
                </dd>
              </div>
              {summary.models.map((m) => (
                <div key={m.model} className="rounded-xl border border-gray-200 p-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">{m.model} · published, signed</dt>
                  <dd className="mt-1 text-2xl font-black text-gray-900">
                    {m.correct} of {m.answered}
                  </dd>
                  <dd className="text-sm text-gray-600">
                    published answers match gold{m.noAnswer > 0 ? `; ${m.noAnswer} with no usable answer recorded` : ""}
                  </dd>
                </div>
              ))}
              <div className="rounded-xl border border-dashed border-gray-300 p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">Trivial baseline</dt>
                <dd className="mt-1 text-2xl font-black text-gray-900">
                  {summary.alwaysEscapeCorrect} of {summary.items}
                </dd>
                <dd className="text-sm text-gray-600">answering ESCAPE on every item</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => start()}
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Play another round
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" /> Clear and go back
              </button>
            </div>
          </section>
        )}

        <AdmissionPreview />
      </div>
    </main>
  );
}

function RevealCard({ item, answer, seed, onNext, last }: { item: RulerItem; answer: RoundAnswer | undefined; seed: string; onNext: () => void; last: boolean }) {
  const setup = betSetup(item, seed);
  const outcome = scoreBet(answer?.bet ?? null, setup);
  const models = Object.keys(item.model_answers).sort();
  return (
    <section aria-labelledby="ruler-reveal" className="mt-4 rounded-2xl border border-emerald-600/20 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
        Reveal · <span className="font-mono normal-case tracking-normal">{item.id}</span>
      </p>
      <h2 id="ruler-reveal" className="mt-2 text-2xl font-black text-gray-900">
        Gold label: {item.gold}
      </h2>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-800">
        You said <strong>{answer?.label}</strong>
        <Chip ok={answer ? answer.label === item.gold : null}>{answer?.label === item.gold ? "matches gold" : "does not match gold"}</Chip>
      </p>
      <p className="mt-3 text-sm text-gray-700">
        <span className="font-semibold">Why, in the bank’s words:</span> {item.note}
      </p>

      <h3 className="mt-5 text-sm font-bold text-gray-900">Published model answers for this item</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {models.map((model) => {
          const published = item.model_answers[model];
          return (
            <li key={model} className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-gray-800">{model}</span>
              {published ? (
                <>
                  <span className="font-semibold text-gray-900">{published}</span>
                  <Chip ok={published === item.gold}>{published === item.gold ? "matches gold" : "does not match gold"}</Chip>
                </>
              ) : (
                <span className="text-gray-600">no usable answer recorded in the signed evidence</span>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="mt-5 text-sm font-bold text-gray-900">Your bet</h3>
      <p className="mt-1 text-sm text-gray-800">
        {setup.kind === "bet" ? (
          <>
            Seat {setup.modelSeat} was <span className="font-mono">{setup.model}</span> (published answer). Seat{" "}
            {setup.modelSeat === "A" ? "B" : "A"} was the simulated seat.{" "}
            <Chip ok={outcome === "correct"}>{outcome === "correct" ? "you picked the model" : "you picked the simulated seat"}</Chip>
          </>
        ) : (
          <>Not scored: {setup.kind === "indistinguishable" ? "both seats gave the same label." : "no published model answer for this item."}</>
        )}
      </p>

      <button
        type="button"
        onClick={onNext}
        className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {last ? "See the round" : "Next item"}
      </button>
    </section>
  );
}

function AdmissionPreview() {
  return (
    <section aria-labelledby="ruler-admission" className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
        Human results · {RULER_HUMAN_ADMISSION_ENABLED ? "open" : "off"}
      </p>
      <h2 id="ruler-admission" className="mt-2 text-lg font-bold text-gray-900">{RULER_CONSENT_COPY.title}</h2>
      <p className="mt-2 text-sm font-semibold text-gray-900">{RULER_CONSENT_COPY.offNotice}</p>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-emerald-800">Read the draft consent screen</summary>
        <div className="mt-3 space-y-3 text-sm text-gray-700">
          <p>{RULER_CONSENT_COPY.lead}</p>
          {RULER_CONSENT_COPY.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-gray-900">What would be sent</p>
              <ul className="mt-1 list-disc pl-5">
                {RULER_CONSENT_COPY.sends.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900">What is never sent</p>
              <ul className="mt-1 list-disc pl-5">
                {RULER_CONSENT_COPY.neverSends.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <label className="flex items-start gap-2 text-gray-500">
            <input type="checkbox" disabled className="mt-1" />
            <span>{RULER_CONSENT_COPY.checkbox}</span>
          </label>
          <button type="button" disabled aria-disabled="true" className="cursor-not-allowed rounded-xl bg-gray-300 px-4 py-2 text-sm font-bold text-gray-600">
            Contribute this round (off)
          </button>
          <p className="font-semibold text-gray-900">Before this can open</p>
          <ul className="list-disc pl-5">
            {RULER_ADMISSION_PRECONDITIONS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
