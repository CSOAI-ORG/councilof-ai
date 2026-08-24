/**
 * GET /landing and /landing/ - 308 to the lobby.
 * Leftover watchdog-job marketing still says Get Certified.
 * Measurement, not certification. Do not 308 onto /landing/.
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
