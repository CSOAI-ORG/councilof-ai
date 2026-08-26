/** GET /sov3-system-card — 308 to the current page. Retired internal codename; link kept alive. */
export function onRequest() {
  return new Response(null, { status: 308, headers: { location: "/council-system-card" } });
}
