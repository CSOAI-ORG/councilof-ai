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
// requirements for the resource. If no facilitator is provisioned (the estate's x402 rail is
// still `mode: "mock"` per /.well-known/x402.json — there is no live settle path yet), the
// receipt cannot be confirmed settled, so verification FAILS CLOSED: the caller returns 402 and
// never grants on header presence.
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

// Re-exported so existing importers (and tests) keep their entry point after the converters moved
// to _x402_config.ts to break an import cycle with _x402_negotiate.ts.
export { toCaip2Network, toLegacyNetwork };

// CdpEnv carries CDP_API_KEY_ID/SECRET — declared once in _cdp_jwt.ts so the credential shape
// cannot drift between the minter and its caller.
export type X402Env = CdpEnv & {
  // The x402 facilitator that verifies (and settles) a receipt. Absent → metered endpoints
  // stay 402: an unverified receipt is never accepted.
  X402_FACILITATOR_URL?: string;
  X402_ASSET?: string; // ERC-20 asset contract the receipt must pay (e.g. USDC on base)
  X402_NETWORK?: string; // e.g. "base"
  X402_PAY_TO?: string; // overrides the estate default in _x402_config.ts
  X402_AMOUNT?: string; // atomic units required (string, as x402 encodes it)
  // Per-SKU price overrides (strings, as Cloudflare passes them) are read via _skus.ts.
  [k: string]: string | undefined;
};

export type X402Result = {
  ok: boolean;
  reason: string;
  // Present only when a facilitator confirmed settlement — the value to echo back in the
  // X-PAYMENT-RESPONSE header per the x402 spec. Never fabricated; absent when fail-closed.
  paymentResponse?: string;
  // Settlement facts as the facilitator reported them (never invented). Absent when not paid.
  settlement?: { transaction: string | null; network: string | null; payer: string | null };
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
  if (entry.maxAmountRequired === "0") return { ok: false, reason: "no amount configured for this resource" };

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
  const v: 1 | 2 = neg.version ?? clientVersion;
  const paymentRequirements = v === 2 ? toV2Requirements(entry) : toV1Requirements(entry);
  const body = JSON.stringify({
    x402Version: v,
    paymentPayload: toDialectPayload(payload as Record<string, unknown>, v),
    paymentRequirements,
  });

  try {
    const vr = await fetch(`${facilitator}/verify`, {
      method: "POST",
      headers: await headersFor("/verify"),
      body,
    });
    if (!vr.ok) return { ok: false, reason: `facilitator /verify HTTP ${vr.status}` };
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
    };
    // X-PAYMENT-RESPONSE echo per the x402 spec — only ever what the facilitator returned.
    const paymentResponse = btoa(JSON.stringify({ success: true, ...settlement }));
    return { ok: true, reason: "facilitator verified and settled receipt", paymentResponse, settlement };
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

/** Encode PaymentRequired for the v2 `PAYMENT-REQUIRED` response header. */
export function encodePaymentRequiredHeader(paymentRequired: unknown): string {
  const json = JSON.stringify(paymentRequired);
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
