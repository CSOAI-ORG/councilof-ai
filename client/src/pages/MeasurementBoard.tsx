import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import {
  AXIS_SETS,
  BOARD_FALLBACK,
  CARD_AXIS_ALIASES,
  fetchPublishedSet,
  rowHasCardQuestion,
  rowVerifyTarget,
  type AxisRow,
  type AxisSet,
  type LoadedSet,
} from "@/data/axis-sets";
import { GAP_BY_AXIS } from "./GSPCGapMap";
import { verifyCardHref } from "@/lib/cardParam";
import { isOwnModel, ROWS_RECORD_SIGNED_URL } from "@/lib/livingBoard";
import LivingBoard, { BoardFreshness } from "@/components/gspc/LivingBoard";
import BoardField from "@/components/gspc/BoardField";
// The generated per-axis model rankings (schema csoai.axis-rankings/0.1), built by
// scripts/build-axis-rankings.py from the published per-item rows plus the dated
// frontier run. Every leaderboard number below renders from this artifact — the
// same nothing-typed rule as the rest of the page. The ?url import gives the
// verify footnote a link to the exact deployed bytes.
import axisRankingsDoc from "@/data/axis-rankings.json";
import axisRankingsUrl from "@/data/axis-rankings.json?url";

/**
 * /board — one board a person can actually navigate.
 *
 * ── THE COMPLAINT THIS PAGE ANSWERS ──────────────────────────────────────────
 * This estate publishes seven separately-counted axis sets. Each count is honest
 * on its own. Together they were incoherent, because a visitor met exactly one of
 * them and had no route to the other six: no way to learn what each measured,
 * over what, when, or why the numbers differ. A reader who saw "22" and then "16"
 * somewhere else had every reason to conclude one of them was a lie.
 *
 * The rule this estate already keeps in its data — every count names its set —
 * is made true in the INTERFACE here, not just in a JSON comment.
 *
 * ── WHAT IS BORROWED, AND FROM WHOM ──────────────────────────────────────────
 * The information architecture follows OpenRouter's rankings and models pages:
 * pick a domain before you meet a number; set sizes shown ON the tab so the
 * reader sees how big each set is before clicking; freshness stated as data
 * provenance rather than render time; dense sortable tables where every row
 * links to the thing itself; a density toggle; filters as first-class controls.
 *
 * The pattern that matters most is their closing section on what their rankings
 * do NOT establish, published in plain language on the same page as the numbers.
 * Every set below carries its own version of that, inline — not in a footnote and
 * not on a separate methodology page. Where we can go further than a commercial
 * router is only afterwards: our numbers resolve to a signed card a stranger can
 * check offline. That claim is worth nothing until the limits are stated first.
 *
 * ── NO COUNT ON THIS PAGE IS TYPED ───────────────────────────────────────────
 * Every number renders from an artifact: /api/gspc, /api/state, or the published
 * JSON each set names as its own authority. Counts are `rows.length` over data
 * that was fetched. If an artifact changes, this page changes. Grep it for an
 * integer standing in for a count and you will not find one.
 */

// ───────────────────────────────────────────────────────────── plain language

interface TermDef {
  term: string;
  short: string;
}

/** Jargon that survives on this page is defined in place. A word not in here
 *  should not be on the page. */
const GLOSSARY: TermDef[] = [
  {
    term: "axis",
    short:
      "A named area we aim to measure. Read its subject, scope and status before comparing results.",
  },
  {
    term: "measured",
    short:
      "A real run happened: inputs were evaluated by the row's declared fixed rule and a run artifact was published. Signature state is separate: some artifacts are signed and some are content-addressed but unsigned.",
  },
  {
    term: "unmeasured",
    short:
      "An axis or slot is declared, but no qualifying measurement is published for it. Plans and supporting work do not count as a measured result.",
  },
  {
    term: "n",
    short:
      "The number of observations included in the result. Interpret it alongside the sampling method, exclusions and reported uncertainty.",
  },
  {
    term: "confidence range",
    short:
      "An interval describing uncertainty around a run's estimated score under its stated method. Interval overlap alone does not decide a comparison; read the published comparison result.",
  },
  {
    term: "separated",
    short:
      "The published comparison found evidence of a difference under its stated test. TIE does not establish a difference or prove equality. UNTESTED establishes no eligible comparison. Neither supplies a winner.",
  },
  {
    term: "signed card",
    short:
      "A compact measurement record with a cryptographic signature that can be verified offline using the published verification key. A valid signature establishes integrity, not the correctness of the result.",
  },
  {
    term: "frozen bank",
    short:
      "The exact set of questions used, published and unchanged, so that anyone can ask a model the same questions and compare.",
  },
];

function Term({ children, def }: { children: React.ReactNode; def: string }) {
  return (
    <span
      title={def}
      className="cursor-help border-b border-dotted border-gray-400 decoration-dotted"
    >
      {children}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────── formatting

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function formatHeadline(row: AxisRow): string {
  if (row.headline === null) return "—";
  if (row.headlineFormat === "pct") return row.headlineCount ? `${pct(row.headline)} (${row.headlineCount})` : pct(row.headline);
  if (row.headlineFormat === "elo") return row.headline.toFixed(0);
  return String(row.headline);
}

const STATUS_STYLE: Record<string, string> = {
  MEASURED: "bg-emerald-50 text-emerald-800 border-emerald-300",
  UNMEASURED: "bg-amber-50 text-amber-900 border-amber-300",
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
  SPEC: "bg-gray-100 text-gray-700 border-gray-300",
  PLANNED: "bg-gray-100 text-gray-700 border-gray-300",
};

const SEPARATION_PLAIN: Record<string, string> = {
  SEPARATED: "The published test supports a difference for the compared models.",
  TIE: "This comparison did not establish a difference. It does not prove the models are equal.",
  UNTESTED: "No eligible comparison is established for this published result.",
};

// ──────────────────────────────────────────────────────────────── the loader

type SetState =
  | { phase: "loading" }
  | { phase: "ready"; data: LoadedSet }
  | { phase: "error"; message: string; data: LoadedSet };

/** The gap map keeps its numbers in the page that renders them rather than in a
 *  JSON artifact. Rather than typing them a second time here — the exact defect
 *  this page is a defence against — the same table is imported and handed to the
 *  set's own loader. One source, two renderings. */
const GAP_MAP_INPUT = {
  by_axis: GAP_BY_AXIS,
  names: {
    G: "Governance provisions",
    S: "Safety provisions",
    P: "Provenance provisions",
    C: "Continuity provisions",
    care_cost: "Cost-of-care lens",
  },
  aside: [
    {
      label: "What a cell is",
      value:
        "One enumerated provision of law crossed with one theme. A cell counts as covered only if some published instrument measures that provision at that granularity — ours or anyone else's.",
    },
  ],
};

const EMPTY: LoadedSet = {
  rows: [],
  asOf: null,
  asOfField: null,
  aside: [],
  live: false,
  provenance: "This set's artifact did not answer, so no rows are drawn.",
};

/** ONE hook that loads EVERY set, so the tabs can carry their own sizes before a
 *  reader clicks — the reader should see how big each set is before deciding
 *  which to open. Loading them one hook per set would put a hook inside a loop;
 *  they are loaded together into one keyed state instead. */
function useAllSets(): Record<string, SetState> {
  const [states, setStates] = useState<Record<string, SetState>>(() =>
    Object.fromEntries(AXIS_SETS.map((s) => [s.id, { phase: "loading" } as SetState])),
  );

  useEffect(() => {
    let cancelled = false;
    const put = (id: string, next: SetState) => {
      if (cancelled) return;
      setStates((prev) => ({ ...prev, [id]: next }));
    };

    for (const set of AXIS_SETS) {
      if (!set.fetchUrl) {
        const raw = set.id === "gap-map" ? GAP_MAP_INPUT : undefined;
        try {
          put(set.id, { phase: "ready", data: set.load(raw) });
        } catch (e) {
          put(set.id, { phase: "error", message: String(e), data: EMPTY });
        }
        continue;
      }
      fetchPublishedSet(set)
        .then((data) => put(set.id, { phase: "ready", data }))
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          put(set.id, {
            phase: "error",
            message,
            data:
              set.id === "board"
                ? BOARD_FALLBACK(
                    "The live board endpoint did not answer and its signed fallback was not eligible " +
                      `for current use (${message}). No rows are drawn. The dated figure below is only ` +
                      "a recorded observation; GET /api/gspc remains the authority.",
                  )
                : EMPTY,
          });
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return states;
}

/** The signed card index, fetched once for the whole page and indexed by the
 *  axis slug each card records. A board row reaches its cards from here, so the
 *  path from a headline number to a signature is: open the row, open the card. */
export interface CardRef {
  card: string;
  axis: string;
  ts: string;
  kid?: string;
}
function useCardsByAxis(): Record<string, CardRef[]> {
  const [byAxis, setByAxis] = useState<Record<string, CardRef[]>>({});
  useEffect(() => {
    let cancelled = false;
    fetch("/signed/card_index.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || !Array.isArray(d.cards)) return;
        const out: Record<string, CardRef[]> = {};
        for (const c of d.cards as CardRef[]) (out[c.axis] ||= []).push(c);
        setByAxis(out);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return byAxis;
}

// ────────────────────────────────────────────────────────── the set switcher

function SetTab({
  set,
  active,
  count,
  measured,
  onClick,
}: {
  set: AxisSet;
  active: boolean;
  count: number | null;
  measured: number | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={`set-tab-${set.id}`}
      aria-pressed={active}
      className={[
        "flex min-w-0 flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left transition",
        active
          ? "border-emerald-500 bg-emerald-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-400",
      ].join(" ")}
    >
      <span className="text-sm font-semibold text-gray-900">{set.name}</span>
      <span className="font-mono text-[11px] text-gray-600">
        {count === null ? (
          <span className="text-gray-400">loading…</span>
        ) : (
          <>
            {count} rows
            {measured !== null && (
              <>
                {" · "}
                <span className={measured > 0 ? "text-emerald-700" : "text-amber-700"}>
                  {measured} with a measurement
                </span>
              </>
            )}
          </>
        )}
      </span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────── the row detail

/** A row's signed cards, newest first. Only the honest mappings in CARD_AXIS_ALIASES are
 *  followed; a row with no mapping has no card and so no Verify link. */
function rowCards(row: AxisRow, cardsByAxis: Record<string, CardRef[]>): CardRef[] {
  return (CARD_AXIS_ALIASES[row.id] ?? [])
    .flatMap((alias) => cardsByAxis[alias] ?? [])
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
}

const cardPath = (c: CardRef) => `/signed/cards/${c.card}.json`;

/** Row → verifier. A Verify link is rendered ONLY when the board itself declares that a signed
 *  per-model card backs this row's model and number (leader_card_state SIGNED_PER_MODEL_CARD).
 *  The card index files cards by axis, not by model and number, so "the newest card under this
 *  axis" is somebody else's evidence; linking it said VALID about a measurement the row does not
 *  show. Otherwise the row says plainly that no card backs the number, and points at the two
 *  signed things that do bind it: the board snapshot and the per-item rows record. */
function RowVerify({ row, setId }: { row: AxisRow; setId: string }) {
  if (!rowHasCardQuestion(row)) return null;
  const leader = row.measuredOn ?? "this row's model";
  const target = rowVerifyTarget(row);
  if (target) {
    return (
      <a
        href={verifyCardHref(target)}
        onClick={(e) => e.stopPropagation()}
        data-testid={`verify-${setId}-${row.id}`}
        title={`Verify the signed card for ${leader} on this row`}
        className="inline-flex min-h-[44px] items-center rounded-md px-1 font-semibold text-emerald-800 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-950"
      >
        Verify
      </a>
    );
  }
  return (
    <span data-testid={`no-card-${setId}-${row.id}`} className="text-xs text-gray-700">
      No signed card for this model's number ·{" "}
      <a
        href="/gspc-verify/#board-stamp"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex min-h-[44px] items-center font-semibold text-emerald-800 underline underline-offset-2"
      >
        Check the signed board snapshot
      </a>{" "}
      ·{" "}
      <a
        href={ROWS_RECORD_SIGNED_URL}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex min-h-[44px] items-center font-semibold text-emerald-800 underline underline-offset-2"
      >
        Per-item rows (signed record)
      </a>
    </span>
  );
}

/** One signed card's body, read so the list can say what each card records. */
interface CardBody {
  model?: string;
  accuracy?: number;
  created?: string;
  axis?: string;
}

/** Fetch the bodies of the cards filed under a row (about 850 bytes each), only when the row is
 *  opened. A card that does not load is listed as "did not load", never guessed. */
function useCardBodies(cards: CardRef[]): Record<string, CardBody | "error"> {
  const [bodies, setBodies] = useState<Record<string, CardBody | "error">>({});
  const key = cards.map((c) => c.card).join(",");
  useEffect(() => {
    let cancelled = false;
    for (const c of cards) {
      fetch(cardPath(c))
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((d) => {
          if (cancelled) return;
          const b = d && typeof d === "object" && d.body && typeof d.body === "object" ? (d.body as CardBody) : null;
          setBodies((prev) => ({ ...prev, [c.card]: b ?? "error" }));
        })
        .catch(() => {
          if (!cancelled) setBodies((prev) => ({ ...prev, [c.card]: "error" }));
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return bodies;
}

/** "Cite this": a block whose sha256 is over the exact bytes its URL serves. Read on demand
 *  from GET /api/gspc?axis=<row>&format=cite; nothing in it is typed on this page. */
function CiteBlock({ axis }: { axis: string }) {
  const [state, setState] = useState<
    { phase: "idle" | "loading" } | { phase: "ready"; block: any } | { phase: "error"; message: string }
  >({ phase: "idle" });
  const [copied, setCopied] = useState(false);
  const load = () => {
    if (state.phase !== "idle") return;
    setState({ phase: "loading" });
    fetch(`/api/gspc?axis=${encodeURIComponent(axis)}&format=cite`, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((block) => {
        if (!block || typeof block.sha256 !== "string" || typeof block.url !== "string") throw new Error("the cite block has no url or sha256");
        setState({ phase: "ready", block });
      })
      .catch((e) => setState({ phase: "error", message: String(e?.message ?? e) }));
  };
  return (
    <details
      className="mt-3 rounded-lg border border-gray-300 bg-white p-3"
      data-testid={`cite-${axis}`}
      onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) load(); }}
    >
      <summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-bold text-gray-900">Cite this</summary>
      {state.phase === "loading" && <p className="mt-2 text-sm text-gray-600">Reading the cite block…</p>}
      {state.phase === "error" && (
        <p className="mt-2 text-sm text-amber-900" role="status">
          Cite block unavailable ({state.message}). Nothing is shown in its place.{" "}
          <a className="underline" href={`/api/gspc?axis=${encodeURIComponent(axis)}&format=cite`}>Open it directly</a>.
        </p>
      )}
      {state.phase === "ready" && (
        <div className="mt-2 space-y-2 text-sm text-gray-800">
          <pre className="whitespace-pre-wrap break-all rounded-md bg-gray-50 p-3 font-mono text-[12px] leading-relaxed text-gray-900">{state.block.text}</pre>
          <button
            type="button"
            className="min-h-[44px] rounded-lg border border-gray-400 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            onClick={() => {
              navigator.clipboard?.writeText(state.block.text).then(() => setCopied(true), () => setCopied(false));
            }}
          >
            {copied ? "Copied" : "Copy citation"}
          </button>
          <p className="text-[12px] text-gray-700">
            Check it: <code className="break-all">{state.block.check}</code> prints the same sha256. The
            board is re-served on every deploy, so keep a copy of the bytes; a matching hash shows you
            hold the cited bytes, not that the numbers are good.
          </p>
        </div>
      )}
    </details>
  );
}

function RowDetail({
  row,
  setId,
  cardsByAxis,
}: {
  row: AxisRow;
  setId: string;
  cardsByAxis: Record<string, CardRef[]>;
}) {
  // A board row and a signed card do not share a naming scheme — the card store
  // predates the board's slugs. Only the mappings that genuinely refer to the
  // same axis are followed; a row with no honest mapping gets NO card link
  // rather than a wrong one, because a link to somebody else's evidence is worse
  // than no link at all.
  const cards = rowCards(row, cardsByAxis);
  const bodies = useCardBodies(cards);
  // Our own prompt overlays are dropped from the list once their body has loaded and named one;
  // the board excludes them before comparison, so listing them under a row reads as a ranking.
  const ownCount = cards.filter((c) => {
    const b = bodies[c.card];
    return b && b !== "error" && typeof b.model === "string" && isOwnModel(b.model);
  }).length;
  const shown = cards.filter((c) => {
    const b = bodies[c.card];
    return !(b && b !== "error" && typeof b.model === "string" && isOwnModel(b.model));
  });
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 text-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">
            What this row measures
          </h4>
          <p className="mt-1 text-gray-800">{row.what}</p>
          {row.note && <p className="mt-2 text-gray-600">{row.note}</p>}
          {row.leaderCardNote && (
            <p
              className={`mt-2 text-xs ${row.leaderCardState === "SIGNED_PER_MODEL_CARD" ? "text-gray-600" : "font-semibold text-amber-800"}`}
              data-testid={`row-leader-card-note-${row.id}`}
            >
              {row.leaderCardNote}
            </p>
          )}
          {row.whyUnmeasured && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
                Why there is no number here
              </p>
              <p className="mt-1 text-amber-900">{row.whyUnmeasured}</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">The numbers</h4>
          <dl className="mt-1 space-y-1">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">
                <Term def={GLOSSARY.find((g) => g.term === "n")!.short}>Things measured (n)</Term>
              </dt>
              <dd className="text-right font-mono text-gray-900">
                {row.n === null ? "nothing measured" : row.nNote ?? `${row.n} ${row.nUnit}`}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">{row.headlineLabel}</dt>
              <dd className="font-mono text-gray-900">{formatHeadline(row)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">
                <Term def={GLOSSARY.find((g) => g.term === "confidence range")!.short}>
                  Confidence range
                </Term>
              </dt>
              <dd className="font-mono text-gray-900">
                {row.interval
                  ? row.headlineFormat === "pct"
                    ? `${pct(row.interval[0])} – ${pct(row.interval[1])}`
                    : `${row.interval[0]} – ${row.interval[1]}`
                  : "not published for this row"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">What was measured</dt>
              <dd className="text-right font-mono text-gray-900">{row.measuredOn ?? "—"}</dd>
            </div>
            {row.separation && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">
                  <Term def={GLOSSARY.find((g) => g.term === "separated")!.short}>
                    Is the lead real?
                  </Term>
                </dt>
                <dd className="text-right text-gray-900">{SEPARATION_PLAIN[row.separation]}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Go to the evidence
        </h4>
        <ul className="mt-2 space-y-1">
          {row.evidence.map((e) => (
            <li key={e.href}>
              <a
                href={e.href}
                className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
                data-testid={`evidence-${setId}-${row.id}`}
                {...(/^https?:/.test(e.href) ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {e.label}
              </a>
              <span className="text-gray-600"> — {e.what}</span>
            </li>
          ))}
        </ul>

        {cards.length > 0 && (
          <div className="mt-3 rounded-lg border border-gray-300 bg-white p-3" data-testid={`filed-cards-${row.id}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-800">
              Signed cards filed under this axis (not the number above)
            </p>
            <p className="mt-1 text-xs text-gray-700">
              Each card is one earlier measurement of one model, stamped so you can confirm offline
              that it has not been edited. A card can record a different model, or a different
              measurement of the same model, from the row above — read what each one records before
              relying on it. Steps:{" "}
              <a href="/signed/HOW-TO-VERIFY.md" className="underline">
                how to verify
              </a>
              .
            </p>
            <ul className="mt-2 space-y-1">
              {shown.slice(0, 8).map((c) => {
                const b = bodies[c.card];
                return (
                  <li key={c.card} className="flex flex-wrap items-center gap-x-2 text-[12px] text-gray-800">
                    <a
                      href={cardPath(c)}
                      data-testid={`card-${row.id}`}
                      className="inline-block rounded-md border border-gray-300 bg-white px-2 py-1 font-mono text-[11px] text-emerald-800 hover:border-emerald-600"
                      title={`${c.axis} · recorded ${c.ts}`}
                    >
                      {c.card.slice(0, 12)}…
                    </a>
                    <span data-testid={`card-says-${row.id}`}>
                      {b === undefined
                        ? "reading the card…"
                        : b === "error"
                          ? "this card did not load, so nothing from it is shown"
                          : `${b.model ?? "model not recorded"} · accuracy ${typeof b.accuracy === "number" ? b.accuracy : "not recorded"} · ${typeof b.created === "string" ? b.created.slice(0, 10) : c.ts.slice(0, 10)}`}
                    </span>
                    {b !== undefined && b !== "error" && b.accuracy === 0 && (
                      <a
                        href={`/board/models?axis=${encodeURIComponent(c.axis)}`}
                        className="inline-flex min-h-[44px] items-center px-1 text-[12px] text-amber-900 underline"
                      >
                        why a zero may not be quotable
                      </a>
                    )}
                    <a
                      href={verifyCardHref(cardPath(c))}
                      data-testid={`verify-card-${row.id}`}
                      className="inline-flex min-h-[44px] items-center px-1 text-[12px] font-semibold text-emerald-800 underline"
                    >
                      Verify this card
                    </a>
                  </li>
                );
              })}
            </ul>
            {ownCount > 0 && (
              <p className="mt-2 text-xs text-gray-700" data-testid={`own-cards-hidden-${row.id}`}>
                {ownCount} {ownCount === 1 ? "card" : "cards"} from our own prompt overlays are not
                listed; the board excludes them before comparison.
              </p>
            )}
            {shown.length > 8 && (
              <p className="mt-2 text-xs text-gray-700">
                {shown.length - 8} more under this axis —{" "}
                <a href="/signed/card_index.json" className="underline">
                  see the whole index
                </a>
                .
              </p>
            )}
          </div>
        )}
        {setId === "board" && <CiteBlock axis={row.id} />}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────── axis model leaderboards

/** Shape of the generated artifact (csoai.axis-rankings/0.1). The JSON is the
 *  authority; these interfaces only describe what this page reads from it. */
interface AxisRankingModel {
  rank: number;
  arm: string;
  accuracy: number;
  k: number;
  n: number;
  ci95: [number, number];
  mcnemar_vs_top: number | null;
  discordant_vs_top?: { b10_top_correct_arm_wrong: number; c01_arm_correct_top_wrong: number } | null;
  paired_items_vs_top?: number;
  band: "SEPARATED_LEADER" | "TIE_BAND" | "SEPARATED";
  verdict: string;
  measured_on: string;
  frontier: boolean;
  provider?: string;
  grading?: string;
}

interface AxisRanking {
  n: number;
  dataset: string;
  bench: string;
  task: string;
  colour: string;
  measured_on: string;
  rows_sha256: string;
  excluded_own_arms: number;
  note?: string;
  frontier_alignment?: Record<string, number>;
  models: AxisRankingModel[];
}

interface AxisRankingsDoc {
  schema: string;
  generated_at: string;
  sha256: { algorithm: string; recipe: string; hex: string };
  axes: Record<string, AxisRanking>;
}

const RANKINGS = axisRankingsDoc as unknown as AxisRankingsDoc;

const hasLeaderboard = (axisId: string): boolean =>
  Object.prototype.hasOwnProperty.call(RANKINGS.axes, axisId);

/** Exact McNemar p, shown to four places; smaller than that reads "< 0.0001"
 *  rather than a rounded 0.0, which would print a nonzero test as zero. */
const fmtMcNemarP = (p: number | null): string =>
  p === null ? "—" : p < 0.0001 ? "< 0.0001" : p.toFixed(4);

/** A measurement older than 30 days is still shown — it is just shown amber,
 *  the same way the rest of this estate treats stale dating. */
const MEASUREMENT_STALE_MS = 30 * 24 * 60 * 60 * 1000;
const isStaleMeasurement = (measuredOn: string, now: number): boolean => {
  const t = Date.parse(measuredOn);
  return Number.isFinite(t) && now - t > MEASUREMENT_STALE_MS;
};

const BAND_CHIP: Record<AxisRankingModel["band"], { label: string; className: string }> = {
  SEPARATED_LEADER: {
    label: "SEPARATED LEADER",
    className: "border-[#04624a] bg-[#04624a] text-emerald-50",
  },
  SEPARATED: {
    label: "SEPARATED",
    className: "border-emerald-600 bg-emerald-50 text-emerald-900",
  },
  TIE_BAND: {
    label: "TIE",
    className: "border-gray-300 bg-gray-100 text-gray-600",
  },
};

/** The toggle. Renders nothing where the artifact has no ranking for the axis
 *  (jail has no published per-item rows, so it has no leaderboard and no toggle). */
function LeaderboardToggle({
  axis,
  open,
  onToggle,
}: {
  axis: string;
  open: boolean;
  onToggle: () => void;
}) {
  if (!hasLeaderboard(axis)) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      data-testid={`leaderboard-toggle-${axis}`}
      aria-expanded={open}
      className="inline-flex min-h-[44px] items-center gap-1 px-1 font-mono text-[11px] font-bold uppercase tracking-wide text-emerald-800 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-950"
    >
      LEADERBOARD {open ? "▾" : "▸"}
    </button>
  );
}

/** The ranked table itself: rank, model, accuracy with its Wilson interval, the
 *  exact McNemar p against the top arm, the band the test supports, and the date
 *  the rows were measured. Every cell is read from the artifact. */
function LeaderboardPanel({ axis }: { axis: string }) {
  const ranking = RANKINGS.axes[axis];
  if (!ranking) return null;
  const now = Date.now();
  return (
    <div
      className="border-t border-gray-200 bg-gray-50 px-4 py-4"
      data-testid={`leaderboard-${axis}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Model leaderboard — {ranking.task}
        </h4>
        <span className="font-mono text-[11px] text-gray-600">
          n = {ranking.n} bank items · rows measured {ranking.measured_on} ·{" "}
          <span className="font-mono">{ranking.dataset}</span>
        </span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Model</th>
              <th className="px-3 py-2 text-right font-semibold">Accuracy (95% CI)</th>
              <th className="px-3 py-2 text-right font-semibold" title="Exact McNemar test against the top arm, two-sided, on paired items">
                vs top p
              </th>
              <th className="px-3 py-2 font-semibold">Band</th>
              <th className="px-3 py-2 text-right font-semibold">Measured</th>
            </tr>
          </thead>
          <tbody>
            {ranking.models.map((m) => {
              const stale = isStaleMeasurement(m.measured_on, now);
              const band = BAND_CHIP[m.band] ?? BAND_CHIP.TIE_BAND;
              return (
                <tr
                  key={m.arm}
                  data-testid={`leaderboard-row-${axis}-${m.rank}`}
                  className={`border-b border-gray-100 ${m.frontier ? "bg-emerald-50/40" : ""}`}
                >
                  <td className="px-3 py-2 font-mono tabular-nums text-gray-700">{m.rank}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-gray-900 [overflow-wrap:anywhere]">{m.arm}</span>
                    {m.frontier && (
                      <span
                        className="ml-2 rounded-full border border-emerald-600 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-800"
                        title={`measured ${m.measured_on} · provider ${m.provider ?? "declared in the artifact"}`}
                      >
                        NEW
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-gray-900">
                    {pct(m.accuracy)}
                    <span className="block text-[10px] text-gray-500">
                      {m.k}/{m.n} · {pct(m.ci95[0])}–{pct(m.ci95[1])}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-gray-700">
                    {fmtMcNemarP(m.mcnemar_vs_top)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${band.className}`}
                      title={m.verdict}
                    >
                      {band.label}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono tabular-nums text-xs ${stale ? "text-amber-700" : "text-gray-700"}`}
                    title={stale ? "measured more than 30 days ago" : undefined}
                  >
                    {m.measured_on}
                    {m.frontier && (
                      <span className="block text-[10px] text-gray-500">{m.provider}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ranking.frontier_alignment && (
        <p className="mt-2 text-[11px] text-gray-600">
          The NEW arm joined this axis only because its rows align item-for-item with the frozen
          bank: {ranking.frontier_alignment.matched_items}/{ranking.frontier_alignment.frontier_rows}{" "}
          items matched, {ranking.frontier_alignment.unmatched_items} unmatched,{" "}
          {ranking.frontier_alignment.error_rows} transport errors,{" "}
          {ranking.frontier_alignment.gold_mismatches_vs_frozen} gold-label mismatches — counts read
          from the artifact, not asserted here.
        </p>
      )}

      <p className="mt-2 text-[11px] text-gray-600">
        Bands come from the exact two-sided McNemar test on paired items: a top arm is a
        SEPARATED LEADER only if the test separates it from every other arm at α=0.05; TIE means
        the test does not establish a difference (a tie is not equality). Arms the test separates
        below the top are marked SEPARATED. Own/tuned arms ({ranking.excluded_own_arms} on this
        axis) are excluded before comparison, as the board serves them.
        {ranking.note ? ` ${ranking.note}` : ""}
      </p>

      <p
        className="mt-2 border-t border-gray-200 pt-2 text-[11px] text-gray-600"
        data-testid={`leaderboard-verify-${axis}`}
      >
        Verify this table: sha256{" "}
        <code className="break-all font-mono text-[10px] text-gray-800">{RANKINGS.sha256.hex}</code>{" "}
        ({RANKINGS.sha256.recipe}) over the generated artifact{" "}
        <a href={axisRankingsUrl} className="font-semibold text-emerald-800 underline" target="_blank" rel="noreferrer">
          axis-rankings.json
        </a>
        , generated {RANKINGS.generated_at} by{" "}
        <span className="font-mono text-[10px]">scripts/build-axis-rankings.py</span> from the
        published per-item rows. Independent checks:{" "}
        <a href="/verifier/" className="font-semibold text-emerald-800 underline">
          the /verifier toolkit
        </a>{" "}
        ·{" "}
        <a href={ROWS_RECORD_SIGNED_URL} className="font-semibold text-emerald-800 underline">
          per-item rows (signed record)
        </a>
        .
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────── the table

type SortKey = "name" | "status" | "n" | "headline";

function SetTable({
  rows,
  setId,
  density,
  cardsByAxis,
}: {
  rows: AxisRow[];
  setId: string;
  density: "table" | "cards";
  cardsByAxis: Record<string, CardRef[]>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  // Which row's leaderboard is expanded. Independent of the row detail, so a
  // reader can hold both the row's own record and the model ranking at once.
  const [lbOpen, setLbOpen] = useState<string | null>(null);

  const field = <BoardField rows={rows} setId={setId} />;

  if (density === "cards") {
    return (
      <div className="space-y-3" data-testid="rows-cards">
        {field}
        {rows.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              onClick={() => setOpen(open === r.id ? null : r.id)}
              className="flex w-full flex-col gap-2 p-4 text-left hover:bg-gray-50"
              data-testid={`row-${setId}-${r.id}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-900">{r.name}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? STATUS_STYLE.DRAFT}`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-gray-700">{r.what}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-gray-600">
                <span>{r.n === null ? "nothing measured" : r.nNote ? `n = ${r.nNote}` : `n = ${r.n} ${r.nUnit}`}</span>
                <span>
                  {r.headlineLabel}: {formatHeadline(r)}
                </span>
              </div>
            </button>
            {hasLeaderboard(r.id) && (
              <div className="border-t border-gray-100 px-4 py-1 text-sm">
                <LeaderboardToggle
                  axis={r.id}
                  open={lbOpen === r.id}
                  onToggle={() => setLbOpen(lbOpen === r.id ? null : r.id)}
                />
              </div>
            )}
            {lbOpen === r.id && <LeaderboardPanel axis={r.id} />}
            {rowHasCardQuestion(r) && (
              <div className="border-t border-gray-100 px-4 py-1 text-sm">
                <RowVerify row={r} setId={setId} />
              </div>
            )}
            {open === r.id && <RowDetail row={r} setId={setId} cardsByAxis={cardsByAxis} />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {field}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm" data-testid="rows-table">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-2 font-semibold">Row</th>
            <th className="px-4 py-2 font-semibold">What it asks</th>
            <th className="px-4 py-2 font-semibold">Status</th>
            <th className="px-4 py-2 text-right font-semibold">
              <Term def={GLOSSARY.find((g) => g.term === "n")!.short}>n</Term>
            </th>
            <th className="px-4 py-2 text-right font-semibold">Result</th>
            <th className="px-4 py-2 font-semibold">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.id}>
              <tr
                onClick={() => setOpen(open === r.id ? null : r.id)}
                data-testid={`row-${setId}-${r.id}`}
                className={`cursor-pointer border-b border-gray-100 hover:bg-emerald-50/40 ${
                  open === r.id ? "bg-emerald-50/60" : ""
                }`}
              >
                <td className="px-4 py-2 font-semibold text-gray-900">{r.name}</td>
                <td className="max-w-[22rem] px-4 py-2 text-gray-700">{r.what}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? STATUS_STYLE.DRAFT}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right font-mono text-gray-900">
                  {r.n === null ? <span className="text-gray-400">none</span> : r.n}
                  {r.nNote && (
                    <span className="block text-[10px] font-normal text-gray-500" data-testid={`n-note-${r.id}`}>
                      {r.nNote}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right font-mono text-gray-900">
                  {formatHeadline(r)}
                  {r.interval && (
                    <span className="block text-[10px] font-normal text-gray-500">
                      {r.headlineFormat === "pct"
                        ? `${pct(r.interval[0])} – ${pct(r.interval[1])}`
                        : `${r.interval[0]} – ${r.interval[1]}`}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-emerald-700">
                  {open === r.id ? "close" : `open (${r.evidence.length})`}
                  {hasLeaderboard(r.id) && (
                    <>
                      {" · "}
                      <LeaderboardToggle
                        axis={r.id}
                        open={lbOpen === r.id}
                        onToggle={() => setLbOpen(lbOpen === r.id ? null : r.id)}
                      />
                    </>
                  )}
                  {rowHasCardQuestion(r) && (
                    <>
                      {" · "}
                      <RowVerify row={r} setId={setId} />
                    </>
                  )}
                </td>
              </tr>
              {lbOpen === r.id && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <LeaderboardPanel axis={r.id} />
                  </td>
                </tr>
              )}
              {open === r.id && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <RowDetail row={r} setId={setId} cardsByAxis={cardsByAxis} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────── evidence + custody

function CustodyPanel() {
  const [index, setIndex] = useState<any>(null);
  const [chain, setChain] = useState<any>(null);
  const [matrix, setMatrix] = useState<any>(null);

  useEffect(() => {
    const grab = (u: string, set: (v: any) => void) =>
      fetch(u)
        .then((r) => (r.ok ? r.json() : null))
        .then(set)
        .catch(() => set(null));
    grab("/signed/card_index.json", setIndex);
    // chain.json is card-shaped since 2026-08-27 ({body: manifest, id, pubkey,
    // signature}) so the manifest itself is signed; the counts live in the body.
    grab("/signed/chain.json", (j) => setChain(j?.body && typeof j.body === "object" ? j.body : j));
    grab("/signed/card-matrix.json", setMatrix);
  }, []);

  const listed = Array.isArray(index?.cards) ? index.cards.length : null;
  const onDisk = matrix?.counts?.cells ?? null;

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">
        Inspect the evidence behind the results
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-700">
        Every measured row above names a published evidence or run artifact. Where a{" "}
        <Term def={GLOSSARY.find((g) => g.term === "signed card")!.short}>signed card</Term> is
        linked, you can verify that card offline. Seven current financial rows
        instead link to content-addressed but unsigned run artifacts; a content ID is not a
        signature, and this page keeps that difference visible.
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Cards listed in the index
          </dt>
          <dd className="mt-1 font-mono text-2xl text-gray-900">{listed ?? "…"}</dd>
          <p className="mt-1 text-xs text-gray-600">
            This index uses the verified count. An earlier larger count was withdrawn because
            a signature label alone did not establish cryptographic verification.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Positions in the chain
          </dt>
          <dd className="mt-1 font-mono text-2xl text-gray-900">{chain?.length ?? "…"}</dd>
          <p className="mt-1 text-xs text-gray-600">
            Parent references support end-to-end chain inspection. Missing positions can be
            identified when checking the published chain.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Private record contents
          </dt>
          <dd className="mt-1 font-mono text-2xl text-gray-900">
            {chain?.bodies_withheld ?? "…"}
          </dd>
          <p className="mt-1 text-xs text-gray-600">
            Record contents remain private. Published positions allow reviewers to inspect
            chain continuity without accessing those contents.
          </p>
        </div>
      </dl>

      {/* THE NUMBER THAT DISAGREES WITH ITSELF, stated rather than smoothed over.
          More card files are published than the frozen index lists. Showing only
          the larger number would overclaim; showing only the smaller would hide
          published work. Both are shown, with what each one counts. */}
      {listed !== null && onDisk !== null && onDisk !== listed && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900">
            Two numbers here, and they do not agree
          </h3>
          <p className="mt-1 text-sm text-amber-900">
            The index lists <strong>{listed}</strong> records; <strong>{onDisk}</strong> record
            files are actually published. The index was frozen at the smaller figure because the
            extra ones could not be verified against the store that produced them, and a flag
            inside a file saying &ldquo;signed&rdquo; is not a signature. Both numbers are shown
            because each counts something real: one counts what was verified, the other counts what
            was published.{" "}
            <Link href="/board/models" className="font-bold underline">
              Browse all of them, model by model
            </Link>
            .
          </p>
        </div>
      )}

      {chain?.what_this_does_not_prove && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900">
            What the signatures do not prove
          </h3>
          <p className="mt-1 text-sm text-amber-900">{chain.what_this_does_not_prove}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <a
          href="/signed/card_index.json"
          className="rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white hover:bg-emerald-800"
          data-testid="browse-cards"
        >
          The index of signed records
        </a>
        <a
          href="/signed/chain.json"
          className="rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-800 hover:border-gray-500"
        >
          The chain file
        </a>
        <a
          href="/signed/HOW-TO-VERIFY.md"
          className="rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-800 hover:border-gray-500"
        >
          How to check one yourself
        </a>
        <Link
          href="/board/models"
          className="rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-800 hover:border-gray-500"
          data-testid="to-measured-models"
        >
          Every measured model →
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────── surfaces the board does not have a route to

interface OrphanEntry {
  path: string;
  what: string;
  why: string;
  status: string;
}

/** Measurement surfaces that exist, are published, and had NO route from the
 *  board before this page. Each is listed with what it measures and the honest
 *  state of the rail behind it — not as a link farm, but because a surface a
 *  reader cannot find is functionally unpublished. */
const NO_ROUTE_FROM_BOARD: OrphanEntry[] = [
  {
    path: "/xrpl-attest",
    what:
      "The ledger attestation work: a record attached to a public ledger so that a third party can see a measurement existed at a point in time.",
    why:
      "Reachable from the site header and footer, and from nothing on the board. The provenance-controls row points at the signed ledger evidence; seven other financial rows point at separate content-addressed, unsigned run artifacts.",
    status: "Proven on a test network. Attaching to the main network is planned and is not done.",
  },
  {
    path: "/interop/financial-measure-run-v2.json",
    what: "The signed run behind the provenance-controls financial row.",
    why:
      "The board's own data names this file as the provenance-controls evidence. It is the only currently signed artifact among the eight financial run files; the other seven remain unsigned.",
    status: "Signed and published.",
  },
  {
    path: "/interop/evm-control-facts.json",
    what: "The same style of control-fact reading, on a different kind of public ledger.",
    why: "Published signed record available here for independent inspection.",
    status:
      "Signed. The attestation back end for this kind of ledger is not built, so nothing is attested there.",
  },
  {
    path: "/interop/coverage-register.json",
    what:
      "How much of each register was actually covered — which named instruments were read and which could not be located.",
    why:
      "Identifies the instruments included in the review and those that could not be located. Results apply to that documented coverage, not automatically to the entire instrument family.",
    status: "Published.",
  },
  {
    path: "/interop/rwa-attest-index.json",
    what: "The index of attestation records produced for named financial instruments.",
    why: "Published index available through this direct link and the bulk API.",
    status: "Published.",
  },
  {
    path: "/interop/attestation-corpus.json",
    what: "The corpus of attestations gathered across rails.",
    why: "Machine-readable supporting record available through this direct link and the bulk API.",
    status: "Published.",
  },
  {
    path: "/interop/eas-attestation-batch.json",
    what: "A prepared batch of attestation payloads for a third-party attestation service.",
    why: "Machine-readable supporting record available through this direct link and the bulk API.",
    status: "Payloads are prepared. Nothing has been published to that service.",
  },
  {
    path: "/interop/jailbreak-asr-evidence-pack.json",
    what: "The per-model evidence behind the escape-detection work.",
    why: "Dated signed record linked here for independent review.",
    status: "Signed and published.",
  },
  {
    path: "/interop/jail-peritem-v3.json",
    what: "The item-by-item detail behind one board row, at the granularity a challenger needs.",
    why: "Dated signed record linked here for independent review.",
    status: "Signed and published.",
  },
  {
    path: "/interop/mcp-security-scorecard.json",
    what: "A security scorecard over tool servers, a measurement in its own right.",
    why: "Machine-readable supporting record available through this direct link and the bulk API.",
    status: "Published.",
  },
  {
    path: "/interop/card-store-verification.json",
    what:
      "A record of searching five stores for the card bodies that would settle the disputed card count — and finding none.",
    why:
      "Preserves the historical negative result and the scope of the card-store verification.",
    status: "Published historical result: zero matching card bodies found in the stated search.",
  },
  {
    path: "/interop/rwa-registry.json",
    what: "The register of named financial instruments the financial rows draw from.",
    why: "Source register supporting the financial data views.",
    status:
      "Published without a source timestamp. Its measurement date is not established.",
  },
  {
    path: "/interop/index-reference-reverify.json",
    what: "A re-check of the public reference series behind the candidate index rows.",
    why: "Supporting re-verification record, linked here for inspection.",
    status: "Published.",
  },
  {
    path: "/interop/sbom-councilof-ai.json",
    what: "The software bill of materials for this site.",
    why:
      "Listed in the surface catalogue under a misspelt path, so a machine following the catalogue gets a 404.",
    status: "Published at the corrected path.",
  },
  {
    path: "/signed/chain.json",
    what: "The full chain of card positions, including the ones whose contents are withheld.",
    why:
      "Use this chain with the published verification instructions to inspect record continuity.",
    status: "Published.",
  },
];

function NoRoutePanel() {
  const [catalog, setCatalog] = useState<any>(null);
  useEffect(() => {
    fetch("/interop/surface-catalog.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setCatalog)
      .catch(() => setCatalog(null));
  }, []);

  return (
    <section className="mt-10 rounded-2xl border border-amber-300 bg-amber-50/50 p-6">
      <h2 className="text-lg font-bold text-gray-900">
        Explore supporting records and methods
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-800">
        Review the supporting records behind the measurement sets. Each link identifies the
        record's purpose, publication status and relevant limitations. Signed records, unsigned
        evidence and prepared but unpublished payloads remain separate.
      </p>
      {catalog?.as_of && (
        <p className="mt-2 text-xs text-gray-700">
          Cross-referenced with the published machine-readable catalogue, dated{" "}
          <span className="font-mono">{catalog.as_of}</span> —{" "}
          <a href="/interop/surface-catalog.json" className="underline">
            /interop/surface-catalog.json
          </a>
          .
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-amber-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-2 font-semibold">Surface</th>
              <th className="px-4 py-2 font-semibold">What it measures</th>
              <th className="px-4 py-2 font-semibold">About this record</th>
              <th className="px-4 py-2 font-semibold">Publication status</th>
            </tr>
          </thead>
          <tbody>
            {NO_ROUTE_FROM_BOARD.map((o) => (
              <tr key={o.path} className="border-b border-gray-100 align-top">
                <td className="px-4 py-2">
                  <a
                    href={o.path}
                    className="font-mono text-xs font-semibold text-emerald-700 underline"
                    data-testid={`orphan-${o.path}`}
                  >
                    {o.path}
                  </a>
                </td>
                <td className="max-w-[18rem] px-4 py-2 text-gray-700">{o.what}</td>
                <td className="max-w-[18rem] px-4 py-2 text-gray-700">{o.why}</td>
                <td className="max-w-[14rem] px-4 py-2 text-gray-700">{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────── the page

export default function MeasurementBoard() {
  const [activeId, setActiveId] = useState<string>(AXIS_SETS[0].id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "measured" | "unmeasured">("all");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  // A dense table is the right default on a wide screen and the wrong one on a
  // phone, where it becomes a sideways-scrolling strip. Start in whichever mode
  // suits the screen; the toggle still wins, and both show the same rows.
  const [density, setDensity] = useState<"table" | "cards">(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "cards" : "table",
  );

  useEffect(() => {
    document.title = "AI measurement board | Council of AI";
    setMetaDescription(
      "Explore published AI measurements, methods, coverage and supporting evidence. Each result identifies its scope, date and limitations; signed and unsigned records are clearly distinguished.",
    );
    // The navigation's arena link must open the current signed reference, not
    // the separate historical practice replay. Keep the first server render
    // deterministic, then apply this validated deep link after hydration.
    const requested = new URLSearchParams(window.location.search).get("set");
    if (AXIS_SETS.some((set) => set.id === requested)) setActiveId(requested!);
  }, []);

  const active = AXIS_SETS.find((s) => s.id === activeId)!;

  const states = useAllSets();
  const cardsByAxis = useCardsByAxis();
  const activeState = states[activeId] ?? { phase: "loading" as const };
  const data = activeState.phase === "loading" ? null : activeState.data;

  const rows = useMemo(() => {
    if (!data) return [];
    let out = data.rows;
    if (statusFilter === "measured") out = out.filter((r) => r.status === "MEASURED");
    if (statusFilter === "unmeasured") out = out.filter((r) => r.status !== "MEASURED");
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.what.toLowerCase().includes(q) ||
          (r.measuredOn ?? "").toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...out].sort((a, b) => {
      if (sortKey === "n") return dir * ((a.n ?? -1) - (b.n ?? -1));
      if (sortKey === "headline") return dir * ((a.headline ?? -1) - (b.headline ?? -1));
      if (sortKey === "status")
        return dir * (Number(b.status === "MEASURED") - Number(a.status === "MEASURED"));
      return dir * a.name.localeCompare(b.name);
    });
  }, [data, statusFilter, query, sortKey, sortDir]);

  const measuredCount = data ? data.rows.filter((r) => r.status === "MEASURED").length : null;
  const unmeasuredCount = data ? data.rows.length - (measuredCount ?? 0) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Service enquiries are separate from the published measurements below. */}
      <aside
        data-testid="board-commission-callout"
        role="note"
        aria-label="Measurement services"
        className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5"
      >
        <p className="text-base leading-relaxed text-emerald-950">
          Need evidence for a specific model or system?{" "}
          <a
            href="/services/"
            className="font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
            data-testid="board-callout-cta"
          >
            Explore measurement services.
          </a>{" "}
          Results apply to the subjects, methods and dates shown below.
        </p>
      </aside>

      {/* ── the headline sentence: what ranks what ─────────────────────────── */}
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Measurement, not certification
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          The measurement board
        </h1>
        {/* dated freshness on the first screen: read live from /api/gspc, never typed */}
        <BoardFreshness />
        <p className="mt-3 max-w-3xl text-base text-gray-700">
          Explore the published measurement sets below. Each covers a defined subject, method
          and period, with its own sample size and supporting evidence. Counts from different
          sets are not directly comparable. Review the scope and limitations alongside each result.
        </p>
        <p className="mt-3 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <strong className="font-semibold">About the dates on this page.</strong> A date shown
          against a set is the stamp carried inside the data itself — when the measuring actually
          happened. It is not the time this page was rendered or deployed, so it advances only when
          something new is measured and recorded. Each set names the exact field its date was read
          from, so you can open the file and check.
        </p>
      </header>

      {/* ── the living board: freshness, rank spread on one frozen bank, downloads ── */}
      <LivingBoard withFreshness={false} />

      {/* ── the set switcher, with sizes shown before you click ────────────── */}
      <nav className="mt-6" aria-label="Choose a measurement set">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Choose a set
        </h2>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {AXIS_SETS.map((set) => {
            const state = states[set.id] ?? { phase: "loading" as const };
            const d = state.phase === "loading" ? null : state.data;
            return (
              <SetTab
                key={set.id}
                set={set}
                active={set.id === activeId}
                count={d ? d.rows.length : null}
                measured={d ? d.rows.filter((r) => r.status === "MEASURED").length : null}
                onClick={() => {
                  setActiveId(set.id);
                  setQuery("");
                  setStatusFilter("all");
                  const url = new URL(window.location.href);
                  url.searchParams.set("set", set.id);
                  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
                }}
              />
            );
          })}
        </div>
      </nav>

      {/* ── the selected set, described in plain language ──────────────────── */}
      <section className="mt-8" data-testid={`set-panel-${active.id}`}>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{active.name}</h2>
            <div className="font-mono text-xs text-gray-600">
              {data ? (
                <>
                  {data.rows.length} visible rows in this set · {measuredCount} with published results ·{" "}
                  {unmeasuredCount} awaiting a qualifying measurement
                </>
              ) : (
                "loading…"
              )}
            </div>
          </div>

          <p className="mt-3 max-w-3xl text-base text-gray-800">{active.headline}</p>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                What it measures
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{active.measures}</dd>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Who or what it covers
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{active.subject}</dd>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                When it was measured
              </dt>
              <dd className="mt-1 text-sm text-gray-800">
                {data?.asOf ? (
                  <span className="font-mono">{data.asOf}</span>
                ) : (
                  <span className="text-gray-600">no date published</span>
                )}
                {data?.asOfField && (
                  <span className="mt-1 block font-mono text-[10px] text-gray-500">
                    read from: {data.asOfField}
                  </span>
                )}
                <span className="mt-1 block text-xs text-gray-600">{active.freshness}</span>
                {data && !data.live && (
                  <span
                    className="mt-2 block rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900"
                    data-testid="provenance-fallback"
                  >
                    {data.provenance}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {/* the pattern that matters most: limits stated beside the numbers */}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-900">
                What this set establishes
              </h3>
              <ul className="mt-2 space-y-2 text-sm text-emerald-950">
                {active.establishes.map((e) => (
                  <li key={e} className="flex gap-2">
                    <span aria-hidden="true">✓</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-xl border border-rose-300 bg-rose-50/60 p-4"
              data-testid={`does-not-establish-${active.id}`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wide text-rose-900">
                What this set does NOT establish
              </h3>
              <ul className="mt-2 space-y-2 text-sm text-rose-950">
                {active.doesNotEstablish.map((e) => (
                  <li key={e} className="flex gap-2">
                    <span aria-hidden="true">✗</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              How this relates to the other sets
            </h3>
            <p className="mt-1 text-sm text-gray-800">{active.relation}</p>
          </div>

          {active.retired && (
            <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>This is a record, not a live instrument.</strong> {active.retired}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-600">
              Check the count yourself:{" "}
              <span className="font-mono text-xs text-gray-800">{active.countAuthority}</span>
            </span>
            <a
              href={active.artifact.href}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-mono text-xs font-semibold text-gray-800 hover:border-gray-500"
            >
              {active.artifact.label}
            </a>
            {active.detailPage && (
              <Link
                href={active.detailPage.href}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-700"
              >
                {active.detailPage.label} →
              </Link>
            )}
          </div>

          {data && data.aside.length > 0 && (
            <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4">
              {data.aside.map((a) => (
                <div key={a.label} className="text-sm">
                  <dt className="font-semibold text-gray-800">{a.label}</dt>
                  <dd className="text-gray-700">{a.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* ── controls ──────────────────────────────────────────────────────── */}
      <section className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter rows…"
            aria-label="Filter rows"
            data-testid="row-search"
            className="min-w-[10rem] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex rounded-lg border border-gray-300" role="group" aria-label="Filter by status">
            {(["all", "measured", "unmeasured"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                data-testid={`filter-${f}`}
                aria-pressed={statusFilter === f}
                className={`px-3 py-2 text-xs font-bold capitalize ${
                  statusFilter === f ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                } first:rounded-l-lg last:rounded-r-lg`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(":");
              setSortKey(k as SortKey);
              setSortDir(d as "asc" | "desc");
            }}
            aria-label="Sort rows"
            data-testid="row-sort"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="status:asc">Measured first</option>
            <option value="status:desc">Unmeasured first</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="n:desc">Most things measured</option>
            <option value="n:asc">Fewest things measured</option>
            <option value="headline:desc">Highest result</option>
            <option value="headline:asc">Lowest result</option>
          </select>
          <div className="flex rounded-lg border border-gray-300" role="group" aria-label="Row density">
            {(["table", "cards"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                data-testid={`density-${d}`}
                aria-pressed={density === d}
                className={`px-3 py-2 text-xs font-bold capitalize ${
                  density === d ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                } first:rounded-l-lg last:rounded-r-lg`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Unmeasured rows are content. They are never hidden to make a layout
            tidier, and the page says so where a reader will actually read it. */}
        {unmeasuredCount !== null && unmeasuredCount > 0 && statusFilter !== "unmeasured" && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>{unmeasuredCount}</strong> of these rows have nothing behind them yet. They are
            shown on purpose, in the same table as the rest, so the gap is visible.{" "}
            <button
              onClick={() => setStatusFilter("unmeasured")}
              className="font-bold underline"
              data-testid="show-unmeasured"
            >
              Show only those
            </button>
            .
          </p>
        )}

        <div className="mt-4">
          {activeState.phase === "loading" && (
            <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Loading this set from its published artifact…
            </p>
          )}
          {activeState.phase === "error" && rows.length === 0 && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
              This set's artifact did not answer here ({activeState.message}). No rows are drawn,
              because an empty table would read like a finding. Open{" "}
              <a href={active.artifact.href} className="font-mono underline">
                {active.artifact.label}
              </a>{" "}
              directly.
            </p>
          )}
          {rows.length > 0 && (
            <SetTable rows={rows} setId={active.id} density={density} cardsByAxis={cardsByAxis} />
          )}
          {activeState.phase === "ready" && rows.length === 0 && data && data.rows.length > 0 && (
            <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
              No rows match that filter.
            </p>
          )}
        </div>
      </section>

      <CustodyPanel />
      <NoRoutePanel />

      {/* ── plain language ────────────────────────────────────────────────── */}
      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Words used on this page</h2>
        <p className="mt-1 text-sm text-gray-600">
          If a term appears above and is not explained here, that is a defect — tell us and we will
          either define it or stop using it.
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="rounded-xl border border-gray-200 p-3">
              <dt className="font-bold text-gray-900">{g.term}</dt>
              <dd className="mt-1 text-sm text-gray-700">{g.short}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-600">
        <p>
          We measure and we publish the measurement. We do not certify, accredit, endorse or
          enforce anything, and we are not a notified body. A score describes a run on a fixed set
          of questions on a date — it does not describe anyone's compliance with any law.
        </p>
        <p className="mt-2">
          Something here wrong?{" "}
          <Link href="/challenge" className="font-semibold text-emerald-700 underline">
            Challenge a measurement
          </Link>{" "}
          or read the{" "}
          <Link href="/refutation-ledger" className="font-semibold text-emerald-700 underline">
            refutation ledger
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
