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
import {
  PROOF_BUNDLE_DESCRIPTION,
  RECEIPTS_BATCH_DESCRIPTION,
  REQUEST_ATTESTATION_DESCRIPTION,
  POPULATION_DESCRIPTIONS,
  FREE_DOOR_DESCRIPTION,
  EVIDENCE_BUNDLE_DESCRIPTION,
  DATA_FEED_DESCRIPTION,
  RWA_EVIDENCE_DESCRIPTION,
  WRAPPER_DESCRIPTION,
  WRAPPER_CHANGES_DESCRIPTION,
  ART50_MARKING_EVIDENCE_DESCRIPTION,
  PROVIDER_DIFF_DESCRIPTION,
  wrapperAssetDescription,
} from "../api/_x402_descriptions";
import WRAPPER_ASSET_DOORS from "../api/_wrapper_asset_doors.json";
import { POPULATION_IDS } from "../api/_population";
import { RAS_MCP_PROBE_DESCRIPTION, RAS_X402_CHECK_DESCRIPTION, RAS_SUPPLY_DESCRIPTION } from "../api/_x402_descriptions";
import { RAS_OUTPUT_SCHEMAS } from "../api/_ras_schemas";
import { SKU as POPULATION_SKU } from "../api/_population_door";
import FREE_TOOLS from "../mcp/gspc-tools.json";
import PAID_TOOLS from "../mcp/paid-tools.json";
import { freshCapsulePaymentRequired, PATH as FRESH_CAPSULE_PATH } from "../api/measurement/fresh-capsule";
import { FREE_DOOR_PRODUCT_ID, FREE_DOOR_SKU } from "../api/free-door";

/** The SKU tier each door passes to x402Accepts — keyed by the path the door serves. */
// pathScoped: the door charges its PATH, not the concrete example URL, so a buyer's target never
// becomes a catalogue row (x402-ras-doors 64e556117). The listing builds its terms the same way.
export type ListingOffer = { skuId: string; tier: string; productId?: string; amountAtomic?: "0"; pathScoped?: true };
export const OFFERS: Record<string, ListingOffer> = {
  // The free door lists under its OWN product and sku id, as its 402 does (functions/api/free-door.ts).
  "/api/free-door": { skuId: FREE_DOOR_SKU, tier: "per_request", productId: FREE_DOOR_PRODUCT_ID, amountAtomic: "0" },
  "/api/request-attestation": { skuId: "request_attestation", tier: "per_request" },
  "/api/evidence-bundle": { skuId: "evidence_bundle", tier: "bundle" },
  "/api/signed-data-feed": { skuId: "issuance", tier: "reserve" },
  "/api/proof": { skuId: "issuance", tier: "reserve" },
  "/api/rwa/evidence": { skuId: "request_attestation", tier: "per_request" },
  "/api/wrapper": { skuId: "request_attestation", tier: "per_request" },
  "/api/wrapper/changes": { skuId: "request_attestation", tier: "per_request" },
  "/api/art50/marking-evidence": { skuId: "art50_marking_evidence", tier: "pack" },
  "/api/feeds/provider-diff": { skuId: "provider_diff_feed", tier: "history_batch" },
  "/api/receipts/batch": { skuId: "receipts_batch", tier: "per_batch" },
  // SELF-SERVE RAS DOORS (functions/api/ras/*): the same SKU each handler passes to x402Accepts.
  "/api/ras/mcp-probe": { skuId: "ras_fresh_read", tier: "per_read", productId: "csoai.product.ras.mcp_probe", pathScoped: true },
  "/api/ras/x402-check": { skuId: "ras_fresh_read", tier: "per_read", productId: "csoai.product.ras.x402_check", pathScoped: true },
  "/api/ras/supply": { skuId: "ras_fresh_read", tier: "per_read", productId: "csoai.product.ras.supply", pathScoped: true },
  // FRESH CAPSULE (venturi-arms): the SKU functions/api/measurement/fresh-capsule.ts charges (its exported SKU).
  [FRESH_CAPSULE_PATH]: { skuId: "request_attestation", tier: "per_request" },
};
export const offerFor = (url: string): ListingOffer | null => {
  const path = new URL(url).pathname;
  const pop = path.match(/^\/api\/pop\/([^/]+)$/);
  if (pop) return { ...POPULATION_SKU, productId: `csoai.product.population.${pop[1]}` };
  // PER-ASSET WRAPPER DOORS (functions/api/wrapper/asset/[asset].ts): the /api/wrapper SKU and tier,
  // path-scoped by construction (the door's resource.url carries no query).
  const asset = path.match(/^\/api\/wrapper\/asset\/([a-z0-9]+)$/);
  if (asset) return { skuId: "request_attestation", tier: "per_request", productId: `csoai.product.wrapper.asset.${asset[1]}` };
  return OFFERS[path] ?? null;
};

/** accepts[] for one listed resource, built exactly as its door builds its 402. */
export function listingAccepts(env: X402Env, listedUrl: string, description: string, outputSchema: Record<string, unknown> = { type: "object" }) {
  const offer = offerFor(listedUrl);
  if (!offer) throw new Error(`x402.json: no offer declared for ${listedUrl}`);
  const url = offer.pathScoped ? listedUrl.split("?")[0] : listedUrl;
  const terms = x402Accepts(offer.amountAtomic === "0" ? { ...env, X402_AMOUNT: "0" } : env, url, {
    skuId: offer.skuId,
    tier: offer.tier,
    description,
    ...(offer.productId ? { productId: offer.productId } : {}),
  });
  return {
    // RAS doors (x402-ras-doors) declare a per-door outputSchema on accepts[] as well; other doors keep the bare projection.
    accepts: terms.map((a) => (outputSchema.type === "object" && Object.keys(outputSchema).length === 1 ? challengeAccept(a, url, description) : { ...challengeAccept(a, url, description), outputSchema })),
    accepts_v1: terms.map((a) => ({ ...toV1Requirements(a), outputSchema })),
  };
}

export const onRequestGet: PagesFunction<X402Env> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  const req = (url: string, description: string, outputSchema?: Record<string, unknown>) => listingAccepts(env, url, description, outputSchema);

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
        description: FREE_DOOR_DESCRIPTION,
        ...req(`${origin}/api/free-door`, FREE_DOOR_DESCRIPTION),
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
        description: EVIDENCE_BUNDLE_DESCRIPTION,
        ...req(`${origin}/api/evidence-bundle?obligation=article-50&bundle=1`, EVIDENCE_BUNDLE_DESCRIPTION)  },
      { method: "GET", url: `${origin}/api/signed-data-feed?feed=1`, paid_for: "assembly",
        description: DATA_FEED_DESCRIPTION,
        ...req(`${origin}/api/signed-data-feed?feed=1`, DATA_FEED_DESCRIPTION)  },
      { method: "GET", url: `${origin}/api/proof?bundle=1`, paid_for: "assembly",
        description: PROOF_BUNDLE_DESCRIPTION,
        ...req(`${origin}/api/proof?bundle=1`, PROOF_BUNDLE_DESCRIPTION)  },
      { method: "GET", url: `${origin}/api/rwa/evidence?asset=RLUSD`, paid_for: "issuance", free_preview: `${origin}/api/rwa/evidence?asset=<symbol>&preview=1`,
        description: RWA_EVIDENCE_DESCRIPTION,
        ...req(`${origin}/api/rwa/evidence?asset=RLUSD`, RWA_EVIDENCE_DESCRIPTION)  },
      { method: "GET", url: `${origin}/api/wrapper?id=usdc.e:arbitrum`, paid_for: "issuance", free_preview: `${origin}/api/wrapper?id=<wrapped-symbol:chain>&preview=1`,
        description: WRAPPER_DESCRIPTION,
        ...req(`${origin}/api/wrapper?id=usdc.e:arbitrum`, WRAPPER_DESCRIPTION)  },
      { method: "GET", url: `${origin}/api/wrapper/changes?id=usdc.e:arbitrum`, paid_for: "assembly", free_preview: `${origin}/api/wrapper/changes?id=usdc.e:arbitrum&preview=1`,
        description: WRAPPER_CHANGES_DESCRIPTION,
        ...req(`${origin}/api/wrapper/changes?id=usdc.e:arbitrum`, WRAPPER_CHANGES_DESCRIPTION)  },
      // PER-ASSET WRAPPER DOORS — derived from functions/api/_wrapper_asset_doors.json, never retyped.
      // PATH-SCOPED (no query): each is its own resource, so an index that keeps only query-less URLs
      // can list it. Each reads every roster pair of one asset; all-UNMEASURED answers 200, never 402.
      ...(WRAPPER_ASSET_DOORS as { doors: { asset: string; symbol: string }[] }).doors.map((d) => {
        const description = wrapperAssetDescription(d.symbol);
        return {
          method: "GET",
          url: `${origin}/api/wrapper/asset/${d.asset}`,
          paid_for: "issuance",
          asset: d.symbol,
          free_preview: `${origin}/api/wrapper/asset/${d.asset}?preview=1`,
          description,
          ...req(`${origin}/api/wrapper/asset/${d.asset}`, description),
        };
      }),
      // PARAMETER NAME, CHECKED AGAINST THE HANDLER, NOT ASSUMED. This advertised `vendor=<slug>`
      // and the endpoint reads only `url=` (marking-evidence.ts: searchParams.get("url")); the
      // string "vendor" appears nowhere in it. A buyer following this document got
      // 400 bad_request and never reached a payment challenge — a door listed as buyable that
      // could not be bought. Probed live 2026-09-05: ?vendor=openai -> 400,
      // ?url=<a real asset> -> 402.
      { method: "GET", url: `${origin}/api/art50/marking-evidence?url=https://councilof.ai/og-image.png`, paid_for: "assembly", free_preview: `${origin}/api/art50/marking-evidence?url=https://councilof.ai/og-image.png&preview=1`,
        description: ART50_MARKING_EVIDENCE_DESCRIPTION,
        ...req(`${origin}/api/art50/marking-evidence?url=https://councilof.ai/og-image.png`, ART50_MARKING_EVIDENCE_DESCRIPTION)  },
      { method: "GET", url: `${origin}/api/feeds/provider-diff?history=1`, paid_for: "assembly",
        description: PROVIDER_DIFF_DESCRIPTION,
        ...req(`${origin}/api/feeds/provider-diff?history=1`, PROVIDER_DIFF_DESCRIPTION)  },
      { method: "GET", url: `${origin}/api/receipts/batch?from=2026-01-01T00:00:00Z`, paid_for: "assembly", free_preview: `${origin}/api/receipts/batch?from=2026-01-01T00:00:00Z&preview=1`,
        description: RECEIPTS_BATCH_DESCRIPTION,
        ...req(`${origin}/api/receipts/batch?from=2026-01-01T00:00:00Z`, RECEIPTS_BATCH_DESCRIPTION)  },
      // FRESH CAPSULE (lane venturi-arms-20260926). Built per that lane's MERGE NOTE: its SKU is in OFFERS
      // and the entry goes through req() like every other door, so listing = challenge by construction;
      // the description is the door's own DESCRIPTION (read from the door's 402 builder).
      (() => {
        const { resourceUrl, accepts } = freshCapsulePaymentRequired(env, origin);
        const description = accepts[0].description as string;
        return {
          method: "GET",
          url: resourceUrl,
          paid_for: "issuance",
          free_preview: `${resourceUrl}?endpoint=https://councilof.ai/mcp&dimension=TOOLS&preview=1`,
          description,
          ...req(resourceUrl, description),
          free_verification: `${origin}/mcp (verify_capsule, server_evidence are free)`,
        };
      })(),
      // POPULATION DOORS — derived from the registry (functions/api/_population.ts), never retyped
      // here: a population added there is advertised here the moment it exists. Each url is
      // PATH-SCOPED (no query) because PayAI lists only query-less URLs today; the pod's settle
      // loop walks this list, so a door listed here is settled — and therefore indexed — without
      // anyone asking. Descriptions are the canonical bytes in x402-descriptions.json.
      ...POPULATION_IDS.map((id) => {
        const description = POPULATION_DESCRIPTIONS[id];
        if (!description) throw new Error(`x402.json: no canonical description for population ${id} in functions/api/x402-descriptions.json`);
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
      // SELF-SERVE RAS DOORS (functions/api/ras/*) — fresh computation against a buyer-named
      // target, one Ed25519 receipt each. `url` is a concrete, probeable example (the manifest
      // door test and the 402index loop call it verbatim); the 402's resource.url is path-scoped
      // so a buyer's target never becomes a catalogue row. A result that is bad news about the
      // target is delivered as found; a read OUR side could not run is never settled.
      { method: "GET", url: `${origin}/api/ras/mcp-probe?url=https://councilof.ai/mcp`, paid_for: "issuance",
        description: RAS_MCP_PROBE_DESCRIPTION,
        outputSchema: RAS_OUTPUT_SCHEMAS.mcp_probe,
        ...req(`${origin}/api/ras/mcp-probe?url=https://councilof.ai/mcp`, RAS_MCP_PROBE_DESCRIPTION, RAS_OUTPUT_SCHEMAS.mcp_probe) },
      { method: "GET", url: `${origin}/api/ras/x402-check?url=https://councilof.ai/api/free-door`, paid_for: "issuance",
        description: RAS_X402_CHECK_DESCRIPTION,
        outputSchema: RAS_OUTPUT_SCHEMAS.x402_check,
        ...req(`${origin}/api/ras/x402-check?url=https://councilof.ai/api/free-door`, RAS_X402_CHECK_DESCRIPTION, RAS_OUTPUT_SCHEMAS.x402_check) },
      { method: "GET", url: `${origin}/api/ras/supply?asset=USDC&ledger=ethereum`, paid_for: "issuance",
        description: RAS_SUPPLY_DESCRIPTION,
        outputSchema: RAS_OUTPUT_SCHEMAS.supply,
        ...req(`${origin}/api/ras/supply?asset=USDC&ledger=ethereum`, RAS_SUPPLY_DESCRIPTION, RAS_OUTPUT_SCHEMAS.supply) },
    ],
    // FREE DOORS — named here so an agent reading this manifest finds the free companions of the
    // RAS doors without paying: verifying any receipt, and the daily conformance index. They are
    // not in resources[] because they never answer 402; they carry no accepts[] and no amount.
    free_doors: [
      { method: "GET", url: `${origin}/api/verify?record_url=https://councilof.ai/signed/card_index.json`, free: true,
        description: "Verify a published CSOAI record — re-fetches a councilof.ai / csoai.org record, recomputes its sha256 and checks its signature under the pinned board keys. Free forever; POST a RAS receipt to verify it.",
        outputSchema: RAS_OUTPUT_SCHEMAS.verify },
      { method: "GET", url: `${origin}/api/x402/index`, free: true,
        description: "Daily x402 conformance index — serves the latest SIGNED daily run when one exists; until then says INDEX_PENDING and points at the latest unsigned census run, never an invented list. Free.",
        outputSchema: RAS_OUTPUT_SCHEMAS.x402_index },
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
