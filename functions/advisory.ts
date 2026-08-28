/**
 * GET /advisory - 308 to the lobby.
 * Same leftover PartnersAdvisory page as /partners — sells remediation support.
 * Measurement, not certification. We do not remediate. Do not 308 onto /advisory/.
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
