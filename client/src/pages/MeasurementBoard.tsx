import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import {
  AXIS_SETS,
  BOARD_FALLBACK,
  CARD_AXIS_ALIASES,
  type AxisRow,
  type AxisSet,
  type LoadedSet,
} from "@/data/axis-sets";
import { GAP_BY_AXIS } from "./GSPCGapMap";

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
      "One thing we try to measure — a single question asked over and over, like “can this model tell which risk tier a system falls into?”. Every axis has its own set of questions and its own score.",
  },
  {
    term: "measured",
    short:
      "A real run happened: a fixed set of questions was asked, the answers were graded by a fixed rule, and the result was recorded and signed.",
  },
  {
    term: "unmeasured",
    short:
      "The slot is published, and nothing has been run against it. It appears on purpose so the gap is visible. It is never evidence that anything was measured.",
  },
  {
    term: "n",
    short:
      "How many things were actually measured. A score over ten items is a much weaker claim than the same score over three hundred, which is why n is always shown next to it.",
  },
  {
    term: "confidence range",
    short:
      "The band the true score is likely to sit in, given how few things were measured. A wide band means the headline number could easily move on a re-run. Two models whose bands overlap are not separated by the measurement.",
  },
  {
    term: "separated",
    short:
      "The leader's advantage over the rest of the field is large enough that it is unlikely to be chance. When it is not separated we call it a tie and refuse to publish an ordering.",
  },
  {
    term: "signed card",
    short:
      "A small file recording one measurement, stamped with a cryptographic signature. Anyone can re-check the stamp offline, without asking us and without trusting us.",
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
  if (row.headlineFormat === "pct") return pct(row.headline);
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
  SEPARATED: "The leader's advantage is unlikely to be chance.",
  TIE: "Too close to call — we refuse to publish an ordering.",
  UNTESTED: "No separation test has been run on this set of questions yet.",
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
      const json = (u: string) =>
        fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))));

      json(set.fetchUrl)
        .then((d) => put(set.id, { phase: "ready", data: set.load(d) }))
        .catch((liveErr) => {
          // A declared fallback artifact is tried before the set is given up on.
          // This is what makes the board render real rows in a prerendered page,
          // where no function is running to answer /api/gspc — and the fallback
          // is LABELLED as a snapshot rather than passed off as a live read.
          if (!set.fallbackUrl) {
            put(set.id, {
              phase: "error",
              message: String(liveErr?.message ?? liveErr),
              data: set.id === "board" ? BOARD_FALLBACK() : EMPTY,
            });
            return;
          }
          json(set.fallbackUrl)
            .then((d) =>
              put(set.id, {
                phase: "ready",
                data: set.load(d, set.fallbackProvenance),
              }),
            )
            .catch((snapErr) =>
              put(set.id, {
                phase: "error",
                message: `${liveErr?.message ?? liveErr}; snapshot: ${snapErr?.message ?? snapErr}`,
                data: set.id === "board" ? BOARD_FALLBACK() : EMPTY,
              }),
            );
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
  const cards = (CARD_AXIS_ALIASES[row.id] ?? [])
    .flatMap((alias) => cardsByAxis[alias] ?? [])
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 text-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">
            What this row measures
          </h4>
          <p className="mt-1 text-gray-800">{row.what}</p>
          {row.note && <p className="mt-2 text-gray-600">{row.note}</p>}
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
              <dd className="font-mono text-gray-900">
                {row.n === null ? "nothing measured" : `${row.n} ${row.nUnit}`}
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
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">
              Signed records for this row
            </p>
            <p className="mt-1 text-xs text-emerald-950">
              Each is one measurement, stamped so you can confirm offline that it has not been
              edited. Open one and check it against{" "}
              <a href="/signed/HOW-TO-VERIFY.md" className="underline">
                the verification steps
              </a>
              .
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {cards.slice(0, 6).map((c) => (
                <li key={c.card}>
                  <a
                    href={`/signed/cards/${c.card}.json`}
                    data-testid={`card-${row.id}`}
                    className="inline-block rounded-md border border-emerald-300 bg-white px-2 py-1 font-mono text-[11px] text-emerald-800 hover:border-emerald-600"
                    title={`${c.axis} · recorded ${c.ts}`}
                  >
                    {c.card.slice(0, 12)}…
                  </a>
                </li>
              ))}
            </ul>
            {cards.length > 6 && (
              <p className="mt-2 text-xs text-emerald-900">
                {cards.length - 6} more for this row —{" "}
                <a href="/signed/card_index.json" className="underline">
                  see the whole index
                </a>
                .
              </p>
            )}
          </div>
        )}
      </div>
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

  if (density === "cards") {
    return (
      <div className="space-y-3" data-testid="rows-cards">
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
                <span>{r.n === null ? "nothing measured" : `n = ${r.n} ${r.nUnit}`}</span>
                <span>
                  {r.headlineLabel}: {formatHeadline(r)}
                </span>
              </div>
            </button>
            {open === r.id && <RowDetail row={r} setId={setId} cardsByAxis={cardsByAxis} />}
          </div>
        ))}
      </div>
    );
  }

  return (
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
                </td>
              </tr>
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
    grab("/signed/chain.json", setChain);
    grab("/signed/card-matrix.json", setMatrix);
  }, []);

  const listed = Array.isArray(index?.cards) ? index.cards.length : null;
  const onDisk = matrix?.counts?.cells ?? null;

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">
        Where a number turns into something you can check
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-700">
        Every measured row above is backed by a{" "}
        <Term def={GLOSSARY.find((g) => g.term === "signed card")!.short}>signed card</Term>: a small
        file recording one run, stamped so that anyone can confirm offline that it has not been
        edited since. This is the part a commercial leaderboard cannot offer, and it is worth
        stating only after the limits above have been stated.
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Cards listed in the index
          </dt>
          <dd className="mt-1 font-mono text-2xl text-gray-900">{listed ?? "…"}</dd>
          <p className="mt-1 text-xs text-gray-600">
            Frozen at the number that could actually be verified. A larger figure was published
            once and withdrawn, because a flag in a file saying “signed” is not a signature.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Positions in the chain
          </dt>
          <dd className="mt-1 font-mono text-2xl text-gray-900">{chain?.length ?? "…"}</dd>
          <p className="mt-1 text-xs text-gray-600">
            Each card names its parent, so the whole run of them can be walked end to end. A card
            quietly removed would break the walk.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Bodies we do not publish
          </dt>
          <dd className="mt-1 font-mono text-2xl text-gray-900">
            {chain?.bodies_withheld ?? "…"}
          </dd>
          <p className="mt-1 text-xs text-gray-600">
            Their contents stay private, but their positions are listed, so we cannot make one
            disappear without it showing.
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
          className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white hover:bg-emerald-700"
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
      "Reachable from the site header and footer, and from nothing on the board. The one financial row that has a measurement behind it points at this evidence in the board's own data, and that pointer was rendered nowhere.",
    status: "Proven on a test network. Attaching to the main network is planned and is not done.",
  },
  {
    path: "/interop/financial-measure-run-v2.json",
    what: "The signed run behind the one financial row that carries a measurement.",
    why:
      "The board's own data names this file as that row's evidence, and no page fetched it. Three pages fetch the earlier unsigned version of the same run instead.",
    status: "Signed and published.",
  },
  {
    path: "/interop/evm-control-facts.json",
    what: "The same style of control-fact reading, on a different kind of public ledger.",
    why: "Published and signed, and referenced by no page at all.",
    status:
      "Signed. The attestation back end for this kind of ledger is not built, so nothing is attested there.",
  },
  {
    path: "/interop/coverage-register.json",
    what:
      "How much of each register was actually covered — which named instruments were read and which could not be located.",
    why:
      "This is the file that turns a headline into an honest one, and nothing links to it. Coverage is the difference between “we measured this family” and “we measured the part of it we could find”.",
    status: "Published.",
  },
  {
    path: "/interop/rwa-attest-index.json",
    what: "The index of attestation records produced for named financial instruments.",
    why: "Reachable only through a bulk API endpoint. No page renders it.",
    status: "Published.",
  },
  {
    path: "/interop/attestation-corpus.json",
    what: "The corpus of attestations gathered across rails.",
    why: "Reachable only through a bulk API endpoint.",
    status: "Published.",
  },
  {
    path: "/interop/eas-attestation-batch.json",
    what: "A prepared batch of attestation payloads for a third-party attestation service.",
    why: "Reachable only through a bulk API endpoint.",
    status: "Payloads are prepared. Nothing has been published to that service.",
  },
  {
    path: "/interop/jailbreak-asr-evidence-pack.json",
    what: "The per-model evidence behind the escape-detection work.",
    why: "Signed, dated, and linked from nowhere.",
    status: "Signed and published.",
  },
  {
    path: "/interop/jail-peritem-v3.json",
    what: "The item-by-item detail behind one board row, at the granularity a challenger needs.",
    why: "Signed, dated, and linked from nowhere.",
    status: "Signed and published.",
  },
  {
    path: "/interop/mcp-security-scorecard.json",
    what: "A security scorecard over tool servers, a measurement in its own right.",
    why: "Reachable only through a bulk API endpoint.",
    status: "Published.",
  },
  {
    path: "/interop/card-store-verification.json",
    what:
      "A record of searching five stores for the card bodies that would settle the disputed card count — and finding none.",
    why:
      "This is a published negative result, which is exactly the kind of thing that should be easy to find and was impossible to find.",
    status: "Published. The result was zero, and it is recorded as zero.",
  },
  {
    path: "/interop/rwa-registry.json",
    what: "The register of named financial instruments the financial rows draw from.",
    why: "Referenced in the data layer, rendered on no page.",
    status:
      "Published, and carrying no timestamp of any kind — so nothing derived from it can honestly claim a date.",
  },
  {
    path: "/interop/index-reference-reverify.json",
    what: "A re-check of the public reference series behind the candidate index rows.",
    why: "Not listed in the estate's own surface catalogue, and linked from nowhere.",
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
      "The verification instructions tell a stranger to walk this chain, and no page linked it until now.",
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
        Published, and until now unreachable from the board
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-800">
        These surfaces exist and are public. None of them had a route from the board, which means a
        reader who started at a headline number could not get to them — and a surface a reader
        cannot find is functionally unpublished. They are listed here with what each one measures
        and the honest state of the rail behind it.
      </p>
      {catalog?.as_of && (
        <p className="mt-2 text-xs text-gray-700">
          Cross-checked against the estate's own machine-readable catalogue of surfaces, dated{" "}
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
              <th className="px-4 py-2 font-semibold">Why it was hard to find</th>
              <th className="px-4 py-2 font-semibold">Honest state</th>
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
    document.title = "The measurement board — every set, what it measures, what it does not";
    setMetaDescription(
      "One navigable board across every axis set this estate publishes. Each set states what it measures, over what, when, what it establishes and what it does not — and every row links to the signed record behind it.",
    );
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
      {/* ── the headline sentence: what ranks what ─────────────────────────── */}
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Measurement, not certification
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          The measurement board
        </h1>
        <p className="mt-3 max-w-3xl text-base text-gray-700">
          We publish several different measuring instruments. Each one asks a different set of
          questions, of different things, on different dates — so each one carries its own count,
          and those counts are not supposed to match. Pick a set below before you meet a number.
          Every set states what it establishes and, just as plainly, what it does not.
        </p>
        <p className="mt-3 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <strong className="font-semibold">About the dates on this page.</strong> A date shown
          against a set is the stamp carried inside the data itself — when the measuring actually
          happened. It is not the time this page was rendered or deployed, so it advances only when
          something new is measured and recorded. Each set names the exact field its date was read
          from, so you can open the file and check.
        </p>
      </header>

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
                  {data.rows.length} rows · {measuredCount} carry a measurement ·{" "}
                  {unmeasuredCount} published with nothing behind them
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
                What is on the other end
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
