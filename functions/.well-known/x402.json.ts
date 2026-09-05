/**
 * GET /.well-known/x402.json — the x402 discovery manifest, served live so `mode` is derived
 * from env (never typed). Replaces the static file that pointed agents at a mock pack host;
 * the metered resources live on THIS origin. No amounts here — they live in each 402 challenge.
 */
import { railMode, resolvePayTo, NETWORK_CAIP2_BASE } from "../api/_x402_config";
import { USDC_BASE } from "../api/_skus";
import PAID_TOOLS from "../mcp/paid-tools.json";

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
      // The ONLY resource of ours the x402 Bazaar actually indexes, and it was missing from the
      // document agents read after they find the domain. Discovery pointed one way and the
      // catalogue the other: an agent arriving from the Bazaar landed on /api/free-door, and an
      // agent reading this file was never told that door exists.
      //
      // paid_for is null because nothing is bought. `amount` is the protocol field name, not a
      // published price: it is the same 0 the door already advertises in accepts[].amount. The real
      // price — it serves the live board totals and the public signed root, which are published
      // free at the links it returns. It speaks 402 so that an indexer has a payable resource to
      // catalogue at all; a genuinely free 200 route is invisible to the Bazaar, which is why the
      // first seed (against /api/gspc) indexed nothing.
      {
        method: "GET",
        url: `${origin}/api/free-door`,
        paid_for: null,
        amount: "0",
        note: "Payable and priced at zero — it settles, and charges nothing. It belongs in resources rather than quarantined because it is a live 402 route, not a withdrawn one.",
        indexed_in: "x402 Bazaar (PayAI)",
      },
      { method: "GET", url: `${origin}/api/request-attestation?subject=<id>&axis=<slug>`, paid_for: "issuance" },
      { method: "GET", url: `${origin}/api/evidence-bundle?obligation=<id>&subject=<s>&bundle=1`, paid_for: "assembly" },
      { method: "GET", url: `${origin}/api/eunomia-data?feed=1`, paid_for: "assembly" },
      { method: "GET", url: `${origin}/api/proof?bundle=1`, paid_for: "assembly" },
      { method: "GET", url: `${origin}/api/rwa/evidence?asset=<symbol|issuer_address>`, paid_for: "issuance", free_preview: `${origin}/api/rwa/evidence?asset=<symbol>&preview=1` },
      { method: "GET", url: `${origin}/api/art50/marking-evidence?vendor=<slug>`, paid_for: "assembly", free_preview: `${origin}/api/art50/marking-evidence?vendor=<slug>&preview=1` },
      { method: "GET", url: `${origin}/api/feeds/provider-diff?history=1`, paid_for: "assembly" },
      { method: "GET", url: `${origin}/api/receipts/batch?from=<iso>&to=<iso>`, paid_for: "assembly", free_preview: `${origin}/api/receipts/batch?from=<iso>&to=<iso>&preview=1` },
    ],
    mcp: {
      url: `${origin}/mcp`,
      transport: "streamable-http",
      // Derived, never retyped: this list named witness_hash for as long as it took the SKU to be
      // quarantined and dropped from the catalogue, and nothing failed. The catalogue is the truth.
      paid_tools: PAID_TOOLS.tools.map((t) => t.name),
      free_tools: ["board_totals", "get_axis", "verify_card", "list_cards", "get_root", "get_card", "verify_inclusion"],
      how: "tools/call without x_payment returns the route's 402 challenge as structuredContent; pay, then call again with x_payment",
    },
    // Named, not hidden: an agent that cached an older manifest learns why the route now 503s
    // instead of retrying a resource that cannot be sold.
    quarantined: [
      { url: `${origin}/api/witness?sha256=<64-hex>`, lifecycle: "QUARANTINED_PRE_RELEASE", buyable: false,
        reason: "paid witness issuance is disabled until a release gate verifies leaf → signed root → sidecar → Rekor → OpenTimestamps",
        free_status: `${origin}/api/witness/status?sha256=<64-hex>` },
    ],
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
