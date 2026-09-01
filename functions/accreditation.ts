/**
 * GET /accreditation and /accreditation/ - 308 to honesty.
 * Still mounts leftover Start Certification copy after hydrate.
 * We hold no accreditation. Measurement, not certification.
 * Do not 308 onto /accreditation/.
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
