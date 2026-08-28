/**
 * GET /remediation and /remediation/ - 308 to the lobby.
 * We do not remediate. Measurement, not certification.
 * Do not 308 onto /remediation/.
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
