/**
 * GET /courses - 308 to the lobby.
 * Still mounts leftover enroll-now training-catalog copy after hydrate.
 * Measurement, not certification. Do not 308 onto /courses/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
