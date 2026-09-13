/**
 * GET /api/wrapper?id=<roster id> — per-request signed evidence card of ONE wrapped/bridged
 * stablecoin pair: the wrapped token's totalSupply on its chain and the canonical token's
 * balance in the bridge escrow on the origin chain, both read live from public RPC at
 * provider-reported finalized blocks, every raw result sha256'd. Sold over the existing x402
 * rail (same accepts entry / facilitator / settle path as /api/request-attestation).
 *
 *   ?preview=1   free — the unsigned state: no signature, no raw-read hashes. Verify stays free.
 *   (no header)  402 — the challenge (the amount lives ONLY here).
 *   X-PAYMENT    the signed pack: ONE card-v0 leaf (surface public.notice, kind
 *                csoai.wrapper.parity/0.1), canonical bytes ≤3072, Ed25519 under
 *                did:web:csoai.org#board-attestation-1 when the Pages key is present, else
 *                sig_ed25519:null declared in unmeasured[].
 *
 * Roster: functions/api/_wrapper_roster.ts — the same pairs scripts/readers/
 * wrapped-asset-parity-reader.mjs reads (a test pins the two rosters equal). A pair is on the
 * roster only with its wrapped contract, canonical contract and a named escrow — or a `native`
 * note saying why no escrow exists (Circle CCTP, Tether native). Native issuance is read but
 * NO parity is claimed: it is UNCHECKABLE, not "unbacked".
 *
 * States on the card: ESCROW_PARITY_READ / UNCHECKABLE_NATIVE_ISSUANCE / UNMEASURED. A read is
 * not a measurement; the card never carries MEASURED, a rate, a grade, a reserve attestation or
 * a certificate (VERDICT_RE refuses the card rather than softening it).
 *
 * Doctrine: buyer-led; the free ledger /interop/wrapped-asset-parity-*.json stays free and this
 * endpoint reads the chain like any stranger. Never paywalls /api/gspc or /root.json.
 */
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

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

export const SCHEMA = "https://councilof.ai/schema/card-v0.json";
export const KIND = "csoai.wrapper.parity/0.1";
export const ATTESTS = "point-in-time reads at the pinned blocks named below — a ratio, not a rate, not a grade, not a reserve attestation, not a certificate";

type Side = { chain: string; symbol: string; address: string };
export type RosterEntry = {
  id: string;
  wrapped: Side;
  canonical: Side;
  backing_model: "escrow" | "native";
  escrow: string | null;
  escrow_name: string | null;
  note?: string | null;
};
export const ROSTER: RosterEntry[] = WRAPPER_ROSTER as unknown as RosterEntry[];

export const CHAINS: Record<string, { rpc: string; chainId: number }> = {
  ethereum: { rpc: "https://ethereum-rpc.publicnode.com", chainId: 1 },
  base: { rpc: "https://mainnet.base.org", chainId: 8453 },
  optimism: { rpc: "https://mainnet.optimism.io", chainId: 10 },
  arbitrum: { rpc: "https://arb1.arbitrum.io/rpc", chainId: 42161 },
  polygon: { rpc: "https://polygon-bor-rpc.publicnode.com", chainId: 137 },
};
const SEL = { totalSupply: "0x18160ddd", balanceOf: "0x70a08231", decimals: "0x313ce567" };
const UA = "csoai-wrapper-parity/0.1 (+https://councilof.ai; nicholas@csoai.org)";

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

const ID_RE = /^[a-z0-9.]+:[a-z]+$/;
export const findEntry = (id: string): RosterEntry | undefined => ROSTER.find((e) => e.id === id);

async function rpc(url: string, method: string, params: unknown[]): Promise<string | Record<string, string>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": UA },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  const d = (await res.json()) as { result?: string | Record<string, string>; error?: { message?: string } };
  if (d.error) throw new Error(`RPC error: ${d.error.message || "unknown"}`);
  if (d.result === undefined || d.result === null) throw new Error("RPC empty result");
  return d.result;
}

async function pin(url: string) {
  try {
    const b = (await rpc(url, "eth_getBlockByNumber", ["finalized", false])) as Record<string, string>;
    if (b?.number && b?.hash) return { number: parseInt(b.number, 16), hex: b.number, hash: b.hash, timestamp: parseInt(b.timestamp, 16), finality: "RPC_FINALIZED_TAG_PROVIDER_REPORTED_NOT_INDEPENDENTLY_PROVEN_FINAL" };
  } catch { /* fall through */ }
  const hex = (await rpc(url, "eth_blockNumber", [])) as string;
  const b = (await rpc(url, "eth_getBlockByNumber", [hex, false])) as Record<string, string>;
  return { number: parseInt(hex, 16), hex, hash: b.hash, timestamp: parseInt(b.timestamp, 16), finality: "RPC_LATEST_NOT_INDEPENDENTLY_PROVEN_FINAL" };
}

const pad32 = (addr: string) => addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");

async function call(url: string, to: string, data: string, blockHex: string) {
  const raw = (await rpc(url, "eth_call", [{ to, data }, blockHex])) as string;
  if (!raw || raw === "0x") throw new Error(`empty eth_call result from ${to}`);
  return { raw, value: BigInt(raw), raw_sha256: await sha256Hex(new TextEncoder().encode(raw)) };
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

/** The whole payload: what was read, where, at which block, and what state that leaves the pair in. */
export async function buildPayload(entry: RosterEntry) {
  const w = CHAINS[entry.wrapped.chain];
  const c = CHAINS[entry.canonical.chain];
  const fetched_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const unmeasured: string[] = [];
  const payload: Record<string, unknown> = {
    kind: KIND,
    attests: ATTESTS,
    id: entry.id,
    backing_model: entry.backing_model,
    wrapped: { ...entry.wrapped, chainId: w.chainId, rpc: w.rpc },
    canonical: { ...entry.canonical, chainId: c.chainId, rpc: c.rpc },
    escrow: entry.escrow,
    escrow_name: entry.escrow_name,
    note: entry.note || null,
    fetched_at,
    reads: {} as Record<string, unknown>,
    state: "UNMEASURED",
  };
  const source_urls: string[] = [w.rpc];
  try {
    const wp = await pin(w.rpc);
    (payload.wrapped as Record<string, unknown>).block = wp;
    const dec = await call(w.rpc, entry.wrapped.address, SEL.decimals, wp.hex);
    const decimals = Number(dec.value);
    const ts = await call(w.rpc, entry.wrapped.address, SEL.totalSupply, wp.hex);
    (payload.reads as Record<string, unknown>).wrapped_total_supply = { query: "totalSupply()", raw_sha256: ts.raw_sha256, atomic: ts.value.toString(), normalized: normalize(ts.value, decimals), decimals };
    if (entry.backing_model === "escrow" && entry.escrow) {
      source_urls.push(c.rpc);
      const cp = await pin(c.rpc);
      (payload.canonical as Record<string, unknown>).block = cp;
      const eb = await call(c.rpc, entry.canonical.address, SEL.balanceOf + pad32(entry.escrow), cp.hex);
      (payload.reads as Record<string, unknown>).escrow_balance = { query: `balanceOf(${entry.escrow})`, raw_sha256: eb.raw_sha256, atomic: eb.value.toString(), normalized: normalize(eb.value, decimals), decimals };
      payload.escrow_over_wrapped = ratioString(eb.value, ts.value);
      payload.state = "ESCROW_PARITY_READ";
    } else {
      payload.escrow_over_wrapped = null;
      payload.state = "UNCHECKABLE_NATIVE_ISSUANCE";
      unmeasured.push("escrow_balance (natively issued on the destination chain; no escrow exists)");
    }
  } catch (e) {
    payload.state = "UNMEASURED";
    payload.error = String((e as Error).message || e);
    unmeasured.push("chain reads (rpc failed; nothing inferred)");
  }
  payload.unmeasured = unmeasured;
  const reads = payload.reads as Record<string, { raw_sha256: string }>;
  payload.inputs_sha256 = await sha256Hex(new TextEncoder().encode(Object.values(reads).map((r) => r.raw_sha256).join("\n")));
  return { payload, fetched_at, source_urls };
}

/** Strip signature + raw-read hashes for the free preview. */
export function toPreview(card: Record<string, unknown>): Record<string, unknown> {
  const c = JSON.parse(JSON.stringify(card)) as Record<string, unknown>;
  const p = c.payload as Record<string, unknown>;
  delete c.sig_ed25519; delete c.did; delete c.sha256; delete p.inputs_sha256;
  for (const r of Object.values((p.reads as Record<string, Record<string, unknown>>) || {})) delete r.raw_sha256;
  return { ...c, preview: true, preview_note: "unsigned preview — no signature, no raw-read hashes. The signed pack (same schema, sig_ed25519 + inputs_sha256 + per-read sha256) is the metered artefact." };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();
  const preview = url.searchParams.get("preview") === "1";
  const resourceUrl = `${origin}/api/wrapper?id=${encodeURIComponent(id || "<roster id>")}`;
  const known = ROSTER.map((e) => e.id);
  const bad = (reason: string, status: number) =>
    json({ schema: "csoai.wrapper-parity/0.1", error: status === 404 ? "not_found" : "bad_request", reason, known_ids: known, free_ledger: `${origin}/interop/wrapped-asset-parity-2026-09-13.json`, preview: `${origin}/api/wrapper?id=<roster id>&preview=1` }, status);

  const valid = !!(id && ID_RE.test(id));
  if (!valid && preview) return bad("pass id=<roster id> (see known_ids)", 400);
  // Unpaid bare GET stays 402 so an indexer can discover the door. A presented payment must
  // never settle until the id is a deliverable the roster carries.
  if (hasPaymentHeader(request) && !valid) return bad("pass id=<roster id> before presenting payment", 400);
  const entry = valid ? findEntry(id) : undefined;
  if (hasPaymentHeader(request) && valid && !entry) return bad(`${id} is not on the roster. No payment was taken for a 404.`, 404);

  const description = `A signed wrapped-asset parity card for ${id || "<id>"}: wrapped totalSupply on its chain and the canonical token's bridge-escrow balance on the origin chain, both at pinned finalized blocks, raw reads sha256'd. A ratio — not a rate, a grade or a reserve attestation.`;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "request_attestation", tier: "per_request", description });
  const payment = preview ? { ok: false as const, reason: "preview" } : await verifyX402Payment(request, env, resourceUrl, accepts[0]);

  if (!preview && !payment.ok) {
    return paymentRequiredResponseSigned(
      buildPaymentRequiredV2({
        resourceUrl,
        description,
        serviceName: "CSOAI Wrapped-Asset Parity",
        tags: ["stablecoin", "bridge", "wrapped", "parity", "evidence", "x402"],
        accepts,
        bazaar: declareBazaarHttpGet({
          method: "GET",
          queryParams: { id: id || "usdc.e:arbitrum" },
          queryParamsSchema: { properties: { id: { type: "string", description: "roster id <wrapped-symbol>:<chain>, e.g. usdc.e:arbitrum (free ledger lists them)" } }, required: ["id"] },
          outputExample: { schema: SCHEMA, surface: "public.notice", subject: "wrapped <SYMBOL> on <chain> vs <escrow> — ESCROW_PARITY_READ", payload: { kind: KIND, state: "ESCROW_PARITY_READ", reads: { wrapped_total_supply: {}, escrow_balance: {} }, escrow_over_wrapped: "<decimal>", inputs_sha256: "<hex>" }, sha256: "<hex>", sig_ed25519: "<hex or null>", unmeasured: [] },
        }),
        csoai: {
          schema: "csoai.wrapper-parity/0.1",
          per: "pair-request",
          lid: CSOAI_LID,
          never: ["rating", "guarantee", "verdict", "rank", "certificate", "reserve attestation"],
          deliverable: "one card-v0 leaf (public.notice / csoai.wrapper.parity/0.1), canonical ≤3072 bytes, signed when the Pages key is present",
          free_preview: `${resourceUrl}&preview=1`,
          free_ledger: `${origin}/interop/wrapped-asset-parity-2026-09-13.json`,
          rail: railMode(env),
          not_paid_reason: payment.reason,
          catalog: `${origin}/api/x402`,
        },
      }),
      env,
    );
  }

  if (!valid) return bad("pass id=<roster id> (see known_ids)", 400);
  if (!entry) return bad(`${id} is not on the roster. No payment was taken for a 404.`, 404);

  const built = await buildPayload(entry);
  const envelope = (payload: Record<string, unknown>) => ({
    schema: SCHEMA,
    surface: "public.notice",
    subject: `wrapped ${entry.wrapped.symbol} on ${entry.wrapped.chain} vs ${entry.escrow_name || "native issuance"} — ${payload.state}`,
    as_of: built.fetched_at,
    source_urls: built.source_urls,
    payload,
    tags: ["eater:wrapper-parity", "axis:distribution-integrity", `backing:${entry.backing_model}`, `state:${payload.state}`],
    unmeasured: [...(payload.unmeasured as string[])],
    did_intended: "did:web:csoai.org#board-attestation-1",
  });
  const payload = built.payload;
  const cardBase = envelope(payload);

  if (preview) {
    const sha256 = await sha256Hex(canonicalBytes(payload));
    const card = toPreview({ ...cardBase, sha256, sig_ed25519: null });
    return json({ schema: "csoai.wrapper-parity/0.1", kind: "preview", card, buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402` }, rail: railMode(env) });
  }

  let leaf;
  try {
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return json({ schema: "csoai.wrapper-parity/0.1", error: "uncheckable", reason: (e as Error).message }, 500);
  }
  const unmeasured = [...(payload.unmeasured as string[])];
  if (!leaf.sig_ed25519) unmeasured.push(/absent/.test(leaf.unsigned_reason || "") ? "sig_ed25519 (no Pages key)" : "sig_ed25519 (sign failed)");
  const { did_intended, ...base } = cardBase;
  const card: Record<string, unknown> = { ...base, ...(leaf.did ? { did: leaf.did } : { did_intended }), sha256: leaf.sha256, sig_ed25519: leaf.sig_ed25519, unmeasured, tags: [...cardBase.tags, leaf.sig_ed25519 ? "signed" : "unsigned"] };
  const bytes = canonicalBytes(card);
  const text = new TextDecoder().decode(bytes);
  if (VERDICT_RE.test(text)) return json({ schema: "csoai.wrapper-parity/0.1", error: "refused", reason: `card carries a verdict word: ${text.match(VERDICT_RE)![0]}` }, 500);
  if (bytes.byteLength > PAYLOAD_CAP_BYTES) return json({ schema: "csoai.wrapper-parity/0.1", error: "uncheckable", reason: `card ${bytes.byteLength}B > ${PAYLOAD_CAP_BYTES}B cap` }, 500);

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:issuances")) || "0") + 1;
      await env.REVENUE_KV.put("count:issuances", String(n));
    } catch { /* never blocks a paid deliverable */ }
  }

  return new Response(text, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "x-csoai-card-sha256": leaf.sha256,
      "x-csoai-signed": leaf.sig_ed25519 ? "true" : "false",
      ...(payment.ok && payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
    },
  });
};

/** Gold-402's gate POSTs {}. Query string still selects the paid tier; body is ignored. */
export const onRequestPost = onRequestGet;
