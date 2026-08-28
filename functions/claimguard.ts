/**
 * GET /claimguard — 308 to honesty.
 * Functions beat _redirects on live. Home is marketing, not the OS.
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
