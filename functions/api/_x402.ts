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
// TODO(x402 live): provision the X402_* bindings below (Cloudflare secrets) and confirm the
//   facilitator implements the standard x402 `POST {facilitator}/verify` (and `/settle`) contract
//   — see https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp. Until then verification
//   returns { ok:false } by design; that is the honest state, not a regression.

import { SKUS, USDC_BASE, usdToAtomic, resolvePriceUsd } from "./_skus";

export type X402Env = {
  // The x402 facilitator that verifies (and settles) a receipt. Absent → metered endpoints
  // stay 402: an unverified receipt is never accepted.
  X402_FACILITATOR_URL?: string;
  X402_ASSET?: string; // ERC-20 asset contract the receipt must pay (e.g. USDC on base)
  X402_NETWORK?: string; // e.g. "base"
  X402_PAY_TO?: string; // the address the receipt must pay
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
};

/** One entry of the canonical x402 `accepts` array (the `exact`/EIP-3009 scheme on Base). */
export type X402Accept = {
  scheme: "exact";
  network: string;
  maxAmountRequired: string; // atomic units, decimal string (v1 + dual)
  amount?: string; // atomic units — required by x402 v2 / CDP Bazaar validate
  asset: string;
  payTo: string | null; // null until the owner provisions the receiving address (X402_PAY_TO)
  resource?: string; // v1 clients; v2 moves this to top-level resource.url
  description?: string; // v1; v2 prefers resource.description
  mimeType?: string;
  maxTimeoutSeconds: number;
  extra: { name: string; decimals?: number; version?: string };
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
      payTo: env.X402_PAY_TO || null,
      resource: resourceUrl,
      description,
      mimeType: "application/json",
      maxTimeoutSeconds: 300,
      extra: { name: USDC_BASE.symbol, decimals: USDC_BASE.decimals, version: "2" },
    },
  ];
}

/**
 * verifyX402Payment — returns { ok:true } ONLY for a facilitator-verified receipt. Never grants
 * on header presence or structure alone.
 */
export async function verifyX402Payment(
  request: Request,
  env: X402Env,
  resourceUrl: string,
): Promise<X402Result> {
  const header = request.headers.get("x-payment");
  if (!header) return { ok: false, reason: "no x-payment header" };

  // Decode the X-PAYMENT header (x402 sends it base64-encoded JSON). A header that does not
  // decode to a structured payload is not a receipt — reject it rather than trust its presence.
  let payload: unknown;
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

  // Real settlement verification requires a facilitator. None provisioned ⇒ we cannot confirm
  // the receipt settled ⇒ fail closed. NEVER grant on structure alone.
  const facilitator = (env.X402_FACILITATOR_URL || "").replace(/\/$/, "");
  if (!facilitator) {
    return {
      ok: false,
      reason:
        "x402 verification is not provisioned (no X402_FACILITATOR_URL). The receipt cannot be " +
        "confirmed settled, so the paid resource is not granted. This is fail-closed by design.",
    };
  }

  const paymentRequirements = {
    scheme: "exact",
    network: toCaip2Network(env.X402_NETWORK || USDC_BASE.network),
    asset: env.X402_ASSET || null,
    payTo: env.X402_PAY_TO || null,
    maxAmountRequired: env.X402_AMOUNT || null,
    resource: resourceUrl,
    mimeType: "application/json",
  };

  try {
    const vr = await fetch(`${facilitator}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements }),
    });
    if (!vr.ok) return { ok: false, reason: `facilitator /verify HTTP ${vr.status}` };
    const out = (await vr.json()) as {
      isValid?: boolean;
      invalidReason?: string;
      payment?: unknown;
      txHash?: string;
    };
    if (out && out.isValid === true) {
      // A verified receipt carries a settlement echo to return in X-PAYMENT-RESPONSE (x402 spec).
      // Only ever set from what the facilitator actually returned — never fabricated.
      const paymentResponse =
        out.txHash || out.payment
          ? btoa(JSON.stringify({ txHash: out.txHash ?? null, payment: out.payment ?? null }))
          : undefined;
      return { ok: true, reason: "facilitator verified receipt", paymentResponse };
    }
    return { ok: false, reason: `facilitator rejected receipt: ${out?.invalidReason || "not valid"}` };
  } catch (e) {
    return { ok: false, reason: `facilitator /verify error: ${(e as Error).message}` };
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
  "22 axes · 14 fleets · 3 public leaders · 8 fact runs · not a certificate";

export type BazaarHttpGetOpts = {
  method?: "GET" | "HEAD" | "DELETE";
  queryParams?: Record<string, string>;
  queryParamsSchema?: {
    properties?: Record<string, unknown>;
    required?: string[];
  };
  outputExample?: Record<string, unknown>;
};

/** Map legacy network names to CAIP-2 (CDP Bazaar validate requires CAIP-2). */
export function toCaip2Network(network: string): string {
  const n = (network || "").trim().toLowerCase();
  if (n === "base") return "eip155:8453";
  if (n === "base-sepolia") return "eip155:84532";
  if (n.includes(":")) return network.trim();
  return network || "eip155:8453";
}

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
      extra: a.extra?.version
        ? a.extra
        : { ...a.extra, version: "2" },
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
