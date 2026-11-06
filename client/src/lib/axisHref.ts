import { isOwnerGated } from "./ownerGated";

/**
 * Where an axis row must link — ONE rule, derived from the board's own payload.
 *
 * WHY THIS EXISTS. The homepage's board rows linked every axis to
 * `/gspc/<axis>/`. That route is prerendered per-axis, and the prerender list
 * was a hand-typed subset of the board. Nine measured-subject axes
 * (lab-practice, company-practice, measurer-integrity, harness-fidelity,
 * interop-conformance, humanoid-deployment, interpretability-reproducibility,
 * claim-maintenance, serving-fidelity) were on the board and on the homepage,
 * but not on that list — so nine links from the primary landing page returned
 * HTTP 404. The page the board served for those axes was published at
 * `/axis/<axis>/`, canonical to itself, and nothing linked to it.
 *
 * THE RULE. The board says what it serves, in its own payload:
 *
 *   - `public_pages: "HIDDEN_PENDING_OWNER_GO"` — the owner is holding this
 *     slot. It has no public page, so it gets no public link (see isOwnerGated).
 *   - `kind: "model-comparison"` — answered by a fleet of models on a frozen
 *     bank. Its deep-dive page is `/gspc/<axis>/`.
 *   - anything else — a measured subject axis or a deterministic fact. Its
 *     published page is `/axis/<axis>/`.
 *
 * Those two routes partition the axes exactly: scripts/surface/build-axis-pages.mjs
 * renders one `public/axis/<axis>.html` for every board axis that is not
 * owner-gated (32 of 34 at the time of writing), and scripts/prerender.mjs
 * prerenders `/gspc/<axis>/` for the model-comparison axes. Measured against
 * the live site, all 32 non-owner-gated axes answer 200 at the route this
 * function returns.
 *
 * NO HARDCODED LIST. An earlier list of axis slugs was a list that rots: the
 * board grew an axis and the link broke. The route is now read from the same
 * payload the row was rendered from, so a new axis cannot break its own link
 * unless the board says something this function does not understand.
 */

export type AxisHrefSource = {
  axis?: unknown;
  kind?: unknown;
  public_pages?: unknown;
};

/**
 * The href an axis row should carry, or null when the row must not link out.
 *
 * null is a real answer, not a failure: an owner-gated axis has no public page,
 * so a link would point at something that does not exist.
 */
export function axisHref(a: AxisHrefSource | null | undefined): string | null {
  if (!a || typeof a !== "object") return null;
  if (isOwnerGated(a)) return null;
  const axis = typeof a.axis === "string" ? a.axis.trim() : "";
  if (!axis) return null;
  const slug = encodeURIComponent(axis);
  if (a.kind === "model-comparison") return `/gspc/${slug}/`;
  return `/axis/${slug}/`;
}
