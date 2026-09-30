// functions/api/eunomia-data.ts — FORMER PATH of the signed data feed.
//
// Renamed 30 Sep 2026 to /api/signed-data-feed: "Eunomia" is an internal codename and never a public
// path. This handler keeps every old link, registry listing and paying client working with a 308
// (method and body preserved, query string kept verbatim). It reads nothing, signs nothing and never
// touches a payment: the 402 challenge, verification and settlement all happen at the new path, whose
// resource URL is the one a client pays for.
export const RENAMED_TO = "/api/signed-data-feed";

// One handler for every method (a plain onRequest): the route is a pointer, not a door, so the
// openapi walker and the capability registry, which enumerate per-method handlers, do not list it
// as an API of its own. The door is /api/signed-data-feed, declared there.
export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const to = new URL(RENAMED_TO + url.search, url.origin).toString();
  return new Response(null, {
    status: 308,
    headers: {
      location: to,
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
      "access-control-expose-headers": "location",
      link: `<${to}>; rel="canonical"`,
    },
  });
};
