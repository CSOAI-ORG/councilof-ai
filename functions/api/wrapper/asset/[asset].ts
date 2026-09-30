/**
 * GET /api/wrapper/asset/<asset> — the per-asset wrapper doors (plan: asset_specific_x402_doors was 0).
 *
 * ONE asset (usdc, usdt, dai — registry functions/api/_wrapper_asset_doors.json), EVERY roster pair
 * whose canonical symbol it is, read live in one request by the same reader as /api/wrapper
 * (functions/api/wrapper.ts): ordered keyless RPCs, a finalized block per chain whose hash a second
 * operator confirmed, pinned ONCE per chain and shared by every pair on it.
 *
 *   ?preview=1   free — every pair's unsigned preview card and the counts by state.
 *   (no header)  the chain is read FIRST, within a READ_BUDGET_MS budget (30 Sep 2026: the cold read
 *                took ~8.3 s and agents timed out on the paid door). At least one readable pair → 402
 *                (the amount lives ONLY there). Every pair UNMEASURED → 200 PREVIEW-ONLY: nothing is
 *                offered. The states of the last completed read are kept in the edge cache for
 *                STATE_TTL_S and answer the challenge at once; a read that misses the budget finishes
 *                in the background and the challenge says PENDING_READ. Either way the PAID request
 *                reads the chain first again, so UNMEASURED is still never sent to the facilitator.
 *   X-PAYMENT    read FIRST; every pair UNMEASURED → 200 preview-only, never sent to the
 *                facilitator. Otherwise one signed card-v0 leaf per READABLE pair (each ≤3072
 *                canonical bytes, the same card /api/wrapper sells), the UNMEASURED pairs listed with
 *                their reasons and never signed, then verify + settle, then the pack.
 *
 * The resource is PATH-SCOPED (no query) so an index that lists only query-less URLs can list it.
 * Same SKU and tier as /api/wrapper: no new price is introduced here, and the amount is never typed.
 * States per pair: ESCROW_PARITY_READ / UNCHECKABLE_NATIVE_ISSUANCE / INDEXED_CUSTODIAL / UNMEASURED.
 * A read is not a measurement; never a rate, a grade, a reserve attestation or a certificate.
 */
import { headFromGet } from "../../_head";
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  hasPaymentHeader,
  type X402Env,
} from "../../_x402";
import { railMode } from "../../_x402_config";
import { sha256Hex } from "../../../_lib/cardSign";
import { wrapperAssetDescription } from "../../_x402_descriptions";
import { ROSTER, buildPayload, previewCardFor, signedCardFor, NOT_SOLD, SCHEMA, KIND, WRAPPER_LID, type PinMemo, type RosterEntry } from "../../wrapper";
import DOORS from "../../_wrapper_asset_doors.json";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };
export type AssetDoor = { asset: string; symbol: string; stablecoin_index_id: string };

export const ASSET_DOORS: AssetDoor[] = (DOORS as { doors: AssetDoor[] }).doors;
export const PACK_SCHEMA = "csoai.wrapper-asset-pack/0.1";
export const PATH_PREFIX = "/api/wrapper/asset/";

export const doorFor = (asset: string): AssetDoor | undefined => ASSET_DOORS.find((d) => d.asset === asset);
export const pairsFor = (door: AssetDoor): RosterEntry[] => ROSTER.filter((e) => e.canonical.symbol === door.symbol);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" },
  });

/** How long the unpaid challenge waits for a fresh read before answering from what it has. */
export const READ_BUDGET_MS = 1500;
/** How long the states of a completed read answer an unpaid challenge. */
export const STATE_TTL_S = 300;

type ChallengeState = { counts: Record<string, number>; all_unmeasured: boolean; read_at: string };
const stateKey = (asset: string) => new Request(`https://councilof.ai/__cache/wrapper-asset-state/${asset}`);
const edgeCache = (): Cache | null => {
  try {
    return typeof caches !== "undefined" && (caches as unknown as { default?: Cache }).default
      ? (caches as unknown as { default: Cache }).default
      : null;
  } catch {
    return null;
  }
};
async function cachedState(asset: string): Promise<ChallengeState | null> {
  const c = edgeCache();
  if (!c) return null;
  try {
    const hit = await c.match(stateKey(asset));
    return hit ? ((await hit.json()) as ChallengeState) : null;
  } catch {
    return null;
  }
}
async function storeState(asset: string, st: ChallengeState): Promise<void> {
  const c = edgeCache();
  if (!c) return;
  try {
    await c.put(stateKey(asset), new Response(JSON.stringify(st), {
      headers: { "content-type": "application/json", "cache-control": `public, max-age=${STATE_TTL_S}` },
    }));
  } catch {
    /* a cache that cannot be written only costs the next caller a read */
  }
}
const stateOf = (r: { counts: Record<string, number>; allUnmeasured: boolean }): ChallengeState => ({
  counts: r.counts,
  all_unmeasured: r.allUnmeasured,
  read_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
});

/** Read every pair of one asset; chains are pinned once and shared. */
export async function readAsset(door: AssetDoor) {
  const memo: PinMemo = new Map();
  const pairs = pairsFor(door);
  const built = await Promise.all(pairs.map(async (entry) => ({ entry, built: await buildPayload(entry, memo) })));
  const counts: Record<string, number> = {};
  for (const b of built) counts[String(b.built.payload.state)] = (counts[String(b.built.payload.state)] || 0) + 1;
  const readable = built.filter((b) => b.built.payload.state !== "UNMEASURED");
  return { built, counts, readable, allUnmeasured: readable.length === 0 };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const waitUntil = (p: Promise<unknown>) => {
    try {
      (context as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil?.(p);
    } catch {
      /* outside the Workers runtime there is nothing to extend */
    }
  };
  const url = new URL(request.url);
  const origin = url.origin;
  const asset = decodeURIComponent(url.pathname.slice(PATH_PREFIX.length)).replace(/\/+$/, "").toLowerCase();
  const door = doorFor(asset);
  if (!door) {
    return json({ schema: PACK_SCHEMA, error: "not_found", reason: `${asset || "<asset>"} has no per-asset door. No payment was requested or taken.`, known_assets: ASSET_DOORS.map((d) => d.asset), per_pair: `${origin}/api/wrapper?id=<roster id>` }, 404);
  }
  const preview = url.searchParams.get("preview") === "1";
  const paid = hasPaymentHeader(request);
  const resourceUrl = `${origin}${PATH_PREFIX}${door.asset}`;
  const description = wrapperAssetDescription(door.symbol);
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description, productId: `csoai.product.wrapper.asset.${door.asset}` });
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    outputExample: { schema: PACK_SCHEMA, asset: door.symbol, counts: { ESCROW_PARITY_READ: 1 }, cards: [{ schema: SCHEMA, surface: "public.notice", payload: { kind: KIND, state: "ESCROW_PARITY_READ" }, sha256: "<hex>", sig_ed25519: "<hex or null>" }], unmeasured_pairs: [], pack_sha256: "<hex>" },
  });
  const pairIds = pairsFor(door).map((e) => e.id);

  // Unpaid challenge fast path. The paid request (below) always reads the chain first again.
  type Read = Awaited<ReturnType<typeof readAsset>>;
  let fastState: (ChallengeState & { source: string }) | null = null;
  let readDone: Read | null = null;
  if (!paid && !preview) {
    const cached = await cachedState(door.asset);
    if (cached && !cached.all_unmeasured) {
      fastState = { ...cached, source: "edge-cache" };
    } else if (!cached) {
      const reading = readAsset(door).then(async (r) => {
        await storeState(door.asset, stateOf(r));
        return r;
      });
      const timedOut = Symbol("timeout");
      const first = await Promise.race([
        reading,
        new Promise<typeof timedOut>((res) => setTimeout(() => res(timedOut), READ_BUDGET_MS)),
      ]);
      if (first === timedOut) {
        waitUntil(reading.catch(() => undefined));
        fastState = {
          counts: { PENDING_READ: pairIds.length },
          all_unmeasured: false,
          read_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
          source: "pending",
        };
      } else {
        readDone = first;
      }
    }
  }

  const read: Read = fastState
    ? { built: [], counts: fastState.counts, readable: [], allUnmeasured: false }
    : readDone ?? (await readAsset(door));
  const { built, counts, readable, allUnmeasured } = read;
  const previews = async () => Promise.all(built.map(async (b) => previewCardFor(b.entry, b.built)));
  const unmeasuredPairs = built.filter((b) => b.built.payload.state === "UNMEASURED").map((b) => ({ id: b.entry.id, state: "UNMEASURED", reason: b.built.payload.error ?? null }));

  if (allUnmeasured) {
    return json({
      schema: PACK_SCHEMA,
      kind: "preview",
      preview_only: true,
      asset: door.symbol,
      state: "UNMEASURED",
      counts,
      pairs: pairIds,
      cards: await previews(),
      not_sold: NOT_SOLD,
      payment: { requested: false, presented: paid, sent_to_facilitator: false, settled: false },
      rail: railMode(env),
    });
  }

  if (preview) {
    return json({ schema: PACK_SCHEMA, kind: "preview", asset: door.symbol, counts, pairs: pairIds, cards: await previews(), buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402` }, rail: railMode(env) });
  }

  const challenge = (notPaidReason: string) =>
    paymentRequiredResponseSigned(
      buildPaymentRequiredV2({
        resourceUrl,
        description,
        serviceName: "SovX Wrapped-Asset Read",
        tags: ["stablecoin", "bridge", "wrapped", "parity", door.asset],
        accepts,
        bazaar,
        csoai: {
          schema: PACK_SCHEMA,
          per: "asset-request",
          lid: WRAPPER_LID,
          asset: door.symbol,
          pairs: pairIds,
          states_at_challenge: counts,
          states_source: fastState
            ? fastState.source === "pending"
              ? `PENDING_READ: the chain read did not finish within ${READ_BUDGET_MS} ms; it completes in the background. Paying reads the chain first again, and an asset whose every pair is UNMEASURED answers 200 preview-only and is never sent to the facilitator.`
              : `${fastState.source === "edge-cache" ? "edge cache" : "fresh read"}, read_at ${fastState.read_at} (kept ${STATE_TTL_S} s). Paying reads the chain first again.`
            : "fresh read",
          never: ["rating", "guarantee", "verdict", "rank", "certificate", "reserve attestation"],
          deliverable: `one signed card-v0 leaf per readable ${door.symbol} pair (the /api/wrapper card), UNMEASURED pairs listed with reasons and never signed`,
          never_charged_for: "UNMEASURED — an asset whose every pair is unreadable answers 200 preview-only, never 402",
          free_preview: `${resourceUrl}?preview=1`,
          rail: railMode(env),
          not_paid_reason: notPaidReason,
          catalog: `${origin}/api/x402`,
        },
      }),
      env,
    );

  if (!paid) return challenge((await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar })).reason);

  // Sign every readable pair BEFORE settle; any refusal means nothing is settled.
  const cards: Record<string, unknown>[] = [];
  for (const b of readable) {
    const s = await signedCardFor(b.entry, b.built, env.BOARD_SIGN_KEY_PKCS8_B64);
    if (!s.ok) return json({ schema: PACK_SCHEMA, error: s.error, reason: `${b.entry.id}: ${s.reason}`, settled: false }, 500);
    cards.push(s.card);
  }
  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });
  if (!payment.ok) return challenge(payment.reason);

  const pack_sha256 = await sha256Hex(new TextEncoder().encode(cards.map((c) => String(c.sha256)).join("\n")));
  return new Response(
    JSON.stringify({ schema: PACK_SCHEMA, asset: door.symbol, as_of: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), counts, cards, unmeasured_pairs: unmeasuredPairs, pack_sha256, pack_sha256_rule: "sha256 of the cards' sha256 values joined by \\n, in pair order" }, null, 2),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
        "x-csoai-pack-sha256": pack_sha256,
        ...(payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
      },
    },
  );
};

export const onRequestPost = onRequestGet;
export const onRequestHead = headFromGet(onRequestGet);
