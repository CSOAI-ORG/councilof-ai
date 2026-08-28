/**
 * GET /about-ceasai and /about-ceasai/ - 308 to honesty.
 * Retracted credential brand. Measurement, not certification.
 * Do not 308 onto /about-ceasai/.
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
