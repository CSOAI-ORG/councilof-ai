/**
 * GET /how-it-works/certification and /how-it-works/certification/ - 308 to the lobby.
 * Leftover academy/certification guide. Measurement, not certification.
 * Do not 308 onto /how-it-works/certification/.
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
