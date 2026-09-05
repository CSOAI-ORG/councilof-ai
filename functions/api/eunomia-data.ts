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
//   paid   + settled X-PAYMENT              → one assembled feed document: the signals index,
//                                             signed First-Fine Watch feed, root, and card index.
//                                             Each block preserves its published verification state;
//                                             unsigned indexes are never described as signed.
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponse,
  CSOAI_LID,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";

type Env = X402Env & { REVENUE_KV?: KVNamespace };

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

async function getJson<T>(u: string): Promise<{ ok: true; body: T } | { ok: false; reason: string }> {
  try {
    const r = await fetch(u);
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    return { ok: true, body: (await r.json()) as T };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

const hasPublishedSignature = (body: Record<string, unknown>): boolean =>
  Boolean(body.signature || body.sig_ed25519);

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  // `?x402=1` is the legacy probe flag (public/interop/x402-challenge); keep it as a synonym.
  const wantFeed = url.searchParams.get("feed") === "1" || url.searchParams.get("x402") === "1";
  const resourceUrl = new URL("/api/eunomia-data?feed=1", origin).toString();

  // The streams — read, never typed. A stream that cannot be read says so; it is never a 0.
  const [signals, fines, root, cardIndex] = await Promise.all([
    getJson<Record<string, unknown> & { signals?: unknown[]; schema?: string }>(`${origin}/signals/_index.json`),
    getJson<Record<string, unknown>>(`${origin}/api/fines`),
    getJson<Record<string, unknown> & { as_of?: string; card_count?: number; merkle_root?: string }>(`${origin}/root.json`),
    getJson<Record<string, unknown> & { cards?: unknown[] }>(`${origin}/signed/card_index.json`),
  ]);
  const streams = {
    signals: signals.ok ? { rows: (signals.body.signals || []).length, schema: signals.body.schema || null, top_level_signed: hasPublishedSignature(signals.body), href: `${origin}/signals/_index.json`, each: `${origin}/signals/<axis>.signed.json` } : { rows: null, unreadable: signals.reason },
    first_fine_watch: fines.ok ? { top_level_signed: hasPublishedSignature(fines.body), kid: (fines.body.kid as string) || (fines.body.did as string) || null, href: `${origin}/api/fines` } : { top_level_signed: null, unreadable: fines.reason },
    root: root.ok ? { as_of: root.body.as_of || null, card_count: root.body.card_count ?? null, merkle_root: root.body.merkle_root || null, top_level_signed: hasPublishedSignature(root.body), href: `${origin}/root.json` } : { as_of: null, unreadable: root.reason },
    card_index: cardIndex.ok ? { rows: (cardIndex.body.cards || []).length, top_level_signed: hasPublishedSignature(cardIndex.body), href: `${origin}/signed/card_index.json` } : { rows: null, unreadable: cardIndex.reason },
  };
  const preview = {
    lane: "commercial-data",
    data_only: true,
    streams,
    free_for: ["regulators", "the public", "anyone verifying"],
    sold: "assembly + cadence of the feed (one document preserving each block's published verification state) — never the facts, which stay free",
    never: ["scores as a product", "ranking", "rating", "certificate"],
  };

  if (!wantFeed) {
    return json({ schema: "csoai.eunomia-data/0.2", kind: "preview", ...preview, buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402`, explainer: `${origin}/pricing-free` }, rail: railMode(env) });
  }

  const description = "Enforcement + measurement evidence feed, assembled (DATA only — never scores, never ranked). Signed and unsigned states remain explicit. Measurement, not certification. " + CSOAI_LID + ".";
  const accepts = x402Accepts(env, resourceUrl, { skuId: "issuance", tier: "reserve", description });
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  if (!payment.ok) {
    const paymentRequired = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Data Feed",
      tags: ["data", "feed", "enforcement", "evidence", "x402"],
      accepts,
      bazaar: declareBazaarHttpGet({
        method: "GET",
        queryParams: { feed: "1" },
        queryParamsSchema: { properties: { feed: { type: "string", const: "1" } }, required: ["feed"] },
        outputExample: { schema: "csoai.eunomia-data/0.2", kind: "feed", blocks: { signals: {}, first_fine_watch: {}, root: {}, card_index: {} } },
      }),
      csoai: { schema: "csoai.eunomia-data/0.2", per: "feed-pull", lid: CSOAI_LID, ...preview, rail: railMode(env), not_paid_reason: payment.reason, catalog: `${origin}/api/x402` },
    });
    return paymentRequiredResponse(paymentRequired);
  }

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:feed_pulls")) || "0") + 1;
      await env.REVENUE_KV.put("count:feed_pulls", String(n));
    } catch {
      /* never blocks a paid deliverable */
    }
  }

  return json(
    {
      schema: "csoai.eunomia-data/0.2",
      kind: "feed",
      lane: "commercial-data",
      data_only: true,
      note: "Each block preserves its published bytes and verification state. Verify signed material offline; unsigned indexes remain explicitly unsigned. Nothing here is a score product.",
      verification: streams,
      blocks: {
        signals: signals.ok ? signals.body : { unreadable: signals.reason },
        first_fine_watch: fines.ok ? fines.body : { unreadable: fines.reason },
        root: root.ok ? root.body : { unreadable: root.reason },
        card_index: cardIndex.ok ? cardIndex.body : { unreadable: cardIndex.reason },
      },
      settle: payment.settlement || null,
      verify: `${origin}/gspc-verify`,
    },
    200,
    payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
  );
};
