/**
 * GET /features/watchdog-jobs - 308 leftover certification career page.
 * Live copy still sells Get Certified + certification exam.
 * Do not 308 onto /features/watchdog-jobs/.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/os?lobby=home",
      "cache-control": "public, max-age=300",
    },
  });
}
