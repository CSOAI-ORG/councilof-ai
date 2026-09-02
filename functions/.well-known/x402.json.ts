/**
 * GET /.well-known/x402.json — the x402 discovery manifest, served live so `mode` is derived
 * from env (never typed). Replaces the static file that pointed agents at a mock pack host;
 * the metered resources live on THIS origin. No amounts here — they live in each 402 challenge.
 */
import { railMode, resolvePayTo, NETWORK_CAIP2_BASE } from "../api/_x402_config";
import { USDC_BASE } from "../api/_skus";

export const onRequestGet: PagesFunction<{ X402_PAY_TO?: string; X402_FACILITATOR_URL?: string }> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const rail = railMode(env);
  const body = {
    schema: "csoai.x402/0.2",
    one_line: "agents pay per artefact — issuance, assembly, cadence; the board and verification stay free",
    x402Version: 2,
    scheme: "exact",
    network: NETWORK_CAIP2_BASE,
    asset: USDC_BASE.asset,
    payTo: resolvePayTo(env),
    mode: rail.mode,
    mode_note: rail.note,
    resources: [
      { method: "GET", url: `${origin}/api/request-attestation?subject=<id>&axis=<slug>`, paid_for: "issuance" },
      { method: "GET", url: `${origin}/api/evidence-bundle?obligation=<id>&subject=<s>&bundle=1`, paid_for: "assembly" },
      { method: "GET", url: `${origin}/api/eunomia-data?feed=1`, paid_for: "assembly" },
      { method: "GET", url: `${origin}/api/proof?bundle=1`, paid_for: "assembly" },
      { method: "GET", url: `${origin}/api/rwa/evidence?asset=<symbol|issuer_address>`, paid_for: "issuance", free_preview: `${origin}/api/rwa/evidence?asset=<symbol>&preview=1` },
      { method: "GET", url: `${origin}/api/witness?sha256=<64-hex>`, paid_for: "independent-signature", also: "POST raw bytes (hashed, dropped) or ?url=<https>", free_status: `${origin}/api/witness/status?sha256=<64-hex>` },
      { method: "GET", url: `${origin}/api/feeds/provider-diff?history=1`, paid_for: "assembly" },
      { method: "GET", url: `${origin}/api/receipts/batch?from=<iso>&to=<iso>`, paid_for: "assembly", free_preview: `${origin}/api/receipts/batch?from=<iso>&to=<iso>&preview=1` },
    ],
    mcp: {
      url: `${origin}/mcp`,
      transport: "streamable-http",
      paid_tools: ["commission_card", "art50_marking_evidence", "rwa_evidence", "witness_hash", "receipts_batch"],
      free_tools: ["board_totals", "get_axis", "verify_card", "list_cards", "get_root", "get_card", "verify_inclusion"],
      how: "tools/call without x_payment returns the route's 402 challenge as structuredContent; pay, then call again with x_payment",
    },
    not: ["score", "certificate", "filled-cells", "pay-to-pass", "rank"],
    catalog: `${origin}/api/x402`,
    board: `${origin}/api/gspc`,
    verify: `${origin}/gspc-verify`,
    explainer: `${origin}/pricing-free`,
    agent_paths: ["@x402/fetch", "x402-fetch (v1)", "curl -i <resource> → read accepts[]"],
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
};
