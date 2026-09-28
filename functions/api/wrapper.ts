/**
 * GET /api/wrapper?id=<roster id> — per-request signed evidence card of ONE wrapped/bridged
 * stablecoin pair: the wrapped token's totalSupply on its chain and the canonical token's
 * balance in the bridge escrow on the origin chain, both read live from public RPC at a
 * FINALIZED block whose hash a SECOND, different RPC operator confirmed, every raw result
 * sha256'd. Sold over the existing x402 rail (same accepts entry / facilitator / settle path as
 * /api/request-attestation).
 *
 *   ?preview=1   free — the unsigned state: no signature, no raw-read hashes. Verify stays free.
 *   (no header)  the chain is read FIRST. A readable pair answers 402 — the challenge (the amount
 *                lives ONLY there). An UNMEASURED pair answers 200 PREVIEW-ONLY: nothing is
 *                offered for sale while there is nothing to deliver.
 *   X-PAYMENT    the chain is read FIRST; an UNMEASURED read answers 200 preview-only, the payment
 *                is never sent to the facilitator and nothing settles. Otherwise the signed pack:
 *                ONE card-v0 leaf (surface public.notice, kind csoai.wrapper.parity/0.1), canonical
 *                bytes ≤3072, Ed25519 under did:web:csoai.org#board-attestation-1 when the Pages key
 *                is present, else sig_ed25519:null declared in unmeasured[].
 *
 * RPC (2026-09-28, plan item #19): every chain has an ORDERED list of keyless endpoints in
 * functions/api/_evm_rpcs.json — the same file scripts/readers/wrapped-asset-parity-reader.mjs
 * reads. Each call falls through the list on any HTTP or JSON-RPC error (rate limits included).
 * A block is pinned only when one operator reports it under the `finalized` tag AND a different
 * operator (registrable domain) returns the same hash at that height; a disagreement, or no
 * second operator answering, leaves the pair UNMEASURED. There is no `latest` fallback.
 *
 * Roster: functions/api/_wrapper_roster.ts — the same pairs scripts/readers/
 * wrapped-asset-parity-reader.mjs reads (a test pins the two rosters equal). A pair is on the
 * roster only with its wrapped contract, canonical contract and a named escrow — or a `native`
 * note saying why no escrow exists (Circle CCTP, Tether native). Native issuance is read but
 * NO parity is claimed: it is UNCHECKABLE, not "unbacked".
 *
 * States on the card: ESCROW_PARITY_READ / UNCHECKABLE_NATIVE_ISSUANCE / INDEXED_CUSTODIAL /
 * UNMEASURED. A custodial wrapper (wBTC, cbBTC, wXRP, BUIDL) has no reserve readable from an
 * EVM chain: its supply is read and it stays INDEXED — never "unbacked". A read is
 * not a measurement; the card never carries MEASURED, a rate, a grade, a reserve attestation or
 * a certificate (VERDICT_RE refuses the card rather than softening it).
 *
 * Doctrine: buyer-led; the free ledger /interop/wrapped-asset-parity-*.json stays free and this
 * endpoint reads the chain like any stranger. Never paywalls /api/gspc or /root.json. Never
 * charges for UNMEASURED.
 */
import { headFromGet } from "./_head";
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  hasPaymentHeader,
  CSOAI_LID,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { signPayload, canonicalBytes, sha256Hex, PAYLOAD_CAP_BYTES } from "../_lib/cardSign";
import { VERDICT_RE } from "./rwa/evidence";
import { WRAPPER_ROSTER } from "./_wrapper_roster";
import { WRAPPER_DESCRIPTION } from "./_x402_descriptions";
import RPC_LIST from "./_evm_rpcs.json";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

export const SCHEMA = "https://councilof.ai/schema/card-v0.json";
export const KIND = "csoai.wrapper.parity/0.1";
export const ATTESTS = "point-in-time reads at the pinned blocks named below — a ratio, not a rate, not a grade, not a reserve attestation, not a certificate";
export const FINALITY = "RPC_FINALIZED_TAG_HASH_MATCHED_BY_SECOND_OPERATOR_NOT_INDEPENDENTLY_PROVEN_FINAL";

type Side = { chain: string; symbol: string; address: string };
export type RosterEntry = {
  id: string;
  wrapped: Side;
  canonical: Side;
  backing_model: "escrow" | "native" | "custodial";
  escrow: string | null;
  escrow_name: string | null;
  note?: string | null;
};
export const ROSTER: RosterEntry[] = WRAPPER_ROSTER as unknown as RosterEntry[];

export type ChainSpec = { chainId: number; rpcs: string[]; rpc: string };
/** Ordered keyless endpoints per chain (functions/api/_evm_rpcs.json). `rpc` is the first, kept for callers that name one. */
export const CHAINS: Record<string, ChainSpec> = Object.fromEntries(
  Object.entries((RPC_LIST as { chains: Record<string, { chainId: number; rpcs: string[] }> }).chains).map(([name, c]) => [
    name,
    { chainId: c.chainId, rpcs: [...c.rpcs], rpc: c.rpcs[0] },
  ]),
);

/** The operator behind an endpoint: its registrable domain. Two URLs on one domain are ONE operator, never a second opinion. */
export const operatorOf = (url: string): string => new URL(url).hostname.split(".").slice(-2).join(".");

const SEL = { totalSupply: "0x18160ddd", balanceOf: "0x70a08231", decimals: "0x313ce567" };
const UA = "csoai-wrapper-parity/0.2 (+https://councilof.ai; nicholas@csoai.org)";
/** Per call. A hung public endpoint must not hold the answer: it falls through to the next one. */
export const RPC_TIMEOUT_MS = 4000;

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

const ID_RE = /^[a-z0-9.]+:[a-z-]+$/;
export const findEntry = (id: string): RosterEntry | undefined => ROSTER.find((e) => e.id === id);
const msg = (e: unknown) => String((e as Error)?.message || e);

async function rpc(url: string, method: string, params: unknown[]): Promise<string | Record<string, string>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": UA },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = (await res.json()) as { result?: string | Record<string, string>; error?: { message?: string } };
  if (d.error) throw new Error(`RPC error: ${d.error.message || "unknown"}`);
  if (d.result === undefined || d.result === null) throw new Error("RPC empty result");
  return d.result;
}

export type Pin = {
  number: number;
  hex: string;
  hash: string;
  timestamp: number;
  finality: string;
  /** [the operator that reported `finalized`, the different operator that returned the same hash at that height] */
  operators: [string, string];
  rpc: string;
};

class HashDisagreement extends Error {}

/**
 * Pin one chain: the first endpoint (in list order) that reports a `finalized` block, then the
 * first endpoint of a DIFFERENT operator that returns the same hash at that height. Throws — and
 * the pair goes UNMEASURED — when no operator reports a finalized block, when the second operator
 * disagrees, or when no second operator answers. Never falls back to `latest`.
 */
export async function pinChain(chain: string): Promise<Pin> {
  const spec = CHAINS[chain];
  if (!spec) throw new Error(`${chain}: no RPC list for this chain`);
  const tried: string[] = [];
  let first: { b: Record<string, string>; url: string } | null = null;
  for (const url of spec.rpcs) {
    try {
      const b = (await rpc(url, "eth_getBlockByNumber", ["finalized", false])) as Record<string, string>;
      if (!b?.number || !b?.hash) throw new Error("finalized block without number/hash");
      first = { b, url };
      break;
    } catch (e) {
      tried.push(`${operatorOf(url)}: ${msg(e)}`);
    }
  }
  if (!first) throw new Error(`${chain}: no operator reported a finalized block (${tried.join("; ")})`);
  const op1 = operatorOf(first.url);
  const height = parseInt(first.b.number, 16);
  for (const url of spec.rpcs) {
    if (operatorOf(url) === op1) continue;
    try {
      const b2 = (await rpc(url, "eth_getBlockByNumber", [first.b.number, false])) as Record<string, string>;
      if (!b2?.hash) throw new Error("block without hash");
      if (b2.hash.toLowerCase() !== first.b.hash.toLowerCase())
        throw new HashDisagreement(`${chain}: block-hash disagreement at ${height} — ${op1} ${first.b.hash}, ${operatorOf(url)} ${b2.hash}`);
      return { number: height, hex: first.b.number, hash: first.b.hash, timestamp: parseInt(first.b.timestamp, 16), finality: FINALITY, operators: [op1, operatorOf(url)], rpc: first.url };
    } catch (e) {
      if (e instanceof HashDisagreement) throw e;
      tried.push(`${operatorOf(url)} (hash check): ${msg(e)}`);
    }
  }
  throw new Error(`${chain}: no second operator confirmed the hash of finalized block ${height} (${tried.join("; ")})`);
}

const pad32 = (addr: string) => addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");

/** eth_call at the pinned height, starting with the endpoint that pinned it, falling through the list. */
async function call(chain: string, pin: Pin, to: string, data: string) {
  const order = [pin.rpc, ...CHAINS[chain].rpcs.filter((u) => u !== pin.rpc)];
  const tried: string[] = [];
  for (const url of order) {
    try {
      const raw = (await rpc(url, "eth_call", [{ to, data }, pin.hex])) as string;
      if (!raw || raw === "0x") throw new Error(`empty eth_call result from ${to}`);
      return { raw, value: BigInt(raw), raw_sha256: await sha256Hex(new TextEncoder().encode(raw)), operator: operatorOf(url), url };
    } catch (e) {
      tried.push(`${operatorOf(url)}: ${msg(e)}`);
    }
  }
  throw new Error(`${chain}: eth_call to ${to} failed on every endpoint (${tried.join("; ")})`);
}

/** BigInt ratio, six places, truncated — no float anywhere in the card. */
export function ratioString(numerator: bigint, denominator: bigint): string | null {
  if (denominator === 0n) return null;
  const scaled = (numerator * 1_000_000n) / denominator;
  return `${scaled / 1_000_000n}.${(scaled % 1_000_000n).toString().padStart(6, "0")}`;
}

export function normalize(atomic: bigint, decimals: number): string {
  const d = 10n ** BigInt(decimals);
  return decimals === 0 ? atomic.toString() : `${atomic / d}.${(atomic % d).toString().padStart(decimals, "0")}`;
}

/** One request's pins, shared by every pair it reads (the per-asset doors read several pairs per chain). */
export type PinMemo = Map<string, Promise<Pin>>;
const pinOnce = (memo: PinMemo, chain: string) => {
  let p = memo.get(chain);
  if (!p) {
    p = pinChain(chain);
    p.catch(() => undefined); // an unobserved rejection must not escape; each caller awaits and records it
    memo.set(chain, p);
  }
  return p;
};

const blockOut = (p: Pin) => ({ number: p.number, hex: p.hex, hash: p.hash, timestamp: p.timestamp, finality: p.finality, operators: p.operators });

/** The whole payload: what was read, where, at which block, and what state that leaves the pair in. */
export async function buildPayload(entry: RosterEntry, memo: PinMemo = new Map()) {
  const w = CHAINS[entry.wrapped.chain];
  const c = CHAINS[entry.canonical.chain] ?? null; // custodial rows name a ledger we cannot read from here
  const fetched_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const unmeasured: string[] = [];
  const payload: Record<string, unknown> = {
    kind: KIND,
    attests: ATTESTS,
    id: entry.id,
    backing_model: entry.backing_model,
    wrapped: { ...entry.wrapped, chainId: w.chainId, rpc: w.rpc },
    canonical: c ? { ...entry.canonical, chainId: c.chainId, rpc: c.rpc } : { ...entry.canonical, chainId: null, rpc: null },
    escrow: entry.escrow,
    escrow_name: entry.escrow_name,
    note: entry.note || null,
    fetched_at,
    reads: {} as Record<string, unknown>,
    state: "UNMEASURED",
  };
  const source_urls = new Set<string>();
  const readsEscrow = entry.backing_model === "escrow" && !!entry.escrow && !!c;
  try {
    // Both sides pin in parallel; each side's calls run in parallel once its block is pinned.
    const [wp, cp] = await Promise.all([pinOnce(memo, entry.wrapped.chain), readsEscrow ? pinOnce(memo, entry.canonical.chain) : Promise.resolve(null)]);
    (payload.wrapped as Record<string, unknown>).rpc = wp.rpc;
    (payload.wrapped as Record<string, unknown>).block = blockOut(wp);
    source_urls.add(wp.rpc);
    const [dec, ts, eb] = await Promise.all([
      call(entry.wrapped.chain, wp, entry.wrapped.address, SEL.decimals),
      call(entry.wrapped.chain, wp, entry.wrapped.address, SEL.totalSupply),
      readsEscrow && cp ? call(entry.canonical.chain, cp, entry.canonical.address, SEL.balanceOf + pad32(entry.escrow!)) : Promise.resolve(null),
    ]);
    const decimals = Number(dec.value);
    (payload.reads as Record<string, unknown>).wrapped_total_supply = { query: "totalSupply()", operator: ts.operator, raw_sha256: ts.raw_sha256, atomic: ts.value.toString(), normalized: normalize(ts.value, decimals), decimals };
    source_urls.add(ts.url);
    if (readsEscrow && cp && eb) {
      (payload.canonical as Record<string, unknown>).rpc = cp.rpc;
      (payload.canonical as Record<string, unknown>).block = blockOut(cp);
      source_urls.add(cp.rpc);
      source_urls.add(eb.url);
      (payload.reads as Record<string, unknown>).escrow_balance = { query: `balanceOf(${entry.escrow})`, operator: eb.operator, raw_sha256: eb.raw_sha256, atomic: eb.value.toString(), normalized: normalize(eb.value, decimals), decimals };
      payload.escrow_over_wrapped = ratioString(eb.value, ts.value);
      payload.state = "ESCROW_PARITY_READ";
    } else if (entry.backing_model === "native") {
      payload.escrow_over_wrapped = null;
      payload.state = "UNCHECKABLE_NATIVE_ISSUANCE";
      unmeasured.push("escrow_balance (natively issued on the destination chain; no escrow exists)");
    } else {
      payload.escrow_over_wrapped = null;
      payload.state = "INDEXED_CUSTODIAL";
      unmeasured.push("reserve (custodian-held off this chain; not readable here)");
    }
  } catch (e) {
    payload.state = "UNMEASURED";
    payload.error = msg(e);
    payload.reads = {};
    delete payload.escrow_over_wrapped;
    unmeasured.push("chain reads (rpc failed or the finalized block was not confirmed by a second operator; nothing inferred)");
  }
  payload.unmeasured = unmeasured;
  const reads = payload.reads as Record<string, { raw_sha256: string }>;
  payload.inputs_sha256 = await sha256Hex(new TextEncoder().encode(Object.values(reads).map((r) => r.raw_sha256).join("\n")));
  return { payload, fetched_at, source_urls: [...source_urls].length ? [...source_urls] : [w.rpc] };
}

/** Strip signature + raw-read hashes for the free preview. */
export function toPreview(card: Record<string, unknown>): Record<string, unknown> {
  const c = JSON.parse(JSON.stringify(card)) as Record<string, unknown>;
  const p = c.payload as Record<string, unknown>;
  delete c.sig_ed25519; delete c.did; delete c.sha256; delete p.inputs_sha256;
  for (const r of Object.values((p.reads as Record<string, Record<string, unknown>>) || {})) delete r.raw_sha256;
  return { ...c, preview: true, preview_note: "unsigned preview — no signature, no raw-read hashes. The signed pack (same schema, sig_ed25519 + inputs_sha256 + per-read sha256) is the metered artefact." };
}

/** The card-v0 envelope around one pair's payload (the per-asset doors wrap each pair the same way). */
export function envelopeFor(entry: RosterEntry, built: Awaited<ReturnType<typeof buildPayload>>) {
  const payload = built.payload;
  return {
    schema: SCHEMA,
    surface: "public.notice",
    subject: `wrapped ${entry.wrapped.symbol} on ${entry.wrapped.chain} vs ${entry.escrow_name || "native issuance"} — ${payload.state}`,
    as_of: built.fetched_at,
    source_urls: built.source_urls,
    payload,
    tags: ["eater:wrapper-parity", "axis:distribution-integrity", `backing:${entry.backing_model}`, `state:${payload.state}`],
    unmeasured: [...(payload.unmeasured as string[])],
    did_intended: "did:web:csoai.org#board-attestation-1",
  };
}

/** Sign one pair's card. Returns the card, or the reason it cannot be handed over (never settled). */
export async function signedCardFor(entry: RosterEntry, built: Awaited<ReturnType<typeof buildPayload>>, key: string | undefined) {
  const cardBase = envelopeFor(entry, built);
  let leaf;
  try {
    leaf = await signPayload(built.payload, key);
  } catch (e) {
    return { ok: false as const, error: "uncheckable", reason: msg(e) };
  }
  const unmeasured = [...(built.payload.unmeasured as string[])];
  if (!leaf.sig_ed25519) unmeasured.push(/absent/.test(leaf.unsigned_reason || "") ? "sig_ed25519 (no Pages key)" : "sig_ed25519 (sign failed)");
  const { did_intended, ...base } = cardBase;
  const card: Record<string, unknown> = { ...base, ...(leaf.did ? { did: leaf.did } : { did_intended }), sha256: leaf.sha256, sig_ed25519: leaf.sig_ed25519, unmeasured, tags: [...cardBase.tags, leaf.sig_ed25519 ? "signed" : "unsigned"] };
  const bytes = canonicalBytes(card);
  const text = new TextDecoder().decode(bytes);
  if (VERDICT_RE.test(text)) return { ok: false as const, error: "refused", reason: `card carries a verdict word: ${text.match(VERDICT_RE)![0]}` };
  if (bytes.byteLength > PAYLOAD_CAP_BYTES) return { ok: false as const, error: "uncheckable", reason: `card ${bytes.byteLength}B > ${PAYLOAD_CAP_BYTES}B cap` };
  return { ok: true as const, card, text, sha256: leaf.sha256, signed: !!leaf.sig_ed25519 };
}

export async function previewCardFor(entry: RosterEntry, built: Awaited<ReturnType<typeof buildPayload>>) {
  const sha256 = await sha256Hex(canonicalBytes(built.payload));
  return toPreview({ ...envelopeFor(entry, built), sha256, sig_ed25519: null });
}

export const NOT_SOLD =
  "Nothing is sold while the state is UNMEASURED: this answer is 200, not 402, and no payment is requested. The free preview stays free; read it again later — public RPC endpoints recover on their own.";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();
  const preview = url.searchParams.get("preview") === "1";
  const paid = hasPaymentHeader(request);
  const resourceUrl = `${origin}/api/wrapper?id=${encodeURIComponent(id || "<roster id>")}`;
  const known = ROSTER.map((e) => e.id);
  const bad = (reason: string, status: number) =>
    json({ schema: "csoai.wrapper-parity/0.1", error: status === 404 ? "not_found" : "bad_request", reason, known_ids: known, free_ledger: `${origin}/interop/wrapped-asset-parity-2026-09-13.json`, preview: `${origin}/api/wrapper?id=<roster id>&preview=1`, per_asset: `${origin}/api/wrapper/asset/<asset>` }, status);

  const description = WRAPPER_DESCRIPTION;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
  // Computed once, used twice: the 402 advertises this block and the paid path echoes the SAME
  // object into the PaymentPayload sent to the facilitator (specs/extensions/bazaar.md, Client
  // Behavior) — that echo is what gets a resource catalogued.
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    queryParams: { id: id || "usdc.e:arbitrum" },
    queryParamsSchema: { properties: { id: { type: "string", description: "roster id <wrapped-symbol>:<chain>, e.g. usdc.e:arbitrum (free ledger lists them)" } }, required: ["id"] },
    outputExample: { schema: SCHEMA, surface: "public.notice", subject: "wrapped <SYMBOL> on <chain> vs <escrow> — ESCROW_PARITY_READ", payload: { kind: KIND, state: "ESCROW_PARITY_READ", reads: { wrapped_total_supply: {}, escrow_balance: {} }, escrow_over_wrapped: "<decimal>", inputs_sha256: "<hex>" }, sha256: "<hex>", sig_ed25519: "<hex or null>", unmeasured: [] },
  });
  const challenge = (notPaidReason: string, extra: { error?: string; csoai?: Record<string, unknown> } = {}) => {
    const pr = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Wrapped-Asset Parity",
      tags: ["stablecoin", "bridge", "wrapped", "parity", "evidence", "x402"],
      accepts,
      bazaar,
      csoai: {
        schema: "csoai.wrapper-parity/0.1",
        per: "pair-request",
        lid: CSOAI_LID,
        never: ["rating", "guarantee", "verdict", "rank", "certificate", "reserve attestation"],
        deliverable: "one card-v0 leaf (public.notice / csoai.wrapper.parity/0.1), canonical ≤3072 bytes, signed when the Pages key is present",
        free_preview: `${resourceUrl}&preview=1`,
        free_ledger: `${origin}/interop/wrapped-asset-parity-2026-09-13.json`,
        rail: railMode(env),
        not_paid_reason: notPaidReason,
        never_charged_for: "UNMEASURED — an unreadable pair answers 200 preview-only, never 402",
        catalog: `${origin}/api/x402`,
        ...(extra.csoai || {}),
      },
    });
    return paymentRequiredResponseSigned(extra.error ? { ...pr, error: extra.error } : pr, env);
  };

  // No id at all: the abstract door. Nothing is read, so the unpaid answer is the discovery 402
  // (an indexer needs a payable resource to list); a preview or a payment needs a pair first.
  if (!id) {
    if (preview || paid) return bad("pass id=<roster id> (see known_ids)", 400);
    return challenge((await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar })).reason);
  }
  if (!ID_RE.test(id)) return bad(paid ? "pass id=<roster id> before presenting payment" : "pass id=<roster id> (see known_ids)", 400);
  const entry = findEntry(id);
  // A pair the roster does not carry is not for sale: 404, paid or not, and nothing is taken.
  if (!entry) return bad(`${id} is not on the roster. No payment was requested or taken.`, 404);

  // READ BEFORE ANY OFFER, AND BEFORE ANY SETTLE. The chain reads, the signature and every refusal
  // check run before a 402 is issued or the facilitator is asked to move money.
  const built = await buildPayload(entry);
  const payload = built.payload;

  if (payload.state === "UNMEASURED") {
    return json({
      schema: "csoai.wrapper-parity/0.1",
      kind: "preview",
      preview_only: true,
      id,
      state: "UNMEASURED",
      reason: payload.error ?? null,
      card: await previewCardFor(entry, built),
      not_sold: NOT_SOLD,
      payment: { requested: false, presented: paid, sent_to_facilitator: false, settled: false },
      rail: railMode(env),
    });
  }

  if (preview) {
    return json({ schema: "csoai.wrapper-parity/0.1", kind: "preview", id, state: payload.state, card: await previewCardFor(entry, built), buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402` }, rail: railMode(env) });
  }

  if (!paid) {
    return challenge((await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar })).reason, {
      csoai: { state_at_challenge: payload.state, read_at: built.fetched_at },
    });
  }

  const signed = await signedCardFor(entry, built, env.BOARD_SIGN_KEY_PKCS8_B64);
  if (!signed.ok) return json({ schema: "csoai.wrapper-parity/0.1", error: signed.error, reason: signed.reason, settled: false }, 500);

  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });
  if (!payment.ok) return challenge(payment.reason, { csoai: { state_at_challenge: payload.state, read_at: built.fetched_at } });

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:issuances")) || "0") + 1;
      await env.REVENUE_KV.put("count:issuances", String(n));
    } catch { /* never blocks a paid deliverable */ }
  }

  return new Response(signed.text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "x-csoai-card-sha256": signed.sha256,
      "x-csoai-signed": signed.signed ? "true" : "false",
      ...(payment.ok && payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
    },
  });
};

/** Gold-402's gate POSTs {}. Query string still selects the paid tier; body is ignored. */
export const onRequestPost = onRequestGet;

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);
