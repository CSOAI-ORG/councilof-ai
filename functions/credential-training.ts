/**
 * GET /credential-training and /credential-training/ - 308 to the lobby.
 * Still mounts CEASAITraining after hydrate. Measurement, not certification.
 * Do not 308 onto /credential-training/.
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
