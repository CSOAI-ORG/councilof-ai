/**
 * GET /evidence/ — 308 to the live evidence rail.
 * Prior force-404 hid Evidence Hub cold-loads (J-D1). Measurement not certification.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/evidence-rail/",
      "cache-control": "public, max-age=300",
    },
  });
}
