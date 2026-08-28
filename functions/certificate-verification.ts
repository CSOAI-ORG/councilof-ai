/**
 * GET /certificate-verification and /certificate-verification/ - 308 to the lobby.
 * Measurement, not certification. Verify of signed cards is /gspc-verify.
 * Do not 308 onto /certificate-verification/.
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
