/**
 * GET /api/ledger — 308 to the live receipts door (J-D5).
 * Dark GTM stub retired; Value Ledger reads /api/receipts/latest.
 */
export function onRequest() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/api/receipts/latest",
      "cache-control": "public, max-age=300",
    },
  });
}
