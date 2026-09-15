/**
 * publicationState — the one predicate every recommendation picker consults.
 *
 * WHY. On 2026-09-15 the homepage promoted nine "field notes" whose every link
 * resolved to the withdrawal notice: App.tsx routes /blog and /blog/:slug to
 * ContentReviewNotice, and the picker was driven by URL existence rather than by
 * a reviewed publication state. A 200 withdrawal notice is not an article.
 *
 * The manifest (client/src/data/publication-state.json) lists the exact route
 * patterns App.tsx withdraws. scripts/content-promise-gate.mjs keeps the two in
 * step: a route withdrawn in App.tsx but missing here fails the build, and so
 * does a stale entry here. Pickers call isWithdrawnPath() before promoting.
 */
import manifest from "@/data/publication-state.json";

export const WITHDRAWN_ROUTES: readonly string[] = manifest.withdrawn_routes;

/** The page a reader should be sent to for the withdrawal record itself. */
export const WITHDRAWAL_RECORD_PATH: string = manifest.withdrawal_record;

function normalise(path: string): string {
  const bare = path.split(/[?#]/)[0] || "/";
  return bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
}

/** Does a wouter-style pattern ("/blog/:slug") match a concrete path? */
export function routePatternMatches(pattern: string, path: string): boolean {
  const p = normalise(pattern).split("/");
  const q = normalise(path).split("/");
  if (p.length !== q.length) return false;
  return p.every((seg, i) => (seg.startsWith(":") ? q[i].length > 0 : seg === q[i]));
}

/** True when the path renders the withdrawal notice instead of the promised page. */
export function isWithdrawnPath(path: string): boolean {
  if (/^https?:\/\//i.test(path)) return false;
  return WITHDRAWN_ROUTES.some((pattern) => routePatternMatches(pattern, path));
}
