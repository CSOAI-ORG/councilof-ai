/**
 * GET|HEAD|… /arena/scoreboard → 308 /api/arena/scoreboard
 * Use onRequest (all methods). A GET-only export left HEAD on the SPA 404.
 * Static _redirects alone has been inert on apex for this path.
 */
export async function onRequest(ctx: { request: Request }) {
  const q = new URL(ctx.request.url).search;
  return new Response(null, {
    status: 308,
    headers: {
      location: `/api/arena/scoreboard${q}`,
      "cache-control": "public, max-age=300",
    },
  });
}
