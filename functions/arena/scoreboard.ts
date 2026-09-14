/**
 * GET /arena/scoreboard — conventional alias of the signed leaderboard at
 * /api/arena/scoreboard (SPA was 404ing this probe path).
 */
export async function onRequestGet(ctx: { request: Request }) {
  const url = new URL(ctx.request.url);
  const q = url.search; // preserve ?verify=1
  return new Response(null, {
    status: 308,
    headers: {
      location: `/api/arena/scoreboard${q}`,
      "cache-control": "public, max-age=300",
    },
  });
}
