/**
 * GET /.well-known/x402 and /.well-known/x402/ — 308 to the JSON door.
 * Agents probe the suffix-less well-known; the file we ship is x402.json.
 * Pack assembly only. Does not fill a cell.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/.well-known/x402.json",
      "cache-control": "public, max-age=300",
    },
  });
}
