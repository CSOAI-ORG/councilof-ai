/**
 * Owner-gated axes (public_pages "HIDDEN_PENDING_OWNER_GO") stay in GET /api/gspc and in its
 * counts, but no public page may render them as a tile or a row until the owner's go.
 * Same rule as scripts/llms-txt.mjs, build-axis-pages.mjs and badge/board.svg.ts.
 */
export const OWNER_GATED = "HIDDEN_PENDING_OWNER_GO";
export const isOwnerGated = (a: unknown): boolean =>
  !!a && typeof a === "object" && (a as { public_pages?: unknown }).public_pages === OWNER_GATED;
