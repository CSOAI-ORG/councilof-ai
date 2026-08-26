/**
 * GET /api/interop-bulk — metered bulk/replay access to signed interop surfaces.
 *
 * Free tier (default): single-shard access to the live interop registry (read-only,
 * the trust engine — never gated). Bulk/replay tier: x402-gated (provider:meta).
 * Settlement = estate receipt MCP; verification = Ed25519 (RECEIPT_PUBKEY_HEX).
 * Honest absence of the key => 402 invoice + note (never a fabricated unlock).
 *
 * Trust engine free forever. Metered = bulk/scale/replay only. No certification.
 */
interface Env { RECEIPT_PUBKEY_HEX?: string }

const SURFACES = [
  "/interop/attestation-corpus.json",
  "/interop/financial-measure-run-v2.json",
  "/interop/mcp-security-scorecard.json",
  "/interop/rwa-attest-index.json",
  "/interop/eas-attestation-batch.json",
];

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const surface = String(url.searchParams.get("surface") ?? "");
  if (!SURFACES.includes(surface)) {
    return Response.json({ error: "unknown surface", surfaces: SURFACES }, { status: 400 });
  }
  const wantsGate = url.searchParams.get("x402") === "1";
  const paidHeader = ctx.request.headers.get("x-payment") != null;
  if (wantsGate && !paidHeader) {
    return Response.json(
      {
        schema: "csoai.interop-bulk/0.1",
        payment_required: {
          kind: "x402",
          amount: 0.02,
          per: "bulk-fetch",
          instruction: "Settle via the estate x402 receipt MCP (or provider:'meta' on /api/checkout), then retry with the x-payment header + invoice id.",
          settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp",
        },
      },
      { status: 402 }
    );
  }
  const base = new URL(ctx.request.url).origin;
  return Response.json(
    {
      schema: "csoai.interop-bulk/0.1",
      surface,
      free: true,
      artifacts: [base + surface.replace("/interop/", "/interop/")],
      note: "Trust engine free forever; bulk/replay metered only. Measurement, not certification.",
    },
    { status: 200 }
  );
};
