/**
 * GET /eu-ai-act-urgency - 308 leftover cert + public-price page.
 * Live copy still sells Certification and types £50K–£1M.
 * Do not 308 onto /eu-ai-act-urgency/. Do not type public prices here.
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
