import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FOCUS, MEASURE, PRIMARY, SP, TYPE } from "./glass";
import { leaderLabel } from "../../../../functions/_lib/leaderLabel";
import { Check, CopyBlock, Field, PaneHead, WireNotice } from "./paneKit";
import HelpDoor from "./HelpDoor";
import {
  answerForSubject,
  MODELS_MEASURED_PATH,
  readModelsFile,
  type ModelsMeasuredFile,
  type SubjectCard,
} from "./EvidenceSubject";
import {
  determined,
  quotableWire,
  stateWord,
  useBoardWire,
  type WireAxis,
} from "./boardWire";
import { composeEvidenceIndex } from "./evidenceIndex";

/**
 * LobbyEvidencePane — the Evidence-pack workflow, NATIVE in Council OS.
 *
 * WHY THIS IS A PANE AND NOT A FRAMED PAGE. /gpai-evidence explains what an
 * evidence pack is. It cannot tell a reader what evidence actually exists for
 * THEIR system today, because that answer lives on the live board. This pane does
 * the work: name the system, tick the axes that bear on the claim, and it compiles
 * a real evidence index from GET /api/gspc — every row carrying the bank's
 * resolvable dataset_url, the leader, the item count, and whether the lead is
 * statistically separated or a tie.
 *
 * WHAT IT IS NOT. The index is compiled ON THIS DEVICE from the published board.
 * It is NOT itself signed, and it is not a certification, a conformity assessment,
 * or legal advice — the pane says so in the artefact it emits. The signed objects
 * are the per-axis cards, and they verify at /gspc-verify against the published
 * key without contacting us.
 *
 * THE HONESTY INVARIANTS, ENFORCED IN CODE, NOT IN COPY:
 *   · No board → no artefact. `WireNotice` renders instead. Nothing is compiled
 *     from a bundled snapshot (see boardWire.ts — there is deliberately none).
 *   · A row carries an accuracy ONLY when `quotableWire()` passes.
 *   · Every axis the reader leaves out, and every axis the board itself cannot
 *     quote, is NAMED in the artefact under `not_included` / `not_quotable` with
 *     its reason. An evidence index that silently omits is a misleading index.
 *   · Every count in the output is `.length` of a real array. Nothing is typed.
 *
 * RE-TEST 7 OCT 2026 — THE PANE ANSWERED THE WRONG QUESTION. A stranger who named a model
 * (qwen3:8b) got a JSON index of the board, whose rows name each axis's LEADER: other people's
 * models. The first screen now answers for the model they named, from the signed corpora
 * (EvidenceSubject.ts over /interop/models-measured.json), as a card: a status chip, the numbers,
 * one button, and the raw record behind a "Details" expander. If we hold nothing for it, the card
 * says so plainly. The board-wide index is still here, under "For developers", labelled as being
 * about the board and not about the named model. Its help buttons are HelpDoors: the Dashboard
 * renders this pane without an opener, and the old buttons threw on click and did nothing.
 */

type ModelsState =
  | { phase: "loading" }
  | { phase: "ready"; file: ModelsMeasuredFile }
  | { phase: "failed"; error: string };

/** Read the measured-models list once. Failure is said, never papered over with a guess. */
function useModelsMeasured(): ModelsState {
  const [state, setState] = useState<ModelsState>({ phase: "loading" });
  useEffect(() => {
    const ac = new AbortController();
    fetch(MODELS_MEASURED_PATH, { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`GET ${MODELS_MEASURED_PATH} → HTTP ${r.status}`);
        const ct = (r.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("text/html")) throw new Error(`GET ${MODELS_MEASURED_PATH} returned a page, not data`);
        return readModelsFile(await r.json());
      })
      .then((file) => setState({ phase: "ready", file }))
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setState({ phase: "failed", error: String((e as Error)?.message ?? e) });
      });
    return () => ac.abort();
  }, []);
  return state;
}

/** ?model= or ?subject= on the page URL pre-fills the question (a shareable ask). */
function initialSubject(): string {
  if (typeof window === "undefined") return "";
  try {
    const p = new URLSearchParams(window.location.search);
    return (p.get("model") || p.get("subject") || "").trim().slice(0, 200);
  } catch {
    return "";
  }
}

const CHIP_TONE: Record<SubjectCard["tone"], string> = {
  measured: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-700/25",
  own: "bg-slate-100 text-slate-800 ring-1 ring-slate-500/25",
  none: "bg-amber-50 text-amber-900 ring-1 ring-amber-700/25",
};

function SubjectAnswer({ card, onPick }: { card: SubjectCard; onPick: (id: string) => void }) {
  return (
    <section
      className="mt-5 rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm"
      aria-labelledby="coai-ev-answer-title"
      data-testid="evidence-answer"
      data-state={card.state}
    >
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold ${CHIP_TONE[card.tone]}`}
        data-testid="evidence-chip"
      >
        {card.chip}
      </span>
      <h3 id="coai-ev-answer-title" className="mt-2 break-words text-[18px] font-semibold text-slate-900">
        {card.subject ?? card.query}
      </h3>
      <p className={`mt-1.5 ${MEASURE} ${TYPE.body}`}>{card.sentence}</p>
      {card.numbers.length > 0 && (
        <dl className="mt-4 flex flex-wrap gap-3" data-testid="evidence-numbers">
          {card.numbers.map((n) => (
            <div key={n.label} className="min-w-[8.5rem] rounded-xl border border-slate-900/10 bg-slate-50 px-3.5 py-2.5">
              <dt className={TYPE.fine}>{n.label}</dt>
              <dd className="font-mono text-[22px] font-semibold tabular-nums text-slate-900">{n.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {card.pick.length > 0 && (
        <div className="mt-4">
          <p className={TYPE.fine}>{card.state === "ambiguous" ? "Which one do you mean?" : "Did you mean one of these?"}</p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {card.pick.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onPick(id)}
                  className={`min-h-11 rounded-lg border border-slate-900/12 bg-white px-3 py-1.5 font-mono text-[12px] text-slate-800 hover:bg-slate-900/5 ${FOCUS}`}
                >
                  {id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-5">
        <HelpDoor path={card.button.href} label={card.button.label} primary testId="evidence-action">
          {card.button.label}
        </HelpDoor>
      </div>
      <details className="mt-5 rounded-xl border border-slate-900/10 bg-white/80 px-4 py-2.5" data-testid="evidence-details">
        <summary className={`cursor-pointer text-[12.5px] font-semibold text-slate-800 ${FOCUS}`}>Details</summary>
        <p className={`mt-2 ${TYPE.fine}`}>
          The record this answer was read from, as published. Every number above is a field of it.
        </p>
        <CopyBlock text={JSON.stringify(card.details, null, 2)} label="the record · JSON" />
      </details>
    </section>
  );
}

function AxisRow({
  a,
  on,
  toggle,
}: {
  a: WireAxis;
  on: boolean;
  toggle: (v: boolean) => void;
}) {
  const word = stateWord(a);
  const tone =
    word === "separated"
      ? "bg-emerald-100 text-emerald-800"
      : word === "tie"
        ? "bg-lime-100 text-lime-900"
        : word === "untested"
          ? "bg-amber-100 text-amber-900"
          : "bg-slate-100 text-slate-600";
  return (
    <li className="rounded-xl border border-slate-900/10 bg-white/85 p-3">
      <Check id={`coai-ev-${a.axis}`} checked={on} onChange={toggle}>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900">
            {a.axis}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${tone}`}
          >
            {word}
          </span>
          <span className={TYPE.fine}>
            {a.bench}
            {a.n > 0 ? ` · n=${a.n}` : ""}
          </span>
        </span>
        <span className={`mt-1 block ${TYPE.fine}`}>{a.task || "—"}</span>
        {quotableWire(a) && (
          <span className="mt-1 block font-mono text-[11.5px] tabular-nums text-emerald-800">
            {leaderLabel(a.separation)} {(a.accuracy! * 100).toFixed(1)}
            {a.interval
              ? ` · 95% [${(a.interval[0] * 100).toFixed(1)}, ${(a.interval[1] * 100).toFixed(1)}]`
              : " · no interval published"}
            {typeof a.separation_p === "number"
              ? ` · McNemar p=${a.separation_p}`
              : ""}
          </span>
        )}
      </Check>
      {/* The bank link sits OUTSIDE the label: a link nested in a <label> both
          navigates and toggles the box, which is neither behaviour a reader asked for. */}
      {a.dataset_url ? (
        <a
          href={a.dataset_url}
          target="_blank"
          rel="noreferrer noopener"
          className={`mt-1.5 ml-[26px] inline-block font-mono text-[11px] text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 ${FOCUS}`}
        >
          {a.dataset_url}
        </a>
      ) : a.dataset ? (
        // The bank is named but not yet resolved to a URL by /api/gspc. Show the
        // slug — it is what the board published — and never build a link from it:
        // the axis are `governance`/`safety` while the banks are `gspc-gov`/`gspc-agi`,
        // so a constructed URL 401s.
        <span className={`mt-1.5 ml-[26px] block ${TYPE.fine}`}>
          bank{" "}
          <code className="font-mono text-[11px] text-slate-700">
            {a.dataset}
          </code>{" "}
          · no resolvable URL published yet
        </span>
      ) : (
        <span className={`mt-1.5 ml-[26px] block ${TYPE.fine}`}>
          no bank published for this axis
        </span>
      )}
    </li>
  );
}

export default function LobbyEvidencePane({
  onOpenRoute,
}: {
  onOpenRoute?: (path: string, label: string) => void;
}) {
  const wire = useBoardWire();
  const models = useModelsMeasured();
  const [query, setQuery] = useState(initialSubject);
  /** The question as last asked (Enter or the button); the card answers this, not every keystroke. */
  const [asked, setAsked] = useState(initialSubject);
  const answer = useMemo(
    () => (models.phase === "ready" && asked.trim() ? answerForSubject(asked, models.file) : null),
    [models, asked],
  );
  const ask = (e?: FormEvent) => {
    e?.preventDefault();
    setAsked(query.trim());
  };
  const pick = (id: string) => {
    setQuery(id);
    setAsked(id);
  };
  // The board-wide index (For developers) is about the board, so it no longer takes the model
  // the reader named above: printing that name over other models' rows was the defect.
  const system = "";
  const provider = "";
  /** axis -> included. Seeded once, from the board, to every quotable+determined axis. */
  const [picked, setPicked] = useState<Record<string, boolean> | null>(null);

  // Was `const axis = …` while every reader below said `axes` — a ReferenceError that took the
  // whole Evidence pack pane down to the error boundary (Council OS overlay and Dashboard alike).
  const axes = wire.phase === "ready" ? wire.board.axes : [];
  const selection = useMemo<Record<string, boolean>>(() => {
    if (picked) return picked;
    const seed: Record<string, boolean> = {};
    for (const a of axes) seed[a.axis] = quotableWire(a) && determined(a);
    return seed;
  }, [picked, axes]);

  const setAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    for (const a of axes) next[a.axis] = v;
    setPicked(next);
  };
  const toggle = (axis: string, v: boolean) =>
    setPicked({ ...selection, [axis]: v });

  const included = axes.filter((a) => selection[a.axis]);
  const notIncluded = axes.filter((a) => !selection[a.axis]);
  const notQuotable = axes.filter((a) => !quotableWire(a) || !determined(a));

  const artefact = useMemo(() => {
    if (wire.phase !== "ready" || included.length === 0) return "";
    // Composed by a PURE function so the honesty invariants are enforced by a
    // test rather than by reading JSX — see evidenceIndex.ts / evidenceIndex.test.ts.
    return JSON.stringify(
      composeEvidenceIndex({
        board: wire.board,
        included,
        system,
        provider,
        now: new Date().toISOString(),
      }),
      null,
      2,
    );
  }, [wire, included, system, provider]);

  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <PaneHead eyebrow="Evidence pack" title="What evidence do we hold for your model?">
        Type a model&apos;s name. We look it up in the signed measurements we have published and
        answer for that model only, or tell you plainly that we hold nothing for it yet. We
        measure; we do not certify.
      </PaneHead>

      <form onSubmit={ask} className="mt-5 flex flex-wrap items-end gap-3" role="search" aria-label="Look up a model">
        <div className="min-w-0 flex-1 basis-64">
          <Field
            id="coai-ev-system"
            label="Model name"
            hint="As you would write it: qwen3:8b, or a Hugging Face name such as Qwen/Qwen3-8B."
            value={query}
            onChange={setQuery}
            placeholder="e.g. qwen3:8b"
          />
        </div>
        <button type="submit" className={`${PRIMARY} min-h-11 px-4 py-2 text-[13px]`} data-testid="evidence-ask">
          Look it up
        </button>
      </form>

      {models.phase === "loading" && asked.trim() && (
        <p className={`mt-5 rounded-xl border border-slate-900/10 bg-white/80 px-4 py-3 ${TYPE.muted}`} role="status">
          Looking it up…
        </p>
      )}
      {models.phase === "failed" && (
        <div className="mt-5 rounded-xl border border-amber-600/35 bg-amber-50 px-4 py-3.5" role="status">
          <p className="text-[13px] font-semibold text-amber-900">The list of measured models did not load.</p>
          <p className={`mt-1.5 ${MEASURE} text-[12px] leading-relaxed text-amber-900/90`}>
            So we cannot say what we hold for a model right now, and we show nothing rather than a
            guess.
          </p>
          <p className="mt-2 font-mono text-[11px] text-amber-900/80">{models.error}</p>
        </div>
      )}
      {answer && <SubjectAnswer card={answer} onPick={pick} />}
      {!answer && models.phase !== "failed" && !asked.trim() && (
        <p className={`mt-4 ${MEASURE} ${TYPE.muted}`}>
          The answer is a short card: whether we hold signed measurements for that model, how many,
          and one place to go next. The raw record sits behind “Details”.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        <HelpDoor path="/gpai-evidence" label="GPAI Evidence Pack" onOpenRoute={onOpenRoute} testId="evidence-help-what">
          What an evidence pack is for
        </HelpDoor>
        <HelpDoor path="/gspc-verify" label="Verify a card" onOpenRoute={onOpenRoute} testId="evidence-help-verify">
          Check a signed card yourself
        </HelpDoor>
        <HelpDoor path="/methodology" label="Methodology" onOpenRoute={onOpenRoute} testId="evidence-help-method">
          How we measure
        </HelpDoor>
      </div>

      <details className="mt-8 rounded-2xl border border-slate-900/10 bg-white/85 px-5 py-3" data-testid="evidence-board-index">
        <summary className={`cursor-pointer text-[13px] font-semibold text-slate-900 ${FOCUS}`}>
          For developers: an index of the whole live board
        </summary>
        <p className={`mt-2 ${MEASURE} ${TYPE.muted}`}>
          This index is about the board, not about the model above. Each row names the model that
          leads that axis, which is usually someone else&apos;s model. Tick the axes to include; every
          axis left out is still named in the output.
        </p>
      {wire.phase !== "ready" ? (
        <WireNotice
          phase={wire.phase}
          error={wire.phase === "failed" ? wire.error : undefined}
        />
      ) : (
        <>
          <p
            className={`mt-4 rounded-xl border border-slate-900/10 bg-white/80 px-4 py-2.5 ${TYPE.muted}`}
          >
            Live board · {wire.board.publicCount || "counts from GET /api/gspc"}{" "}
            · measured on {wire.board.measuredOn || "—"}
          </p>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className={TYPE.section}>Axes on the live board</h3>
              <p className={`mt-1 ${MEASURE} ${TYPE.muted}`}>
                Seeded to the axes the board can quote today. Untested and
                unmeasured axes are listed too — include one and the output
                carries its state and its reason, never a number.
              </p>
            </div>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => setAll(true)}
                className={`rounded-lg border border-slate-900/12 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setAll(false)}
                className={`rounded-lg border border-slate-900/12 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
              >
                None
              </button>
            </span>
          </div>

          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {wire.board.axes.map((a) => (
              <AxisRow
                key={a.axis}
                a={a}
                on={!!selection[a.axis]}
                toggle={(v) => toggle(a.axis, v)}
              />
            ))}
          </ul>

          <div className="mt-8 mb-2 rounded-2xl border border-slate-900/10 bg-white/90 p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">
              The board index
            </h3>
            {included.length === 0 ? (
              <p className={`mt-2 ${MEASURE} ${TYPE.body}`}>
                Nothing is selected, so nothing is compiled. Tick at least one
                axis above.
              </p>
            ) : (
              <>
                <p className={`mt-2 ${MEASURE} ${TYPE.body}`}>
                  {included.length} axis row{included.length === 1 ? "" : "s"}{" "}
                  included, {notIncluded.length} named as left out,{" "}
                  {notQuotable.length} named as not quotable on this board.
                  Counts are the arrays' own lengths.
                </p>
                <CopyBlock text={artefact} label="board index · JSON" />
              </>
            )}
          </div>
        </>
      )}
      </details>
    </div>
  );
}
