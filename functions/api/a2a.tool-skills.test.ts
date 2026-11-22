/**
 * The per-tool A2A skills: metered tool execution on POST /api/a2a (2026-11-16).
 *
 * Every card in public/.well-known/agents/ names JSONRPC https://councilof.ai/api/a2a as its
 * interface, and every card but evidence_bundle's gives SendMessage {"skill":"<tool>","input":{}}
 * as its first example. Until this date the router answered every one of them "unknown skill",
 * the paid tools included, so the cards promised a door that refused them. These tests hold the
 * cards and the router to one set, and hold the A2A answer to what POST /mcp answers for the
 * same tool and the same arguments: the same validation, the same dispatch, the same payment
 * path. A refused input reaches no route, and no payment is read from anywhere but
 * input.x_payment or the x402 A2A transport's message.metadata["x402.payment.payload"].
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { METERED_TOOL_SKILL_IDS, SKILL_IDS, TOOL_SKILL_IDS, onRequestGet, onRequestPost } from "./a2a";
import { toolInputError } from "../mcp/_dispatch";
import { onRequest as mcpOnRequest } from "../mcp/[[path]]";
import PAID from "../mcp/paid-tools.json";
import FREE from "../mcp/gspc-tools.json";

const here = path.dirname(fileURLToPath(import.meta.url));
const CARDS = path.resolve(here, "../../public/.well-known/agents");
const ORIGIN = "https://councilof.ai";

afterEach(() => vi.unstubAllGlobals());

type Card = {
  mcp_tool?: string;
  supportedInterfaces?: Array<{ url: string }>;
  skills?: Array<{ id: string; examples?: string[] }>;
};
const cards = (): Array<{ file: string; card: Card }> =>
  readdirSync(CARDS)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((file) => ({ file, card: JSON.parse(readFileSync(path.join(CARDS, file), "utf8")) as Card }));

const a2a = async (data: unknown, headers: Record<string, string> = { "a2a-version": "1.0" }) => {
  const res = await onRequestPost({
    request: new Request(`${ORIGIN}/api/a2a`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 7,
        method: "SendMessage",
        params: { message: { messageId: "m-tool", role: "ROLE_USER", parts: [{ data, mediaType: "application/json" }] } },
      }),
    }),
  } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await res.json()) as any;
};

/** SendMessage with message-level metadata: where the x402 A2A transport carries its payment. */
const a2aMessage = async (metadata: Record<string, unknown>, data: unknown) => {
  const res = await onRequestPost({
    request: new Request(`${ORIGIN}/api/a2a`, {
      method: "POST",
      headers: { "content-type": "application/json", "a2a-version": "1.0" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 9,
        method: "SendMessage",
        params: { message: { messageId: "m-x402", role: "ROLE_USER", metadata, parts: [{ data, mediaType: "application/json" }] } },
      }),
    }),
  } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await res.json()) as any;
};

/** The route reads X-PAYMENT with atob then JSON.parse, as functions/api/_x402.ts does. */
const routeDecodes = (header: string | null) => JSON.parse(atob(header ?? ""));

/** POST /mcp tools/call, decoded from SSE or JSON, so the two doors can be compared. */
const mcpCall = async (name: string, args: Record<string, unknown>) => {
  const res = await mcpOnRequest({
    request: new Request(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-03-26",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name, arguments: args } }),
    }),
    env: {},
    params: {},
  } as never);
  const text = await res.text();
  if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) return JSON.parse(text).result;
  const line = text.split("\n").find((l) => l.startsWith("data:"));
  return JSON.parse((line ?? "data: {}").slice(5)).result;
};

/** A fake origin for the paid routes: 402 with an x402 v2 challenge, 200 once X-PAYMENT is present. */
const CHALLENGE = {
  x402Version: 2,
  resource: { url: `${ORIGIN}/api/evidence-bundle?obligation=article-50&bundle=1` },
  accepts: [{ scheme: "exact", network: "eip155:8453", amount: "10000", asset: "0xA0b8", payTo: "0xMERCHANT", maxTimeoutSeconds: 60 }],
};
const stubPaidRoute = () => {
  const seen: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const req = input instanceof Request ? input : new Request(String(input));
      seen.push(req);
      if (req.headers.get("x-payment")) {
        return new Response(JSON.stringify({ bundle: "assembled" }), {
          status: 200,
          headers: { "content-type": "application/json", "x-payment-response": btoa(JSON.stringify({ success: true })) },
        });
      }
      return new Response(JSON.stringify(CHALLENGE), {
        status: 402,
        headers: { "content-type": "application/json", "PAYMENT-REQUIRED": btoa(JSON.stringify(CHALLENGE)) },
      });
    }),
  );
  return seen;
};

describe("the per-tool cards and the router are one set", () => {
  it("every per-tool card names a skill the router accepts, and the router accepts no tool without a card", () => {
    const advertised = cards().flatMap(({ card }) => (card.skills ?? []).map((s) => s.id));
    expect([...advertised].sort()).toEqual([...TOOL_SKILL_IDS].sort());
  });

  it("every per-tool card names this door, and describes the tool its skill runs", () => {
    for (const { file, card } of cards()) {
      expect(card.supportedInterfaces?.some((i) => i.url === `${ORIGIN}/api/a2a`), `${file} names another door`).toBe(true);
      expect(card.skills?.map((s) => s.id), `${file} runs a different tool than it describes`).toEqual([card.mcp_tool]);
    }
  });

  it("the set is derived from the definitions /mcp serves, and the metered subset is the paid file", () => {
    expect([...TOOL_SKILL_IDS].sort()).toEqual([...FREE.tools, ...PAID.tools].map((t) => t.name).sort());
    expect([...METERED_TOOL_SKILL_IDS].sort()).toEqual(PAID.tools.map((t) => t.name).sort());
  });

  it("no per-tool skill shadows a main-card skill", () => {
    expect(TOOL_SKILL_IDS.filter((id) => (SKILL_IDS as readonly string[]).includes(id))).toEqual([]);
  });
});

/** The {skill,input} selector after "Part.data " in an example string (balanced braces), or null. */
const selectorIn = (example: string): { skill?: unknown; input?: unknown } | null => {
  const at = example.indexOf("Part.data {");
  if (at < 0) return null;
  const start = example.indexOf("{", at);
  for (let depth = 0, i = start; i < example.length; i++) {
    if (example[i] === "{") depth++;
    if (example[i] === "}" && --depth === 0) return JSON.parse(example.slice(start, i + 1));
  }
  return null;
};

/**
 * A card example is an instruction a stranger copies. Until 2026-11-16 seven cards gave an example
 * for their own skill with input {} although the tool requires an argument, so the door refused the
 * card's own example as INVALID_SKILL_INPUT, and three cards gave none for their own skill at all.
 */
describe("every per-tool card's own example runs on this door", () => {
  it("each card gives a SendMessage example for its own skill whose input passes the tool's validation", async () => {
    for (const { file, card } of cards()) {
      const own = (card.skills?.[0]?.examples ?? []).map(selectorIn).filter((s) => s?.skill === card.mcp_tool);
      expect(own.length, `${file} has no SendMessage example for its own skill`).toBeGreaterThan(0);
      for (const selector of own) {
        expect(await toolInputError(String(selector!.skill), (selector!.input ?? {}) as Record<string, unknown>), `${file}: ${JSON.stringify(selector)}`).toBeNull();
      }
    }
  });

  it("an example that names another skill names one this router accepts", () => {
    for (const { file, card } of cards()) {
      for (const selector of (card.skills?.[0]?.examples ?? []).map(selectorIn).filter(Boolean)) {
        const skill = String(selector!.skill);
        expect(TOOL_SKILL_IDS.includes(skill) || (SKILL_IDS as readonly string[]).includes(skill), `${file} names ${skill}`).toBe(true);
      }
    }
  });
});

describe("metered tool execution on POST /api/a2a", () => {
  it("with no x_payment: the route is asked once, without X-PAYMENT, and its 402 challenge comes back; nothing is charged", async () => {
    const seen = stubPaidRoute();
    const body = await a2a({ skill: "evidence_bundle", input: { obligation: "article-50" } });
    expect(body.error).toBeUndefined();
    expect(seen).toHaveLength(1);
    const asked = new URL(seen[0].url);
    expect(asked.pathname).toBe("/api/evidence-bundle");
    expect(asked.searchParams.get("bundle")).toBe("1");
    expect(seen[0].headers.get("x-payment")).toBeNull();

    const [text, data] = body.result.message.parts;
    expect(data.data).toMatchObject({ kind: "TOOL_RESULT", skill: "evidence_bundle", metered: true, state: "PAYMENT_REQUIRED" });
    const sc = data.data.result.structuredContent;
    expect(data.data.result.isError).toBe(true);
    expect(sc.x402Version).toBe(2);
    expect(sc.accepts).toEqual(CHALLENGE.accepts);
    expect(sc).toMatchObject({ status: "PAYMENT_REQUIRED", delivery_state: "NOT_DELIVERED", payment_presented: false, nothing_charged: true });
    expect(text.text).toContain("nothing was charged");
    expect(text.text).toContain("input.x_payment");
  });

  it("with input.x_payment: the value is forwarded verbatim as X-PAYMENT and the route's settlement echo is reported, not invented", async () => {
    const seen = stubPaidRoute();
    const body = await a2a({ skill: "evidence_bundle", input: { obligation: "article-50", x_payment: "SIGNED-PAYLOAD-B64" } });
    expect(seen).toHaveLength(1);
    expect(seen[0].headers.get("x-payment")).toBe("SIGNED-PAYLOAD-B64");
    const data = body.result.message.parts[1].data;
    expect(data).toMatchObject({ metered: true, state: "DELIVERED" });
    expect(data.result.structuredContent).toMatchObject({
      status: "DELIVERED",
      payment_presented: true,
      settlement_state: "REPORTED_BY_ROUTE",
      deliverable: { bundle: "assembled" },
    });
  });

  it("a refused input reaches no route and forwards no payment", async () => {
    const seen = stubPaidRoute();
    const missing = await a2a({ skill: "commission_card", input: {} });
    expect(missing.error.code).toBe(-32602);
    expect(missing.error.data[0].reason).toBe("INVALID_SKILL_INPUT");
    expect(missing.error.message).toContain('required property "subject"');
    const extra = await a2a({ skill: "evidence_bundle", input: { obligation: "article-50", x_payment: "SIGNED", smuggled: 1 } });
    expect(extra.error.data[0].reason).toBe("INVALID_SKILL_INPUT");
    expect(seen).toHaveLength(0);
  });

  it("payment is never read from HTTP headers or part metadata: the challenge, nothing charged", async () => {
    const seen = stubPaidRoute();
    const res = await onRequestPost({
      request: new Request(`${ORIGIN}/api/a2a`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "a2a-version": "1.0",
          "x-payment": "HEADER-PAYLOAD",
          "payment-signature": "HEADER-V2-PAYLOAD",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 8,
          method: "SendMessage",
          params: {
            message: {
              messageId: "m-meta",
              role: "ROLE_USER",
              parts: [
                {
                  data: { skill: "evidence_bundle", input: { obligation: "article-50" } },
                  metadata: { "x402.payment.payload": { x402Version: 2, payload: { signature: "0xPART" } } },
                },
              ],
            },
          },
        }),
      }),
    } as never);
    const body = await res.json();
    expect(seen).toHaveLength(1);
    expect(seen[0].headers.get("x-payment")).toBeNull();
    expect(seen[0].headers.get("payment-signature")).toBeNull();
    expect(body.result.message.parts[1].data.result.structuredContent.nothing_charged).toBe(true);
    expect(body.result.message.metadata["x402.payment.status"]).toBe("payment-required");
  });

  it("the x402 A2A transport: a PaymentPayload in message.metadata is forwarded, and the reply carries the receipt", async () => {
    const seen = stubPaidRoute();
    // A non-ASCII character in the payload must reach the route unaltered (the route has no UTF-8 step).
    const payload = { x402Version: 2, resource: { description: "bundle — article 50" }, accepted: CHALLENGE.accepts[0], payload: { signature: "0xabc" } };
    const res = await a2aMessage(
      { "x402.payment.status": "payment-submitted", "x402.payment.payload": payload },
      { skill: "evidence_bundle", input: { obligation: "article-50" } },
    );
    expect(seen).toHaveLength(1);
    expect(routeDecodes(seen[0].headers.get("x-payment"))).toEqual(payload);
    const message = res.result.message;
    expect(message.parts[1].data.result.structuredContent.status).toBe("DELIVERED");
    expect(message.parts[1].data.result._meta["x402/payment-response"]).toEqual({ success: true });
    expect(message.metadata["x402.payment.status"]).toBe("payment-completed");
    expect(message.metadata["x402.payment.receipts"]).toEqual([{ success: true }]);
  });

  it("the unpaid challenge names x402.payment.required on the reply message", async () => {
    stubPaidRoute();
    const res = await a2a({ skill: "evidence_bundle", input: { obligation: "article-50" } });
    const metadata = res.result.message.metadata;
    expect(metadata["x402.payment.status"]).toBe("payment-required");
    expect(metadata["x402.payment.required"].accepts).toEqual(CHALLENGE.accepts);
    expect(metadata["x402.payment.receipts"]).toBeUndefined();
  });

  it("both channels at once, or a carried payment that is not an object, is refused before any route is called", async () => {
    const seen = stubPaidRoute();
    const twice = await a2aMessage(
      { "x402.payment.payload": { x402Version: 2 } },
      { skill: "evidence_bundle", input: { obligation: "article-50", x_payment: "SIGNED" } },
    );
    expect(twice.error.code).toBe(-32602);
    expect(twice.error.data[0].reason).toBe("INVALID_SKILL_INPUT");
    expect(twice.error.message).toContain("payment was sent twice");
    expect(twice.error.message).toContain('message.metadata["x402.payment.payload"]');
    const notObject = await a2aMessage(
      { "x402.payment.payload": "METADATA-PAYLOAD" },
      { skill: "evidence_bundle", input: { obligation: "article-50" } },
    );
    expect(notObject.error.data[0].reason).toBe("INVALID_SKILL_INPUT");
    expect(notObject.error.message).toContain('message.metadata["x402.payment.payload"] must be an x402 PaymentPayload object');
    expect(seen).toHaveLength(0);
  });

  it("a null metadata payment is no payment: the challenge, nothing charged", async () => {
    const seen = stubPaidRoute();
    const res = await a2aMessage({ "x402.payment.payload": null }, { skill: "evidence_bundle", input: { obligation: "article-50" } });
    expect(seen).toHaveLength(1);
    expect(seen[0].headers.get("x-payment")).toBeNull();
    expect(res.result.message.metadata["x402.payment.status"]).toBe("payment-required");
  });

  it("a free skill never reads a carried payment: no request carries it, no x402 metadata", async () => {
    const seen = stubPaidRoute();
    const res = await a2aMessage(
      { "x402.payment.payload": "not even an object" },
      { skill: "board_totals", input: {} },
    );
    expect(res.result.message.parts[1].data.metered).toBe(false);
    expect(res.result.message.metadata).toBeUndefined();
    expect(seen.every((r) => r.headers.get("x-payment") === null)).toBe(true);
  });

  it("verification stays free on this door: no verify tool is metered", () => {
    const verifiers = TOOL_SKILL_IDS.filter((id) => id.startsWith("verify"));
    expect(verifiers.length).toBeGreaterThan(0);
    expect(verifiers.filter((id) => METERED_TOOL_SKILL_IDS.includes(id))).toEqual([]);
  });

  it("the A2A answer is the /mcp answer: same tool, same arguments, same structured result", async () => {
    stubPaidRoute();
    const viaMcp = await mcpCall("evidence_bundle", { obligation: "article-50" });
    const viaA2a = (await a2a({ skill: "evidence_bundle", input: { obligation: "article-50" } })).result.message.parts[1].data.result;
    expect(viaA2a.isError).toBe(viaMcp.isError);
    expect(viaA2a.structuredContent).toEqual(viaMcp.structuredContent);
  });

  it("a 0.3 client reaches the same tool: message/send with a data part", async () => {
    stubPaidRoute();
    const res = await onRequestPost({
      request: new Request(`${ORIGIN}/api/a2a`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "message/send",
          params: { message: { kind: "message", role: "user", parts: [{ kind: "data", data: { skill: "rwa_evidence", input: { asset: "RLUSD" } } }] } },
        }),
      }),
    } as never);
    const body = await res.json();
    expect(body.result.kind).toBe("message");
    expect(body.result.parts[1]).toMatchObject({ kind: "data", data: { skill: "rwa_evidence", metered: true, state: "PAYMENT_REQUIRED" } });
  });
});

describe("free per-tool skills run through the same dispatch", () => {
  it("a free tool is answered with its /mcp result and is never metered", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("unreachable in this test", { status: 503 })));
    const viaMcp = await mcpCall("get_root", {});
    const viaA2a = (await a2a({ skill: "get_root", input: {} })).result.message.parts[1].data;
    expect(viaA2a).toMatchObject({ kind: "TOOL_RESULT", skill: "get_root", metered: false });
    expect(viaA2a.result.isError).toBe(viaMcp.isError);
    expect(Object.keys(viaA2a.result.structuredContent ?? {}).sort()).toEqual(Object.keys(viaMcp.structuredContent ?? {}).sort());
  });
});

describe("GET /api/a2a names the per-tool skills it serves", () => {
  it("derived ids, the metered subset and the card index", async () => {
    const res = await onRequestGet({ request: new Request(`${ORIGIN}/api/a2a`) } as never);
    const json = await res.json();
    expect(json.tool_skills.ids).toEqual([...TOOL_SKILL_IDS]);
    expect(json.tool_skills.metered).toEqual([...METERED_TOOL_SKILL_IDS]);
    expect(json.tool_skills.cards).toBe(`${ORIGIN}/.well-known/agents/index.json`);
    expect(json.skills).toEqual([...SKILL_IDS]);
  });
});
