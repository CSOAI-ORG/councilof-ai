/**
 * GET /verify-certificate and /verify-certificate/ - 308 to the lobby.
 * Measurement, not certification. Do not 308 onto /verify-certificate/.
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
