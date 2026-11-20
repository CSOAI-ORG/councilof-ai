import { handlePurchases } from "../api/purchases/[[path]]";
import { purchaseBody, type BuyerEnv } from "../api/_buyer_purchase";
import { purchaseSha256 } from "../../shared/buyerPurchase";
/**
 * Paid MCP tools on Pages /mcp — thin, honest wrappers over the x402-metered routes.
 *
 * Definitions: ./paid-tools.json. Payment is the `x_payment` ARGUMENT and this module sets the
 * X-PAYMENT header itself, so nothing here is HTTP-only in principle — the stdio server reads the
 * same file and carries the same tools. The free tools in ./gspc-tools.json are untouched.
 *
 * MECHANISM: a paid tool forwards to its route on the SAME origin with the caller's `x_payment`
 * argument as the X-PAYMENT header (verbatim; this module never authenticates, signs or invents a
 * receipt — it only classifies the opaque response's receipt shape). Settlement is the route's job
 * via functions/api/_x402.ts, fail-closed. The route's
 * reply comes back as structuredContent in three honest states:
 *   402 → status PAYMENT_REQUIRED, following the x402 MCP transport (x402-foundation/x402
 *         specs/transports-v2/mcp.md, "Payment Required Signaling"): isError:TRUE, structuredContent
 *         carries the route's PaymentRequired object at the TOP LEVEL (x402Version, resource,
 *         accepts[], extensions) next to this wrapper's own fields, and content[0].text is
 *         JSON.stringify(structuredContent); the human summary moves to content[1].text. Until
 *         2026-09-26 this returned isError:false with the challenge nested under
 *         `payment_required`, which an x402 MCP client (checks structuredContent.x402Version +
 *         accepts) could not recognise. `payment_required` is kept for existing readers.
 *         PAYMENT, TWO CHANNELS, ONE HEADER (2026-11-20). Until then payment was read only from the
 *         `x_payment` argument, so a client following the same transport spec's "Payment Payload
 *         Transmission" (it retries the call with its PaymentPayload in `_meta["x402/payment"]`)
 *         was sent the challenge again on every retry and could never buy. Now POST /mcp hands that
 *         object to this module, which base64s its JSON into the same X-PAYMENT header the argument
 *         becomes; the route decodes exactly that (functions/api/_x402.ts) and still verifies and
 *         settles, fail closed. Both channels at once are refused and nothing is forwarded. When the
 *         route reports settlement, the decoded X-PAYMENT-RESPONSE is also returned as
 *         `_meta["x402/payment-response"]` ("Settlement Response Delivery"), never invented.
 *   2xx → status DELIVERED: delivery is separate from settlement and receipt state. A free preview,
 *         a paid delivery with no settle echo, a settle echo with a receipt gap, and a settle echo
 *         carrying an unverified JWS receipt are four different structured states.
 *   404 → status NOT_DEPLOYED: the route is not on this origin — said plainly, never a fabricated
 *         result. A 404 that carries the route's own JSON body (its `schema` field) is NOT this: the
 *         route is deployed and answered "not found", so it is reported as HTTP_404 with its reason.
 *   other → status = the HTTP status, body passed through, isError:true — nothing was delivered.
 * Same-origin fetch: one subrequest per call. Routes are forwarded to by exact path from the
 * definitions file; a caller cannot steer the tool to any other URL.
 */
import PAID_TOOLS from "./paid-tools.json";
import { rpc, type McpToolResult } from "./_handlers";

type PaidTool = {
  name: string;
  csoai: { route: string; sku: string; rail: string };
};
const TOOLS = (PAID_TOOLS as { tools: PaidTool[] }).tools;
export const PAID_TOOL_NAMES = new Set(TOOLS.map((t) => t.name));
export const PAID_TOOL_DEFS = (PAID_TOOLS as { tools: unknown[] }).tools;

const DOCTRINE =
  "measurement, not certification — no tool here carries or awards a trust label of any kind; verification stays free";

type ReceiptState = "NOT_REQUESTED" | "ABSENT" | "UNREADABLE" | "MISSING" | "PRESENT_UNVERIFIED";

function inspectReceipt(paymentResponse?: string | null): ReceiptState {
  if (!paymentResponse) return "ABSENT";
  try {
    const normalized = paymentResponse.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const extensions = decoded?.extensions;
    if (!extensions || typeof extensions !== "object" || Array.isArray(extensions)) return "MISSING";
    const offerReceipt = (extensions as Record<string, unknown>)["offer-receipt"];
    if (!offerReceipt || typeof offerReceipt !== "object" || Array.isArray(offerReceipt)) return "MISSING";
    const info = (offerReceipt as Record<string, unknown>).info;
    if (!info || typeof info !== "object" || Array.isArray(info)) return "MISSING";
    const receipt = (info as Record<string, unknown>).receipt;
    if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return "MISSING";
    const format = (receipt as Record<string, unknown>).format;
    const signature = (receipt as Record<string, unknown>).signature;
    return format === "jws" &&
      typeof signature === "string" &&
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(signature)
      ? "PRESENT_UNVERIFIED"
      : "MISSING";
  } catch {
    return "UNREADABLE";
  }
}

function deliveryFields(paymentPresented: boolean, paymentResponse?: string | null) {
  const receiptState = paymentResponse
    ? inspectReceipt(paymentResponse)
    : paymentPresented
      ? "ABSENT"
      : "NOT_REQUESTED";
  if (!paymentPresented) {
    return {
      delivery_kind: "PREVIEW_OR_FREE",
      receipt_state: receiptState,
    } as const;
  }
  if (!paymentResponse) {
    return {
      delivery_kind: "DELIVERED_SETTLEMENT_UNCONFIRMED",
      receipt_state: receiptState,
    } as const;
  }
  if (receiptState === "PRESENT_UNVERIFIED") {
    return {
      delivery_kind: "DELIVERED_WITH_ROUTE_RECEIPT",
      receipt_state: receiptState,
    } as const;
  }
  return {
    delivery_kind: "DELIVERED_RECEIPT_GAP",
    receipt_state: receiptState,
    receipt_gap:
      "The route reported settlement, but its opaque response did not carry a readable offer-receipt JWS. Inspect the route, chain and facilitator; do not retry blindly.",
  } as const;
}

/** Build the same-origin request for a paid tool from its arguments. */
export function buildPaidRequest(
  name: string,
  args: Record<string, unknown>,
  origin: string,
): { req: Request; route: string } | { error: string } {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { error: `unknown paid tool: ${name}` };
  const route = tool.csoai.route;
  const str = (k: string) =>
    typeof args[k] === "string" ? (args[k] as string).trim() : "";
  const flag = (k: string) =>
    args[k] === true || args[k] === "1" || args[k] === "true";
  const headers: Record<string, string> = { accept: "application/json" };
  const xp = str("x_payment");
  if (xp) headers["x-payment"] = xp;
  // A free preview never verifies a payment, so a preview sent with x_payment would come back as a
  // delivery with "settlement unconfirmed" for an authorization no route ever looked at.
  if (flag("preview") && xp)
    return { error: "preview is free: omit x_payment for a preview, or drop preview to buy" };
  const u = new URL(route, origin);
  let method = "GET";
  let body: string | undefined;

  switch (name) {
    case "commission_card": {
      if (!str("subject")) return { error: "subject is required" };
      u.searchParams.set("subject", str("subject"));
      if (str("axis")) u.searchParams.set("axis", str("axis"));
      break;
    }
    case "art50_marking_evidence": {
      if (flag("preview")) u.searchParams.set("preview", "1");
      if (str("bytes_b64") || str("manifest_b64")) {
        method = "POST";
        headers["content-type"] = "application/json";
        body = JSON.stringify(
          str("bytes_b64")
            ? { bytes_b64: str("bytes_b64") }
            : { manifest_b64: str("manifest_b64") },
        );
      } else if (str("url")) {
        u.searchParams.set("url", str("url"));
      } else {
        return { error: "one of url, bytes_b64 or manifest_b64 is required" };
      }
      break;
    }
    case "rwa_evidence": {
      if (!str("asset")) return { error: "asset is required" };
      u.searchParams.set("asset", str("asset"));
      if (flag("preview")) u.searchParams.set("preview", "1");
      break;
    }
    case "receipts_batch": {
      if (!str("from")) return { error: "from is required (ISO-8601)" };
      // A paid batch names its window end. The route's default end is "now", which moves on every
      // call, so the paid bytes could never hash to the preview's batch_sha256 or match the
      // resource the challenge named.
      if (xp && !str("to"))
        return { error: "to is required when paying: pass the window.to that the free preview (preview=true) or the 402 challenge names" };
      u.searchParams.set("from", str("from"));
      if (str("to")) u.searchParams.set("to", str("to"));
      if (flag("preview")) u.searchParams.set("preview", "1");
      break;
    }
    case "evidence_bundle": {
      // GET /api/evidence-bundle?obligation=<id>[&subject=<s>]&bundle=1 — the paid, assembled OSCAL bundle.
      // preview=true drops bundle=1, which is the route's own free preview (nothing is charged).
      if (!str("obligation")) return { error: "obligation is required (article-50, article-53, dora or cra)" };
      u.searchParams.set("obligation", str("obligation"));
      if (str("subject")) u.searchParams.set("subject", str("subject").slice(0, 120));
      if (!flag("preview")) u.searchParams.set("bundle", "1");
      break;
    }
    default:
      return { error: `no request builder for ${name}` };
  }
  return {
    req: new Request(u.toString(), {
      method,
      headers,
      redirect: "manual", // A paid authorization must not follow a route redirect; "error" throws on Cloudflare workerd.
      ...(body ? { body } : {}),
    }),
    route,
  };
}

/** x402 MCP transport field names (x402-foundation/x402 specs/transports-v2/mcp.md). */
export const X402_META_PAYMENT = "x402/payment";
export const X402_META_PAYMENT_RESPONSE = "x402/payment-response";
// A PaymentPayload is a signature and an authorization. This bounds what becomes a request header.
export const META_PAYMENT_MAX_BYTES = 16 * 1024;

/**
 * `_meta["x402/payment"]` as the X-PAYMENT header value: base64 of the PaymentPayload's JSON, the
 * form the metered routes decode. Only the shape is checked here; whether the payment is good is
 * the route's question (facilitator verify, then settle).
 */
export function metaPaymentHeader(meta: unknown): { header: string } | { error: string } {
  if (!meta || typeof meta !== "object" || Array.isArray(meta))
    return { error: `_meta["${X402_META_PAYMENT}"] must be an x402 PaymentPayload object` };
  const bytes = new TextEncoder().encode(JSON.stringify(meta));
  if (bytes.byteLength > META_PAYMENT_MAX_BYTES)
    return { error: `_meta["${X402_META_PAYMENT}"] exceeds ${META_PAYMENT_MAX_BYTES} bytes` };
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { header: btoa(binary) };
}

/** The route's X-PAYMENT-RESPONSE as an object, or null when it is not base64 of a JSON object. */
function settlementResponse(header: unknown): Record<string, unknown> | null {
  if (typeof header !== "string" || !header) return null;
  try {
    const normalized = header.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    const decoded: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))));
    return decoded && typeof decoded === "object" && !Array.isArray(decoded) ? (decoded as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export type PaidCallerContext={authorization?:string;env?:BuyerEnv;
  /** params._meta["x402/payment"] of the tools/call, when the caller sent one (POST /mcp only). */
  metaPayment?:unknown};

/**
 * Run a paid tool. Payment arrives as the `x_payment` argument or as `_meta["x402/payment"]`
 * (caller.metaPayment); either way it reaches the route as one X-PAYMENT header. A settlement the
 * route reports is returned in `_meta["x402/payment-response"]` beside the existing fields.
 */
export async function paidToolResult(
  name: string,
  args: Record<string, unknown>,
  origin: string,
  caller?:PaidCallerContext,
): Promise<McpToolResult> {
  let paidArgs = args;
  const meta = caller?.metaPayment;
  if (meta !== undefined && meta !== null) {
    const refused = (reason: string): McpToolResult => ({
      content: [{ type: "text", text: `BAD_ARGUMENTS — ${reason}. Nothing was forwarded to the route; nothing was charged by this request.` }],
      structuredContent: {
        tool: name,
        status: "BAD_ARGUMENTS",
        reason,
        payment_presented: true,
        payment_forwarded: false,
        settlement_state: "NOT_REQUESTED",
        nothing_charged: true,
        delivery_state: "NOT_DELIVERED",
        doctrine: DOCTRINE,
        not_a_certification: true,
      },
      isError: true,
    });
    if (typeof args.x_payment === "string" && args.x_payment.trim() !== "")
      return refused(`payment was sent twice: use the x_payment argument or _meta["${X402_META_PAYMENT}"], not both`);
    const encoded = metaPaymentHeader(meta);
    if ("error" in encoded) return refused(encoded.error);
    paidArgs = { ...args, x_payment: encoded.header };
  }
  const result = await paidToolCall(name, paidArgs, origin, caller);
  const settled = settlementResponse(result.structuredContent?.payment_response_header);
  return settled ? { ...result, _meta: { [X402_META_PAYMENT_RESPONSE]: settled } } : result;
}

async function paidToolCall(
  name: string,
  args: Record<string, unknown>,
  origin: string,
  caller?:PaidCallerContext,
): Promise<McpToolResult> {
  const paymentPresented =
    typeof args.x_payment === "string" && args.x_payment.trim() !== "";
  const built = buildPaidRequest(name, args, origin);
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) {
    return {
      content: [
        { type: "text", text: `BAD_ARGUMENTS — unknown paid tool: ${name}` },
      ],
      structuredContent: {
        tool: name,
        status: "BAD_ARGUMENTS",
        reason: "unknown paid tool",
        doctrine: DOCTRINE,
        not_a_certification: true,
      },
      isError: true,
    };
  }
  const base = {
    tool: name,
    route: tool.csoai.route,
    sku: tool.csoai.sku,
    rail: tool.csoai.rail,
    payment_presented: paymentPresented,
    doctrine: DOCTRINE,
    not_a_certification: true,
  };
  const settlementFields = (paymentResponse?: string | null) => {
    if (paymentResponse) {
      return {
        settlement_state: "REPORTED_BY_ROUTE",
        payment_response_header: paymentResponse,
      } as const;
    }
    if (paymentPresented) {
      return { settlement_state: "UNCONFIRMED" } as const;
    }
    return {
      settlement_state: "NOT_REQUESTED",
      nothing_charged: true,
    } as const;
  };
  const retryWarning = paymentPresented
    ? "Settlement is unconfirmed; inspect the wallet, chain and facilitator before signing or retrying."
    : "No payment authorization was presented; nothing was charged by this request.";
  const reply = (
    payload: Record<string, unknown>,
    summary: string,
    isError = false,
  ): McpToolResult => ({
    content: [
      {
        type: "text" as const,
        text: `${summary}\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    structuredContent: payload,
    isError,
  });

  if("purchase_action" in args){
    if(paymentPresented)return reply({...base,status:"BAD_ARGUMENTS",reason:"Recovery and decisions must omit payment authorization."},"No payment was attempted.",true);
    const action=args.purchase_action,tx=typeof args.purchase_transaction==="string"?args.purchase_transaction:"";
    if(typeof action!=="string"||!["history","recover","decisions","accept","reject","request_correction"].includes(action)||
      (action!=="history"&&(!tx||tx.length>256)))
      return reply({...base,status:"BAD_ARGUMENTS",reason:"A supported purchase action and owned transaction are required."},"No payment was attempted.",true);
    const decision=!["history","recover","decisions"].includes(action);
    const url=new URL(action==="history"?"/api/purchases":"/api/purchases/"+encodeURIComponent(tx)+(action==="recover"?"?include_body=1":"/decisions"),origin);
    if(typeof args.purchase_cursor==="string")url.searchParams.set("cursor",args.purchase_cursor);
    if(action==="decisions"&&typeof args.purchase_request_id==="string")url.searchParams.set("request_id",args.purchase_request_id);
    const headers=new Headers(decision?{"content-type":"application/json"}:{});
    if(caller?.authorization)headers.set("authorization",caller.authorization);
    const request=new Request(url,{method:decision?"POST":"GET",headers,...(decision?{body:JSON.stringify({
      action,result_sha256:args.purchase_result_sha256,result_version:args.purchase_result_version,
      request_id:args.purchase_request_id,reason:args.purchase_reason,
    })}:{})});
    const response=await handlePurchases(request,caller?.env||{}),result=await response.json();
    return reply({...base,status:response.ok?(action==="history"?"PURCHASE_HISTORY":action==="recover"?"ORIGINAL_RECOVERED":action==="decisions"?"BUYER_DECISIONS":"BUYER_DECISION_RECORDED"):"PURCHASE_UNAVAILABLE",
      http_status:response.status,purchase:result,payment_presented:false,settlement_state:"NOT_REQUESTED",
      no_new_payment_or_provider_call:true,acceptance_inferred:false},
      response.ok?"Owned original data or explicit buyer declaration read. No new payment, provider/model call or signature.":"Purchase access or decision could not be qualified. No new payment was attempted.",!response.ok);
  }

  if ("error" in built)
    return reply(
      { ...base, status: "BAD_ARGUMENTS", reason: built.error },
      `BAD_ARGUMENTS — ${built.error}`,
      true,
    );

  if(caller?.authorization)built.req.headers.set("authorization",caller.authorization);
  const identityRequest=paymentPresented?null:built.req.clone();
  let res: Response;
  try {
    res = await fetch(built.req);
  } catch {
    return reply(
      {
        ...base,
        status: "UNREACHABLE",
        reason: "same-origin evidence route could not be reached",
        delivery_state: "UNKNOWN",
        ...settlementFields(),
      },
      `UNREACHABLE — ${tool.csoai.route} could not be reached; delivery is unknown. ${retryWarning}`,
      true,
    );
  }
  let body: unknown = null;
  let text: string;
  try {
    text = await res.text();
  } catch {
    return reply(
      {
        ...base,
        status: "UNREADABLE_RESPONSE",
        http_status: res.status,
        reason: "same-origin evidence route response could not be read",
        delivery_state: "UNKNOWN",
        ...settlementFields(res.headers.get("x-payment-response")),
      },
      `UNREADABLE_RESPONSE — ${tool.csoai.route} answered, but delivery could not be established. ${res.headers.get("x-payment-response") ? "The route reported settlement; inspect the wallet, chain and facilitator before signing or retrying. The opaque header is not independently verified." : retryWarning}`,
      true,
    );
  }
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 2000) };
  }

  if (res.status === 402) {
    const paymentRequired =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const advertised=typeof paymentRequired.resource==="object"&&paymentRequired.resource!==null
      ?(paymentRequired.resource as {url?:unknown}).url:typeof paymentRequired.resource==="string"?paymentRequired.resource
      :Array.isArray(paymentRequired.accepts)&&typeof paymentRequired.accepts[0]?.resource==="string"?paymentRequired.accepts[0].resource:undefined;
    let purchaseRequest: Record<string, unknown> | undefined;
    let purchaseRequestUnavailable: string | undefined;
    if (identityRequest) {
      try {
        purchaseRequest={url:identityRequest.url,resource:typeof advertised==="string"?advertised:identityRequest.url,
          method:identityRequest.method,body_sha256:await purchaseSha256(await purchaseBody(identityRequest))};
      } catch (e) {
        // A body too large to hash for purchase binding must not swallow the challenge itself.
        purchaseRequestUnavailable = e instanceof Error ? e.message : String(e);
      }
    }
    const payload = {
      ...(purchaseRequest?{purchase_request:purchaseRequest}:{}),
      ...(purchaseRequestUnavailable?{purchase_request_unavailable:purchaseRequestUnavailable}:{}),
      // x402 MCP transport: the PaymentRequired object sits at the top level of structuredContent.
      ...paymentRequired,
      ...base,
      status: "PAYMENT_REQUIRED",
      http_status: 402,
      payment_required: body,
      payment_required_header: res.headers.get("PAYMENT-REQUIRED"),
      delivery_state: "NOT_DELIVERED",
      ...settlementFields(),
      how_to_pay: paymentPresented
        ? "A payment authorization was presented, but this response does not prove settlement. Inspect the returned reason, wallet, chain and facilitator before signing or retrying."
        : "sign accepts[0] (x402 exact scheme, EIP-3009 transferWithAuthorization under extra.name/version) with your wallet, then call this tool again with the same arguments and either x_payment=<base64 of the payload> or the payload object in _meta[\"x402/payment\"] (x402 MCP transport), not both. The free preview, if any, is in payment_required.csoai.preview.",
    };
    // T11 (6 Oct 2026): a dated amount is said in the human line, built from the challenge itself so it
    // disappears once accepts[0] no longer carries an end date. No amount is typed here.
    const accepts0 = (Array.isArray(paymentRequired.accepts) ? paymentRequired.accepts[0] : undefined) as
      | { csoai_pricing?: { ends_at?: unknown } }
      | undefined;
    const endsAt = accepts0?.csoai_pricing?.ends_at;
    const datedAmount =
      typeof endsAt === "string" && endsAt
        ? ` Launch amount until ${endsAt}; after that this tool asks the standard amount in accepts[0].csoai_pricing.normal_amount_atomic — read accepts[] on every call.`
        : "";
    const summary = `PAYMENT_REQUIRED — ${tool.csoai.route} answered 402; accepts[] carries asset, amount and payTo. ${retryWarning}${datedAmount} ${DOCTRINE}.`;
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(payload) },
        { type: "text" as const, text: summary },
      ],
      structuredContent: payload,
      // isError marks "not delivered — payment required", as the x402 MCP transport requires. It is
      // a challenge, not a fault: nothing was charged unless x_payment was presented.
      isError: true,
    };
  }
  // A deployed route answers with its own JSON, which always names its `schema`. Without that, a 404
  // means the route itself is missing from this origin.
  const routeBody =
    body && typeof body === "object" && !Array.isArray(body) && typeof (body as { schema?: unknown }).schema === "string"
      ? (body as Record<string, unknown>)
      : null;
  if (res.status === 404 && !routeBody) {
    return reply(
      {
        ...base,
        status: "NOT_DEPLOYED",
        http_status: 404,
        delivery_state: "NOT_DELIVERED",
        ...settlementFields(),
        reason: `${tool.csoai.route} is not deployed on this origin (${(tool as PaidTool & { csoai: { deployed_by?: string } }).csoai.deployed_by || "route missing"}); no result is invented`,
        body,
      },
      `NOT_DEPLOYED — ${tool.csoai.route} is 404 on this origin. Nothing invented. ${retryWarning}`,
    );
  }
  const deliveryRecordFields = {
    delivery_record_state: res.headers.get("x-csoai-delivery-record-state"),
    delivery_record_scope: "unsigned bookkeeping for the underlying HTTP body; not this MCP JSON-RPC envelope",
  };
  if (res.ok && res.headers.get("x-csoai-delivery-state") === "PAID_NOT_DELIVERED") {
    return reply({
      ...base, ...deliveryRecordFields, status: "PAID_NOT_DELIVERED", http_status: res.status,
      delivery_state: "NOT_DELIVERED", body,
      ...settlementFields(res.headers.get("x-payment-response")),
    }, "Settlement was reported but the requested output was not delivered; inspect the route before retrying.", true);
  }
  if (res.ok) {
    const paymentResponse = res.headers.get("x-payment-response");
    const delivered = deliveryFields(paymentPresented, paymentResponse);
    const payload = {
      ...base,
      status: "DELIVERED",
      ...deliveryRecordFields,
      http_status: res.status,
      delivery_state: "DELIVERED",
      deliverable: body,
      ...settlementFields(paymentResponse),
      ...delivered,
      payment_response_header: paymentResponse,
    };
    const deliverySummary =
      delivered.delivery_kind === "PREVIEW_OR_FREE"
        ? "Preview or free delivery observed; no payment authorization was presented."
        : delivered.delivery_kind === "DELIVERED_SETTLEMENT_UNCONFIRMED"
          ? "Delivery was observed, but settlement is unconfirmed; inspect the wallet, chain and facilitator before retrying."
          : delivered.delivery_kind === "DELIVERED_RECEIPT_GAP"
            ? "Settlement was reported by the route, but its receipt is missing or unreadable; inspect it before retrying."
            : "Settlement and a JWS receipt were reported by the route; the receipt is present but not independently verified here.";
    return reply(
      payload,
      `DELIVERED — ${tool.csoai.route} HTTP ${res.status}. ${deliverySummary} ${DOCTRINE}.`,
    );
  }
  const reportedPayment = res.headers.get("x-payment-response");
  const routeReason = typeof routeBody?.reason === "string" ? routeBody.reason : undefined;
  const refusedNote = reportedPayment
    ? "Settlement was reported by the route; inspect the receipt before retrying."
    : paymentPresented && res.status >= 400 && res.status < 500
      ? "The route refused the request and reported no settlement; nothing was delivered. Correct the arguments before paying again, and inspect the wallet if in doubt."
      : retryWarning;
  return reply(
    {
      ...base,
      status: `HTTP_${res.status}`,
      http_status: res.status,
      ...(routeReason ? { reason: routeReason } : {}),
      delivery_state: "NOT_DELIVERED",
      ...settlementFields(reportedPayment),
      body,
    },
    `HTTP ${res.status} from ${tool.csoai.route}${routeReason ? `: ${routeReason}` : ""} — not delivered; the route's body is passed through, nothing invented. ${refusedNote}`,
    // Nothing was delivered, so this is a failed call whatever the status: an x402 MCP client and a
    // model both read isError to decide whether to correct the arguments.
    true,
  );
}

export async function handlePaidTool(
  id: unknown,
  name: string,
  args: Record<string, unknown>,
  origin: string,
): Promise<Response> {
  return rpc(id, await paidToolResult(name, args, origin));
}
