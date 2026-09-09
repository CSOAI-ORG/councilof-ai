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
      settlement_state: string;
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

const FREE_EIGHT = [
  "board_totals",
  "get_axis",
  "verify_card",
  "list_cards",
  "get_root",
  "get_card",
  "verify_inclusion",
  "x402_trust",
];
const PAID_FOUR = [
  "commission_card",
  "art50_marking_evidence",
  "rwa_evidence",
  "receipts_batch",
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
  receipt?: boolean;
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
      if (req.headers.get("x-payment") && opts.paidOk !== false) {
        return new Response(
          JSON.stringify({
            schema: "x",
            kind: "deliverable",
            route: url.pathname,
          }),
          {
            status: 200,
            headers:
              opts.receipt === false
                ? {}
                : { "x-payment-response": "c2V0dGxlZA==" },
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

describe("/mcp tools/list — eight free + four paid, catalogue free, nothing labelled safe", () => {
  it("lists the free eight first and the paid four after, one definitions file each", async () => {
    const r = await call(rpc("tools/list"));
    const names = r.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual([...FREE_EIGHT, ...PAID_FOUR]);
    expect((FREE as { tools: unknown[] }).tools).toHaveLength(8);
    expect((PAID as { tools: unknown[] }).tools).toHaveLength(4);
    expect([...PAID_TOOL_NAMES]).toEqual(PAID_FOUR);
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

  it("the free eight definitions are byte-identical to what the stdio server reads (no drift)", async () => {
    const { readFileSync } = await import("node:fs");
    const canonical = JSON.parse(
      readFileSync(new URL("./gspc-tools.json", import.meta.url), "utf8"),
    );
    expect(canonical.tools.map((t: { name: string }) => t.name)).toEqual(
      FREE_EIGHT,
    );
    expect(
      canonical.tools.some((t: { name: string }) => PAID_FOUR.includes(t.name)),
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
    expect(g.paid_tools.names).toEqual(PAID_FOUR);
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
    expect(i.result.serverInfo.version).toBe("1.4.2");
    expect(i.result.instructions).toMatch(/Eight free read-only tools/);
    expect(i.result.instructions).toMatch(/four paid x402 tools/i);
    expect(i.result.instructions).toMatch(/witness_hash is quarantined/);
    expect(i.result.instructions).toMatch(/Measurement, not certification/);
    expect(i.result.instructions).toMatch(MECHANISM);
    expect(i.result.instructions).not.toMatch(WRONG_REASON);
  });
});

describe("/mcp tools/call — paid tools", () => {
  it("unpaid: returns the route's 402 challenge as structuredContent (not an error), forwarding exactly the route path", async () => {
    const seen = stubOrigin({
      deployed: ["/api/request-attestation", "/api/receipts/batch"],
    });
    const r = await call(
      rpc("tools/call", {
        name: "commission_card",
        arguments: { subject: "qwen3", axis: "gov" },
      }),
    );
    expect(r.result.isError).toBe(false);
    const sc = r.result.structuredContent;
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
    expect(r.result.content[0].text).toMatch(/^PAYMENT_REQUIRED/);
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
    expect(r.result.content[0].text).toMatch(
      /inspect the wallet, chain and facilitator before .*retrying/i,
    );
    expect(JSON.stringify(r)).not.toContain(token);
  });

  it("paid: forwards x_payment as the X-PAYMENT header verbatim and returns the deliverable + settle echo", async () => {
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
    expect(sc.payment_response_header).toBe("c2V0dGxlZA==");
    expect(sc.payment_presented).toBe(true);
    expect(sc.delivery_state).toBe("DELIVERED");
    expect(sc.settlement_state).toBe("REPORTED_BY_ROUTE");
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
    expect(sc.settlement_state).toBe("UNCONFIRMED");
    expect(sc.payment_response_header).toBeNull();
    expect(sc.nothing_charged).toBeUndefined();
    expect(r.result.content[0].text).toMatch(/Settlement is unconfirmed/);
    expect(JSON.stringify(r)).not.toContain(token);
  });

  it("preview=true is forwarded as the free preview flag (no payment needed)", async () => {
    const seen = stubOrigin({ deployed: ["/api/receipts/batch"] });
    await call(
      rpc("tools/call", {
        name: "receipts_batch",
        arguments: { from: "2026-08-31T00:00:00Z", preview: true },
      }),
    );
    expect(new URL(seen[0].url).searchParams.get("preview")).toBe("1");
  });

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

  it("bad arguments are refused before any fetch; the free eight still dispatch to their own handler", async () => {
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
    expect(g.install.claude_code).toMatch(/npx -y csoai-gspc-mcp/);
    expect(g.install.no_install_at_all).toMatch(/api\/gspc/);
    // A checkout is a fallback, never the headline.
    expect(JSON.stringify(g.install)).not.toMatch(/git clone|index\.mjs/);
  });
});
