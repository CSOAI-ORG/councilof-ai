/**
 * LivingBoard — the first screen of /board for a stranger: how fresh the numbers are, where each
 * model could rank on one frozen bank, and the files to check it with.
 *
 * Every figure is read at runtime: dates and determinations from GET /api/gspc, per-model figures
 * from /interop/gspc-fleet-2026-08-12.json (computed from the hash-bound per-item rows by
 * scripts/gspc_separation_from_rows.py --fleet), the card count from /signed/card_index.json and
 * the root date from /root.json. Nothing is typed, and a failed read is said in words.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useLiveJson } from "./useLiveJson";
import {
  FLEET_CSV_URL,
  FLEET_URL,
  ROWS_RECORD_SIGNED_URL,
  axisView,
  comparedModels,
  daysSince,
  formatSpread,
  freshness,
  modelHref,
  pct1,
  type AxisView,
  type BoardDoc,
  type FleetDoc,
  type FleetModel,
} from "@/lib/livingBoard";

interface CardIndex {
  n_cards?: number;
}
interface RootDoc {
  as_of?: string;
}

const fmtDate = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function Age({ date }: { date: string }) {
  const days = daysSince(date.slice(0, 10), new Date());
  return <span className="text-gray-600">({days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`})</span>;
}

export function FreshnessLine({
  board,
  fleet,
  cards,
  root,
}: {
  board: BoardDoc | null;
  fleet: FleetDoc | null;
  cards: CardIndex | null;
  root: RootDoc | null;
}) {
  const f = board ? freshness(board) : null;
  const models = fleet ? comparedModels(fleet) : null;
  const items: React.ReactNode[] = [];
  if (f && f.comparisonDates.length) {
    const first = f.comparisonDates[0];
    const last = f.comparisonDates[f.comparisonDates.length - 1];
    items.push(
      <span key="cmp">
        Model comparisons measured{" "}
        {first === last ? (
          <strong>{fmtDate(first)}</strong>
        ) : (
          <>
            between <strong>{fmtDate(first)}</strong> and <strong>{fmtDate(last)}</strong>
          </>
        )}{" "}
        <Age date={last} />
      </span>,
    );
  }
  if (models) {
    items.push(
      <span key="models">
        <strong>{models.length}</strong> third-party models compared
      </span>,
    );
  }
  if (f?.newest) {
    items.push(
      <span key="newest">
        newest measurement on the board <strong>{fmtDate(f.newest.date)}</strong> ({f.newest.axis})
      </span>,
    );
  }
  if (typeof cards?.n_cards === "number") {
    items.push(
      <span key="cards">
        <strong>{cards.n_cards}</strong> cards in the{" "}
        <a href="/signed/card_index.json" className="underline">
          signed card index
        </a>
      </span>,
    );
  }
  if (root?.as_of) {
    items.push(
      <span key="root">
        signed public root as of <strong>{fmtDate(root.as_of)}</strong> <Age date={root.as_of} />
      </span>,
    );
  }
  return (
    <p
      className="mt-4 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm leading-6 text-gray-800"
      data-testid="board-freshness"
    >
      {items.length === 0 ? (
        <span className="text-gray-600">Reading the dates from /api/gspc…</span>
      ) : (
        items.map((n, i) => (
          <span key={i}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            {n}
          </span>
        ))
      )}
      <span className="mt-1 block text-xs text-gray-600">
        Dates are the ones each measurement carries (from{" "}
        <a href="/api/gspc" className="underline">
          /api/gspc
        </a>{" "}
        → <code>measurement_time</code>), not when this page was built. They move only when something new
        is measured.
      </span>
    </p>
  );
}

function CiBar({ m }: { m: FleetModel }) {
  const [lo, hi] = m.wilson95;
  const acc = m.accuracy ?? 0;
  return (
    <div className="relative h-2.5 w-full min-w-[5rem] rounded bg-gray-100" aria-hidden="true">
      <div
        className="absolute top-0 h-2.5 rounded bg-sky-300"
        style={{ left: `${lo * 100}%`, width: `${Math.max(0.5, (hi - lo) * 100)}%` }}
      />
      <div className="absolute -top-0.5 h-3.5 w-0.5 bg-gray-900" style={{ left: `${acc * 100}%` }} />
    </div>
  );
}

function ModelRow({ m }: { m: FleetModel }) {
  const [lo, hi] = m.wilson95;
  return (
    <tr className="border-t border-gray-100 align-middle" data-testid="fleet-row">
      <td className="py-2 pr-3">
        <Link href={modelHref(m.model)} className="break-all font-mono text-xs font-semibold text-gray-900 underline sm:text-sm">
          {m.model}
        </Link>
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-right font-mono text-sm text-gray-900">
        {m.accuracy === null ? "—" : pct1(m.accuracy)}
        <span className="block text-[11px] text-gray-600">
          {m.k}/{m.n}
        </span>
      </td>
      <td className="hidden py-2 pr-3 sm:table-cell">
        <CiBar m={m} />
        <span className="font-mono text-[11px] text-gray-600">
          {pct1(lo)}–{pct1(hi)}
        </span>
      </td>
      <td className="whitespace-nowrap py-2 text-right font-mono text-sm text-gray-900" title="Possible positions given every model's 95% range">
        {formatSpread(m.rank_spread)}
        <span className="block text-[11px] text-gray-600 sm:hidden">
          {pct1(lo)}–{pct1(hi)}
        </span>
      </td>
    </tr>
  );
}

function AxisTable({ view }: { view: AxisView }) {
  if (view.kind !== "ranked") {
    return (
      <div
        className={`rounded-xl border p-4 text-sm ${
          view.kind === "mismatch" ? "border-rose-300 bg-rose-50 text-rose-950" : "border-amber-300 bg-amber-50 text-amber-950"
        }`}
        data-testid={`axis-${view.kind}`}
      >
        <p className="font-semibold">
          {view.kind === "mismatch" ? "Not shown: the sources disagree." : "No positions published on this axis."}
        </p>
        <p className="mt-1">{view.reason}</p>
        {view.kind === "withheld" && view.fleet.models_withheld ? (
          <p className="mt-1 text-xs">
            {view.fleet.models_withheld} third-party models answered this bank. Their per-item answers are
            public in the{" "}
            <a href={FLEET_URL} className="underline">
              fleet file
            </a>
            's source dataset; the board names no position here.
          </p>
        ) : null}
      </div>
    );
  }
  const { board, groups, fleet } = view;
  return (
    <div>
      <p className="text-sm text-gray-800">
        {board.task ?? board.axis}
        {board.bench ? <span className="text-gray-600"> · {board.bench}</span> : null} ·{" "}
        <span className="font-mono">{fleet.distinct_items}</span> questions in the frozen bank · higher is better
      </p>
      <table className="mt-3 w-full text-left" data-testid="fleet-table">
        <thead>
          <tr className="whitespace-nowrap text-[11px] uppercase tracking-wide text-gray-600">
            <th className="pb-1 pr-3 font-bold">Model</th>
            <th className="pb-1 pr-3 text-right font-bold">Score</th>
            <th className="hidden pb-1 pr-3 font-bold sm:table-cell">95% range (Wilson)</th>
            <th className="pb-1 text-right font-bold">
              <span className="sm:hidden">Position</span>
              <span className="hidden sm:inline">Possible position</span>
            </th>
          </tr>
        </thead>
        {groups.map((g, gi) => (
          <tbody key={gi} data-testid={`group-${g.label}`}>
            <tr>
              <td colSpan={4} className="pt-3">
                {g.label === "no-clear-winner" && (
                  <p className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-bold text-white">
                    No clear winner (tie) — {g.models.length} models
                  </p>
                )}
                {g.label === "separated-leader" && (
                  <p className="rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-bold text-white">
                    Separated leader (the board's test)
                  </p>
                )}
                {g.label === "ordered" && (
                  <p className="px-1 text-xs font-bold uppercase tracking-wide text-gray-600">
                    Below the top group
                  </p>
                )}
              </td>
            </tr>
            {g.models.map((m) => (
              <ModelRow key={m.model} m={m} />
            ))}
          </tbody>
        ))}
      </table>
      {board.separation_sentence && (
        <p className="mt-3 text-sm text-gray-800">
          <span className="font-semibold">The board's test:</span> {board.separation_sentence}
        </p>
      )}
      <p className="mt-1 text-xs text-gray-600">
        “Possible position” is the range of places a model could hold given every model's 95% range on the
        same frozen bank. Overlapping ranges are not ordered by this measurement. It is annotation; the
        tie-or-separated word comes only from the board's fixed test. {fleet.own_overlays.count} of our own
        prompt overlays answered this bank too; they are excluded before comparison and not shown.
      </p>
    </div>
  );
}

function DownloadCard({ fleet, board }: { fleet: FleetDoc | null; board: BoardDoc | null }) {
  const own = fleet ? Math.max(0, ...Object.values(fleet.axes).map((a) => a.own_overlays.count)) : null;
  const licence = board?.peritem_rows?.licence ?? fleet?.licence ?? null;
  return (
    <aside className="self-start rounded-2xl border border-gray-200 bg-gray-50 p-4" data-testid="board-download">
      <h3 className="text-sm font-bold text-gray-900">Download and check it</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        <li>
          <a href={FLEET_CSV_URL} download className="font-semibold text-gray-900 underline">
            CSV
          </a>{" "}
          <span className="text-gray-600">— every model, every axis</span>
        </li>
        <li>
          <a href={FLEET_URL} className="font-semibold text-gray-900 underline">
            JSON
          </a>{" "}
          <span className="text-gray-600">— the same figures, with the rule</span>
        </li>
        <li>
          <a href="/api/gspc" className="font-semibold text-gray-900 underline">
            Board JSON
          </a>{" "}
          <span className="text-gray-600">— /api/gspc, the authority</span>
        </li>
        <li>
          <a href={ROWS_RECORD_SIGNED_URL} className="font-semibold text-gray-900 underline">
            Signed rows record
          </a>{" "}
          <span className="text-gray-600">— binds the per-item rows by hash</span>
        </li>
        <li>
          <a href="/root.json" className="font-semibold text-gray-900 underline">
            Signed public root
          </a>
        </li>
        {fleet && (
          <li>
            <a href={fleet.dataset_url} className="font-semibold text-gray-900 underline">
              Per-item rows
            </a>{" "}
            <span className="text-gray-600">— recompute every figure</span>
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs text-gray-700">
        Licence: <strong>{licence ?? "not stated in the data"}</strong>
        {licence ? " (read from /api/gspc → peritem_rows.licence)" : ""}.
      </p>
      {own !== null && (
        <p className="mt-1 text-xs text-gray-700">
          Our own models: {own} prompt overlays are in the rows. In the CSV they are one tagged line per axis
          (<code>own_overlays_excluded</code>), excluded before comparison and never scored.
        </p>
      )}
      <p className="mt-1 text-xs text-gray-700">
        <Link href="/gspc-verify" className="underline">
          Verify a signed card
        </Link>{" "}
        — free, offline, no account.
      </p>
    </aside>
  );
}

/** The freshness line on its own, for a page's first screen. Shares LivingBoard's reads. */
export function BoardFreshness() {
  const board = useLiveJson<BoardDoc>("/api/gspc");
  const fleet = useLiveJson<FleetDoc>(FLEET_URL);
  const cards = useLiveJson<CardIndex>("/signed/card_index.json");
  const root = useLiveJson<RootDoc>("/root.json");
  return <FreshnessLine board={board.data} fleet={fleet.data} cards={cards.data} root={root.data} />;
}

function NewOnTheBoard() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-700" data-testid="new-on-board">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">New on the board</h3>
      <p className="mt-1">
        No dated feed yet. Admission records for newly measured models carry no date, and an admitted card does
        not change the board above, so there is nothing honest to list here. Every measured model, with its
        signed cards, is on{" "}
        <Link href="/models-measured" className="underline">
          the measured-models list
        </Link>
        .
      </p>
    </div>
  );
}

export default function LivingBoard({ withFreshness = true }: { withFreshness?: boolean }) {
  const board = useLiveJson<BoardDoc>("/api/gspc");
  const fleet = useLiveJson<FleetDoc>(FLEET_URL);
  const cards = useLiveJson<CardIndex>("/signed/card_index.json");
  const root = useLiveJson<RootDoc>("/root.json");

  const axes = useMemo(() => (fleet.data ? Object.keys(fleet.data.axes) : []), [fleet.data]);
  const views = useMemo(() => {
    if (!fleet.data || !board.data) return {} as Record<string, AxisView>;
    return Object.fromEntries(axes.map((a) => [a, axisView(a, fleet.data!, board.data!)]));
  }, [axes, fleet.data, board.data]);
  const ranked = axes.filter((a) => views[a]?.kind === "ranked");
  const [picked, setPicked] = useState<string | null>(null);
  const active = picked ?? ranked[0] ?? axes[0] ?? null;

  return (
    <section className="mt-6" aria-labelledby="living-board-h" data-testid="living-board">
      {withFreshness && <FreshnessLine board={board.data} fleet={fleet.data} cards={cards.data} root={root.data} />}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 id="living-board-h" className="text-xl font-bold text-gray-900">
          Model comparison: where each model could rank
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-700">
          Same questions for every model. Every figure recomputable from the published per-item rows. Untested stays blank. Pick an axis.
        </p>

        {(board.state === "error" || fleet.state === "error") && (
          <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-950" role="alert">
            Could not read {board.state === "error" ? "/api/gspc" : FLEET_URL} ({board.error ?? fleet.error}). No
            figures are drawn rather than old ones.
          </p>
        )}

        {axes.length > 0 && (
          <div className="mt-3" role="group" aria-label="Choose an axis">
            <div className="flex flex-wrap gap-1.5">
              {ranked.map((a) => {
                const on = a === active;
                return (
                  <button
                    key={a}
                    onClick={() => setPicked(a)}
                    aria-pressed={on}
                    data-testid={`axis-chip-${a}`}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      on ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-800 hover:border-gray-500"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
            {axes.length > ranked.length && (
              <p className="mt-2 text-xs text-gray-700">
                <span className="font-semibold">No positions published on:</span>{" "}
                {axes
                  .filter((a) => !ranked.includes(a))
                  .map((a, i) => (
                    <span key={a}>
                      {i > 0 && ", "}
                      <button
                        onClick={() => setPicked(a)}
                        aria-pressed={a === active}
                        data-testid={`axis-chip-${a}`}
                        className={`underline ${a === active ? "font-bold text-gray-900" : "text-gray-700"}`}
                      >
                        {a}
                      </button>
                    </span>
                  ))}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {active && views[active] ? (
              <AxisTable view={views[active]} />
            ) : (
              <p className="text-sm text-gray-600" role="status">
                {board.state === "loading" || fleet.state === "loading" ? "Reading the board…" : "Nothing to show."}
              </p>
            )}
          </div>
          <DownloadCard fleet={fleet.data} board={board.data} />
        </div>
        <NewOnTheBoard />
      </div>
    </section>
  );
}
