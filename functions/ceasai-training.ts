/**
 * GET /ceasai-training and /ceasai-training/ - 308 to honesty.
 * Retracted credential brand. Measurement, not certification.
 * Do not 308 onto /ceasai-training/.
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
