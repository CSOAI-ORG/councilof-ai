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
}: {
  className?: string;
  /** Set false to render the grid alone. */
  showHumanPanel?: boolean;
  heading?: string;
}) {
  const { data, error, loading } = useGspcBoard();
  const [expanded, setExpanded] = useState(false);
  const [indexLine, setIndexLine] = useState<string | null>(null);

  const rows = orderedRows(data);
  const shown = expanded ? rows : rows.slice(0, DEFAULT_ROWS);
  const count = countLine(data);
  const emptyNames = rows.filter((a) => a.status === "UNMEASURED").map((a) => a.axis);
  const stampState = (data?.measured_on as { living_stamp?: { verification_state?: string } } | undefined)
    ?.living_stamp?.verification_state;

  useEffect(() => {
    let dead = false;
    fetch("/signed/card_index.json", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { n_cards?: number; n_cells?: number }) => {
        if (dead) return;
        const cards = typeof j.n_cards === "number" ? j.n_cards : null;
        const cells = typeof j.n_cells === "number" ? j.n_cells : null;
        if (cards == null || cells == null) {
          setIndexLine(null);
          return;
        }
        setIndexLine(
          `${cards} in the index · ${cells} verify against #card-attestation-1`,
        );
      })
      .catch(() => {
        if (!dead) setIndexLine(null);
      });
    return () => {
      dead = true;
    };
  }, []);

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
                    <Row key={a.axis} a={a} />
                  ))}
                </tbody>
              </table>
            </div>

            {emptyNames.length > 0 && (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Empty on purpose: {emptyNames.join(", ")}.
              </p>
            )}
            {indexLine && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {indexLine}
              </p>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Living stamp: {stampState ?? "UNCHECKABLE"}. The 18 Aug stamp stays
              superseded UNVERIFIABLE — not deleted.
            </p>

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

function Row({ a }: { a: GspcAxis }) {
  const measured = hasFigure(a);
  // `kind` distinguishes an axis with no run (UNMEASURED) from one that IS
  // measured but by deterministic facts, which have no leader and so no
  // accuracy. Without it, provenance-controls — a signed mainnet run over 6
  // issuer accounts — rendered as UNMEASURED on this table.
  const kind = typeof a.kind === "string" ? a.kind : undefined;
  const chip = chipFor(a.status, a.separation, kind);
  const facts = kind === "deterministic-facts";

  return (
    <tr className="border-b border-border align-middle last:border-0 hover:bg-primary/[0.05]">
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
