import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { PAID_TOOL_NAMES, buildPaidRequest } from "./_paid";
import PAID from "./paid-tools.json";
import FREE from "./gspc-tools.json";

const ORIGIN = "https://councilof.ai";
const LEGACY_PROTOCOL = "2025-03-26";
const rpc = (method: string, params?: unknown, id = 1) => ({
  jsonrpc: "2.0",
  id,
  method,
  ...(params ? { params } : {}),
});

type Envelope = {
  jsonrpc: string;
  id?: unknown;
  result: {
    tools: Array<{ name: string }>;
    serverInfo: { version: string };
    instructions: string;
    isError: boolean;
    content: Array<{ type: string; text: string }>;
    structuredContent: {
      status: string;
      payment_required: { accepts: Array<Record<string, unknown>> };
      payment_required_header: string | null;
      nothing_charged?: boolean;
      payment_presented: boolean;
      delivery_state: string;
      delivery_kind: string;
      settlement_state: string;
      receipt_state: string;
      receipt_gap?: string;
      not_a_certification: boolean;
      deliverable: Record<string, unknown>;
      payment_response_header: string | null;
      reason: string;
    };
  };
  error: { code: number; message: string };
};

async function decode(response: Response, id: unknown): Promise<Envelope> {
  const text = await response.text();
  if (
    !(response.headers.get("content-type") ?? "").includes("text/event-stream")
  ) {
    return JSON.parse(text) as Envelope;
  }
  const messages = text
    .replace(/\r\n/g, "\n")
    .split(/\n\n/)
    .flatMap((event) => {
      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""))
        .join("\n");
      return data && data !== "[DONE]" ? [JSON.parse(data) as Envelope] : [];
    });
  const message =
    messages.find((candidate) => candidate.id === id) ?? messages.at(-1);
  if (!message)
    throw new Error("SSE response did not contain a JSON-RPC result");
  return message;
}

const call = async (
  body: Record<string, unknown>,
  env: Record<string, unknown> = {},
) => {
  const response = await onRequest({
    request: new Request(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": LEGACY_PROTOCOL,
      },
      body: JSON.stringify(body),
    }),
    env,
    params: {},
  } as never);
  return decode(response, body.id);
};

const FREE_LIST = [
  "board_totals",
  "get_axis",
  "verify_card",
  "list_cards",
  "get_root",
  "get_card",
  "verify_inclusion",
  "x402_trust",
  "mcp_trust",
  "measurement_index",
  "verify_capsule",
  "server_evidence",
  "evidence_bundle_preview",
  "route",
];
const PAID_LIST = [
  "commission_card",
  "art50_marking_evidence",
  "rwa_evidence",
  "receipts_batch",
  "evidence_bundle",
];

/**
 * The reason that was false, in the shapes it was written in across seven places on 4 Sep 2026:
 * "stdio has no payment header", "stdio stays free-only", "paid tools are NOT mirrored here by design".
 * Payment travels as the `x_payment` ARGUMENT and each door sets the X-PAYMENT header itself, so which
 * tools a package carries is a packaging choice and never a property of the transport. These assertions
 * exist so the wrong reason cannot come back, and so no document here pins another package's tool list.
 */
const WRONG_REASON =
  /free-only|no payment header|carries no payment header|cannot carry a payment header/i;

/**
 * The mechanism, asserted BESIDE the negative on every surface. The negative alone is passed by a
 * document that simply deletes the explanation, which would leave a guard that looks like it is
 * watching and is not. Both directions are proven: restoring the old sentence turns these red, and
 * so does removing the mechanism sentence without restoring anything.
 */
const MECHANISM = /x_payment\s+ARGUMENT/i;

/** A fake origin: routes answer 402 (with a v2 body + header), 200 when x-payment is present, 404 when absent. */
function stubOrigin(opts: {
  deployed: string[];
  paidOk?: boolean;
  receipt?: boolean | "gap" | "unreadable";
  errorStatus?: number;
}) {
  const seen: Request[] = [];
  vi.stubGlobal(
    "fetch",
    async (u: string | URL | Request, init?: RequestInit) => {
      const req = u instanceof Request ? u : new Request(String(u), init);
      seen.push(req);
      const url = new URL(req.url);
      if (!opts.deployed.includes(url.pathname))
        return new Response(JSON.stringify({ error: "not_found" }), {
          status: 404,
        });
      if (opts.errorStatus)
        return new Response(JSON.stringify({ error: "upstream_error" }), {
          status: opts.errorStatus,
        });
      if (
        (req.headers.get("x-payment") && opts.paidOk !== false) ||
        url.searchParams.get("preview") === "1"
      ) {
        const settlementResponse = btoa(
          JSON.stringify({
            success: true,
            transaction: `0x${"a".repeat(64)}`,
            ...(opts.receipt === "gap"
              ? {}
              : {
                  extensions: {
                    "offer-receipt": {
                      info: {
                        receipt: {
                          format: "jws",
                          signature: "eyJhbGciOiJFZERTQSJ9.eyJ2ZXJzaW9uIjoxfQ.c2ln",
                        },
                      },
                    },
                  },
                }),
          }),
        );
        return new Response(
          JSON.stringify({
            schema: "x",
            kind: "deliverable",
            route: url.pathname,
          }),
          {
            status: 200,
            headers:
              !req.headers.get("x-payment") || opts.receipt === false
                ? {}
                : {
                    "x-payment-response":
                      opts.receipt === "unreadable"
                        ? "not-base64"
                        : settlementResponse,
                  },
          },
        );
      }
      const pr = {
        x402Version: 2,
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453",
            amount: "100000",
            payTo: "0xpay",
          },
        ],
        extensions: { bazaar: { info: {}, schema: {} } },
        csoai: { preview: { route: url.pathname } },
      };
      return new Response(JSON.stringify(pr), {
        status: 402,
        headers: { "PAYMENT-REQUIRED": btoa(JSON.stringify(pr)) },
      });
    },
  );
  return seen;
}
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Network is mocked: unexpected subrequest");
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("/mcp tools/list — the free list then the paid list, catalogue free, nothing labelled safe", () => {
  it("lists the free tools first and the paid tools after, one definitions file each", async () => {
    const r = await call(rpc("tools/list"));
    const names = r.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual([...FREE_LIST, ...PAID_LIST]);
    expect((FREE as { tools: unknown[] }).tools).toHaveLength(FREE_LIST.length);
    expect((PAID as { tools: unknown[] }).tools).toHaveLength(PAID_LIST.length);
    expect([...PAID_TOOL_NAMES]).toEqual(PAID_LIST);
  });

  it("every paid definition says PAID, names measurement not certification, and never 'safe' / 'verified registry'", () => {
    for (const t of (
      PAID as {
        tools: {
          name: string;
          description: string;
          inputSchema: { properties: Record<string, unknown> };
          csoai: { paid: boolean; route: string };
        }[];
      }
    ).tools) {
      expect(t.description, t.name).toMatch(/^PAID \(x402/);
      expect(t.description, t.name).toMatch(
        /[Mm]easurement, not certification|never a conformity|not a rating|never a conclusion/,
      );
      expect(t.description, t.name).not.toMatch(
        /\bsafe\b|verified registry|approved/i,
      );
      expect(t.inputSchema.properties, t.name).toHaveProperty("x_payment");
      expect(t.csoai.paid).toBe(true);
      expect(t.csoai.route).toMatch(/^\/api\//);
    }
    // The note must give the MECHANISM, which cannot go stale, and must never again give the
    // reason that was false: payment is the x_payment ARGUMENT, so a transport never carries it.
    expect((PAID as { note: string }).note).toMatch(MECHANISM);
    expect((PAID as { note: string }).note).not.toMatch(WRONG_REASON);
    expect(JSON.stringify(PAID)).not.toMatch(/[£$€]\s?\d/);
  });

  it("the free definitions are byte-identical to what the stdio server reads (no drift)", async () => {
    const { readFileSync } = await import("node:fs");
    const canonical = JSON.parse(
      readFileSync(new URL("./gspc-tools.json", import.meta.url), "utf8"),
    );
    expect(canonical.tools.map((t: { name: string }) => t.name)).toEqual(
      FREE_LIST,
    );
    expect(
      canonical.tools.some((t: { name: string }) => PAID_LIST.includes(t.name)),
    ).toBe(false);
  });

  it("GET /mcp discovery and initialize name the paid tools and give the mechanism, not a stale tool list", async () => {
    const g = await (
      await onRequest({
        request: new Request(`${ORIGIN}/mcp`),
        env: {},
        params: {},
      } as never)
    ).json();
    expect(g.paid_tools.names).toEqual(PAID_LIST);
    expect(g.paid_tools.doctrine).toMatch(/measurement, not certification/);
    // stdio_alternative must not assert what another package's current version ships — that drifts on
    // its release schedule. It states the mechanism instead.
    expect(g.stdio_alternative).toMatch(MECHANISM);
    expect(g.stdio_alternative).not.toMatch(WRONG_REASON);
    const i = await call(
      rpc("initialize", {
        protocolVersion: LEGACY_PROTOCOL,
        capabilities: {},
        clientInfo: { name: "t", version: "0" },
      }),
    );
    expect(i.result.serverInfo.version).toBe("1.4.4");
    // Counts are derived from the two definition files, never typed (2026-09-15: the text said
    // "Eight free" while tools/list served nine free tools).
    expect(i.result.instructions).toContain(`${FREE.tools.length} free read-only tools`);
    expect(i.result.instructions).toContain(`${PAID.tools.length} paid x402 tools`);
    const listed = await call(rpc("tools/list", {}, 7));
    expect(listed.result.tools.length).toBe(FREE.tools.length + PAID.tools.length);
    expect(i.result.instructions).toMatch(/witness_hash is quarantined/);
    expect(i.result.instructions).toMatch(/Measurement, not certification/);
    expect(i.result.instructions).toMatch(MECHANISM);
    expect(i.result.instructions).not.toMatch(WRONG_REASON);
  });
});

describe("/mcp tools/call — paid tools", () => {
  it("unpaid: returns the route's 402 challenge per the x402 MCP transport (isError:true, PaymentRequired at the top level), forwarding exactly the route path", async () => {
    const seen = stubOrigin({
      deployed: ["/api/request-attestation", "/api/receipts/batch"],
    });
    const r = await call(
      rpc("tools/call", {
        name: "commission_card",
        arguments: { subject: "qwen3", axis: "gov" },
      }),
    );
    // x402 transports-v2/mcp.md: "servers MUST return a tool result with isError: true containing
    // the PaymentRequired data" — structuredContent holds x402Version + accepts, and content[0].text
    // is the same object as JSON. Until 2026-09-26 this was isError:false with the challenge nested.
    expect(r.result.isError).toBe(true);
    const sc = r.result.structuredContent as unknown as Record<string, unknown> & Envelope["result"]["structuredContent"];
    expect(sc.x402Version).toBe(2);
    expect((sc.accepts as Array<Record<string, unknown>>)[0]).toMatchObject({ scheme: "exact", network: "eip155:8453", payTo: "0xpay" });
    expect(JSON.parse(r.result.content[0].text)).toEqual(sc);
    expect(r.result.content[1].text).toMatch(/^PAYMENT_REQUIRED/);
    expect(sc.status).toBe("PAYMENT_REQUIRED");
    expect(sc.payment_required.accepts[0]).toMatchObject({
      scheme: "exact",
      network: "eip155:8453",
      payTo: "0xpay",
    });
    expect(sc.payment_required_header).toBeTruthy();
    expect(sc.nothing_charged).toBe(true);
    expect(sc.payment_presented).toBe(false);
    expect(sc.delivery_state).toBe("NOT_DELIVERED");
    expect(sc.settlement_state).toBe("NOT_REQUESTED");
    expect(sc.not_a_certification).toBe(true);
    expect(seen).toHaveLength(1);
    const u = new URL(seen[0].url);
    expect(u.origin + u.pathname).toBe(`${ORIGIN}/api/request-attestation`);
    expect(u.searchParams.get("subject")).toBe("qwen3");
    expect(u.searchParams.get("axis")).toBe("gov");
    expect(seen[0].headers.get("x-payment")).toBeNull();
  });

  it("a repeated 402 after x_payment keeps settlement unconfirmed and never tells the caller to retry blindly", async () => {
    stubOrigin({
      deployed: ["/api/request-attestation"],
      paidOk: false,
    });
    const token = "eyJ4NDAyIjoicHJlc2VudGVkIn0=";
    const r = await call(
      rpc("tools/call", {
        name: "commission_card",
        arguments: { subject: "qwen3", x_payment: token },
      }),
    );
    const sc = r.result.structuredContent;
    expect(sc.status).toBe("PAYMENT_REQUIRED");
    expect(sc.payment_presented).toBe(true);
    expect(sc.delivery_state).toBe("NOT_DELIVERED");
    expect(sc.settlement_state).toBe("UNCONFIRMED");
    expect(sc.nothing_charged).toBeUndefined();
    expect(r.result.isError).toBe(true);
    expect(r.result.content[1].text).toMatch(
      /inspect the wallet, chain and facilitator before .*retrying/i,
    );
    expect(JSON.stringify(r)).not.toContain(token);
  });

  // PAYMENT SEMANTICS UNCHANGED by the 2026-09-26 isError switch: payment is read ONLY from the
  // x_payment argument. A client that puts a payload in _meta["x402/payment"] (the x402 MCP
  // transport's field, not read here yet) gets the challenge again, and nothing is forwarded.
  it("a payload sent only in _meta['x402/payment'] is not forwarded: same challenge, nothing charged", async () => {
    const seen = stubOrigin({ deployed: ["/api/request-attestation"] });
    const r = await call(
      rpc("tools/call", {
        name: "commission_card",
        arguments: { subject: "qwen3" },
        _meta: { "x402/payment": { x402Version: 2, payload: { signature: "0xabc" } } },
      }),
    );
    expect(r.result.isError).toBe(true);
    const sc = r.result.structuredContent;
    expect(sc.status).toBe("PAYMENT_REQUIRED");
    expect(sc.payment_presented).toBe(false);
    expect(sc.nothing_charged).toBe(true);
    expect(seen).toHaveLength(1);
    expect(seen[0].headers.get("x-payment")).toBeNull();
  });

  it("paid: keeps delivery distinct while reporting a present, unverified route receipt", async () => {
    const seen = stubOrigin({ deployed: ["/api/receipts/batch"] });
    const r = await call(
      rpc("tools/call", {
        name: "receipts_batch",
        arguments: {
          from: "2026-08-31T00:00:00Z",
          to: "2026-09-01T00:00:00Z",
          x_payment: "eyJ4NDAyIjoxfQ==",
        },
      }),
    );
    const sc = r.result.structuredContent;
    expect(sc.status).toBe("DELIVERED");
    expect(sc.deliverable).toMatchObject({
      kind: "deliverable",
      route: "/api/receipts/batch",
    });
    expect(sc.payment_response_header).toBeTruthy();
    expect(sc.payment_presented).toBe(true);
    expect(sc.delivery_state).toBe("DELIVERED");
    expect(sc.delivery_kind).toBe("DELIVERED_WITH_ROUTE_RECEIPT");
    expect(sc.settlement_state).toBe("REPORTED_BY_ROUTE");
    expect(sc.receipt_state).toBe("PRESENT_UNVERIFIED");
    expect(r.result.content[0].text).toMatch(/not independently verified/i);
    expect(seen[0].headers.get("x-payment")).toBe("eyJ4NDAyIjoxfQ==");
    expect(new URL(seen[0].url).searchParams.get("from")).toBe(
      "2026-08-31T00:00:00Z",
    );
  });

  it("keeps delivery separate from settlement when a 2xx route omits its receipt header", async () => {
    stubOrigin({
      deployed: ["/api/receipts/batch"],
      receipt: false,
    });
    const token = "eyJ4NDAyIjoibm8tcmVjZWlwdCJ9";
    const r = await call(
      rpc("tools/call", {
        name: "receipts_batch",
        arguments: {
          from: "2026-08-31T00:00:00Z",
          x_payment: token,
        },
      }),
    );
    const sc = r.result.structuredContent;
    expect(sc.status).toBe("DELIVERED");
    expect(sc.delivery_state).toBe("DELIVERED");
    expect(sc.delivery_kind).toBe("DELIVERED_SETTLEMENT_UNCONFIRMED");
    expect(sc.settlement_state).toBe("UNCONFIRMED");
    expect(sc.receipt_state).toBe("ABSENT");
    expect(sc.payment_response_header).toBeNull();
    expect(sc.nothing_charged).toBeUndefined();
    expect(r.result.content[0].text).toMatch(/settlement is unconfirmed/i);
    expect(JSON.stringify(r)).not.toContain(token);
  });

  it("preview=true is a delivered preview, never a settled paid result", async () => {
    const seen = stubOrigin({ deployed: ["/api/receipts/batch"] });
    const r = await call(
      rpc("tools/call", {
        name: "receipts_batch",
        arguments: { from: "2026-08-31T00:00:00Z", preview: true },
      }),
    );
    expect(new URL(seen[0].url).searchParams.get("preview")).toBe("1");
    expect(r.result.structuredContent).toMatchObject({
      status: "DELIVERED",
      delivery_state: "DELIVERED",
      delivery_kind: "PREVIEW_OR_FREE",
      settlement_state: "NOT_REQUESTED",
      receipt_state: "NOT_REQUESTED",
      nothing_charged: true,
    });
    expect(r.result.content[0].text).toMatch(/preview or free delivery/i);
  });

  it.each([
    ["gap", "MISSING"],
    ["unreadable", "UNREADABLE"],
  ] as const)(
    "reports a delivered receipt gap when the settlement header is %s",
    async (receipt, receiptState) => {
      stubOrigin({ deployed: ["/api/receipts/batch"], receipt });
      const token = `test-only-${receipt}-authorization`;
      const r = await call(
        rpc("tools/call", {
          name: "receipts_batch",
          arguments: {
            from: "2026-08-31T00:00:00Z",
            x_payment: token,
          },
        }),
      );
      expect(r.result.structuredContent).toMatchObject({
        status: "DELIVERED",
        delivery_state: "DELIVERED",
        delivery_kind: "DELIVERED_RECEIPT_GAP",
        settlement_state: "REPORTED_BY_ROUTE",
        receipt_state: receiptState,
      });
      expect(r.result.structuredContent.receipt_gap).toMatch(/do not retry blindly/i);
      expect(r.result.content[0].text).toMatch(/missing or unreadable/i);
      expect(JSON.stringify(r)).not.toContain(token);
    },
  );

  it("a route not on this origin yet answers NOT_DEPLOYED — nothing invented, nothing charged", async () => {
    stubOrigin({ deployed: [] });
    for (const [name, args] of [
      ["art50_marking_evidence", { url: "https://example.org/a.jpg" }],
      ["rwa_evidence", { asset: "RLUSD" }],
    ] as const) {
      const r = await call(rpc("tools/call", { name, arguments: args }));
      expect(r.result.structuredContent.status, name).toBe("NOT_DEPLOYED");
      expect(r.result.structuredContent.payment_presented, name).toBe(false);
      expect(r.result.structuredContent.settlement_state, name).toBe(
        "NOT_REQUESTED",
      );
      expect(r.result.structuredContent.nothing_charged, name).toBe(true);
      // Assert the CONTRACT, not a changelog reference. This previously matched /PR #11(58|62|63)/,
      // which pinned the reason text to three pull requests that have long since merged — so the
      // test enforced stale prose and went red when the prose was corrected to say the routes are
      // live. What must hold is that the refusal names the route and invents nothing.
      expect(r.result.structuredContent.reason, name).toMatch(
        /is not deployed on this origin/,
      );
      expect(r.result.structuredContent.reason, name).toContain(
        String(args && "url" in args ? "/api/art50/marking-evidence" : ""),
      );
      expect(r.result.structuredContent.reason, name).not.toMatch(
        /\b(charged|settled|paid)\b/,
      );
      expect(r.result.isError, name).toBe(false);
    }
  });

  it("a 404 with x_payment never claims the authorization was uncharged", async () => {
    stubOrigin({ deployed: [] });
    const token = "eyJ4NDAyIjoicm91dGUtbWlzc2luZyJ9";
    const r = await call(
      rpc("tools/call", {
        name: "rwa_evidence",
        arguments: { asset: "RLUSD", x_payment: token },
      }),
    );
    const sc = r.result.structuredContent;
    expect(sc.status).toBe("NOT_DEPLOYED");
    expect(sc.payment_presented).toBe(true);
    expect(sc.delivery_state).toBe("NOT_DELIVERED");
    expect(sc.settlement_state).toBe("UNCONFIRMED");
    expect(sc.nothing_charged).toBeUndefined();
    expect(r.result.content[0].text).toMatch(
      /inspect the wallet, chain and facilitator before .*retrying/i,
    );
    expect(JSON.stringify(r)).not.toContain(token);
  });

  it.each([
    [false, "NOT_REQUESTED", true],
    [true, "UNCONFIRMED", undefined],
  ] as const)(
    "keeps generic HTTP errors honest (payment presented=%s)",
    async (presented, settlementState, nothingCharged) => {
      stubOrigin({
        deployed: ["/api/rwa/evidence"],
        errorStatus: 500,
      });
      const token = "eyJ4NDAyIjoiZXJyb3IifQ==";
      const r = await call(
        rpc("tools/call", {
          name: "rwa_evidence",
          arguments: {
            asset: "RLUSD",
            ...(presented ? { x_payment: token } : {}),
          },
        }),
      );
      const sc = r.result.structuredContent;
      expect(sc.status).toBe("HTTP_500");
      expect(sc.delivery_state).toBe("NOT_DELIVERED");
      expect(sc.payment_presented).toBe(presented);
      expect(sc.settlement_state).toBe(settlementState);
      expect(sc.nothing_charged).toBe(nothingCharged);
      if (presented) {
        expect(r.result.content[0].text).toMatch(
          /inspect the wallet, chain and facilitator before .*retrying/i,
        );
        expect(JSON.stringify(r)).not.toContain(token);
      }
    },
  );

  it("an error after a route-reported settlement never invites an unqualified retry", async () => {
    const token = "test-only-error-authorization";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { error: "delivery failed after route reported settlement" },
          {
            status: 500,
            headers: { "x-payment-response": "test-only-receipt" },
          },
        ),
      ),
    );
    const response = await call(
      rpc("tools/call", {
        name: "commission_card",
        arguments: { subject: "test", x_payment: token },
      }),
    );
    expect(response.result.structuredContent).toMatchObject({
      status: "HTTP_500",
      delivery_state: "NOT_DELIVERED",
      settlement_state: "REPORTED_BY_ROUTE",
      payment_response_header: "test-only-receipt",
    });
    expect(response.result.content[0].text).toContain(
      "Settlement was reported by the route; inspect the receipt before retrying.",
    );
    expect(response.result.content[0].text).not.toContain(
      "Settlement is unconfirmed",
    );
    expect(JSON.stringify(response)).not.toContain(token);
  });

  it("bad arguments are refused before any fetch; the free nine still dispatch to their own handler", async () => {
    const seen = stubOrigin({ deployed: [] });
    const r = await call(
      rpc("tools/call", { name: "witness_hash", arguments: {} }),
    );
    // The SDK distinguishes an unknown RPC method (-32601) from an unknown
    // tools/call name, which is an invalid tool argument (-32602).
    expect(r.error).toMatchObject({ code: -32602 });
    expect(r.error.message).toMatch(/not found/i);
    expect(seen).toHaveLength(0);

    const missing = await call(
      rpc("tools/call", { name: "commission_card", arguments: {} }),
    );
    // Required inputs are now rejected by the SDK's canonical JSON Schema
    // validator before the paid callback can build or fetch a request. MCP
    // reports tool-input validation as an isError tool result, not an RPC error.
    expect(missing.result.isError).toBe(true);
    expect(missing.result.content[0].text).toMatch(
      /input validation error.*required property "subject"/i,
    );
    expect(missing.result.structuredContent).toBeUndefined();
    expect(seen).toHaveLength(0);
    // The free tools are untouched by the paid layer: get_root goes to /root.json, not to a paid route.
    await call(rpc("tools/call", { name: "get_root", arguments: {} }));
    expect(seen.map((q) => new URL(q.url).pathname)).toEqual(["/root.json"]);
  });

  it("buildPaidRequest pins each tool to its declared route and never to a caller-supplied URL", () => {
    const b = buildPaidRequest(
      "art50_marking_evidence",
      { bytes_b64: "AAAA", url: "https://evil.example/x" },
      ORIGIN,
    );
    expect("req" in b).toBe(true);
    if ("req" in b) {
      expect(new URL(b.req.url).pathname).toBe("/api/art50/marking-evidence");
      expect(b.req.method).toBe("POST");
    }
    expect(
      buildPaidRequest(
        "witness_hash",
        { sha256: "A".repeat(64), label: "hello" },
        ORIGIN,
      ),
    ).toEqual({ error: "unknown paid tool: witness_hash" });
    expect(buildPaidRequest("nope", {}, ORIGIN)).toEqual({
      error: "unknown paid tool: nope",
    });
  });
});

describe("GET /mcp — the one-command install is at the point of discovery", () => {
  it("names a one-command install and a zero-install path", async () => {
    const g = await (
      await onRequest({
        request: new Request(`${ORIGIN}/mcp`),
        env: {},
        params: {},
      } as never)
    ).json();
    // The shortest real install used to live only in the npm README, which nobody discovering
    // this door would read. If it is not here, discovery leads to "clone the repo" again.
    expect(g.install).toBeTruthy();
    // ONE default line, and it is the free door (no key, read-only). Nothing else claims "default".
    expect(g.install.default).toBe(`claude mcp add --transport http council-of-ai ${ORIGIN}/mcp/free`);
    expect(Object.values(g.install).filter((v) => /\/mcp\/free\b/.test(String(v)))).toHaveLength(1);
    // The npm stdio package is labelled as the lighter, separately versioned implementation.
    expect(g.install.stdio_lite).toMatch(/^deprecated on npm; npx -y csoai-gspc-mcp \(stdio-lite \d+\.\d+\.x: fewer tools/);
    expect(g.install.claude_code).toBeUndefined();
    expect(g.install.any_client).toBeUndefined();
    expect(g.install.no_install_at_all).toMatch(/api\/gspc/);
    // A checkout is a fallback, never the headline.
    expect(JSON.stringify(g.install)).not.toMatch(/git clone|index\.mjs/);
  });
});

// 2026-09-15 end-user test: verify_card returned pinned_key "did:web:csoai.org#card-attestation-1"
// while its own Trust anchor check said the key "is published as did:web:csoai.org#board-attestation-1".
// The label is now the anchor the check matched.
describe("/mcp tools/call verify_card — pinned_key names the anchor that matched", () => {
  const read = (rel: string) => JSON.parse(readFileSync(resolve(__dirname, "../../", rel), "utf8"));
  const verify = async (card: unknown) => {
    vi.stubGlobal("fetch", async () => new Response("not stubbed", { status: 404 }));
    const r = await call(rpc("tools/call", { name: "verify_card", arguments: { card } }, 9));
    return r.result.structuredContent as unknown as { state: string; pinned_key: string | null; checks: Array<{ code: string; detail: string }> };
  };

  it("a board-attestation-1 card reports board-attestation-1", async () => {
    const sc = await verify(read("public/interop/mill-cards-signed/signed-art5-saf-1ee79f215d35.json"));
    expect(sc.state).toBe("VALID");
    expect(sc.pinned_key).toBe("did:web:csoai.org#board-attestation-1");
    expect(sc.checks.find((c) => c.code === "anchor_match")?.detail).toContain(sc.pinned_key);
  });

  it("control: a card-attestation-1 card reports card-attestation-1", async () => {
    const sc = await verify(read("public/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json"));
    expect(sc.state).toBe("VALID");
    expect(sc.pinned_key).toBe("did:web:csoai.org#card-attestation-1");
  });

  it("an unpinned key names no anchor", async () => {
    const card = read("public/interop/mill-cards-signed/signed-art5-saf-1ee79f215d35.json");
    const sc = await verify({ ...card, did: undefined, pubkey: "11".repeat(32) });
    expect(sc.state).toBe("INVALID");
    expect(sc.pinned_key).toBeNull();
  });
});

describe("a dated amount is said in the 402 human line, built from the challenge (T11, 6 Oct 2026)", () => {
  const challenge = (endsAt?: string) => ({
    x402Version: 2,
    accepts: [
      {
        scheme: "exact",
        network: "eip155:8453",
        amount: "1",
        payTo: "0xpay",
        ...(endsAt ? { csoai_pricing: { ends_at: endsAt, normal_amount_atomic: "2", offered_amount_atomic: "1" } } : {}),
      },
    ],
    extensions: { bazaar: { info: {}, schema: {} } },
  });
  const summaryFor = async (endsAt?: string) => {
    const pr = challenge(endsAt);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(pr), { status: 402, headers: { "PAYMENT-REQUIRED": btoa(JSON.stringify(pr)) } })),
    );
    const r = await call(rpc("tools/call", { name: "commission_card", arguments: { subject: "qwen3", axis: "gov" } }));
    return String(r.result.content[1].text);
  };

  it("names the end and the standard-amount FIELD when accepts[0] carries ends_at — never an amount", async () => {
    const line = await summaryFor("2026-10-11T00:00:00Z");
    expect(line).toMatch(/^PAYMENT_REQUIRED/);
    expect(line).toContain("Launch amount until 2026-10-11T00:00:00Z");
    expect(line).toContain("accepts[0].csoai_pricing.normal_amount_atomic");
    expect(line).toContain("read accepts[] on every call");
    expect(line).not.toMatch(/\$\s?\d/);
  });

  it("says nothing about a launch amount once the challenge carries no end date", async () => {
    const line = await summaryFor(undefined);
    expect(line).toMatch(/^PAYMENT_REQUIRED/);
    expect(line).not.toMatch(/launch amount/i);
  });
});
