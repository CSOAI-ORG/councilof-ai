/**
 * GET /agent-council - 308 to honesty.
 * Retracted 33-agent guarantee. Do not 308 onto /agent-council/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/honesty/",
      "cache-control": "public, max-age=300",
    },
  });
}
