/**
 * GET /charter — 308 to the operational charter, served by Pages.
 *
 * Until 2026-09-28 this 308'd to /os?lobby=assess&task=pricing-overview (a leftover
 * public-price CTA from the 52-Article partnership charter page). The current charter
 * is the Operational Constitutional Harness Charter:
 *   human    /constitutional-harness/                       (public/constitutional-harness/index.html)
 *   machine  /.well-known/constitutional-harness.json       (sha256 pinned in charter-amendments.json)
 *   log      /.well-known/charter-amendments.json
 * Those bytes were first served by a separate Worker route; the Pages copies are
 * byte-identical (functions/charter.test.ts pins the sha256). Do not 308 onto /charter/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/constitutional-harness/",
      "cache-control": "public, max-age=300",
    },
  });
}
