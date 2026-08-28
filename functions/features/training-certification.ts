/**
 * GET /features/training-certification and slash variant - 308 to the lobby.
 * Leftover certification feature page. Measurement, not certification.
 * Do not 308 onto /features/training-certification/.
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
