/** GET /roi-calculator/ - 308 to the pricing lobby. No public prices. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300",
    },
  });
}
