// functions/api/eunomia-data.ts — Tier 3: the DATA FEED rail (SOVOS Part IX canon, R8).
//
// Serves the public evidence corpus as RAW DATA to commercial buyers (insurers, bond desks, vendors)
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
//                                             index — source bytes and digests, with signatures only
//                                             where the source publishes them.
import { headFromGet } from "./_head";
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  CSOAI_LID,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { buildFinesResponse } from "./fines";
import { readFeedSource, expectedFeedDigest, missingFeedSources, feedBlocks, makeFeedManifest, requestRecord, feedJson, EXPECTED_FEED_HEADER, type Reads } from "./_eunomia_delivery";

type Env = X402Env & { REVENUE_KV?: KVNamespace; ASSETS?: Fetcher; BOARD_SIGN_KEY_PKCS8_B64?: string };

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

const sourceFailure = (source: { ok: boolean; reason?: string }) =>
  source.reason || "Source read, JSON parsing or transport was uncheckable";

const fineSignaturePresent = (body: Record<string, unknown>): boolean => {
  const signature = body.signature;
  if (signature && typeof signature === "object" && !Array.isArray(signature)) {
    const record = signature as Record<string, unknown>;
    return record.alg === "Ed25519" && typeof record.sig === "string" && /^[a-f0-9]{128}$/.test(record.sig);
  }
  return typeof body.sig_ed25519 === "string" && /^[a-f0-9]{128}$/.test(body.sig_ed25519);
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const {request,env} = context;
  const url = new URL(request.url);
  const origin = url.origin;
  // `?x402=1` is the legacy probe flag (public/interop/x402-challenge); keep it as a synonym.
  const wantManifest = url.searchParams.get("manifest") === "1";
  let expected: string | null;
  try { expected = expectedFeedDigest(request); }
  catch { return json({schema:"csoai.eunomia-data/0.2",error:"invalid_expected_digest",settled:false},400); }
  const wantFeed = url.searchParams.get("feed") === "1" || url.searchParams.get("x402") === "1";
  const resourceUrl = new URL("/api/eunomia-data?feed=1", origin).toString();

  // Pages Functions may not self-fetch their own route through the public origin.
  // Read static evidence from the Pages asset binding, and invoke the free fines
  // function directly with the same environment. The published endpoints remain
  // independently readable; these are local transport paths, not new evidence.
  const sourceFetch = async (sourceUrl: string, init?: RequestInit): Promise<Response> => {
    if (env.ASSETS) {
      if (new URL(sourceUrl).pathname === "/api/fines") return buildFinesResponse(env);
      return env.ASSETS.fetch(new Request(sourceUrl, init));
    }
    // On the production apex the Pages ASSETS binding is not guaranteed to be present.
    // A same-origin subrequest can re-enter Functions, so read the identical public bytes
    // through the project's production Pages alias instead. Release readback compares the
    // alias and apex bytes; manifest sources retain both canonical and transport URLs.
    if (origin === "https://councilof.ai") {
      const target = new URL(sourceUrl);
      const alias = new URL(target.pathname + target.search, "https://councilof-ai.pages.dev");
      return fetch(alias.toString(), init);
    }
    return fetch(sourceUrl, init);
  };
  const [signals, fines, root, cardIndex] = await Promise.all([
    readFeedSource<{ signals?: unknown[]; schema?: string }>(`${origin}/signals/_index.json`,"signals",sourceFetch),
    readFeedSource<Record<string, unknown>>(`${origin}/api/fines`,"first_fine_watch",sourceFetch),
    readFeedSource<{ as_of?: string; card_count?: number; merkle_root?: string }>(`${origin}/root.json`,"root",sourceFetch),
    readFeedSource<{ cards?: unknown[] }>(`${origin}/signed/card_index.json`,"card_index",sourceFetch),
  ]);
  const streams = {
    signals: signals.ok ? { rows: (signals.body.signals || []).length, schema: signals.body.schema || null, href: `${origin}/signals/_index.json`, each: `${origin}/signals/<axis>.signed.json` } : { rows: null, unreadable: sourceFailure(signals) },
    first_fine_watch: fines.ok ? { signed: fineSignaturePresent(fines.body), signature_verification: "NOT_PERFORMED", kid: (fines.body.kid as string) || (fines.body.did as string) || null, href: `${origin}/api/fines` } : { signed: null, unreadable: sourceFailure(fines) },
    root: root.ok ? { as_of: root.body.as_of || null, card_count: root.body.card_count ?? null, merkle_root: root.body.merkle_root || null, href: `${origin}/root.json` } : { as_of: null, unreadable: sourceFailure(root) },
    card_index: cardIndex.ok ? { rows: (cardIndex.body.cards || []).length, href: `${origin}/signed/card_index.json` } : { rows: null, unreadable: sourceFailure(cardIndex) },
  };
  const preview = {
    lane: "commercial-data",
    data_only: true,
    streams,
    free_for: ["regulators", "the public", "anyone verifying"],
    sold: "assembly + cadence of the feed (one document with source digests and any published signatures) — never the facts, which stay free",
    never: ["scores as a product", "ranking", "rating", "certificate"],
  };

  const reads = {signals,first_fine_watch:fines,root,card_index:cardIndex} as Reads;
  const missing = missingFeedSources(reads);
  // A partial source inventory is a preview, never a paid assembled feed.
  if ((wantManifest || wantFeed) && missing.length) {
    return json({schema:"csoai.eunomia-data/0.2",kind:"feed_unavailable",state:"UNCHECKABLE",missing_sources:missing,settled:false,signing_attempted:false,free_preview:`${origin}/api/eunomia-data`},503);
  }
  const manifest = missing.length ? null : await makeFeedManifest(reads,origin);
  if (wantManifest) return feedJson(manifest,200,{"x-csoai-feed-sha256":manifest!.evidence.blocks_sha256});

  if (!wantFeed) {
    return json({ schema: "csoai.eunomia-data/0.2", kind: "preview", ...preview, delivery_manifest:manifest, buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402`, explainer: `${origin}/pricing` }, rail: railMode(env) });
  }

  const description = "An assembled JSON feed of public enforcement and measurement artefacts with source digests and any published signatures. Data only — no scores, no ranking.";
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
      tags: ["data", "feed", "enforcement", "integrity", "x402"],
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
      note: "Each block retains the source response and digest. Verify a signature only where that source publishes one. Nothing here is a score product.",
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

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);
