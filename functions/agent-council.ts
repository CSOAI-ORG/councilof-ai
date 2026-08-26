/**
 * GET /agent-council - 308 to the lobby.
 * Retracted 33-agent guarantee. Do not 308 onto /agent-council/.
 * Functions bump: official 32994447687 on 9779d406 was cancelled by a delayed
 * #800 job. Re-queue deploy.yml on the untyped-catalog exact-150 tip.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
