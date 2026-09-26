// functions/api/eunomia-data.ts — Tier 3: the DATA FEED rail (SOVOS Part IX canon, R8).
//
// Serves the signed corpus as RAW DATA to commercial buyers (insurers, bond desks, vendors)
// behind an x402 gate. DATA-only — never scores as a product, never ranked, never a rating.
// Regulators + the public get every signed stream free (/api/fines, /signals/*.signed.json,
// /root.json, /api/gspc) — this endpoint sells ASSEMBLY + CADENCE of the feed, not access to
// facts that are already public. The buyer can always recompute for free.
//
//   free   GET /api/eunomia-data            → feed preview: what streams exist, their as_of,
//                                             row counts — read from the signed files, never typed.
//   402    GET /api/eunomia-data?feed=1     → x402 challenge (the amount lives only here).
//   paid   + settled X-PAYMENT              → one assembled feed document: the signed signals index,
//                                             the signed First-Fine Watch feed, the root, the card
//                                             index — each block carrying its own signature/kid as
//                                             published, so a stranger verifies every block offline.
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  CSOAI_LID,
  hasPaymentHeader,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { onRequestGet as finesGet } from "./fines";
import { readFeedSource, expectedFeedDigest, missingFeedSources, feedBlocks, makeFeedManifest, requestRecord, feedJson, EXPECTED_FEED_HEADER, type Reads } from "./_eunomia_delivery";

type AssetFetcher = { fetch: (request: Request | string) => Promise<Response> };
type Env = X402Env & { REVENUE_KV?: KVNamespace; ASSETS?: AssetFetcher };

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  // `?x402=1` is the legacy probe flag (public/interop/x402-challenge); keep it as a synonym.
  const wantManifest = url.searchParams.get("manifest") === "1";
  let expected: string | null;
  try { expected = expectedFeedDigest(request); }
  catch { return json({schema:"csoai.eunomia-data/0.2",error:"invalid_expected_digest",settled:false},400); }
  const wantFeed = url.searchParams.get("feed") === "1" || url.searchParams.get("x402") === "1";
  const resourceUrl = new URL("/api/eunomia-data?feed=1", origin).toString();

  // The streams — read, never typed. Static bytes use the Pages ASSETS binding when
  // available, so this function does not self-fetch through the public zone. /api/fines is
  // invoked in-process. readFeedSource still hashes the exact response bytes it consumed.
  const staticFetch = async (input: Request | string, init?: RequestInit) =>
    env.ASSETS ? env.ASSETS.fetch(input) : fetch(input, init);
  const finesFetch = async (_input: Request | string, _init?: RequestInit) => {
    const response = await finesGet({
      ...context,
      request: new Request(`${origin}/api/fines`, { headers: { accept: "application/json" } }),
    } as never);
    if (!(response instanceof Response)) {
      return new Response("fines handler returned no response", { status: 503 });
    }
    return response;
  };
  const [signals, fines, root, cardIndex] = await Promise.all([
    readFeedSource<{ signals?: unknown[]; schema?: string }>(`${origin}/signals/_index.json`,"signals",staticFetch),
    readFeedSource<Record<string, unknown>>(`${origin}/api/fines`,"first_fine_watch",finesFetch),
    readFeedSource<{ as_of?: string; card_count?: number; merkle_root?: string }>(`${origin}/root.json`,"root",staticFetch),
    readFeedSource<{ cards?: unknown[] }>(`${origin}/signed/card_index.json`,"card_index",staticFetch),
  ]);
  const streams = {
    signals: signals.ok ? { rows: (signals.body.signals || []).length, schema: signals.body.schema || null, href: `${origin}/signals/_index.json`, each: `${origin}/signals/<axis>.signed.json` } : { rows: null, unreadable: signals.reason },
    first_fine_watch: fines.ok ? { signed: !!(fines.body.signature || fines.body.sig_ed25519), kid: (fines.body.kid as string) || (fines.body.did as string) || null, href: `${origin}/api/fines` } : { signed: null, unreadable: fines.reason },
    root: root.ok ? { as_of: root.body.as_of || null, card_count: root.body.card_count ?? null, merkle_root: root.body.merkle_root || null, href: `${origin}/root.json` } : { as_of: null, unreadable: root.reason },
    card_index: cardIndex.ok ? { rows: (cardIndex.body.cards || []).length, href: `${origin}/signed/card_index.json` } : { rows: null, unreadable: cardIndex.reason },
  };
  const preview = {
    lane: "commercial-data",
    data_only: true,
    streams,
    free_for: ["regulators", "the public", "anyone verifying"],
    sold: "assembly + cadence of the feed (one document, every block carrying its published signature) — never the facts, which stay free",
    never: ["scores as a product", "ranking", "rating", "certificate"],
  };

  const reads = {signals,first_fine_watch:fines,root,card_index:cardIndex} as Reads;
  const missing = missingFeedSources(reads);
  // A partial source inventory is a preview, never a paid assembled feed.
  if ((wantManifest || (wantFeed && hasPaymentHeader(request))) && missing.length) {
    return json({schema:"csoai.eunomia-data/0.2",kind:"feed_unavailable",state:"UNCHECKABLE",missing_sources:missing,settled:false,signing_attempted:false,free_preview:`${origin}/api/eunomia-data`},503);
  }
  const manifest = missing.length ? null : await makeFeedManifest(reads,origin);
  if (wantManifest) return feedJson(manifest,200,{"x-csoai-feed-sha256":manifest!.evidence.blocks_sha256});

  if (!wantFeed) {
    return json({ schema: "csoai.eunomia-data/0.2", kind: "preview", ...preview, delivery_manifest:manifest, buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402`, explainer: `${origin}/pricing` }, rail: railMode(env) });
  }

  const description = "A signed JSON feed of enforcement and measurement artefacts already on the public root. Data only — no scores, no ranking.";
  const accepts = x402Accepts(env, resourceUrl, { skuId: "issuance", tier: "reserve", description });
  // Computed once, used twice: the 402 advertises this block and the paid path echoes the SAME
  // object into the PaymentPayload sent to the facilitator (specs/extensions/bazaar.md, Client
  // Behavior) — that echo is what gets a resource catalogued.
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    queryParams: { feed: "1" },
    queryParamsSchema: { properties: { feed: { type: "string", const: "1" } }, required: ["feed"] },
    outputExample: { schema: "csoai.eunomia-data/0.2", kind: "feed", blocks: { signals: {}, first_fine_watch: {}, root: {}, card_index: {} } },
  });
  // Compare caller's pre-payment data commitment before a facilitator or signer call.
  if (expected !== null && manifest && expected !== manifest.evidence.blocks_sha256) {
    return json({schema:"csoai.eunomia-data/0.2",error:"feed_revision_changed",expected_blocks_sha256:expected,current_blocks_sha256:manifest.evidence.blocks_sha256,manifest_url:manifest.manifest_url,settled:false,signing_attempted:false},409);
  }
  const targetRecord = await requestRecord(request);
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });

  if (!payment.ok) {
    const paymentRequired = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Data Feed",
      tags: ["data", "feed", "enforcement", "signed", "x402"],
      accepts,
      bazaar,
      csoai: { schema: "csoai.eunomia-data/0.2", per: "feed-pull", lid: CSOAI_LID, ...preview,
        // named in the challenge so a buyer knows where to look for free and what settling buys
        free_preview: `${origin}/api/eunomia-data`,
        free_manifest: `${origin}/api/eunomia-data?manifest=1`,
        delivery_manifest: manifest,
        read_before_settle: {complete:missing.length===0, missing_sources:missing},
        deliverable: "the assembled signed data feed for this lane — data only, never a score and never a rank",
        rail: railMode(env), not_paid_reason: payment.reason, catalog: `${origin}/api/x402` },
    });
    return paymentRequiredResponseSigned(paymentRequired, env);
  }

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:feed_pulls")) || "0") + 1;
      await env.REVENUE_KV.put("count:feed_pulls", String(n));
    } catch {
      /* never blocks a paid deliverable */
    }
  }

  return feedJson(
    {
      schema: "csoai.eunomia-data/0.2",
      kind: "feed",
      lane: "commercial-data",
      data_only: true,
      note: "Each block is the published bytes with its own signature/kid; verify every block offline. Nothing here is a score product.",
      blocks: feedBlocks(reads),
      delivery_manifest: manifest,
      request_record: targetRecord,
      receipt_binding: "Separate x402 receipt remains path-scoped; this unsigned integrity record does not extend that signature.",
      settle: payment.settlement || null,
      verify: `${origin}/gspc-verify`,
    },
    200,
    {"x-csoai-feed-sha256":manifest!.evidence.blocks_sha256,...(payment.paymentResponse ? {"x-payment-response":payment.paymentResponse} : {})},
  );
};

/** Gold-402's gate POSTs {}. Query string still selects the paid tier; body is ignored. */
export const onRequestPost = onRequestGet;

/** Browser preflight never reads sources, signs, or invokes payment. */
export const onRequestOptions: PagesFunction = async () => new Response(null,{status:204,headers:{
  "access-control-allow-origin":"*","access-control-allow-methods":"GET, POST, OPTIONS",
  "access-control-allow-headers":`content-type, x-payment, payment-signature, x-payment-signature, ${EXPECTED_FEED_HEADER}`,
  "access-control-max-age":"600","cache-control":"no-store",
}});
