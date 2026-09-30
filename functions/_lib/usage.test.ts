import { afterEach, describe, expect, it, vi } from "vitest";

import { SELF_TOOLS, cleanName, countDay, parseUsageKey, recordUsage, selfToolOf, usageKey, utcDay } from "./usage";
import { buildUsage } from "../api/usage";
import { onRequestPost as a2aPost } from "../api/a2a";
import { onRequest as mcpRequest } from "../mcp/[[path]]";

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
    expect(names).toEqual(["v0.3_ok", "v1.0_error-32009"]);
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
