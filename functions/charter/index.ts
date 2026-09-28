/**
 * GET /charter/ — slash variant of functions/charter.ts: 308 to the operational charter.
 * The historical 52-Article partnership charter is not served here; see
 * /.well-known/charter-amendments.json (entry 0, "supersedes").
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
