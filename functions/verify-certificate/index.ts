/** GET /verify-certificate/ — 308 to the free verifier. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/gspc-verify/",
      "cache-control": "public, max-age=300",
    },
  });
}
