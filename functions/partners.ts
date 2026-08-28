/**
 * GET /partners - 308 to the lobby.
 * Still mounts leftover partner-certification and remediation-support copy after hydrate.
 * Measurement, not certification. We do not remediate. Do not 308 onto /partners/.
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
