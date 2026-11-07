/**
 * LivingBoardStrip — the compact LIVE GSPC board strip (owner request, 1 Nov 2026: "the LIVE
 * GSPC board on the homepage, compact, below the hero").
 *
 * DATA: the shared useGspcBoard read of GET /api/gspc (one request per page; the same feed
 * LiveBoardGlance and the workspace card use). NOTHING IS TYPED. The header counts are
 * totals.axes and totals.measured_axes, printed only when the payload carries them as finite
 * numbers; the rows are the payload's model-comparison axes; the accuracy is each axis's own
 * top figure. If the fetch fails — or the payload carries no comparable axes — the strip
 * renders NOTHING: a missing board is never drawn as a broken homepage section, and no
 * placeholder number is ever invented to fill one.
 *
 * ORDERING IS PRESENTATION, NOT A RANKING CLAIM: rows sit at their top observed accuracy with
 * the separation state on a chip beside each figure. A TIE row can sit high; its chip says the
 * lead is not a separated one. Measured is not separated, and an em dash means the payload
 * publishes no figure there — never zero.
 *
 * BRAND: the ink ground #04120c, the mid green #04624a, emerald #10b981; Archivo wordmark,
 * Inter body, mono tabular-nums for every number.
 */
import { Link } from "wouter";
import { useGspcBoard, pct, type GspcAxis, type GspcPayload } from "../board/useGspcBoard";
import { isOwnerGated } from "@/lib/ownerGated";
import { axisHref } from "@/lib/axisHref";

/** A finite number, or null — a count that is not carried is never rendered as zero. */
function finiteNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * The payload's model-comparison axes as strip rows: owner-gated axes excluded, the measured
 * figure bearing rows first at their top accuracy, everything else kept in the board's own
 * order behind them. Sorting is display order; the chip carries the state, not the sort.
 */
export function rankedComparisonRows(data: GspcPayload | null): GspcAxis[] {
  const axes = Array.isArray(data?.axes) ? (data!.axes as GspcAxis[]) : [];
  const rows = axes.filter(
    (a) =>
      !isOwnerGated(a) &&
      a.kind === "model-comparison" &&
      typeof a?.axis === "string" &&
      a.axis.length > 0,
  );
  const figure = (a: GspcAxis): number | null =>
    a.status === "MEASURED" && typeof a.accuracy === "number" && Number.isFinite(a.accuracy)
      ? a.accuracy
      : null;
  return rows.sort((x, y) => {
    const fx = figure(x);
    const fy = figure(y);
    if (fx !== null && fy !== null) return fy - fx;
    if (fx !== null) return -1;
    if (fy !== null) return 1;
    return 0;
  });
}

const nf = new Intl.NumberFormat("en-GB");

type ChipState = "SEPARATED" | "TIE" | "UNTESTED";

function chipOf(a: GspcAxis): ChipState {
  return a.separation === "SEPARATED" ? "SEPARATED" : a.separation === "TIE" ? "TIE" : "UNTESTED";
}

// AA on the ink ground. SEPARATED is the only saturated chip: it is the only state that
// asserts an advantage, so it is the only one allowed to shout.
const CHIP_CLASS: Record<ChipState, string> = {
  SEPARATED: "bg-[#10b981] text-[#04120c]",
  TIE: "border border-sky-300/40 text-sky-200",
  UNTESTED: "border border-white/25 text-white/60",
};

function Row({ a }: { a: GspcAxis }) {
  const hasFigure = a.status === "MEASURED" && typeof a.accuracy === "number" && Number.isFinite(a.accuracy);
  const chip = chipOf(a);
  const n = a.status === "MEASURED" ? finiteNumber(a.n) : null;
  // The route comes from the board's own payload, never from a list of slugs
  // typed here: nine measured-subject axes were linked to a /gspc/ route that
  // is not prerendered, and the homepage sent readers to a 404.
  const href = axisHref(a);
  return (
    <li
      className="min-w-0 rounded-md border border-[#04624a]/50 bg-white/[0.03] px-2.5 py-2 transition hover:border-[#10b981]/60 hover:bg-white/[0.06] motion-reduce:transition-none"
      data-axis={a.axis}
      data-separation={chip}
    >
      {href ? (
        <Link
          href={href}
          className="flex items-baseline justify-between gap-2"
          title={typeof a.bench === "string" && a.bench ? `${a.axis} · ${a.bench}` : a.axis}
          data-axis-link={a.axis}
        >
          <span className="min-w-0 truncate text-[12px] font-semibold leading-tight text-white/90">
            {a.axis}
          </span>
          <span className="shrink-0 font-mono text-[12px] font-bold tabular-nums text-[#6ee7b7]">
            {hasFigure ? pct(a.accuracy as number) : "—"}
          </span>
        </Link>
      ) : (
        <span
          className="flex items-baseline justify-between gap-2"
          title={typeof a.bench === "string" && a.bench ? `${a.axis} · ${a.bench}` : a.axis}
          data-axis-link={a.axis}
        >
          <span className="min-w-0 truncate text-[12px] font-semibold leading-tight text-white/90">
            {a.axis}
          </span>
          <span className="shrink-0 font-mono text-[12px] font-bold tabular-nums text-[#6ee7b7]">
            {hasFigure ? pct(a.accuracy as number) : "—"}
          </span>
        </span>
      )}
      <span className="mt-1.5 flex items-center justify-between gap-2">
        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide ${CHIP_CLASS[chip]}`}>
          {chip}
        </span>
        {n !== null ? (
          <span className="font-mono text-[10px] tabular-nums text-white/50">n {nf.format(n)}</span>
        ) : null}
      </span>
    </li>
  );
}

/**
 * The strip itself. `showHeader`/`showFooter` let an embedded surface (the Council OS lobby
 * card) keep its ONE-FIGURE-PER-PLACE rule: the card already prints the count line, so it
 * takes the rows alone. `data`/`error` accept an injected payload so a test (or a host that
 * already holds the board) can prove every assertion about its own mock — the shared feed
 * stays the default, exactly as LiveBoardGlance does it.
 */
export default function LivingBoardStrip({
  showHeader = true,
  showFooter = true,
  data: injected,
  error: injectedError = null,
}: {
  showHeader?: boolean;
  showFooter?: boolean;
  data?: GspcPayload | null;
  error?: string | null;
}) {
  const live = useGspcBoard();
  const data = injected !== undefined ? injected : live.data;
  const error = injected !== undefined ? injectedError : live.error;
  // Fetch failure → the section does not exist on the page. Silently, and on purpose:
  // never a broken homepage, never an error box where the board should be.
  if (error || !data) return null;
  const rows = rankedComparisonRows(data);
  if (rows.length === 0) return null;
  const total = finiteNumber(data.totals?.axes);
  const measured = finiteNumber(data.totals?.measured_axes);

  return (
    <div
      data-testid="living-board-strip"
      className="overflow-hidden rounded-2xl border border-[#04624a]/70 bg-[#04120c] text-white shadow-[0_28px_60px_-42px_rgba(4,18,12,0.9)]"
    >
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#04624a]/70 bg-[#04624a]/[0.14] px-4 py-3 sm:px-5">
          <p className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 font-primary text-[13px] font-bold uppercase tracking-[0.18em] text-white">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
            </span>
            The living board
            {total !== null && measured !== null ? (
              <span className="font-mono text-[11px] font-semibold normal-case tracking-normal text-emerald-200/85 tabular-nums">
                · {nf.format(total)} axes · {nf.format(measured)} measured
              </span>
            ) : null}
          </p>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#10b981]">
            live
          </span>
        </div>
      )}

      <ul
        className="grid list-none grid-cols-2 gap-1.5 p-3 sm:grid-cols-3 sm:p-4 lg:grid-cols-5 xl:grid-cols-7"
        aria-label="Model-comparison axes at their top observed accuracy, each with its separation state"
        data-testid="living-board-rows"
      >
        {rows.map((a) => (
          <Row key={a.axis} a={a} />
        ))}
      </ul>

      {showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[#04624a]/70 px-4 py-3 sm:px-5">
          <p className="font-mono text-[10px] leading-snug text-white/45">
            Rows sit at their top observed accuracy · a TIE is not a win · — means no figure is published
          </p>
          <Link
            href="/board"
            className="inline-flex min-h-11 items-center text-sm font-bold text-[#6ee7b7] underline underline-offset-4 hover:text-[#a7f3d0]"
            data-testid="living-board-open"
          >
            Open the full board →
          </Link>
        </div>
      )}
    </div>
  );
}
