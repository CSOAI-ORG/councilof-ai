/**
 * GET /my-courses - 308 to the lobby.
 * Still mounts leftover enrolled-courses LMS copy after hydrate.
 * Measurement, not certification. Do not 308 onto /my-courses/.
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
