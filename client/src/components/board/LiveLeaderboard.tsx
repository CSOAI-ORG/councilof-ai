import { useEffect, useState } from "react";
import {
  countLine,
  hasFigure,
  orderedRows,
  pct,
  useGspcBoard,
  type GspcAxis,
} from "./useGspcBoard";
import StatusChip, { chipFor } from "./StatusChip";
import HumanVsAiPanel from "./HumanVsAiPanel";
import { lobbyTaskHref, openLobby } from "@/lib/lobbyLink";

/**
 * LiveLeaderboard — the branded board grid, driven entirely by GET /api/gspc.
 *
 * SELF-CONTAINED BY DESIGN. It owns its fetch, its states and its copy, so it
 * can be dropped into any page with one line and no props. It renders three
 * things and nothing else: the count line the API states, the rows the API
 * serves, and an honest failure when the API does not answer.
 *
 * THE THREE HONESTY RULES IT ENFORCES
 *   1. No number is hardcoded. Every figure, every n, and every count (how many
 *      axes, how many measured) is read from the payload. There is no "13" in
 *      this file, because the day the board changes shape this component must
 *      change with it, not lie about it.
 *   2. An unmeasured cell is a DESIGNED state. A slot with no measured figure
 *      renders a labelled slate chip — "UNMEASURED — not yet gated" — where the
 *      number would be. Not a blank, not a dash, and never a zero: a zero is a
 *      measurement and we do not have one.
 *   3. A TIE renders as a TIE. A point-estimate lead that is not statistically
 *      separated is chipped amber and reads "indistinguishable". We do not count
 *      ties as wins, so the grid does not draw them as wins.
 *
 * ORDER IS NOT RANK. Rows are ordered by the measured figure so the grid reads
 * as a board, with unmeasured slots kept and moved to the end. That ordering is
 * presentation: a TIE row sits high on its point estimate while its chip says
 * the lead is not real. The caption on the table says exactly this.
 *
 * The two controls beneath the grid — "Show all" and "Open in the Council
 * Lobby" — are the AG-UI seam: the second is a real href built by lobbyLink,
 * which opens the lobby on the board pane with a question already typed and
 * un-sent.
 */

const DEFAULT_ROWS = 6;

export default function LiveLeaderboard({
  className = "",
  showHumanPanel = true,
  heading = "The live board",
  defaultExpanded = false,
  highlight = null,
  onSelect,
}: {
  className?: string;
  /** Set false to render the grid alone. */
  showHumanPanel?: boolean;
  heading?: string;
  /** Home desk starts with every slot visible. */
  defaultExpanded?: boolean;
  /** Axis the composer named — we select it and scroll it into view. */
  highlight?: string | null;
  onSelect?: (axis: string) => void;
}) {
  const { data, error, loading } = useGspcBoard();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [picked, setPicked] = useState<string | null>(null);

  const rows = orderedRows(data);
  const shown = expanded ? rows : rows.slice(0, DEFAULT_ROWS);
  const count = countLine(data);
  const want = (highlight || picked || "").toLowerCase();
  const selected = rows.find((r) => r.axis.toLowerCase() === want) ?? null;

  useEffect(() => {
    if (highlight) {
      setPicked(highlight);
      setExpanded(true);
    }
  }, [highlight]);

  useEffect(() => {
    if (!want) return;
    document.getElementById("board-result")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [want]);

  function choose(axis: string) {
    setPicked(axis);
    onSelect?.(axis);
  }

  return (
    <section className={`w-full ${className}`}>
      <div className="section-shell">
        <p className="t-kicker text-primary">
          Live from GET /api/gspc — recompute anything, free
        </p>
        <h2 className="t-section mt-4 text-foreground">
          {heading}
        </h2>
        <p className="t-lede measure mt-4 text-muted-foreground">
          {count ? <><strong className="font-bold text-foreground">{count}</strong> · </> : null}
          deterministic grading on frozen, published splits. A <strong>TIE</strong> means the
          leader&apos;s edge is statistically indistinguishable — ties are never counted as wins. A
          slot with no measurement says so in words; it is never shown as a zero.
        </p>

        {/* ── unreachable: say it plainly, render no figures at all ────── */}
        {error && (
          <div className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] p-6">
            <p className="text-lg font-black tracking-tight text-rose-700 dark:text-rose-200">
              The board could not be read.
            </p>
            <p className="measure mt-2 text-sm leading-relaxed text-foreground/80">
              <code className="font-mono">/api/gspc</code> did not answer — {error}. No figures are
              shown, because none were read. Nothing on this page is standing in for the live board.
            </p>
            <a
              href="/api/gspc"
              className="mt-4 inline-block text-sm font-bold text-rose-700 underline underline-offset-2 dark:text-rose-200"
            >
              Try the endpoint directly →
            </a>
          </div>
        )}

        {loading && !error && (
          <div className="mt-8 space-y-2" aria-hidden="true">
            {Array.from({ length: DEFAULT_ROWS }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-primary/[0.07]" />
            ))}
          </div>
        )}

        {data && !error && (
          <>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[46rem] text-sm">
                <caption className="sr-only">
                  The live GSPC board, ordered by measured figure. Ordering is presentation, not a
                  ranking of skill: a row can lead on its point estimate and still carry a TIE chip
                  meaning the lead is not statistically separated.
                </caption>
                <thead>
                  <tr className="border-b border-border bg-primary/[0.07] text-left text-[12px] font-bold uppercase tracking-wide text-foreground/80">
                    <th scope="col" className="p-4">Axis</th>
                    <th scope="col" className="p-4">Measured figure</th>
                    <th scope="col" className="p-4">n</th>
                    <th scope="col" className="p-4">Status</th>
                    <th scope="col" className="p-4 text-right">Ask</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((a) => (
                    <Row
                      key={a.axis}
                      a={a}
                      active={want !== "" && a.axis.toLowerCase() === want}
                      onChoose={() => choose(a.axis)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {selected && <AxisResult a={selected} />}

            {/* ── the two controls ─────────────────────────────────────── */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {rows.length > DEFAULT_ROWS && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="rounded-full border border-primary/30 bg-card px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10"
                >
                  {expanded
                    ? `Show top ${DEFAULT_ROWS}`
                    : `Show all ${rows.length} slots`}
                </button>
              )}

              <a
                href={lobbyTaskHref("read-the-board")}
                onClick={(e) => { e.preventDefault(); openLobby({ task: "read-the-board" }); }}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open in the Council Lobby →
              </a>

              <a
                href="/gspc-scoreboard"
                className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
              >
                The full board, with intervals and harm tails
              </a>
            </div>

            <p className="measure mt-6 text-xs leading-relaxed text-muted-foreground">
              Measurement, not certification. Rows are ordered by the measured figure; that is
              layout, not a claim — read the status chip, not the position. Counts, figures and n
              all come from <code className="font-mono">GET /api/gspc</code>, which serves its own
              limitations alongside its numbers.
            </p>

            {showHumanPanel && <HumanVsAiPanel data={data} className="mt-10" />}
          </>
        )}
      </div>
    </section>
  );
}

function AxisResult({ a }: { a: GspcAxis }) {
  const measured = hasFigure(a);
  const kind = typeof a.kind === "string" ? a.kind : undefined;
  const chip = chipFor(a.status, a.separation, kind);
  const width = measured ? Math.max(2, Math.min(100, (a.accuracy as number) * 100)) : 0;
  const lo = Array.isArray(a.interval) ? a.interval[0] : null;
  const hi = Array.isArray(a.interval) ? a.interval[1] : null;
  return (
    <aside
      id="board-result"
      className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6"
      aria-live="polite"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-800">
        Selected axis
      </p>
      <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">{a.axis}</h3>
      {a.bench && <p className="mt-1 text-sm text-slate-600">{a.bench}</p>}
      {a.task && <p className="mt-3 text-sm leading-relaxed text-slate-700">{a.task}</p>}
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-800">Measured figure</span>
          <span className="font-mono font-bold text-slate-900">
            {measured ? `${a.accuracy_is ? "≥" : ""}${pct(a.accuracy as number)}` : "no figure — empty stays empty"}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white ring-1 ring-emerald-200">
          <div
            className={measured ? "h-full rounded-full bg-emerald-600" : "h-full"}
            style={{ width: `${width}%` }}
          />
        </div>
        {lo != null && hi != null && (
          <p className="mt-1 font-mono text-[11px] text-slate-500">
            95% CI {pct(lo)} – {pct(hi)}
          </p>
        )}
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">n</dt>
          <dd className="font-mono text-slate-900">
            {typeof a.n === "number" ? a.n : "—"}
            {a.n_unit ? ` ${a.n_unit}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="mt-1"><StatusChip kind={chip} /></dd>
        </div>
        {a.leader && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leader</dt>
            <dd className="text-slate-800">{a.leader}</dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-xs text-slate-600">
        Ordering is layout, not a purchased rank. A TIE is never a win. Ask below about this row, or open the axis.
      </p>
      <p className="mt-2 text-sm">
        <a href={`/gspc/${encodeURIComponent(a.axis)}`} className="font-semibold text-emerald-800 hover:underline">
          Open {a.axis} →
        </a>
      </p>
    </aside>
  );
}

function Row({ a, active, onChoose }: { a: GspcAxis; active: boolean; onChoose: () => void }) {
  const measured = hasFigure(a);
  // `kind` distinguishes an axis with no run (UNMEASURED) from one that IS
  // measured but by deterministic facts, which have no leader and so no
  // accuracy. Without it, provenance-controls — a signed mainnet run over 6
  // issuer accounts — rendered as UNMEASURED on this table.
  const kind = typeof a.kind === "string" ? a.kind : undefined;
  const chip = chipFor(a.status, a.separation, kind);
  const facts = kind === "deterministic-facts";

  return (
    <tr
      id={`axis-${a.axis}`}
      className={`cursor-pointer border-b border-border align-middle last:border-0 ${
        active ? "bg-emerald-50" : "hover:bg-primary/[0.05]"
      }`}
      onClick={onChoose}
    >
      <td className="p-4">
        <div className="font-bold tracking-tight text-foreground">{a.axis}</div>
        {a.bench && <div className="mt-0.5 text-xs text-muted-foreground">{a.bench}</div>}
      </td>

      <td className="p-4">
        {measured ? (
          <span className="font-mono text-[15px] font-bold tabular-nums text-foreground">
            {a.accuracy_is ? "≥" : ""}
            {pct(a.accuracy as number)}
            {a.accuracy_is && (
              <span
                title={a.accuracy_is}
                className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                lower bound
              </span>
            )}
          </span>
        ) : facts ? (
          // Measured, but not by a model comparison: render what it HAS (its
          // coverage over its own declared universe), never an empty percentage.
          <span className="text-xs text-gray-600">
            no leader accuracy
            {typeof a.coverage === "string" && a.coverage && (
              <span className="mt-0.5 block text-[11px] text-gray-500">{a.coverage}</span>
            )}
          </span>
        ) : (
          // The designed unmeasured state: a label, never a blank and never a 0.
          <StatusChip kind="UNMEASURED" />
        )}
      </td>

      <td className="p-4">
        {typeof a.n === "number" && Number.isFinite(a.n) ? (
          <span className="font-mono tabular-nums text-foreground/80" title={a.n_note}>
            {a.n}
            {a.n_note && <span className="ml-1 text-muted-foreground">*</span>}
          </span>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            no n published
          </span>
        )}
      </td>

      <td className="p-4">
        <StatusChip kind={chip} />
        {typeof a.separation_p === "number" && (
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">p={a.separation_p}</span>
        )}
      </td>

      <td className="p-4 text-right">
        <a
          href={lobbyTaskHref("explain-axis", { ctx: a.axis })}
          onClick={(e) => { e.preventDefault(); openLobby({ task: "explain-axis", ctx: a.axis }); }}
          className="whitespace-nowrap rounded-full border border-primary/25 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/10"
          aria-label={`Ask the Council Lobby about the ${a.axis} axis`}
        >
          Explain →
        </a>
      </td>
    </tr>
  );
}
