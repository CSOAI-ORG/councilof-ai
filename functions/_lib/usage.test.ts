import { afterEach, describe, expect, it, vi } from "vitest";

import { PAID_CALL_PAYMENTS, SELF_TOOLS, USAGE_DAY_NOTES, USAGE_DIMS, USAGE_NAME_MAX, cleanName, countDay, paidCallName, parseUsageKey, recordUsage, selfToolOf, usageKey, utcDay } from "./usage";
import { buildUsage } from "../api/usage";
import { a2aPaidCallName, onRequestPost as a2aPost } from "../api/a2a";
import { PAID_TOOL_NAMES } from "../mcp/_paid";
import { onRequestPost as chatPost } from "../api/chat";
import { onRequest as mcpRequest, paidCallPayment } from "../mcp/[[path]]";

/** An in-memory KV with the two calls usage uses. */
function fakeKv() {
  const store = new Map<string, string>();
  return {
    store,
    put: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    list: vi.fn(async ({ prefix, cursor, limit = 1000 }: { prefix: string; cursor?: string; limit?: number }) => {
      const all = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const keys = all.slice(start, start + limit).map((name) => ({ name }));
      const end = start + keys.length;
      return end >= all.length ? { keys, list_complete: true } : { keys, list_complete: false, cursor: String(end) };
    }),
  };
}

const waits: Promise<unknown>[] = [];
const waitUntil = (p: Promise<unknown>) => { waits.push(p); };
const settle = async () => { while (waits.length) await waits.shift(); };

afterEach(() => { vi.unstubAllGlobals(); waits.length = 0; });

const req = (headers: Record<string, string> = {}) => new Request("https://councilof.ai/api/a2a", { method: "POST", headers });

describe("self-exclusion is by name, never by guess", () => {
  it("excludes each listed tool by its own User-Agent token", () => {
    expect(selfToolOf(new Headers({ "user-agent": "Mozilla/5.0 (compatible; csoai-presence/1.0; +https://councilof.ai)" }))).toBe("presence-loop");
    expect(selfToolOf(new Headers({ "user-agent": "CSOAI-ops-canary/0.1 (+https://councilof.ai; public reads only)" }))).toBe("prod-canary");
    expect(selfToolOf(new Headers({ "user-agent": "CSOAI-audit-watchdog/1.0" }))).toBe("audit-watchdog");
    expect(selfToolOf(new Headers({ "user-agent": "csoai-smoke-talk/1" }))).toBe("smoke-talk");
    expect(selfToolOf(new Headers({ "user-agent": "harness-x-check/1" }))).toBe("harness-x-check");
    expect(selfToolOf(new Headers({ "user-agent": "CSOAI-outward-gate/0.1" }))).toBe("outward-gate");
  });

  it("excludes a listed name sent in x-csoai-self, and nothing else", () => {
    expect(selfToolOf(new Headers({ "x-csoai-self": "smoke-talk" }))).toBe("smoke-talk");
    expect(selfToolOf(new Headers({ "x-csoai-self": "anything-else" }))).toBeNull();
  });

  it("does not exclude strangers, look-alikes or an empty User-Agent", () => {
    for (const ua of ["claude-code/2.0", "python-httpx/0.27", "notcsoai-presence/1.0", "csoai-presenceX/1", ""]) {
      expect(selfToolOf(new Headers(ua ? { "user-agent": ua } : {})), ua).toBeNull();
    }
  });

  it("every listed tool has a name, a kind and a place it runs", () => {
    for (const t of SELF_TOOLS) {
      expect(t.name).toMatch(/^[a-z0-9-]+$/);
      expect(t.runs_on.length).toBeGreaterThan(5);
    }
    expect(new Set(SELF_TOOLS.map((t) => t.name)).size).toBe(SELF_TOOLS.length);
  });
});

describe("recordUsage stores a name and a count, never who", () => {
  it("writes one bounded key and no IP, user-agent or text", async () => {
    const kv = fakeKv();
    const key = recordUsage(
      { request: req({ "cf-connecting-ip": "203.0.113.9", "user-agent": "SomeAgent/1.0" }), env: { SOV_ARENA_STATE: kv }, waitUntil },
      "mcp_client",
      "Claude Code: v2 <me@example.com>",
    );
    await settle();
    expect(key).toMatch(new RegExp(`^usage:v1:${utcDay()}:mcp_client:Claude-Code_-v2-_me_example.com_:[0-9a-f]{8}$`));
    expect([...kv.store.keys()]).toEqual([key]);
    const everything = JSON.stringify([...kv.store.entries()]);
    expect(everything).not.toContain("203.0.113.9");
    expect(everything).not.toContain("SomeAgent");
    expect(everything).not.toContain("@");
    expect(kv.put.mock.calls[0][2]).toEqual({ expirationTtl: expect.any(Number) });
  });

  it("writes nothing for our own traffic or without a binding", async () => {
    const kv = fakeKv();
    expect(recordUsage({ request: req({ "user-agent": "CSOAI-ops-canary/0.1" }), env: { SOV_ARENA_STATE: kv }, waitUntil }, "chat_state", "grounded")).toBeNull();
    expect(recordUsage({ request: req(), env: { SOV_ARENA_STATE: kv }, waitUntil }, "mcp_client", "harness-x-check")).toBeNull();
    expect(recordUsage({ request: req(), env: { SOV_ARENA_STATE: kv }, waitUntil }, "mcp_client", "outward-gate")).toBeNull();
    expect(recordUsage({ request: req(), env: {}, waitUntil }, "chat_state", "grounded")).toBeNull();
    await settle();
    expect(kv.store.size).toBe(0);
  });

  it("cleanName keeps names bounded and key-safe", () => {
    expect(cleanName("a:b:c")).toBe("a_b_c");
    expect(cleanName("x".repeat(200))).toHaveLength(48);
    expect(cleanName("")).toBe("none");
    expect(cleanName(42)).toBe("none");
  });
});

describe("countDay and GET /api/usage", () => {
  it("counts rows per name, rejects malformed keys, and pages through list()", async () => {
    const kv = fakeKv();
    const day = "2026-09-29";
    for (let i = 0; i < 2500; i++) kv.store.set(usageKey(day, "mcp_tool", i % 5 ? "board_totals" : "get_axis", `r${i}`), "1");
    kv.store.set(`usage:v1:${day}:not_a_dim:x:r`, "1");
    kv.store.set(usageKey("2026-09-28", "mcp_tool", "board_totals", "old"), "1");
    const r = await countDay(kv, day);
    expect(r.complete).toBe(true);
    expect(r.counts.mcp_tool).toEqual({ board_totals: 2000, get_axis: 500 });
    expect(r.rows).toBe(2500);
    expect(kv.list.mock.calls.length).toBe(3);
    expect(parseUsageKey(`usage:v1:${day}:mcp_tool:a:b:c`)).toBeNull();
  });

  it("reports kind measured, names the self exclusions, and never counts days before the counter existed", async () => {
    const kv = fakeKv();
    kv.store.set(usageKey("2026-09-30", "a2a_outcome", "v0.3_ok", "a"), "1");
    kv.store.set(usageKey("2026-09-30", "chat_state", "grounded", "b"), "1");
    const body = (await buildUsage(kv, 7, new Date("2026-09-30T12:00:00Z"))) as Record<string, any>;
    expect(body.kind).toBe("measured");
    expect(body.self_excluded.map((t: { name: string }) => t.name)).toEqual(SELF_TOOLS.map((t) => t.name));
    expect(body.days.map((d: { day: string }) => d.day)).toEqual(["2026-09-30", "2026-09-29"]);
    expect(body.days[0].counts.a2a_outcome).toEqual({ "v0.3_ok": 1 });
    expect(body.days[0].counts.chat_state).toEqual({ grounded: 1 });
    expect(body.not).toContain("Not revenue");
    expect(JSON.stringify(body)).not.toMatch(/adoption[^.]*(is|=)/i);
  });

  it("is UNMEASURED with a reason, not zero, when the binding is missing", async () => {
    const body = (await buildUsage(undefined, 7)) as Record<string, any>;
    expect(body.state).toBe("UNMEASURED");
    expect(body.kind).toBe("unmeasured");
    expect(body.days).toEqual([]);
  });
});

describe("the doors write what they say they write", () => {
  it("A2A records the wire shape and outcome of each call", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ totals: { lid: "lid" }, axes: [{ axis: "a" }] })));
    const kv = fakeKv();
    const env = { SOV_ARENA_STATE: kv };
    const post = (body: unknown, headers: Record<string, string> = {}) =>
      a2aPost({ request: new Request("https://councilof.ai/api/a2a", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }), env, waitUntil } as never);
    await post({ jsonrpc: "2.0", id: 1, method: "message/send", params: { message: { kind: "message", role: "user", messageId: "m", parts: [{ kind: "text", text: "board" }] } } });
    await post({ jsonrpc: "2.0", id: 2, method: "SendMessage", params: {} });
    await settle();
    const names = [...kv.store.keys()].map((k) => parseUsageKey(k)?.name).sort();
    // The SendMessage above carried NO A2A-Version header. Until 2026-10-07 it was counted as
    // "v1.0_error-32009" because the label was read off the response header.
    expect(names).toEqual(["unversioned_error-32009", "v0.3_ok"]);
  });

  it("A2A labels the version the request declared, and records the shape of a body that is not JSON-RPC", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ totals: { lid: "lid" }, axes: [{ axis: "a" }] })));
    const kv = fakeKv();
    const env = { SOV_ARENA_STATE: kv };
    const post = (body: unknown, headers: Record<string, string> = {}) =>
      a2aPost({ request: new Request("https://councilof.ai/api/a2a", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }), env, waitUntil } as never);
    await post({ query: "what does the board say" });
    await post({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: { message: { messageId: "m", role: "ROLE_USER", parts: [{ text: "board" }] } } }, { "a2a-version": "1.0.0" });
    await post({ jsonrpc: "2.0", id: 2, method: "SendMessage", params: {} }, { "a2a-version": "2.0" });
    await settle();
    const rows = [...kv.store.keys()].map((k) => parseUsageKey(k)).map((p) => `${p?.dim}:${p?.name}`).sort();
    expect(rows).toEqual([
      "a2a_outcome:unversioned_error-32600",
      "a2a_outcome:v1.0_ok",
      "a2a_outcome:vother_error-32009",
      "reject_shape:a2a.-32600.json.query",
    ]);
  });

  it("chat records a refused request's shape (key names, never the text)", async () => {
    const kv = fakeKv();
    const env = { SOV_ARENA_STATE: kv };
    const post = (body: string, ctype = "application/json") =>
      chatPost({ request: new Request("https://councilof.ai/api/chat", { method: "POST", headers: { "content-type": ctype }, body }), env, waitUntil } as never);
    const refused = await post(JSON.stringify({ secret_field_name: "private words" }));
    expect(refused.status).toBe(400);
    await post("{}");
    await settle();
    const rows = [...kv.store.keys()].map((k) => parseUsageKey(k)).map((p) => `${p?.dim}:${p?.name}`).sort();
    expect(rows).toEqual(["chat_state:error", "chat_state:error", "reject_shape:chat.json.nokeys", "reject_shape:chat.json.other"]);
    expect([...kv.store.keys()].join(" ")).not.toMatch(/secret|private/);
  });

  it("MCP records initialize clientInfo.name and tools/call names, and skips our canary", async () => {
    const kv = fakeKv();
    const env = { SOV_ARENA_STATE: kv };
    const call = (body: unknown, ua = "claude-code/2.0") =>
      mcpRequest({
        request: new Request("https://councilof.ai/mcp/free", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "user-agent": ua },
          body: JSON.stringify(body),
        }),
        env,
        waitUntil,
      });
    await call({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "claude-code", version: "2.0.1" } } });
    await call({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "no_such_tool", arguments: {} } });
    await call({ jsonrpc: "2.0", id: 3, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "ours" } } }, "CSOAI-ops-canary/0.1");
    await settle();
    const rows = [...kv.store.keys()].map((k) => parseUsageKey(k)).map((p) => `${p?.dim}:${p?.name}`).sort();
    expect(rows).toEqual(["mcp_client:claude-code", "mcp_tool:not-a-tool"]);
  });
});

// lane paid-call-usage-20261120. /api/usage showed 246 calls of the metered tools in the seven
// days to 20 Nov 2026 and could not say whether one of them presented a payment, or where.
describe("paid_call: whether and where a metered call presented payment, never the payment", () => {
  const TOKEN = "eyJ4NDAyVmVyc2lvbiI6Mn0=";
  const PAYLOAD = { x402Version: 2, payload: { signature: "0xsecretsignature" } };

  it("reads presence and place off the request", () => {
    expect(paidCallPayment({ arguments: { subject: "s" } })).toBe("none");
    expect(paidCallPayment({})).toBe("none");
    expect(paidCallPayment({ arguments: { asset: "RLUSD", preview: true } })).toBe("preview");
    expect(paidCallPayment({ arguments: { subject: "s", x_payment: TOKEN } })).toBe("arg");
    expect(paidCallPayment({ arguments: { subject: "s", x_payment: "   " } })).toBe("none");
    expect(paidCallPayment({ arguments: { subject: "s" }, _meta: { "x402/payment": PAYLOAD } })).toBe("meta");
    expect(paidCallPayment({ arguments: { subject: "s" }, _meta: { "x402/payment": null } })).toBe("none");
    expect(paidCallPayment({ arguments: { subject: "s", x_payment: TOKEN }, _meta: { "x402/payment": PAYLOAD } })).toBe("both");
    expect(paidCallPayment({ arguments: { purchase_action: "history" } })).toBe("purchase");
  });

  it("every label fits its cap, so none is cut", () => {
    for (const door of ["mcp", "a2a"] as const)
      for (const tool of PAID_TOOL_NAMES)
        for (const payment of PAID_CALL_PAYMENTS) {
          const name = paidCallName(door, tool, payment);
          expect(name.length).toBeLessThanOrEqual(USAGE_NAME_MAX.paid_call);
          expect(cleanName(name, USAGE_NAME_MAX.paid_call)).toBe(name);
          expect(parseUsageKey(usageKey("2026-11-20", "paid_call", name, "r"))).toEqual({ day: "2026-11-20", dim: "paid_call", name });
        }
    expect(USAGE_DIMS).toContain("paid_call");
  });

  it("POST /mcp writes one paid_call row per metered call, and nothing of the payment", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ x402Version: 2, accepts: [] }, { status: 402 })));
    const kv = fakeKv();
    const env = { SOV_ARENA_STATE: kv };
    const call = (path: string, params: unknown, ua = "claude-code/2.0") =>
      mcpRequest({
        request: new Request(`https://councilof.ai${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "user-agent": ua },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params }),
        }),
        env,
        waitUntil,
      });
    await call("/mcp", { name: "commission_card", arguments: { subject: "qwen3" } });
    await call("/mcp", { name: "commission_card", arguments: { subject: "qwen3", x_payment: TOKEN } });
    await call("/mcp", { name: "commission_card", arguments: { subject: "qwen3" }, _meta: { "x402/payment": PAYLOAD } });
    await call("/mcp", { name: "board_totals", arguments: {} }); // a free tool writes no paid_call row
    await call("/mcp/free", { name: "commission_card", arguments: { subject: "qwen3" } }); // not served on the free door
    await call("/mcp", { name: "commission_card", arguments: { subject: "qwen3" } }, "csoai-lane-probe/1"); // ours, by name
    await settle();
    const rows = [...kv.store.keys()].map((k) => parseUsageKey(k)).filter((p) => p?.dim === "paid_call").map((p) => p?.name).sort();
    expect(rows).toEqual(["mcp.commission_card.arg", "mcp.commission_card.meta", "mcp.commission_card.none"]);
    expect([...kv.store.keys()].join(" ")).not.toMatch(/eyJ4|0xsecret|qwen3/);
  });

  it("reads the A2A label off the reply's own TOOL_RESULT part, in both wire shapes", () => {
    const part = (structuredContent: Record<string, unknown>, tool = "evidence_bundle", metered = true, channel?: string) => ({
      data: { kind: "TOOL_RESULT", skill: tool, tool, metered, ...(channel ? { payment_channel: channel } : {}), result: { structuredContent } },
    });
    const v1 = (p: unknown) => ({ jsonrpc: "2.0", id: 1, result: { message: { role: "ROLE_AGENT", parts: [{ text: "summary" }, p] } } });
    const v03 = (p: unknown) => ({ jsonrpc: "2.0", id: 1, result: { kind: "message", role: "agent", parts: [{ kind: "text", text: "summary" }, p] } });
    expect(a2aPaidCallName(v1(part({ status: "PAYMENT_REQUIRED", payment_presented: false })))).toBe("a2a.evidence_bundle.none");
    expect(a2aPaidCallName(v1(part({ status: "PAYMENT_REQUIRED", payment_presented: true })))).toBe("a2a.evidence_bundle.arg");
    expect(a2aPaidCallName(v1(part({ status: "DELIVERED", payment_presented: true })))).toBe("a2a.evidence_bundle.arg");
    expect(a2aPaidCallName(v1(part({ status: "DELIVERED", payment_presented: false, delivery_kind: "PREVIEW_OR_FREE" })))).toBe("a2a.evidence_bundle.preview");
    expect(a2aPaidCallName(v1(part({ status: "PURCHASE_HISTORY", payment_presented: false })))).toBe("a2a.evidence_bundle.purchase");
    expect(a2aPaidCallName(v03(part({ status: "PAYMENT_REQUIRED", payment_presented: false })))).toBe("a2a.evidence_bundle.none");
    // The two A2A payment fields are told apart by the channel the door names in its reply.
    const META = 'message.metadata["x402.payment.payload"]';
    expect(a2aPaidCallName(v1(part({ status: "PAYMENT_REQUIRED", payment_presented: true }, "evidence_bundle", true, META)))).toBe("a2a.evidence_bundle.meta");
    expect(a2aPaidCallName(v1(part({ status: "DELIVERED", payment_presented: true }, "evidence_bundle", true, META)))).toBe("a2a.evidence_bundle.meta");
    expect(a2aPaidCallName(v1(part({ status: "DELIVERED", payment_presented: true }, "evidence_bundle", true, "input.x_payment")))).toBe("a2a.evidence_bundle.arg");
    expect(a2aPaidCallName(v1(part({ status: "PAYMENT_REQUIRED", payment_presented: false }, "evidence_bundle", true, "none")))).toBe("a2a.evidence_bundle.none");
    // Not a metered tool result: a free tool, an error, a plain answer.
    expect(a2aPaidCallName(v1(part({ state: "VALID" }, "get_root", false)))).toBeNull();
    expect(a2aPaidCallName(v1(part({ status: "DELIVERED" }, "not_a_paid_tool", true)))).toBeNull();
    expect(a2aPaidCallName({ jsonrpc: "2.0", id: 1, error: { code: -32602, message: "x" } })).toBeNull();
    expect(a2aPaidCallName(v1({ text: "board" }))).toBeNull();
    expect(a2aPaidCallName(null)).toBeNull();
  });

  it("POST /api/a2a writes the row for a metered per-tool skill", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ x402Version: 2, accepts: [] }, { status: 402 })));
    const kv = fakeKv();
    const env = { SOV_ARENA_STATE: kv };
    await a2aPost({
      request: new Request("https://councilof.ai/api/a2a", {
        method: "POST",
        headers: { "content-type": "application/json", "a2a-version": "1.0" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "SendMessage",
          params: { message: { messageId: "m", role: "ROLE_USER", parts: [{ data: { skill: "commission_card", input: { subject: "qwen3" } } }] } },
        }),
      }),
      env,
      waitUntil,
    } as never);
    await settle();
    const rows = [...kv.store.keys()].map((k) => parseUsageKey(k)).map((p) => `${p?.dim}:${p?.name}`).sort();
    expect(rows).toEqual(["a2a_outcome:v1.0_ok", "paid_call:a2a.commission_card.none"]);
  });

  it("POST /api/a2a tells input.x_payment from the x402 A2A transport's metadata field", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ x402Version: 2, accepts: [] }, { status: 402 })));
    const kv = fakeKv();
    const env = { SOV_ARENA_STATE: kv };
    const send = (input: Record<string, unknown>, metadata?: Record<string, unknown>) =>
      a2aPost({
        request: new Request("https://councilof.ai/api/a2a", {
          method: "POST",
          headers: { "content-type": "application/json", "a2a-version": "1.0" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: 1, method: "SendMessage",
            params: { message: { messageId: "m", role: "ROLE_USER", ...(metadata ? { metadata } : {}), parts: [{ data: { skill: "commission_card", input } }] } },
          }),
        }),
        env,
        waitUntil,
      } as never);
    const first = await send({ subject: "qwen3", x_payment: TOKEN });
    const second = await send({ subject: "qwen3" }, { "x402.payment.payload": PAYLOAD });
    // Both fields at once is refused before the dispatch: an error, and no paid_call row.
    await send({ subject: "qwen3", x_payment: TOKEN }, { "x402.payment.payload": PAYLOAD });
    await settle();
    const channel = async (res: Response) => {
      const body = (await res.json()) as { result: { message: { parts: { data?: { payment_channel?: string } }[] } } };
      return body.result.message.parts.find((p) => p.data)?.data?.payment_channel;
    };
    expect(await channel(first)).toBe("input.x_payment");
    expect(await channel(second)).toBe('message.metadata["x402.payment.payload"]');
    const rows = [...kv.store.keys()].map((k) => parseUsageKey(k)).filter((p) => p?.dim === "paid_call").map((p) => p?.name).sort();
    expect(rows).toEqual(["a2a.commission_card.arg", "a2a.commission_card.meta"]);
    expect([...kv.store.keys()].join(" ")).not.toMatch(/eyJ4|0xsecret|qwen3/);
  });

  it("a lane's probes are excluded by name, and the days they were not are flagged", () => {
    expect(selfToolOf(new Headers({ "user-agent": "csoai-lane-probe/1" }))).toBe("lane-probe");
    expect(selfToolOf(new Headers({ "x-csoai-self": "lane-probe" }))).toBe("lane-probe");
    expect(selfToolOf(new Headers({ "user-agent": "curl-probe/1.0" }))).toBeNull();
    expect(USAGE_DAY_NOTES.map((n) => n.day)).toEqual(expect.arrayContaining(["2026-11-19", "2026-11-20"]));
    for (const n of USAGE_DAY_NOTES) expect(n.note.startsWith("Not a baseline.")).toBe(true);
  });
});
