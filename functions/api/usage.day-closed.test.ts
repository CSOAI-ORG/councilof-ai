import { describe, expect, it } from "vitest";
import { buildUsage } from "./usage";
import { clientClassOf, clientClassOfKey, recordUsage, CLIENT_CLASSES } from "../_lib/usage";

/**
 * Sell organ SG-13 (7 Oct 2026): today's /api/usage row read `complete: true` at 04:14Z. `complete`
 * is list completeness, not a closed day, so a partial day read as a whole one. And SG-09: usage rows
 * now carry the kind of client the request declared (client_class), never who it is.
 */
type Store = Map<string, string>;
function kv(store: Store) {
  return {
    async put(k: string, v: string) {
      store.set(k, v);
    },
    async list({ prefix }: { prefix: string }) {
      return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name })), list_complete: true };
    },
  };
}

describe("/api/usage — today is not a closed day", () => {
  it("today's row is day_closed false; earlier rows are day_closed true; complete stays list completeness", async () => {
    const now = new Date("2026-10-07T04:14:00Z");
    const store: Store = new Map([
      ["usage:v1:2026-10-07:chat_state:grounded:1a2b3c4d", "1"],
      ["usage:v1:2026-10-06:chat_state:grounded:5e6f7a8b", "1"],
    ]);
    const body = (await buildUsage(kv(store), 3, now)) as any;
    const [today, yesterday, before] = body.days;
    expect(today).toMatchObject({ day: "2026-10-07", complete: true, day_closed: false, state: "MEASURED" });
    expect(yesterday).toMatchObject({ day: "2026-10-06", complete: true, day_closed: true });
    expect(before).toMatchObject({ day: "2026-10-05", day_closed: true });
    expect(body.row_fields.complete).toMatch(/does not mean the day is over/);
    expect(body.row_fields.day_closed).toMatch(/Today's row is day_closed false/);
  });
});

describe("/api/usage — client_class: what the caller declared, never who", () => {
  const h = (ua?: string) => new Headers(ua === undefined ? {} : { "user-agent": ua });

  it("classes a User-Agent by the published rule, first match wins", () => {
    expect(clientClassOf(h())).toBe("no-ua");
    expect(clientClassOf(h("   "))).toBe("no-ua");
    expect(clientClassOf(h("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)"))).toBe("crawler");
    expect(clientClassOf(h("curl/8.5.0"))).toBe("http-library");
    expect(clientClassOf(h("python-httpx/0.27.0"))).toBe("http-library");
    expect(clientClassOf(h("node"))).toBe("http-library");
    expect(clientClassOf(h("claude-code/2.1 mcp-remote/0.1"))).toBe("agent-runtime");
    expect(clientClassOf(h("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Safari/605.1.15"))).toBe("browser");
    expect(clientClassOf(h("SomethingElse/1.0"))).toBe("other");
  });

  it("writes the class into the key suffix, never the User-Agent, and reads old keys as unrecorded", async () => {
    const store: Store = new Map();
    const key = recordUsage(
      { request: new Request("https://councilof.ai/api/chat", { method: "POST", headers: { "user-agent": "curl/8.5.0 secret-token-xyz" } }), env: { SOV_ARENA_STATE: kv(store) } },
      "chat_state",
      "grounded",
    );
    expect(key).toMatch(/^usage:v1:\d{4}-\d{2}-\d{2}:chat_state:grounded:http-library\.[0-9a-f]{8}$/);
    expect(key).not.toContain("secret-token");
    expect(clientClassOfKey(key!)).toBe("http-library");
    expect(clientClassOfKey("usage:v1:2026-10-06:chat_state:grounded:5e6f7a8b")).toBe("unrecorded");
    expect(CLIENT_CLASSES).toContain(clientClassOfKey(key!));
  });

  it("each day's row counts the same rows by client class, per dimension", async () => {
    const now = new Date("2026-10-07T12:00:00Z");
    const store: Store = new Map([
      ["usage:v1:2026-10-07:chat_state:error:http-library.00000001", "1"],
      ["usage:v1:2026-10-07:chat_state:error:http-library.00000002", "1"],
      ["usage:v1:2026-10-07:chat_state:grounded:browser.00000003", "1"],
      ["usage:v1:2026-10-07:chat_state:grounded:0000beef", "1"],
    ]);
    const body = (await buildUsage(kv(store), 1, now)) as any;
    expect(body.days[0].counts.chat_state).toEqual({ error: 2, grounded: 2 });
    expect(body.days[0].client_class.chat_state).toEqual({ "http-library": 2, browser: 1, unrecorded: 1 });
    // the rule is published in match order (first match wins); it covers every class
    expect([...body.client_class_rule.map((r: { class: string }) => r.class)].sort()).toEqual([...CLIENT_CLASSES].sort());
  });
});
