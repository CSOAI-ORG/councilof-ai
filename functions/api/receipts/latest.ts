/**
 * GET /api/receipts/latest — latest published settlement / attestation receipt pointer.
 *
 * Honest stub: no live receipt stream is wired on Pages yet. Returns 200 with an empty
 * register so agent probes and the audit matrix do not confuse catch-all JSON 404 with
 * a missing route. When the x402 receipt MCP publishes a feed, replace `items` with
 * the signed latest row(s) and keep `status` honest.
 */
export const onRequestGet: PagesFunction = async () => {
  return Response.json(
    {
      schema: "csoai.receipts.latest/0.1",
      status: "UNPUBLISHED",
      items: [],
      count: 0,
      note:
        "No settlement receipts are published on this surface yet. See csoai-x402-receipt-mcp on GitHub for the signed receipt lane.",
      endpoints: {
        ledger: "/api/mcp",
        gspc: "/api/gspc",
        assess: "/api/assess",
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    }
  );
};
