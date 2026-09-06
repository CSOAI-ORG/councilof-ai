// functions/api/_x402.ts — FAIL-CLOSED x402 receipt verification, shared by every metered
// endpoint (currently /api/proof?bundle=1, /api/request-attestation, and /api/eunomia-data).
//
// WHY THIS EXISTS: both metered endpoints shipped the same money-integrity bug —
//   const paid = request.headers.get("x-payment") != null;
// which treated the mere PRESENCE of an x-payment header (even "x-payment: test") as proof of
// payment and handed over the paid artefact for free. Header presence is not settlement. This
// module is the one place that decides "is this request actually paid?", so the two endpoints
// cannot drift apart and neither can regress to header-presence.
//
// WHAT "verified" MEANS: the X-PAYMENT header must decode to a structured x402 payment payload
// AND a configured x402 facilitator must return isValid over that payload against the payment
// requirements for the resource. If no facilitator is provisioned, the receipt cannot be
// confirmed settled, so verification FAILS CLOSED: the caller returns 402 and never grants on
// header presence.
//
// This paragraph used to read "the estate's x402 rail is still `mode: \"mock\"` per
// /.well-known/x402.json — there is no live settle path yet". Checked on the apex 2026-09-04:
// that door reports `mode: "live"` and has done since the facilitator was provisioned. A stale
// comment about a money rail is worse than none — a reader trusting it would conclude no
// settlement path exists and stop looking for the reason payments were failing, which is close
// to what happened. Mode is DERIVED from env by railMode(); read that, never a comment.
//
// SETTLEMENT (2026-09-02): `/verify` only proves the client's EIP-3009 authorization is well
// formed and funded — it moves NO money. The facilitator's `/settle` is what submits the
// transfer on-chain. Granting on /verify alone would hand out paid artefacts for free, so this
// module calls /verify THEN /settle and reports ok only when settle succeeds. The X-PAYMENT-
// RESPONSE echo is built from the settle result (tx hash, network, payer) — never fabricated.
//
// Owner switch: `X402_FACILITATOR_URL` (Cloudflare Pages env). payTo comes from _x402_config.ts
// (estate default, env-overridable). Until the facilitator is set, verification returns
// { ok:false } by design — the honest state of a rail that has not been switched on.

import { SKUS, USDC_BASE, usdToAtomic, resolvePriceUsd } from "./_skus";
import {
  ESTATE_PAY_TO,
  resolvePayTo,
  facilitatorUrl,
  USDC_BASE_EIP712,
  NETWORK_SLUG_BASE,
  NETWORK_CAIP2_BASE,
  toCaip2Network,
  toLegacyNetwork,
} from "./_x402_config";
import { maybeMintCdpJwt, type CdpEnv } from "./_cdp_jwt";
import { facilitatorDialect, toDialectPayload } from "./_x402_negotiate";
import { attachOffers } from "./_x402_offer";
import { buildReceiptRecord, receiptExtension, receiptPayload, signReceipt, storeReceipt } from "./_x402_receipt";

// Re-exported so existing importers (and tests) keep their entry point after the converters moved
// to _x402_config.ts to break an import cycle with _x402_negotiate.ts.
export { toCaip2Network, toLegacyNetwork };

// CdpEnv carries CDP_API_KEY_ID/SECRET — declared once in _cdp_jwt.ts so the credential shape
// cannot drift between the minter and its caller.
export type X402Env = CdpEnv & {
  // Optional settlement ledger (same binding /api/revenue reads). Absent ⇒ nothing is recorded and
  // /api/revenue stays honestly null. Present ⇒ every facilitator-CONFIRMED settle writes one
  // record and moves the non-self tally. Recording never gates the grant.
  REVENUE_KV?: KVNamespace;
  // Comma-separated wallets the estate controls (besides payTo). A settlement whose payer is one
  // of these is SELF: recorded, but never counted as revenue or as a buyer.
  X402_SELF_WALLETS?: string;
  // The x402 facilitator that verifies (and settles) a receipt. Absent → metered endpoints
  // stay 402: an unverified receipt is never accepted.
  X402_FACILITATOR_URL?: string;
  X402_ASSET?: string; // ERC-20 asset contract the receipt must pay (e.g. USDC on base)
  X402_NETWORK?: string; // e.g. "base"
  X402_PAY_TO?: string; // overrides the estate default in _x402_config.ts
  X402_AMOUNT?: string; // atomic units required (string, as x402 encodes it)
  // The ONE signing secret the edge holds: PKCS8 Ed25519 for did:web:csoai.org#board-attestation-1
  // ("born and held in Cloudflare; the private half never leaves" — did.json). It signs the
  // offer-receipt extension's offers and receipts. Absent ⇒ 402s and 200s are unsigned and SAY SO
  // on the `csoai.offer_receipt` sidecar; nothing is ever fabricated in its place.
  BOARD_SIGN_KEY_PKCS8_B64?: string;
  // Per-SKU price overrides (strings, as Cloudflare passes them) are read via _skus.ts.
  [k: string]: string | undefined;
};

/**
 * readBazaarOutcome — decode the facilitator's EXTENSION-RESPONSES sidechannel and report what
 * it said about Bazaar indexing, or that it said nothing.
 *
 * The header is base64 JSON keyed by extension name (specs/extensions/bazaar.md). Three honest
 * outcomes and no fourth: what the facilitator reported, "the facilitator reported nothing", or
 * "it reported something we could not read". Absence is never read as success — that is the
 * whole reason this is a function and not an optimistic boolean.
 */
export function readBazaarOutcome(header: string | null): {
  status: "REPORTED" | "UNREPORTED" | "UNREADABLE";
  detail: unknown;
  note: string;
} {
  if (!header) {
    return {
      status: "UNREPORTED",
      detail: null,
      note:
        "the facilitator returned no EXTENSION-RESPONSES header. Reporting it is optional in the " +
        "spec and x402#2112 records a facilitator that never emits it, so this means the outcome " +
        "is unknown — NOT that the resource was indexed. Check the Bazaar list/search endpoint " +
        "for our payTo before claiming discoverability.",
    };
  }
  try {
    const parsed = JSON.parse(atob(header)) as Record<string, unknown>;
    const bazaar = parsed?.bazaar ?? null;
    return {
      status: bazaar ? "REPORTED" : "UNREPORTED",
      detail: bazaar,
      note: bazaar
        ? "the facilitator reported a bazaar outcome; this is its claim, verified by nothing here"
        : "the sidechannel decoded but carried no bazaar key — the extension was not processed",
    };
  } catch {
    return {
      status: "UNREADABLE",
      detail: null,
      note: "EXTENSION-RESPONSES was present but did not decode as base64 JSON",
    };
  }
}

export type X402Result = {
  ok: boolean;
  reason: string;
  // Present only when a facilitator confirmed settlement — the value to echo back in the
  // X-PAYMENT-RESPONSE header per the x402 spec. Never fabricated; absent when fail-closed.
  paymentResponse?: string;
  // Settlement facts as the facilitator reported them (never invented). Absent when not paid.
  settlement?: {
    transaction: string | null;
    network: string | null;
    payer: string | null;
    // What the facilitator said about Bazaar indexing, or that it said nothing. Never inferred.
    bazaar?: { status: "REPORTED" | "UNREPORTED" | "UNREADABLE"; detail: unknown; note: string };
  };
  /**
   * The x402 offer-receipt extension's signed receipt (§5), present only when the facilitator
   * CONFIRMED a settle and the edge held the signing key. It is already inside `paymentResponse`;
   * it is surfaced here too so a door can put it in its own JSON body without re-signing, and so
   * an operator can tell "settled but unsigned" (key absent) from "not settled".
   */
  receipt?: { format: "jws"; signature: string };
  /** Why there is no receipt on an otherwise successful settle. Absent when there is one. */
  receiptGap?: string;
};

/** One entry of the canonical x402 `accepts` array (the `exact`/EIP-3009 scheme on Base). */
export type X402Accept = {
  scheme: "exact";
  network: string;
  maxAmountRequired: string; // atomic units, decimal string (v1 + dual)
  amount?: string; // atomic units — required by x402 v2 / CDP Bazaar validate
  asset: string;
  payTo: string | null; // estate default from _x402_config.ts, env X402_PAY_TO overrides; null only if malformed
  resource?: string; // v1 clients; v2 moves this to top-level resource.url
  description?: string; // v1; v2 prefers resource.description
  mimeType?: string;
  maxTimeoutSeconds: number;
  // EIP-712 domain of the token (name/version) — what the client signs under. decimals/symbol are informational.
  extra: { name: string; version: string; decimals?: number; symbol?: string };
};

/**
 * x402Accepts — build the standard `accepts` challenge array for a metered resource, so any
 * off-the-shelf x402 client (@x402/fetch, the manifest's advertised agent paths) can pay with
 * no bespoke glue. The amount is the SKU price (an ESTIMATE, owner-overridable via env) converted
 * to atomic units; asset/network default to USDC-on-Base but are env-overridable.
 *
 * OWNER-PROVISIONED, NOT INVENTED: `payTo` comes ONLY from env.X402_PAY_TO. No address is
 * hardcoded — the estate receiving address is an owner decision (EXEC-A §2 step 5). Until it is
 * set, `payTo` is null: the challenge is well-formed and advertises the price, but a client has
 * no address to pay, which is the honest state of a rail whose money destination is unprovisioned.
 * Likewise the facilitator URL (env.X402_FACILITATOR_URL, consumed in verifyX402Payment) is never
 * hardcoded — see the TODO(x402 live) at the top of this file.
 */
export function x402Accepts(
  env: X402Env,
  resourceUrl: string,
  opts: { skuId: string; tier: string; description?: string },
): X402Accept[] {
  const sku = SKUS[opts.skuId];
  // Prefer an explicit atomic override (X402_AMOUNT) if the owner set one; else derive the
  // atomic amount from the SKU's (env-overridable) USD price. Never free: a missing price throws.
  const atomic =
    env.X402_AMOUNT && env.X402_AMOUNT !== ""
      ? env.X402_AMOUNT
      : usdToAtomic(resolvePriceUsd(opts.skuId, opts.tier, env));
  const networkRaw = env.X402_NETWORK || USDC_BASE.network;
  const description =
    opts.description ||
    `${sku ? sku.name : opts.skuId} — ${sku ? sku.artifact : "metered artifact"} (ESTIMATE price; owner-overridable).`;
  return [
    {
      scheme: "exact",
      network: toCaip2Network(networkRaw),
      maxAmountRequired: atomic,
      amount: atomic,
      asset: env.X402_ASSET || USDC_BASE.asset,
      payTo: resolvePayTo(env),
      resource: resourceUrl,
      description,
      mimeType: "application/json",
      maxTimeoutSeconds: 300,
      extra: {
        name: USDC_BASE_EIP712.name,
        version: USDC_BASE_EIP712.version,
        decimals: USDC_BASE.decimals,
        symbol: USDC_BASE.symbol,
      },
    },
  ];
}

/** The v1-shaped paymentRequirements a v1 facilitator/client expects for one accepts entry. */
export function toV1Requirements(a: X402Accept): Record<string, unknown> {
  return {
    scheme: a.scheme,
    network: toLegacyNetwork(a.network),
    maxAmountRequired: a.maxAmountRequired,
    resource: a.resource,
    description: a.description || "",
    mimeType: a.mimeType || "application/json",
    payTo: a.payTo,
    maxTimeoutSeconds: a.maxTimeoutSeconds,
    asset: a.asset,
    extra: { name: a.extra.name, version: a.extra.version },
  };
}

/** The v2-shaped paymentRequirements (CAIP-2 network, `amount`). */
export function toV2Requirements(a: X402Accept): Record<string, unknown> {
  return {
    scheme: a.scheme,
    network: toCaip2Network(a.network),
    amount: a.amount || a.maxAmountRequired,
    asset: a.asset,
    payTo: a.payTo,
    maxTimeoutSeconds: a.maxTimeoutSeconds,
    extra: { name: a.extra.name, version: a.extra.version },
  };
}

/** Wallets whose payments are the estate paying itself: payTo plus X402_SELF_WALLETS. Lowercased. */
export function selfWallets(env: Pick<X402Env, "X402_PAY_TO" | "X402_SELF_WALLETS">): Set<string> {
  const out = new Set<string>();
  const pt = resolvePayTo(env);
  if (pt) out.add(pt.toLowerCase());
  out.add(ESTATE_PAY_TO.toLowerCase());
  for (const w of (env.X402_SELF_WALLETS || "").split(","))
    if (/^0x[0-9a-fA-F]{40}$/.test(w.trim())) out.add(w.trim().toLowerCase());
  return out;
}

export type SettlementRecord = {
  schema: "csoai.x402.settlement/0.1";
  transaction: string | null;
  network: string | null;
  payer: string | null;
  self: boolean; // payer ∈ selfWallets(env) — the estate paying itself
  /**
   * A SETTLEMENT OF ZERO IS NOT A PURCHASE, and the distinct-payer count must not treat it as
   * one. `self` cannot carry this: it tests membership of X402_SELF_WALLETS, and a seed or a
   * probe signs from an EPHEMERAL key that no list can ever enumerate. Measured 2026-09-05 —
   * one zero-value settle through /api/free-door from a throwaway wallet moved
   * /api/revenue one_number.all_time from 0 to 1, i.e. a wallet we created and controlled,
   * paying nothing, was counted as a distinct non-self BUYER. That contradicts the number's own
   * definition ("A wallet we control paying us is recorded but is neither revenue nor a buyer")
   * and would trip its own gate, "≥1 repeat: open the next door", on our own test traffic.
   *
   * Amount is the only test that holds for a wallet nobody can list in advance.
   */
  zero_value: boolean;
  resource: string;
  amount_atomic: string | null; // what the 402 asked for; the facilitator does not echo the amount
  settled_at: string;
};

/**
 * recordSettlement — THE ONE NUMBER's source. Every outside read of this estate on 2026-09-05
 * said the same thing: the only figure that decides the next move is "distinct non-self wallets
 * that paid", and nothing here was writing it down. /api/revenue read a KV tally that no code
 * path ever incremented, so it reported null forever, while the rail was live and settling.
 *
 * Writes (only when REVENUE_KV is bound):
 *   settled:tx:<transaction|unknown:<ts>>  → one SettlementRecord (append-only, never overwritten)
 *   settled:usdc_atomic                     → non-self USDC atomic total (what /api/revenue shows)
 *   settled:self_usdc_atomic                → the estate paying itself, kept apart, never revenue
 * The tally is read-add-put, which can under-count under concurrent settles; the records are the
 * truth and /api/revenue derives the distinct-payer count from them, not from the tally.
 * Never throws and never affects the grant: a lost record is a gap to notice, not a reason to
 * refuse a paid artefact.
 */
export type RecordOutcome =
  | { stored: true; record: SettlementRecord }
  | { stored: false; reason: string; record: SettlementRecord | null };

export async function recordSettlement(
  env: X402Env,
  rec: Omit<SettlementRecord, "schema" | "self" | "zero_value" | "settled_at">,
): Promise<RecordOutcome> {
  const kv = env.REVENUE_KV;
  if (!kv) return { stored: false, reason: "no REVENUE_KV bound", record: null };
  const self = !!rec.payer && selfWallets(env).has(rec.payer.toLowerCase());
  const zero_value = !rec.amount_atomic || !/^[1-9]\d*$/.test(rec.amount_atomic);
  const record: SettlementRecord = {
    schema: "csoai.x402.settlement/0.1",
    ...rec,
    self,
    zero_value,
    settled_at: new Date().toISOString(),
  };
  try {
    const key = `settled:tx:${record.transaction || `unknown:${Date.now()}`}`;
    if ((await kv.get(key)) == null) await kv.put(key, JSON.stringify(record));
    const amt = record.amount_atomic && /^\d+$/.test(record.amount_atomic) ? BigInt(record.amount_atomic) : 0n;
    if (amt > 0n) {
      const tallyKey = self ? "settled:self_usdc_atomic" : "settled:usdc_atomic";
      const prev = await kv.get(tallyKey);
      const base = prev && /^\d+$/.test(prev) ? BigInt(prev) : 0n;
      await kv.put(tallyKey, (base + amt).toString());
    }
    return { stored: true, record };
  } catch (e) {
    // RECORDING IS OBSERVATION, NOT GATING — the grant above still stands, and the payer is told
    // nothing. But the previous version swallowed the error into an empty catch and returned the
    // record anyway, which made a failed write indistinguishable from no settlement at all:
    // /api/revenue would report `settlements: 0, status: MEASURED` whether nothing had settled or
    // every single write had failed. Measured on 2026-09-05: a confirmed settle through
    // /api/free-door (facilitator tx 0xb7ec8a79…, payer 0x620e8d6c…) left settlements at 0 with
    // records_unreadable 0 and kv_bound true — a real payment that the one number never saw.
    // The outcome is returned now so a caller can surface the gap instead of inferring silence.
    return { stored: false, reason: `kv write failed: ${(e as Error).message}`, record };
  }
}

/**
 * verifyX402Payment — returns { ok:true } ONLY for a facilitator-verified AND settled receipt.
 * Never grants on header presence, structure, or /verify alone.
 *
 * `accept` is the SAME challenge entry the 402 advertised (from x402Accepts), so the
 * requirements sent to the facilitator match what the client signed against — the previous
 * version rebuilt them from bare env vars (asset:null, amount:null when unset) and would have
 * rejected every honest receipt.
 */
export async function verifyX402Payment(
  request: Request,
  env: X402Env,
  resourceUrl: string,
  accept?: X402Accept,
  opts?: { allowZeroAmount?: boolean },
): Promise<X402Result> {
  const header = request.headers.get("x-payment") || request.headers.get("payment-signature");
  if (!header) return { ok: false, reason: "no x-payment header" };

  // Decode the X-PAYMENT header (x402 sends it base64-encoded JSON). A header that does not
  // decode to a structured payload is not a receipt — reject it rather than trust its presence.
  let payload: { x402Version?: number; scheme?: string; network?: string } & Record<string, unknown>;
  try {
    let text = header.trim();
    if (!text.startsWith("{")) text = atob(text);
    payload = JSON.parse(text);
  } catch {
    return { ok: false, reason: "x-payment header is not a decodable x402 payload" };
  }
  if (!payload || typeof payload !== "object") {
    return { ok: false, reason: "x-payment payload is not an object" };
  }

  // Real settlement requires a facilitator. None provisioned ⇒ we cannot settle ⇒ fail closed.
  const facilitator = facilitatorUrl(env);
  if (!facilitator) {
    return {
      ok: false,
      reason:
        "x402 settlement is not provisioned (no X402_FACILITATOR_URL). The receipt cannot be " +
        "settled, so the paid resource is not granted. This is fail-closed by design.",
    };
  }

  const entry =
    accept ||
    ({
      scheme: "exact",
      network: toCaip2Network(env.X402_NETWORK || USDC_BASE.network),
      maxAmountRequired: env.X402_AMOUNT || "0",
      amount: env.X402_AMOUNT || "0",
      asset: env.X402_ASSET || USDC_BASE.asset,
      payTo: resolvePayTo(env),
      resource: resourceUrl,
      mimeType: "application/json",
      maxTimeoutSeconds: 300,
      extra: { name: USDC_BASE_EIP712.name, version: USDC_BASE_EIP712.version },
    } as X402Accept);
  if (!entry.payTo) return { ok: false, reason: "no payTo configured — refusing to settle to nowhere" };
  // ZERO MEANS "UNCONFIGURED" UNLESS THE CALLER SAYS IT MEANT ZERO. The default a few lines
  // above is `env.X402_AMOUNT || "0"`, so a paid door whose amount env var is missing arrives
  // here advertising 0 — settling that would hand over a paid artefact for nothing. The guard
  // must stay for exactly that case.
  //
  // But /api/free-door's true price IS zero, and this guard made it unable to ever fulfil:
  // it advertised 0, tripped the "unconfigured" branch, and answered 402 to a caller who had
  // correctly settled. Found 2026-09-05 by paying the live door end to end. It was invisible
  // to the fulfilment test because that test mocked verifyX402Payment — it stubbed out the one
  // function that was refusing.
  //
  // So zero is admissible only when the CALLER declares it, never by inference from the value.
  if (entry.maxAmountRequired === "0" && !opts?.allowZeroAmount) {
    return { ok: false, reason: "no amount configured for this resource" };
  }

  // Auth is per-endpoint, not per-session: CDP binds each JWT to the exact method+host+path via
  // its `uri` claim, so /supported, /verify and /settle each need their own bearer. A non-CDP
  // facilitator falls back to the static token (or to no auth, as the public facilitators want).
  const headersFor = async (suffix: string, method = "POST"): Promise<Record<string, string>> => {
    const h: Record<string, string> = { "content-type": "application/json" };
    const path = `${new URL(facilitator).pathname.replace(/\/$/, "")}${suffix}`;
    const jwt = await maybeMintCdpJwt(env, facilitator, method, path);
    if (jwt) h.authorization = `Bearer ${jwt}`;
    else if (env.X402_FACILITATOR_TOKEN) h.authorization = `Bearer ${env.X402_FACILITATOR_TOKEN}`;
    return h;
  };

  // Speak the FACILITATOR's dialect, not the client's. Facilitators differ: PayAI serves Base
  // mainnet in v1 only, while our own challenge advertises v2 — so mirroring the client would send
  // v2 requirements to a v1 facilitator and fail AFTER the buyer signed. Ask /supported instead.
  // A facilitator that cannot serve our chain at all is a configuration error we report as such,
  // rather than attempting a settlement that cannot succeed.
  const clientVersion: 1 | 2 = payload.x402Version === 2 ? 2 : 1;
  const neg = await facilitatorDialect(
    facilitator,
    entry.network,
    await headersFor("/supported", "GET"),
  );
  if (neg.version === null && neg.reason.includes("no exact scheme")) {
    return {
      ok: false,
      reason: `facilitator does not serve ${entry.network} with the exact scheme (${neg.reason}) — refusing to attempt a settlement that cannot succeed`,
    };
  }
  // Try every dialect the facilitator advertises, best-evidenced first, and keep the one whose
  // /verify it actually accepts. `/verify` moves no money, so a rejected SHAPE costs a round trip
  // and nothing else — whereas failing on the first attempt is how a live rail silently stopped
  // earning: PayAI added a v2 kind for Base, the old "highest version wins" rule switched to it,
  // and every real payment came back `facilitator /verify HTTP 400` after the buyer had signed.
  const candidates: (1 | 2)[] = neg.candidates.length > 0 ? neg.candidates : [neg.version ?? clientVersion];
  const bodyFor = (v: 1 | 2): string => {
    const reqs = v === 2 ? toV2Requirements(entry) : toV1Requirements(entry);
    // v2 repeats the accepted terms INSIDE paymentPayload and adds `resource`; see the envelope
    // note in toDialectPayload. v1 ignores both.
    const v2ctx =
      v === 2
        ? {
            accepted: reqs,
            resource: {
              url: resourceUrl.split("?")[0],
              description: entry.description || "",
              mimeType: entry.mimeType || "application/json",
            },
          }
        : undefined;
    return JSON.stringify({
      x402Version: v,
      paymentPayload: toDialectPayload(payload as Record<string, unknown>, v, v2ctx),
      paymentRequirements: reqs,
    });
  };

  try {
    let vr: Response | null = null;
    let body = "";
    let lastStatus = 0;
    for (const cand of candidates) {
      const attempt = bodyFor(cand);
      const r = await fetch(`${facilitator}/verify`, {
        method: "POST",
        headers: await headersFor("/verify"),
        body: attempt,
      });
      if (r.ok) {
        vr = r;
        body = attempt;
        break;
      }
      lastStatus = r.status;
    }
    if (!vr) return { ok: false, reason: `facilitator /verify HTTP ${lastStatus}` };
    const vout = (await vr.json()) as { isValid?: boolean; invalidReason?: string };
    if (!vout || vout.isValid !== true) {
      return { ok: false, reason: `facilitator rejected receipt: ${vout?.invalidReason || "not valid"}` };
    }
    // Verified ≠ settled. Settle moves the USDC; only then is the artefact paid for.
    const sr = await fetch(`${facilitator}/settle`, {
      method: "POST",
      headers: await headersFor("/settle"),
      body,
    });
    if (!sr.ok) return { ok: false, reason: `facilitator /settle HTTP ${sr.status}` };
    const sout = (await sr.json()) as {
      success?: boolean;
      errorReason?: string;
      error?: string;
      transaction?: string;
      txHash?: string;
      network?: string;
      payer?: string;
    };
    if (!sout || sout.success !== true) {
      return { ok: false, reason: `facilitator settle failed: ${sout?.errorReason || sout?.error || "not settled"}` };
    }
    const settlement = {
      transaction: sout.transaction || sout.txHash || null,
      network: sout.network || toLegacyNetwork(entry.network),
      payer: sout.payer || null,
      // WHETHER THE BAZAAR INDEXED US, read rather than assumed. Bazaar is the discovery layer
      // agents search to find paid resources; a resource is indexed off the metadata a
      // facilitator processes on the verify/settle path, and this endpoint already advertises a
      // spec-shaped `bazaar` blob in its 402. But per specs/extensions/bazaar.md a facilitator
      // only MAY report the outcome, on the EXTENSION-RESPONSES sidechannel — and x402#2112
      // records a facilitator that never emits it, leaving services silently unindexed. Probed
      // 2026-09-04: PayAI returns no such header on /verify, so settle is the only place the
      // answer can appear.
      //
      // Indexing needs a CONFIRMED settle, so the first real payment is the only chance to
      // observe it. Reporting UNREPORTED rather than inferring success is the point: a missing
      // header means the facilitator said nothing, which is NOT the same as being indexed, and
      // guessing here would manufacture exactly the kind of unverified claim this file exists to
      // prevent.
      bazaar: readBazaarOutcome(sr.headers.get("extension-responses")),
    };
    // X-PAYMENT-RESPONSE echo per the x402 spec — only ever what the facilitator returned, and
    // deliberately WITHOUT the bazaar sidechannel. specs/extensions/bazaar.md is explicit that
    // EXTENSION-RESPONSES is "Server internal only — never forwarded to the buyer": it carries
    // the facilitator's processing outcomes, not settlement facts the payer is owed. Including
    // it also broke the echo outright, because btoa() is Latin-1 only and the note text contains
    // an em dash — a silent "facilitator error: Invalid character" on every settled payment,
    // which is the worst possible place to learn that lesson.
    const { bazaar: _bazaarSidechannel, recording_gap: _recordingGap, ...buyerFacing } =
      settlement as typeof settlement & { recording_gap?: string };

    // ─── the signed receipt (offer-receipt extension §5) ────────────────────
    // Issued ONLY here, after the facilitator answered success:true — "returned only on success"
    // is the whole point of the artefact. It rides in the SettlementResponse under
    // extensions["offer-receipt"].info.receipt (§5.1), which for this rail is the base64 JSON of
    // the X-PAYMENT-RESPONSE header every door already echoes.
    //
    // A settle whose payer the facilitator did not name cannot be receipted: `payer` is a REQUIRED
    // signed field (§5.2) and there is nothing honest to put in it. The buyer still gets the
    // artefact — a receipt is evidence, never a gate.
    let receipt: { format: "jws"; signature: string } | undefined;
    let receiptGap: string | undefined;
    const pkcs8 = (env.BOARD_SIGN_KEY_PKCS8_B64 || "").trim();
    if (!settlement.payer) {
      receiptGap = "the facilitator did not name a payer, and payer is a required signed field (spec §5.2)";
    } else if (!pkcs8) {
      receiptGap = "no BOARD_SIGN_KEY_PKCS8_B64 is set in the Pages environment, so the edge holds no key to sign a receipt with";
    }

    const recorded = await recordSettlement(env, {
      transaction: settlement.transaction,
      network: settlement.network,
      payer: settlement.payer,
      resource: resourceUrl,
      amount_atomic: accept?.amount || accept?.maxAmountRequired || null,
    });

    if (!receiptGap && settlement.payer) {
      try {
        const rp = receiptPayload({
          network: settlement.network || entry.network,
          resourceUrl,
          payer: settlement.payer,
          issuedAt: Math.floor(Date.now() / 1000),
          transaction: settlement.transaction,
        });
        receipt = await signReceipt(rp, pkcs8);
        // The CSOAI envelope beside settled:tx:* — a NAMED extension of ours, not the spec
        // artefact. `self` and `zero_value` are copied from the settlement record rather than
        // recomputed, so the receipt ledger and the One Number cannot disagree about the same
        // payment. When no record could be written they are null: unjudged, never guessed.
        const stored = await storeReceipt(
          env.REVENUE_KV as unknown as Parameters<typeof storeReceipt>[0],
          buildReceiptRecord({
            receipt,
            payload: rp,
            resource: resourceUrl,
            amount_atomic: accept?.amount || accept?.maxAmountRequired || null,
            asset: accept?.asset || null,
            self: recorded.record ? recorded.record.self : null,
            settlement_recorded: recorded.stored,
          }),
        );
        if (!stored.stored) receiptGap = `receipt signed but not stored: ${stored.reason}`;
      } catch (e) {
        receipt = undefined;
        receiptGap = `receipt signing failed: ${(e as Error).message}`;
      }
    }

    const paymentResponse = btoa(
      JSON.stringify({
        success: true,
        ...buyerFacing,
        ...(receipt ? { extensions: receiptExtension(receipt) } : {}),
      }),
    );
    // Whether the write SUCCEEDED is carried on the result so an operator can tell "nothing
    // settled" from "nothing recorded". It is server-internal, exactly like the bazaar
    // sidechannel: our bookkeeping gap, not a settlement fact the payer is owed, so it never
    // reaches the X-PAYMENT-RESPONSE echo. (The call itself moved above the receipt block —
    // the receipt copies `self` from the record rather than recomputing it.)
    if (!recorded.stored) {
      (settlement as Record<string, unknown>).recording_gap = recorded.reason;
    }
    return {
      ok: true,
      reason: "facilitator verified and settled receipt",
      paymentResponse,
      settlement,
      ...(receipt ? { receipt } : {}),
      ...(receiptGap ? { receiptGap } : {}),
    };
  } catch (e) {
    return { ok: false, reason: `facilitator error: ${(e as Error).message}` };
  }
}

// ─── x402 v2 + Bazaar discovery ─────────────────────────────────────────────
// Brief language said "Bazaar extension discoverable: true". Current CDP / x402
// bazaar.md does NOT define a `discoverable` field — maintainers warn that
// `extensions.bazaar.discoverable: true` is invalid and causes failed discovery
// (x402-foundation/x402#2112 / #2207). Discoverability is expressed by declaring
// a conformant `extensions.bazaar` block (info + schema) on the PaymentRequired
// response and completing a CDP Facilitator settle. We never invent that field.

/** Board lid language — never a certificate. */
export const CSOAI_LID =
  "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.";

export type BazaarHttpGetOpts = {
  method?: "GET" | "HEAD" | "DELETE";
  queryParams?: Record<string, string>;
  queryParamsSchema?: {
    properties?: Record<string, unknown>;
    required?: string[];
  };
  outputExample?: Record<string, unknown>;
};


/**
 * declareBazaarHttpGet — hand-rolled equivalent of `@x402/extensions/bazaar`
 * `declareDiscoveryExtension` for GET/HEAD/DELETE (Pages Functions have no npm
 * @x402 deps). Shape matches specs/extensions/bazaar.md (info + schema).
 */
export function declareBazaarHttpGet(opts: BazaarHttpGetOpts = {}): {
  info: Record<string, unknown>;
  schema: Record<string, unknown>;
} {
  const method = opts.method || "GET";
  const queryParams = opts.queryParams;
  const inputSchema = opts.queryParamsSchema;
  const outputExample = opts.outputExample;
  return {
    info: {
      input: {
        type: "http",
        method,
        ...(queryParams ? { queryParams } : {}),
      },
      ...(outputExample
        ? { output: { type: "json", example: outputExample } }
        : {}),
    },
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        input: {
          type: "object",
          properties: {
            type: { type: "string", const: "http" },
            method: { type: "string", enum: ["GET", "HEAD", "DELETE"] },
            ...(inputSchema
              ? {
                  queryParams: {
                    type: "object",
                    ...inputSchema,
                  },
                }
              : {}),
          },
          required: ["type", "method"],
          additionalProperties: false,
        },
        ...(outputExample
          ? {
              output: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  example: { type: "object" },
                },
                required: ["type"],
              },
            }
          : {}),
      },
      required: ["input"],
    },
  };
}

export type PaymentRequiredV2Opts = {
  resourceUrl: string;
  description: string;
  serviceName: string;
  tags?: string[];
  accepts: X402Accept[];
  bazaar: { info: Record<string, unknown>; schema: Record<string, unknown> };
  /** Estate sidecar — never sold as a grade; optional for humans/agents. */
  csoai?: Record<string, unknown>;
};

/** Build an x402 v2 PaymentRequired object (body + PAYMENT-REQUIRED header payload). */
export function buildPaymentRequiredV2(opts: PaymentRequiredV2Opts): Record<string, unknown> {
  const accepts = opts.accepts.map((a) => {
    const amount = a.amount || a.maxAmountRequired;
    return {
      scheme: a.scheme,
      network: toCaip2Network(a.network),
      amount,
      maxAmountRequired: a.maxAmountRequired || amount,
      asset: a.asset,
      payTo: a.payTo,
      maxTimeoutSeconds: a.maxTimeoutSeconds,
      extra: a.extra,
    };
  });
  return {
    x402Version: 2,
    error: "Payment required",
    resource: {
      url: opts.resourceUrl,
      description: opts.description.slice(0, 500),
      mimeType: "application/json",
      serviceName: opts.serviceName.slice(0, 32),
      ...(opts.tags && opts.tags.length
        ? { tags: opts.tags.slice(0, 5).map((t) => t.slice(0, 32)) }
        : {}),
    },
    accepts,
    extensions: {
      // Presence of a conformant bazaar block is what makes the route discoverable.
      // Do NOT add `discoverable: true` here — that field is not in the bazaar spec.
      bazaar: opts.bazaar,
    },
    ...(opts.csoai ? { csoai: opts.csoai } : {}),
  };
}

/** x402scan's client fails its fetch when PAYMENT-REQUIRED exceeds this, and falls back
 * to a raw probe with a warning — so an oversized header costs the door its listing. */
export const PAYMENT_REQUIRED_HEADER_LIMIT = 16 * 1024;

/**
 * Encode PaymentRequired for the v2 `PAYMENT-REQUIRED` response header.
 *
 * The BODY carries everything, including the `csoai` estate sidecar. The HEADER carries
 * the challenge a machine needs to pay: x402Version, error, resource, accepts and
 * extensions. `csoai.preview` is a courtesy for whoever reads the body — on
 * /api/evidence-bundle its `preview.cards` alone is 10,610 B, which pushed that door's
 * header to 17,244 B, over x402scan's 16 KiB limit, while every other door sits at
 * 3-7 KB. Duplicating a preview into a header nobody reads it from cost that door its
 * listing, so the sidecar's bulk is dropped from the header only.
 */
export function encodePaymentRequiredHeader(paymentRequired: unknown): string {
  let forHeader = paymentRequired;
  if (paymentRequired && typeof paymentRequired === "object") {
    const src = paymentRequired as Record<string, unknown>;
    if (src.csoai && typeof src.csoai === "object") {
      const { preview: _preview, ...csoaiRest } = src.csoai as Record<string, unknown>;
      forHeader = { ...src, csoai: csoaiRest };
    }
  }
  const json = JSON.stringify(forHeader);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/** 402 Response with JSON body + PAYMENT-REQUIRED header (CDP Bazaar validate requires both). */
export function paymentRequiredResponse(
  paymentRequired: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(paymentRequired, null, 2), {
    status: 402,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "PAYMENT-REQUIRED": encodePaymentRequiredHeader(paymentRequired),
      ...extraHeaders,
    },
  });
}

/**
 * paymentRequiredResponseSigned — THE call every metered door makes instead of
 * `paymentRequiredResponse`. It signs one offer per accepts[] entry (offer-receipt extension §4)
 * and then builds the same 402, so the offers appear in BOTH the JSON body and the base64
 * PAYMENT-REQUIRED header. That symmetry is not decoration: CDP Bazaar validate reads the header
 * and most clients read the body, and an offer present in only one of them is an offer half the
 * ecosystem cannot see.
 *
 * It is the only asynchronous thing about emitting a 402, and it never fails the response: when
 * the key is absent or no accepts entry can be committed to, the 402 goes out exactly as before
 * plus a `csoai.offer_receipt` sidecar saying, in words, why it carries no signature.
 */
export async function paymentRequiredResponseSigned(
  paymentRequired: Record<string, unknown>,
  env: X402Env,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const signed = await attachOffers(paymentRequired, (env.BOARD_SIGN_KEY_PKCS8_B64 || "").trim() || undefined);
  return paymentRequiredResponse(signed, extraHeaders);
}
