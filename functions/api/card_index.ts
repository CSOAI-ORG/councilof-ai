/**
 * GET /api/card_index — 301 to the signed card index at /signed/card_index.json.
 *
 * Agents guess this path; it was a 404 from the /api catch-all. The signed bytes have one
 * served location and are never re-served or copied here (a copy of signed JSON drifts).
 * The static aliases /card_index.json and /cards/card_index.json live in public/_redirects
 * (scripts/generate-redirects.mjs); this path is function-owned, so it needs its own handler.
 */
export const CARD_INDEX_LOCATION = "/signed/card_index.json";

export function onRequest() {
  return new Response(null, {
    status: 301,
    headers: {
      location: CARD_INDEX_LOCATION,
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}
