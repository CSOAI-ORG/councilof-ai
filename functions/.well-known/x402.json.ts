/**
 * GET /.well-known/x402.json — the x402 discovery manifest, served live so `mode` is derived
 * from env (never typed). Replaces the static file that pointed agents at a mock pack host;
 * the metered resources live on THIS origin.
 *
 * ACCEPTS ARE THE LIVE CHALLENGE'S, NOT A COPY OF THEM (2026-09-26). Each resources[].accepts[]
 * entry is built by the same two functions every door calls — x402Accepts() for the terms and
 * challengeAccept() for the projection a buyer reads — from the SKU tier that door charges
 * (OFFERS below). Until then this file hand-rolled `network: "base"`, no amount, no asset and
 * `extra.name: "USDC"` while the 402 said eip155:8453, an atomic amount and "USD Coin"; the
 * EIP-712 domain name is what a wallet signs under, so the listing produced unverifiable
 * signatures. functions/.well-known/x402-listing-parity.test.ts calls every door's own handler
 * and fails when any payment field here differs from its 402.
 *
 * `accepts_v1` is the SAME entry projected through toV1Requirements() — the function the settle
 * path uses when a facilitator speaks v1 — for consumers that still read the chain slug.
 */
import { railMode, resolvePayTo, NETWORK_CAIP2_BASE } from "../api/_x402_config";
import { OFFER_RECEIPT_SPEC_SHA, OFFER_RECEIPT_SPEC_URL, X402_SIGNER_KID } from "../api/_x402_offer";
import { USDC_BASE } from "../api/_skus";
import { challengeAccept, toV1Requirements, x402Accepts, type X402Env } from "../api/_x402";
import { PROOF_BUNDLE_DESCRIPTION, RECEIPTS_BATCH_DESCRIPTION, REQUEST_ATTESTATION_DESCRIPTION, POPULATION_DESCRIPTIONS } from "../api/_x402_descriptions";
import { POPULATION_IDS } from "../api/_population";
import { SKU as POPULATION_SKU } from "../api/_population_door";
import FREE_TOOLS from "../mcp/gspc-tools.json";
import PAID_TOOLS from "../mcp/paid-tools.json";

/** The SKU tier each door passes to x402Accepts — keyed by the path the door serves. */
export type ListingOffer = { skuId: string; tier: string; productId?: string; amountAtomic?: "0" };
export const OFFERS: Record<string, ListingOffer> = {
  "/api/free-door": { skuId: "request_attestation", tier: "per_request", amountAtomic: "0" },
  "/api/request-attestation": { skuId: "request_attestation", tier: "per_request" },
  "/api/evidence-bundle": { skuId: "evidence_bundle", tier: "bundle" },
  "/api/eunomia-data": { skuId: "issuance", tier: "reserve" },
  "/api/proof": { skuId: "issuance", tier: "reserve" },
  "/api/rwa/evidence": { skuId: "request_attestation", tier: "per_request" },
  "/api/wrapper": { skuId: "request_attestation", tier: "per_request" },
  "/api/wrapper/changes": { skuId: "request_attestation", tier: "per_request" },
  "/api/art50/marking-evidence": { skuId: "art50_marking_evidence", tier: "pack" },
  "/api/feeds/provider-diff": { skuId: "provider_diff_feed", tier: "history_batch" },
  "/api/receipts/batch": { skuId: "receipts_batch", tier: "per_batch" },
};
export const offerFor = (url: string): ListingOffer | null => {
  const path = new URL(url).pathname;
  const pop = path.match(/^\/api\/pop\/([^/]+)$/);
  if (pop) return { ...POPULATION_SKU, productId: `csoai.product.population.${pop[1]}` };
  return OFFERS[path] ?? null;
};

/** accepts[] for one listed resource, built exactly as its door builds its 402. */
export function listingAccepts(env: X402Env, url: string, description: string) {
  const offer = offerFor(url);
  if (!offer) throw new Error(`x402.json: no offer declared for ${url}`);
  const terms = x402Accepts(offer.amountAtomic === "0" ? { ...env, X402_AMOUNT: "0" } : env, url, {
    skuId: offer.skuId,
    tier: offer.tier,
    description,
    ...(offer.productId ? { productId: offer.productId } : {}),
  });
  return {
    accepts: terms.map((a) => challengeAccept(a, url, description)),
    accepts_v1: terms.map((a) => ({ ...toV1Requirements(a), outputSchema: { type: "object" as const } })),
  };
}

export const onRequestGet: PagesFunction<X402Env> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const req = (url: string, description: string) => listingAccepts(env, url, description);

  const rail = railMode(env);
  const boardSigningKeyConfigured = Boolean((env.BOARD_SIGN_KEY_PKCS8_B64 || "").trim());
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
    // WHAT THIS RAIL SUPPORTS BEYOND THE BASE PROTOCOL. Declared here so an agent learns the
    // runtime conditions before it spends a request finding them out. `offer-receipt` is the x402
    // Offer & Receipt extension, but its signatures are conditional: offers require the board
    // key; receipts additionally require facilitator-confirmed settlement that names a payer.
    // The format is JWS/EdDSA under a key published in our DID document — a format the extension
    // names in §3.3, verified by a mechanism it names in §4.5.1.
    extensions: {
      "offer-receipt": {
        supported: true,
        emission: "conditional",
        board_signing_key_configured: boardSigningKeyConfigured,
        facilitator_configured: rail.facilitator_configured,
        spec: OFFER_RECEIPT_SPEC_URL,
        spec_commit: OFFER_RECEIPT_SPEC_SHA,
        format: "jws",
        alg: "EdDSA",
        kid: X402_SIGNER_KID,
        did_document: "https://csoai.org/.well-known/did.json",
        offers:
          "signed only when BOARD_SIGN_KEY_PKCS8_B64 is provisioned and an accepts[] entry can be " +
          "committed; otherwise the 402 omits the offer-receipt block and csoai.offer_receipt names the gap",
        receipts:
          "signed only after facilitator-confirmed settlement when the facilitator names a payer and " +
          "BOARD_SIGN_KEY_PKCS8_B64 is provisioned; otherwise receiptGap names why no signed receipt " +
          "was attached",
        eip712:
          "NOT offered. The extension admits eip712 and jws; when a board key is provisioned the edge " +
          "can emit jws but has no secp256k1 signer. A client that requires eip712 should treat this " +
          "rail as unsigned rather than expect a format we cannot produce.",
        verify: {
          hosted: `${origin}/api/receipts/verify`,
          offline: "https://councilof.ai/verifier/verify_receipt.py — same-site checker; reads the public DID document or replays a retained local copy; guide https://councilof.ai/verifier/receipt-toolkit.md",
        },
        receipts_by_payer: `${origin}/api/receipts?payer=0x…`,
      },
    },
    resources: [
      // The resource the x402 Bazaar indexed first (2026-09-05), and it was missing from the
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
        description:
          "Live board totals and the signed public root — free: the GSPC board and Merkle root a buyer can verify without paying.",
        ...req(`${origin}/api/free-door`, "Live board totals and the signed public root — free: the GSPC board and Merkle root a buyer can verify without paying."),
        note: "Payable and priced at zero — it settles, and charges nothing. It answers 402 rather than 200 on purpose: the x402 Bazaar catalogues only a resource that settles, so a 200 route cannot be indexed. It belongs in resources rather than quarantined because it is a live 402 route, not a withdrawn one. To read the same content without any x402 handshake, GET a free_equivalents URL — those answer 200.",
        free_equivalents: [`${origin}/api/gspc`, `${origin}/root.json`],
      },
      { method: "GET", url: `${origin}/api/request-attestation?subject=model-or-subject-id`, paid_for: "issuance",
        description:
          REQUEST_ATTESTATION_DESCRIPTION,
        ...req(`${origin}/api/request-attestation?subject=model-or-subject-id`, REQUEST_ATTESTATION_DESCRIPTION)  },
      // `<id>` meant a MODEL id two lines above and an OBLIGATION id here, so a buyer reading
      // this file tries the obvious thing and gets 404 unknown_obligation. Probed 2026-09-05:
      // obligation=gpt-4o -> 404, obligation=dora|eu-cra|article-50|article-53 -> 402. The
      // endpoint does return the valid list in its 404 body, so the buyer can recover — but a
      // placeholder that names what it wants costs nothing and spends no round trip.
      { method: "GET", url: `${origin}/api/evidence-bundle?obligation=article-50&bundle=1`, paid_for: "assembly",
        description:
          "Signed compliance evidence bundle — per-obligation EU AI Act Article 50, DORA, EU-CRA or Article 53 with signed per-item proof.",
        ...req(`${origin}/api/evidence-bundle?obligation=article-50&bundle=1`, "Signed compliance evidence bundle — per-obligation EU AI Act Article 50, DORA, EU-CRA or Article 53 with signed per-item proof.")  },
      { method: "GET", url: `${origin}/api/eunomia-data?feed=1`, paid_for: "assembly",
        description:
          "Signed derivative data feed — validated measurement series, authenticated and ready to build on.",
        ...req(`${origin}/api/eunomia-data?feed=1`, "Signed derivative data feed — validated measurement series, authenticated and ready to build on.")  },
      { method: "GET", url: `${origin}/api/proof?bundle=1`, paid_for: "assembly",
        description: PROOF_BUNDLE_DESCRIPTION,
        ...req(`${origin}/api/proof?bundle=1`, PROOF_BUNDLE_DESCRIPTION)  },
      { method: "GET", url: `${origin}/api/rwa/evidence?asset=RLUSD`, paid_for: "issuance", free_preview: `${origin}/api/rwa/evidence?asset=<symbol>&preview=1`,
        description:
          "RWA asset evidence — signed evidence for an XRPL token (issuer, funding stage, compliance shape) with a free preview.",
        ...req(`${origin}/api/rwa/evidence?asset=RLUSD`, "RWA asset evidence — signed evidence for an XRPL token (issuer, funding stage, compliance shape) with a free preview.")  },
      { method: "GET", url: `${origin}/api/wrapper?id=usdc.e:arbitrum`, paid_for: "issuance", free_preview: `${origin}/api/wrapper?id=<wrapped-symbol:chain>&preview=1`,
        description:
          "Wrapped-asset parity evidence — signed card of one bridged stablecoin pair: wrapped totalSupply vs origin-chain bridge-escrow balance at pinned finalized blocks, with a free preview. A ratio, not a rate or a reserve attestation.",
        ...req(`${origin}/api/wrapper?id=usdc.e:arbitrum`, "Wrapped-asset parity evidence — signed card of one bridged stablecoin pair: wrapped totalSupply vs origin-chain bridge-escrow balance at pinned finalized blocks, with a free preview. A ratio, not a rate or a reserve attestation.")  },
      { method: "GET", url: `${origin}/api/wrapper/changes?id=usdc.e:arbitrum`, paid_for: "assembly", free_preview: `${origin}/api/wrapper/changes?id=usdc.e:arbitrum&preview=1`,
        description:
          "Wrapped-asset parity evidence: change feed showing the delta of wrapped supply and escrow since the previous ledger snapshot. A diff, not a rate or a grade.",
        ...req(`${origin}/api/wrapper/changes?id=usdc.e:arbitrum`, "Wrapped-asset parity evidence: change feed showing the delta of wrapped supply and escrow since the previous ledger snapshot. A diff, not a rate or a grade.")  },
      // PARAMETER NAME, CHECKED AGAINST THE HANDLER, NOT ASSUMED. This advertised `vendor=<slug>`
      // and the endpoint reads only `url=` (marking-evidence.ts: searchParams.get("url")); the
      // string "vendor" appears nowhere in it. A buyer following this document got
      // 400 bad_request and never reached a payment challenge — a door listed as buyable that
      // could not be bought. Probed live 2026-09-05: ?vendor=openai -> 400,
      // ?url=<a real asset> -> 402.
      { method: "GET", url: `${origin}/api/art50/marking-evidence?url=https://councilof.ai/og-image.png`, paid_for: "assembly", free_preview: `${origin}/api/art50/marking-evidence?url=https://councilof.ai/og-image.png&preview=1`,
        description:
          "Art. 50 marking evidence — EU AI Act Article 50 watermark/marking verification for a named URL, with a free preview.",
        ...req(`${origin}/api/art50/marking-evidence?url=https://councilof.ai/og-image.png`, "Art. 50 marking evidence — EU AI Act Article 50 watermark/marking verification for a named URL, with a free preview.")  },
      { method: "GET", url: `${origin}/api/feeds/provider-diff?history=1`, paid_for: "assembly",
        description:
          "Provider change record — measurable differences between two measurement rounds for a named model provider.",
        ...req(`${origin}/api/feeds/provider-diff?history=1`, "Provider change record — measurable differences between two measurement rounds for a named model provider.")  },
      { method: "GET", url: `${origin}/api/receipts/batch?from=2026-01-01T00:00:00Z`, paid_for: "assembly", free_preview: `${origin}/api/receipts/batch?from=2026-01-01T00:00:00Z&preview=1`,
        description: RECEIPTS_BATCH_DESCRIPTION,
        ...req(`${origin}/api/receipts/batch?from=2026-01-01T00:00:00Z`, RECEIPTS_BATCH_DESCRIPTION)  },
      // POPULATION DOORS — derived from the registry (functions/api/_population.ts), never retyped
      // here: a population added there is advertised here the moment it exists. Each url is
      // PATH-SCOPED (no query) because PayAI lists only query-less URLs today; the pod's settle
      // loop walks this list, so a door listed here is settled — and therefore indexed — without
      // anyone asking. Descriptions are the canonical bytes in x402-descriptions.json.
      ...POPULATION_IDS.map((id) => {
        const description = POPULATION_DESCRIPTIONS[id] || `Population door ${id} — a read-transform of the estate's own published artifact.`;
        return {
          method: "GET",
          url: `${origin}/api/pop/${id}`,
          paid_for: "assembly",
          population: id,
          free_preview: `${origin}/api/pop/${id}?preview=1`,
          description,
          ...req(`${origin}/api/pop/${id}`, description),
        };
      }),
    ],
    mcp: {
      url: `${origin}/mcp`,
      transport: "streamable-http",
      // Derived, never retyped: this list named witness_hash for as long as it took the SKU to be
      // quarantined and dropped from the catalogue, and nothing failed. The catalogue is the truth.
      paid_tools: PAID_TOOLS.tools.map((t) => t.name),
      free_tools: FREE_TOOLS.tools.map((t) => t.name),
      how: "tools/call without x_payment returns the route's 402 challenge per the x402 MCP transport: isError:true, the PaymentRequired object in structuredContent and as JSON in content[0].text; pay, then call again with x_payment",
    },
    // Named, not hidden: an agent that cached an older manifest learns why the route now 503s
    // instead of retrying a resource that cannot be sold.
    quarantined: [
      { url: `${origin}/api/witness?sha256=<64-hex>`, lifecycle: "QUARANTINED_PRE_RELEASE", buyable: false,
        reason: "paid witness issuance is disabled until a release gate verifies leaf → signed root → sidecar → Rekor → OpenTimestamps",
        free_status: `${origin}/api/witness/status?sha256=<64-hex>` },
    ],
    // INDEX MEMBERSHIP IS MEASURED, NOT DECLARED (2026-09-26). This manifest used to carry
    // `indexed_in: "x402 Bazaar (PayAI)"` on one resource of 21 — hand-typed, and silent on the
    // other twenty whether or not a third-party index listed them. An index writes its record once
    // and never refreshes it (see functions/api/free-door.ts), so membership is only knowable by
    // reading the index; nothing in this repository can keep a typed claim true. The field is
    // removed, not populated; the self-parity instrument (csoai.self-parity/0.1) reads each index.
    index_membership:
      "not asserted by this manifest — whether a third-party index lists a resource is measured by reading that index, never typed here",
    not: ["score", "certificate", "filled-cells", "pay-to-pass", "rank"],
    catalog: `${origin}/api/x402`,
    board: `${origin}/api/gspc`,
    verify: `${origin}/gspc-verify`,
    explainer: `${origin}/pricing`,
    agent_paths: ["@x402/fetch", "x402-fetch (v1)", "curl -i <resource> → read accepts[]"],
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
};
