/**
 * GET /proof — alias of /api/proof so the path is never a silent HTML 404.
 * Query string is preserved (?sha= free inclusion, ?bundle=1 x402).
 * No price on this HTML-less JSON surface. Not a grade.
 */
import { headFromGet } from "./api/_head";
export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const dest = new URL("/api/proof", url.origin);
  dest.search = url.search;
  return Response.redirect(dest.toString(), 302);
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
