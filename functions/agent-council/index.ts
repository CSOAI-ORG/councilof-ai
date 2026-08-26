/** GET /agent-council/ - 308 to the lobby. Retracted 33-agent guarantee. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
