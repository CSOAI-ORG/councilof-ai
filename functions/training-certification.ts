/**
 * GET /training-certification and /training-certification/ - 308 to the lobby.
 * Leftover certification door. Measurement, not certification.
 * Do not 308 onto /training-certification/.
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
