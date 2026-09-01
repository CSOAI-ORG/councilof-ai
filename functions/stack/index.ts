/**
 * GET /stack/ — 308 to published stack index.
 * Functions beat _redirects on live. Home is marketing, not the OS.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/stack/index.json",
      "cache-control": "public, max-age=300",
    },
  });
}
