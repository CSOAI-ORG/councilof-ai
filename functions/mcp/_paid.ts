/**
 * Paid MCP tools on Pages /mcp — thin, honest wrappers over the x402-metered routes.
 *
 * Definitions: ./paid-tools.json. Payment is the `x_payment` ARGUMENT and this module sets the
 * X-PAYMENT header itself, so nothing here is HTTP-only in principle — the stdio server reads the
 * same file and carries the same four. The eight free tools in
 * ./gspc-tools.json are untouched.
 *
 * MECHANISM: a paid tool forwards to its route on the SAME origin with the caller's `x_payment`
 * argument as the X-PAYMENT header (verbatim; this module never inspects, signs or invents a
 * receipt — settlement is the route's job via functions/api/_x402.ts, fail-closed). The route's
 * reply comes back as structuredContent in three honest states:
 *   402 → status PAYMENT_REQUIRED: the full x402 v2 body (accepts[], extensions.bazaar, csoai
 *         preview) + the PAYMENT-REQUIRED header, so an MCP client pays from its own wallet and
 *         calls again with x_payment. isError:false — a challenge is an answer, not a failure.
 *   2xx → status DELIVERED: the route body + the X-PAYMENT-RESPONSE settle echo when present.
 *   404 → status NOT_DEPLOYED: the route is not on this origin — said plainly, never a fabricated
 *         result.
 *   other → status = the HTTP status, body passed through.
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
      u.searchParams.set("from", str("from"));
      if (str("to")) u.searchParams.set("to", str("to"));
      if (flag("preview")) u.searchParams.set("preview", "1");
      break;
    }
    default:
      return { error: `no request builder for ${name}` };
  }
  return {
    req: new Request(u.toString(), {
      method,
      headers,
      ...(body ? { body } : {}),
    }),
    route,
  };
}

export async function paidToolResult(
  name: string,
  args: Record<string, unknown>,
  origin: string,
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

  if ("error" in built)
    return reply(
      { ...base, status: "BAD_ARGUMENTS", reason: built.error },
      `BAD_ARGUMENTS — ${built.error}`,
      true,
    );

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
        ...settlementFields(),
      },
      `UNREADABLE_RESPONSE — ${tool.csoai.route} answered, but delivery could not be established. ${retryWarning}`,
      true,
    );
  }
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 2000) };
  }

  if (res.status === 402) {
    const payload = {
      ...base,
      status: "PAYMENT_REQUIRED",
      http_status: 402,
      payment_required: body,
      payment_required_header: res.headers.get("PAYMENT-REQUIRED"),
      delivery_state: "NOT_DELIVERED",
      ...settlementFields(),
      how_to_pay: paymentPresented
        ? "A payment authorization was presented, but this response does not prove settlement. Inspect the returned reason, wallet, chain and facilitator before signing or retrying."
        : "sign accepts[0] (x402 exact scheme, EIP-3009 transferWithAuthorization under extra.name/version) with your wallet, base64 the payload, and call this tool again with x_payment=<that value>. The free preview, if any, is in payment_required.csoai.preview.",
    };
    return reply(
      payload,
      `PAYMENT_REQUIRED — ${tool.csoai.route} answered 402; accepts[] carries asset, amount and payTo. ${retryWarning} ${DOCTRINE}.`,
    );
  }
  if (res.status === 404) {
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
  if (res.ok) {
    const paymentResponse = res.headers.get("x-payment-response");
    const payload = {
      ...base,
      status: "DELIVERED",
      http_status: res.status,
      delivery_state: "DELIVERED",
      deliverable: body,
      ...settlementFields(paymentResponse),
      payment_response_header: paymentResponse,
    };
    return reply(
      payload,
      `DELIVERED — ${tool.csoai.route} HTTP ${res.status}. ${paymentResponse ? "Settlement was reported by the route." : retryWarning} ${DOCTRINE}.`,
    );
  }
  const reportedPayment = res.headers.get("x-payment-response");
  return reply(
    {
      ...base,
      status: `HTTP_${res.status}`,
      http_status: res.status,
      delivery_state: "NOT_DELIVERED",
      ...settlementFields(reportedPayment),
      body,
    },
    `HTTP ${res.status} from ${tool.csoai.route} — passed through, nothing invented. ${reportedPayment ? "Settlement was reported by the route; inspect the receipt before retrying." : retryWarning}`,
    res.status >= 500,
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
