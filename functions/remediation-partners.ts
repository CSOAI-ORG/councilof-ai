/**
 * GET /remediation-partners and /remediation-partners/ - 308 to the lobby.
 * We measure. We do not remediate.
 * Do not 308 onto /remediation-partners/.
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
