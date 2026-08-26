/**
 * axisCells — what a board row PUTS IN A CELL when the number it wants is absent.
 *
 * ── THE DEFECT THIS MODULE EXISTS TO CLOSE ────────────────────────────────────
 * On 2026-08-26 the 22-axis sweep (ADR-001) added the 8 financial/domain axes to
 * GET /api/gspc. Seven are `declared-slot` (n=0, no run) and one —
 * `provenance-controls` — is `deterministic-facts` (n=6 issuer accounts, a real
 * signed mainnet run). The server type `functions/api/_gspc_types.ts` correctly
 * declares `accuracy?`, `separation?` and `leader?` OPTIONAL, because absence on
 * those axes is honest absence and a zero would be a fabricated measurement.
 *
 * The client did not follow. `/insurers` and `/gspc-scoreboard` each carried
 * their OWN local `interface Axis` that declared `accuracy: number` and
 * `separation: "SEPARATED" | "TIE" | "UNTESTED"` as REQUIRED. So TypeScript
 * believed `a.accuracy` was always a number, `(a.accuracy * 100).toFixed(1)`
 * type-checked, and at runtime `undefined * 100` evaluated to `NaN` and printed
 * `NaN%` on 8 of 22 rows. The percentage was never computed wrongly — it was
 * computed on a field that was never there, on a board whose promise is that
 * every number is recomputable.
 *
 * ── THE THREE STATES, WHICH ARE NOT THE SAME STATE ────────────────────────────
 * 1. A figure exists          -> render it.
 * 2. n=0, `declared-slot`     -> `unmeasured`. Never `0%` (that asserts a
 *                                measurement of zero) and never a blank (that
 *                                hides the slot). `unmeasured` is a first-class
 *                                published status, not an error state.
 * 3. `deterministic-facts`    -> the axis IS measured; it simply has no leader
 *                                and therefore no accuracy. Render WHAT IT HAS
 *                                (its coverage over its own declared universe)
 *                                rather than an empty percentage. Calling this
 *                                row `unmeasured` would under-claim a signed run.
 *
 * Nothing here types a number. Every value returned is read off the /api/gspc
 * payload the caller already fetched; when the payload does not carry it, the
 * function says so in words.
 */

/** The subset of an /api/gspc axis these readers touch. Every field optional — that is the point. */
export interface AxisCellSource {
  axis?: string;
  n?: number;
  n_unit?: string;
  kind?: string;
  family?: string;
  status?: string;
  accuracy?: number;
  accuracy_is?: string;
  leader?: string;
  separation?: string;
  interval?: [number, number] | number[];
  coverage?: string;
  evidence_url?: string;
}

/** The published status word for a slot with nothing behind it. Never "0%", never blank. */
export const UNMEASURED_WORD = "unmeasured";

/** True when the axis carries a real, finite leader figure. */
export function hasAccuracy(a: AxisCellSource): boolean {
  return typeof a.accuracy === "number" && Number.isFinite(a.accuracy);
}

/** True when the axis is measured by reading facts off a public source (no fleet, no leader). */
export function isFactsAxis(a: AxisCellSource): boolean {
  return a.kind === "deterministic-facts";
}

export type AccuracyCell =
  /** A real leader figure. `prefix` is "≥" when the value is a stated lower bound. */
  | { state: "figure"; text: string; prefix: string; lowerBound?: string }
  /** Measured, but by deterministic facts — no accuracy exists to show. */
  | { state: "facts"; text: string; detail?: string; title: string }
  /** No measurement exists. The published status word. */
  | { state: "unmeasured"; text: string; title: string };

/**
 * What belongs in the "Leader accuracy" cell.
 *
 * The percentage branch is byte-for-byte the arithmetic the boards already did;
 * the other two branches are the ones that used to fall through to NaN.
 */
export function accuracyCell(a: AxisCellSource, digits = 1): AccuracyCell {
  if (hasAccuracy(a)) {
    return {
      state: "figure",
      prefix: a.accuracy_is ? "≥" : "",
      text: `${((a.accuracy as number) * 100).toFixed(digits)}%`,
      lowerBound: a.accuracy_is,
    };
  }
  if (isFactsAxis(a)) {
    return {
      state: "facts",
      text: "no leader accuracy",
      // `coverage` is the axis's own statement of how much of its declared
      // universe it actually covered. It is the honest figure this row HAS.
      detail: a.coverage,
      title:
        "This axis is measured by reading deterministic facts off a public source. There is no " +
        "model fleet and no leader, so no accuracy exists. The absence is the measurement's shape, " +
        "not a gap in it.",
    };
  }
  return {
    state: "unmeasured",
    text: UNMEASURED_WORD,
    title:
      "No run exists behind this slot, so there is no number. Published as an open slot so the gap " +
      "is visible. Reported as absent — never as zero.",
  };
}

/**
 * What belongs in the "95% CI" cell.
 *
 * "withheld (n not independent)" is a claim about a measurement that exists —
 * it was being printed on rows that have no measurement at all, which is a
 * different and false statement.
 */
export function intervalCell(a: AxisCellSource): { text: string; title?: string } {
  const iv = a.interval;
  if (Array.isArray(iv) && iv.length === 2 && iv.every((v) => typeof v === "number" && Number.isFinite(v))) {
    return { text: `${(iv[0] * 100).toFixed(1)}–${(iv[1] * 100).toFixed(1)}%` };
  }
  if (hasAccuracy(a)) {
    return {
      text: "withheld (n not independent)",
      title: "A figure exists but its n is not honestly independent, so no Wilson interval is published.",
    };
  }
  if (isFactsAxis(a)) {
    return {
      text: "not applicable — no accuracy to bound",
      title: "A deterministic-facts axis has no accuracy, so there is nothing for an interval to bound.",
    };
  }
  return { text: UNMEASURED_WORD, title: "Nothing was measured, so there is no interval." };
}

/**
 * What belongs in the "Separation" cell when the axis carries no `separation`.
 *
 * Absent separation is TWO different facts: on a model-comparison axis the test
 * has not been run (UNTESTED); on a deterministic-facts axis no test is
 * APPLICABLE, because there is no fleet and no leader to separate.
 */
export function separationNote(a: AxisCellSource): string | null {
  if (a.separation) return null;
  if (isFactsAxis(a)) return "not applicable — no fleet, no leader";
  return null;
}
