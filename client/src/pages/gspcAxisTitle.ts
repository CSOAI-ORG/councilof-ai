/**
 * <title> and <h1> for the board page and its per-axis route /gspc/<axis>.
 *
 * Measured on 2026-11-26 at 390 px and 1440 px: clicking "Governance" on /board/ landed on
 * /gspc/governance/ whose served and rendered <title> was the board's
 * ("The GSPC board — 34 axes · 34 measured | Council of AI") and whose <h1> was "The GSPC board".
 * Nothing above the fold named the axis the reader had just chosen. Both strings now lead with
 * the axis when the URL names one the board knows. The count is still the live
 * `totals.public_count` from GET /api/gspc, passed in by the page — nothing here types a number.
 */

const BOARD = "The GSPC board";
const SITE = "Council of AI";

/** Document title. `count` is `totals.public_count` once the payload has landed, else null. */
export function gspcPageTitle(axis: string | null, count: string | null): string {
  const c = typeof count === "string" && count.trim() ? count.trim() : null;
  const board = c ? `${BOARD} — ${c}` : `${BOARD} — live`;
  return axis ? `${axis} axis — ${board} | ${SITE}` : `${board} | ${SITE}`;
}

/**
 * Page heading. `axisKnown` is true only when the URL's axis is a row GET /api/gspc publishes
 * (or a published financial-fact axis). An unknown axis keeps the plain board heading — the page
 * already says "No axis named … on the board", and a heading must not invent one for a URL.
 */
export function gspcPageHeading(axis: string | null, axisKnown: boolean): string {
  return axis && axisKnown ? `${BOARD} · ${axis}` : BOARD;
}
