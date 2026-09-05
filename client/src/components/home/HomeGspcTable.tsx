/**
 * HomeGspcTable — the home-page GSPC board table, and the models block under it.
 *
 * ONE READ, ONE TRUTH. The table is GET /api/gspc rendered row by row in the
 * order the board serves — board order is layout, never rank. Every cell is a
 * field off the payload printed verbatim (status, family, separation,
 * public_leader_state) or a number off the payload (n, accuracy, interval).
 * The lid sentence is totals.lid, quoted verbatim; the tally under the table
 * is counted from the rows on screen at render time. Nothing is typed.
 *
 * ABSENT IS NOT ZERO. If the endpoint does not answer, the surface prints
 * "unread" with the reason and renders no figure at all. A slot with no
 * status prints UNMEASURED (the payload's own rule). A withheld leader prints
 * its state. A TIE prints TIE.
 *
 * THE MODELS BLOCK lists only the models the board publishes as public
 * leaders — today that is however many the payload carries, and the note
 * under it says so with the withheld states counted beside it. It is never
 * padded to a round number.
 *
 * White + green, mobile-first: a card list under `sm`, a table from `sm` up.
 */
import { useEffect, useState } from "react";
import { useGspcBoard, type GspcAxis, type GspcPayload } from "../board/useGspcBoard";
import { boardAxisLabel } from "./HomeGspcBoard";
import {
  familyText,
  fmtPct,
  leaderCell,
  leadersNote,
  lidOf,
  nText,
  publicCountOf,
  publicLeaders,
  separationText,
  statusText,
  tally,
  tallyLine,
  unreadLine,
  withheldWords,
} from "./homeGspcTableReaders";

const chipBase = "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-tight";

function StatusWord({ status }: { status: string }) {
  const cls =
    status === "MEASURED"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : status === "UNMEASURED"
        ? "border-slate-300 bg-slate-50 text-slate-700"
        : "border-amber-300 bg-amber-50 text-amber-900";
  return (
    <span className={`${chipBase} ${cls}`} data-status={status}>
      {status}
    </span>
  );
}

function SeparationWord({ a }: { a: GspcAxis }) {
  const s = separationText(a);
  const cls =
    s === "SEPARATED"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : s === "TIE"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-slate-300 bg-white text-slate-700";
  const title =
    s === "TIE"
      ? "A point-estimate lead that is not statistically separated. A TIE is not a win."
      : s === "SEPARATED"
        ? "The leader's edge is statistically separated (McNemar p<0.05)."
        : s === "UNTESTED"
          ? "Measured, but no separation test has been run on this axis yet."
          : undefined;
  return (
    <span className={`${chipBase} ${cls}`} title={title} data-separation={s}>
      {s}
    </span>
  );
}

function LeaderWords({ a }: { a: GspcAxis }) {
  const cell = leaderCell(a);
  if (cell.kind === "facts") return <span className="text-slate-600">no leader · deterministic facts, no fleet</span>;
  if (cell.kind === "withheld")
    return (
      <span className="text-slate-700" data-leader-state={cell.state}>
        {withheldWords(cell.state)}
      </span>
    );
  if (cell.kind === "none") return <span className="text-slate-600">no leader published</span>;
  return (
    <span data-leader-state="PUBLIC">
      <span className="font-semibold text-slate-900">{cell.model}</span>
      {cell.accuracy != null ? <span className="ml-1.5 font-mono tabular-nums text-slate-900">{fmtPct(cell.accuracy)}</span> : null}
      {cell.separation === "TIE" ? <span className="ml-1.5 text-slate-600">· TIE, a point lead is not a measured advantage</span> : null}
    </span>
  );
}

function AxisName({ a }: { a: GspcAxis }) {
  const label = boardAxisLabel(a.axis);
  const href = a.kind === "model-comparison" ? `/gspc/${encodeURIComponent(a.axis)}/` : typeof a.evidence_url === "string" && a.evidence_url ? a.evidence_url : null;
  return (
    <span className="block">
      {href ? (
        <a href={href} className="font-bold text-slate-900 hover:text-emerald-800 hover:underline">
          {label}
        </a>
      ) : (
        <span className="font-bold text-slate-900">{label}</span>
      )}
      <span className="block font-mono text-[11px] text-slate-500">{a.axis}</span>
    </span>
  );
}

/** The row that opens under a selected axis: what the payload says about it, and nothing more. */
function AxisDetail({ a }: { a: GspcAxis }) {
  const lo = Array.isArray(a.interval) ? a.interval[0] : null;
  const hi = Array.isArray(a.interval) ? a.interval[1] : null;
  const fleetMean = typeof a.fleet_mean === "number" && Number.isFinite(a.fleet_mean) ? a.fleet_mean : null;
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-slate-800" data-testid="home-axis-detail" data-axis={a.axis}>
      {a.bench ? <p className="font-semibold text-slate-900">{String(a.bench)}</p> : null}
      {a.task ? <p className="mt-1">{String(a.task)}</p> : null}
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">n</dt>
          <dd className="font-mono text-slate-900">{nText(a)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">95% interval</dt>
          <dd className="font-mono text-slate-900">{lo != null && hi != null ? `${fmtPct(Number(lo))} – ${fmtPct(Number(hi))}` : "not published"}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">fleet mean</dt>
          <dd className="font-mono text-slate-900">{fleetMean != null ? fmtPct(fleetMean) : "not published"}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">dataset</dt>
          <dd className="truncate">
            {typeof a.dataset_url === "string" && a.dataset_url ? (
              <a href={a.dataset_url} target="_blank" rel="noreferrer" className="font-semibold text-emerald-800 hover:underline">
                {String(a.dataset ?? a.dataset_url)}
              </a>
            ) : (
              "not published"
            )}
          </dd>
        </div>
      </dl>
      {a.note ? <p className="mt-2 text-xs leading-relaxed text-slate-700">{String(a.note)}</p> : null}
    </div>
  );
}

export default function HomeGspcTable({
  className = "",
  heading = "The living board",
  highlight = null,
  onSelect,
  data: injected,
  error: injectedError = null,
}: {
  className?: string;
  /** The page owns the heading text; the table owns everything read off the API. */
  heading?: string;
  /** Axis the composer named — we select it and scroll it into view. */
  highlight?: string | null;
  onSelect?: (axis: string) => void;
  /** Injected payload (tests, SSR) bypasses the fetch. */
  data?: GspcPayload | null;
  error?: string | null;
}) {
  const live = useGspcBoard();
  const data = injected !== undefined ? injected : live.data;
  const error = injected !== undefined ? injectedError : live.error;
  const loading = injected !== undefined ? false : live.loading;

  const [picked, setPicked] = useState<string | null>(null);
  const want = (highlight || picked || "").toLowerCase();

  useEffect(() => {
    if (highlight) setPicked(highlight);
  }, [highlight]);

  useEffect(() => {
    if (!want) return;
    document.getElementById(`axis-${want}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [want]);

  function choose(axis: string) {
    setPicked((cur) => (cur === axis ? null : axis));
    onSelect?.(axis);
  }

  const axes: GspcAxis[] = Array.isArray(data?.axes) ? (data!.axes as GspcAxis[]) : [];
  const lid = lidOf(data);
  const publicCount = publicCountOf(data);
  const t = tally(axes);
  const leaders = publicLeaders(axes);
  const unread = !loading && (!!error || !data);

  const th = "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600";
  const td = "px-3 py-3 align-top text-sm";

  return (
    <section className={`w-full ${className}`} aria-labelledby="home-board-h" data-testid="home-gspc-table">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Live from GET /api/gspc</p>
      <h2 id="home-board-h" className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        {heading}
      </h2>

      {/* The lid: totals.lid verbatim, or a labelled absence. */}
      <p className="mt-3 text-base font-semibold text-slate-900" data-testid="home-lid">
        {unread ? unreadLine(error) : loading ? "reading GET /api/gspc…" : lid ?? "The board did not publish a lid sentence. Empty stays empty."}
      </p>
      {!unread && !loading && publicCount ? (
        <p className="mt-1 font-mono text-sm text-emerald-900" data-testid="home-public-count">
          {publicCount}
        </p>
      ) : null}
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        Rows are in board order — layout, not rank. Status, family, separation and leader state are printed as the API serves them. A TIE is a
        TIE. A withheld leader is a state, not an empty cell. Verify is free; a rank is never sold. Measurement, not certification.
      </p>

      {loading && !unread ? (
        <div className="mt-6 space-y-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-emerald-50" />
          ))}
        </div>
      ) : null}

      {unread ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5" data-testid="home-board-unread">
          <p className="text-lg font-black tracking-tight text-rose-800">The board is unread.</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-800">{unreadLine(error)}</p>
          <a href="/api/gspc" className="mt-3 inline-block text-sm font-bold text-rose-800 underline underline-offset-2">
            Try the endpoint directly →
          </a>
        </div>
      ) : null}

      {!unread && !loading ? (
        <>
          {/* ── mobile: one card per axis ────────────────────────────────── */}
          <ol className="mt-6 space-y-2 sm:hidden" aria-label="GSPC board axes in board order" data-testid="home-board-cards">
            {axes.map((a) => {
              const active = want !== "" && a.axis.toLowerCase() === want;
              return (
                <li key={a.axis} id={`axis-${a.axis.toLowerCase()}`} className={`rounded-xl border p-3 ${active ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                  <button type="button" onClick={() => choose(a.axis)} className="w-full text-left" aria-expanded={active}>
                    <div className="flex items-start justify-between gap-2">
                      <AxisName a={a} />
                      <span className="font-mono text-xs text-slate-700">n {nText(a)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StatusWord status={statusText(a)} />
                      <SeparationWord a={a} />
                      <span className={`${chipBase} border-slate-200 bg-slate-50 text-slate-700`}>{familyText(a)}</span>
                    </div>
                    <p className="mt-2 text-sm">
                      <LeaderWords a={a} />
                    </p>
                  </button>
                  {active ? (
                    <div className="mt-2">
                      <AxisDetail a={a} />
                    </div>
                  ) : null}
                </li>
              );
            })}
            {axes.length === 0 ? <li className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600">The board returned no rows. Empty stays empty.</li> : null}
          </ol>

          {/* ── sm and up: the table ─────────────────────────────────────── */}
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
            <table className="w-full min-w-[44rem]" data-testid="home-board-table">
              <caption className="sr-only">The GSPC board from GET /api/gspc, in board order. Board order is layout, not rank. A TIE is not a win.</caption>
              <thead className="border-b border-slate-200 bg-emerald-50/60">
                <tr>
                  <th scope="col" className={th}>Axis</th>
                  <th scope="col" className={th}>Family</th>
                  <th scope="col" className={th}>Status</th>
                  <th scope="col" className={th}>n</th>
                  <th scope="col" className={th}>Separation</th>
                  <th scope="col" className={th}>Public leader</th>
                </tr>
              </thead>
              <tbody>
                {axes.map((a) => {
                  const active = want !== "" && a.axis.toLowerCase() === want;
                  return [
                    <tr
                      key={a.axis}
                      id={`axis-${a.axis.toLowerCase()}`}
                      data-axis-row={a.axis}
                      onClick={() => choose(a.axis)}
                      className={`cursor-pointer border-b border-slate-100 ${active ? "bg-emerald-50" : "hover:bg-emerald-50/40"}`}
                    >
                      <td className={td}>
                        <AxisName a={a} />
                      </td>
                      <td className={`${td} whitespace-nowrap font-mono text-xs text-slate-700`}>{familyText(a)}</td>
                      <td className={td}>
                        <StatusWord status={statusText(a)} />
                      </td>
                      <td className={`${td} whitespace-nowrap font-mono tabular-nums text-slate-900`} title={typeof a.n_note === "string" ? a.n_note : undefined}>
                        {nText(a)}
                      </td>
                      <td className={td}>
                        <SeparationWord a={a} />
                      </td>
                      <td className={td}>
                        <LeaderWords a={a} />
                      </td>
                    </tr>,
                    active ? (
                      <tr key={`${a.axis}-detail`} className="border-b border-slate-100">
                        <td colSpan={6} className="px-3 pb-3">
                          <AxisDetail a={a} />
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
                {axes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-sm text-slate-600">
                      The board returned no rows. Empty stays empty.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* The tally: counted from the rows on screen, at render time. */}
          <p className="mt-3 font-mono text-xs text-slate-600" data-testid="home-board-tally">
            {tallyLine(t)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <a href="/dashboard?tab=board" className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
              Open the full board in Council OS →
            </a>
            <a href="/api/gspc" className="font-semibold text-emerald-800 underline-offset-2 hover:underline">
              /api/gspc
            </a>
            <a href="/methodology" className="text-slate-600 underline-offset-2 hover:underline">
              Methodology
            </a>
          </div>

          {/* ── the models block: public leader scores only ─────────────── */}
          <div className="mt-12" data-testid="home-models-ranked">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Models with a public leader score</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              One entry per axis whose leader the board publishes. Ordered by point estimate on each model&apos;s own frozen bank — layout, not a
              cross-axis rank. A TIE is not a win.
            </p>
            {leaders.length > 0 ? (
              <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Models the board publishes as public leaders">
                {leaders.map((m) => (
                  <li key={`${m.axis}-${m.model}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" data-model-row={m.model}>
                    <p className="text-lg font-black tracking-tight text-slate-900">{m.model}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      leads{" "}
                      <a href={`/gspc/${encodeURIComponent(m.axis)}/`} className="font-semibold text-emerald-800 hover:underline">
                        {boardAxisLabel(m.axis)}
                      </a>
                    </p>
                    <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">{m.accuracy != null ? fmtPct(m.accuracy) : "no accuracy published"}</span>
                      {m.interval ? (
                        <span className="font-mono text-xs text-slate-600">
                          {fmtPct(m.interval[0])} – {fmtPct(m.interval[1])}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`${chipBase} ${
                          m.separation === "SEPARATED"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : m.separation === "TIE"
                              ? "border-amber-300 bg-amber-50 text-amber-900"
                              : "border-slate-300 bg-white text-slate-700"
                        }`}
                        data-separation={m.separation}
                      >
                        {m.separation}
                      </span>
                      <span className={`${chipBase} border-slate-200 bg-slate-50 text-slate-700`}>n {m.n ?? "not published"}</span>
                    </p>
                    {m.separation === "TIE" ? <p className="mt-2 text-xs text-slate-600">A point lead the test could not separate from the fleet.</p> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">The board publishes no public leader score today. Nothing is shown in its place.</p>
            )}
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-600" data-testid="home-models-note">
              {leadersNote(t, data?.totals)}
            </p>
          </div>
        </>
      ) : null}
    </section>
  );
}
