/**
 * /api/east-west/* — crosswalk, card, verify, packs, challenge, ledger, desks, pricing.
 */
import {
  CLOCKS,
  CROSSWALK_BODY,
  DESKS,
  freezeEastWest,
  GRAMMAR,
  OWNER_BLOCKS,
  PACK_NOT,
  PACKS,
  PRICING_DOCTRINE,
  publishedSurface,
  BUYER_SCREEN,
  LICENSE_TERMS,
  ONE_PAGERS,
  X402_FALLBACK,
  COMMERCE_FIREWALL,
} from "../../../client/src/data/eastWest";
import { publishedLedger } from "../../../client/src/lib/eastWestLedger";
import { verifyHashedEnvelope } from "../../../client/src/lib/eastWestCrypto";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export const onRequest: PagesFunction = async (ctx) => {
  const parts = (ctx.params.path as string[] | undefined) ?? [];
  const sub = parts.join("/");
  const method = ctx.request.method.toUpperCase();
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
      },
    });
  }

  const frozen = await freezeEastWest();

  if (method === "GET" && sub === "crosswalk") {
    return json({ ...frozen.crosswalk, methodologyNote: CROSSWALK_BODY.banner });
  }
  if (method === "GET" && sub === "card") return json(frozen.card);
  if (method === "GET" && sub === "vectors") return json(frozen.vectors);
  if (method === "GET" && sub === "packs") {
    return json({
      banner: CROSSWALK_BODY.banner,
      not: PACK_NOT,
      formats: PACKS,
      sample: { card: frozen.card, crosswalkHash: frozen.crosswalkHash },
    });
  }
  if (method === "GET" && sub === "desks") return json({ regulators: "free forever", desks: DESKS, clocks: CLOCKS });
  if (method === "GET" && sub === "pricing") {
    return json({ ...PRICING_DOCTRINE, scores: GRAMMAR.scores, ownerBlocks: OWNER_BLOCKS });
  }
  if (method === "GET" && sub === "ledger") return json(publishedLedger());
  if (method === "GET" && sub === "surfaces") return json(publishedSurface());
  if (method === "GET" && sub === "buyers") return json({ screen: BUYER_SCREEN, firewall: COMMERCE_FIREWALL });
  if (method === "GET" && sub === "license") return json(LICENSE_TERMS);
  if (method === "GET" && sub === "briefs") return json({ onePagers: ONE_PAGERS, note: "Samples. Not sent outreach." });
  if (method === "GET" && sub === "pay/demo") {
    return json({
      status: 402,
      rail: "x402",
      fallback: "MPP",
      ...X402_FALLBACK,
      amount: null,
      note: "OWNER-BLOCKED. No amount invented. Payment not accepted. This JSON is the honest demo.",
    }, 402);
  }


  if (method === "POST" && sub === "verify") {
    const raw = await ctx.request.json().catch(() => null);
    const verdict = await verifyHashedEnvelope(raw, { expectedCrosswalkHash: frozen.crosswalkHash });
    return json({ ...verdict, expectedCrosswalkHash: frozen.crosswalkHash });
  }
  if (method === "POST" && (sub === "packs/fetch" || sub === "challenge")) {
    return json({
      accepted: true,
      persisted: false,
      note: "Edge ledger is not bound. Mint a local receipt on the public page. Published Value Ledger count remains 0.",
      publishedCount: 0,
    });
  }

  return json({ error: "not_found", path: `/api/east-west/${sub}` }, 404);
};
