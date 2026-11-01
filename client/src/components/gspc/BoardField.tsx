import { Link } from "wouter";
import type { AxisRow } from "@/data/axis-sets";

/**
 * BoardField — the whole set at one glance, above the table.
 *
 * ── THE MISSING READ ─────────────────────────────────────────────────────────
 * The table below answers "what did each axis measure" one row at a time, and
 * the living board answers it for one axis at a time. Neither answers the
 * question a reader actually arrives with: *does anything separate from anything
 * else?* On this board the answer is 0 of 14, and a reader can only discover
 * that by opening fourteen tabs and comparing overlapping ranges by eye.
 *
 * So this strip draws every comparable row against one shared 0–100% scale, with
 * the 95% range as the mark and the point estimate as the dot. Where ranges
 * overlap, nothing separates — that is visible without arithmetic.
 *
 * ── RULES ────────────────────────────────────────────────────────────────────
 * - No rank position: rows keep the order the set gave them. Sorting by headline
 *   would be the claim the board refuses to make.
 * - A row with no interval gets no band, and says why in its state chip:
 *   UNTESTED means no paired test could run, never "close".
 * - An UNMEASURED row is listed with n = 0 rather than dropped. A gap that is
 *   hidden reads as a zero.
 *
 * Every number here is read from the row the set already fetched. Nothing is
 * computed that the artifact did not publish.
 */

const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;

const CHIP: Record<string, string> = {
  SEPARATED: "border-gray-900 bg-gray-900 text-white",
  TIE: "border-gray-900 text-gray-900",
  UNTESTED: "border-dashed border-gray-400 text-gray-600",
  UNMEASURED: "border-dashed border-gray-300 text-gray-500",
};

function Band({ row }: { row: AxisRow }) {
  if (row.interval === null || row.headline === null) return null;
  const [lo, hi] = row.interval;
  return (
    <div
      className="relative h-2.5 w-full min-w-[6rem] rounded bg-gray-100"
      aria-hidden="true"
      title={`${row.headlineLabel} ${pct1(row.headline)}, 95% range ${pct1(lo)}–${pct1(hi)}`}
    >
      <div
        className="absolute top-0 h-2.5 rounded bg-sky-300"
        style={{ left: `${lo * 100}%`, width: `${Math.max(0.5, (hi - lo) * 100)}%` }}
      />
      <div className="absolute -top-0.5 h-3.5 w-0.5 bg-gray-900" style={{ left: `${row.headline * 100}%` }} />
    </div>
  );
}

export default function BoardField({ rows, setId }: { rows: AxisRow[]; setId: string }) {
  const comparable = rows.filter((r) => r.separation !== null);
  const measured = rows.filter((r) => r.status === "MEASURED");
  const slots = rows.filter((r) => r.status === "UNMEASURED");
  const separated = comparable.filter((r) => r.separation === "SEPARATED").length;
  const ties = comparable.filter((r) => r.separation === "TIE").length;
  const untested = comparable.filter((r) => r.separation === "UNTESTED").length;

  return (
    <section
      className="mb-5 rounded-xl border border-gray-200 bg-white p-4"
      data-testid={`board-field-${setId}`}
      aria-labelledby={`board-field-${setId}-h`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`board-field-${setId}-h`} className="text-sm font-bold text-gray-900">
          The field, at one scale
        </h3>
        <p className="font-mono text-[11px] text-gray-600">
          {comparables(comparable.length, separated, ties, untested)}
          {slots.length > 0 && <> · {slots.length} declared slot{slots.length === 1 ? "" : "s"} with no run</>}
        </p>
      </div>

      <p className="mt-1 text-xs text-gray-600">
        Every bar is a 95% range on the same 0–100% axis; the tick is the point estimate. Where ranges
        overlap, nothing separates — a TIE is the test declining to separate, not two models being equal.
      </p>

      <ul className="mt-3 space-y-1.5">
        {rows.map((r) => {
          const chip = r.separation ?? r.status;
          return (
            <li key={r.id} className="grid grid-cols-[minmax(8rem,14rem)_3.5rem_1fr_5.5rem] items-center gap-2">
              <Link
                href={`/axis/${r.id}`}
                className="truncate font-mono text-xs font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900"
                title={r.what}
              >
                {r.name}
              </Link>
              <span className="text-right font-mono text-[11px] text-gray-600">
                {r.n === null ? "—" : r.n}
              </span>
              <div className="flex items-center gap-2">
                <Band row={r} />
                {r.interval !== null && (
                  <span className="hidden whitespace-nowrap font-mono text-[10px] text-gray-500 sm:inline">
                    {pct1(r.interval[0])}–{pct1(r.interval[1])}
                  </span>
                )}
              </div>
              <span
                className={`justify-self-end rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${
                  CHIP[chip] ?? "border-gray-300 text-gray-500"
                }`}
              >
                {chip === "UNMEASURED" ? "no run" : chip.toLowerCase()}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 border-t border-gray-100 pt-2 text-[11px] leading-relaxed text-gray-600">
        {measured.length} of {rows.length} rows carry a run. A slot listed with n = 0 is named and counted
        so the gap stays visible; it is not evidence that nothing was measured anywhere.{" "}
        <Link href="/methodology/#separation" className="underline">
          How separation is decided
        </Link>
        .
      </p>
    </section>
  );
}

function comparables(total: number, separated: number, ties: number, untested: number) {
  if (total === 0) return "no model-comparison rows in this set";
  return `${total} comparisons · ${separated} separated · ${ties} tie · ${untested} untested`;
}
