/**
 * GET /eu-ai-act-urgency/ - 308 leftover cert + public-price page.
 * Slash variant. Do not 308 onto itself.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=assess&task=get-measured",
      "cache-control": "public, max-age=300",
    },
  });
}
