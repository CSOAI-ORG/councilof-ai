/** GET /for/startup/ - 308 to the sector lobby door. */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home&task=sector-brief",
      "cache-control": "public, max-age=300",
    },
  });
}
