/**
 * Regression tests for the independent review of lane chat-door-20261007 (7 Oct 2026). Each block
 * names the defect the review found and reproduces it; every one failed on 9f3aa627a.
 */
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequestGet as chatGet, onRequestPost as chatPost } from "./chat";
import { a2aUsageShape, handlePost, onRequestPost as a2aPost } from "./a2a";
import { buildUsage } from "./usage";
import { SHAPE_KEYS, questionOf } from "../_lib/askInput";
import { USAGE_DAY_NOTES, USAGE_LABEL_NOTES, USAGE_NAME_MAX, parseUsageKey, selfToolOf } from "../_lib/usage";

const ORIGIN = "https://councilof.ai";

function fakeKv() {
  const store = new Map<string, string>();
  return {
    store,
    put: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    list: vi.fn(async ({ prefix }: { prefix: string }) => ({
      keys: [...store.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name })),
      list_complete: true,
    })),
  };
}
const waits: Promise<unknown>[] = [];
const waitUntil = (p: Promise<unknown>) => { waits.push(p); };
const settle = async () => { while (waits.length) await waits.shift(); };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  waits.length = 0;
});

describe("label notes are dated by the deploy, not by the day the code was written", () => {
  it("no note names a calendar day as its start, and each says the deploy day is mixed", () => {
    expect(USAGE_LABEL_NOTES.length).toBeGreaterThan(0);
    for (const n of USAGE_LABEL_NOTES) {
      expect(n).not.toHaveProperty("since");
      expect(n.effective).toMatch(/deploy/);
      expect(n.effective).toMatch(/both labellings/);
      expect(n.effective).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.not_before).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // The note text never says "before this day" / "since this day": the change day is not one day.
      expect(n.note).not.toMatch(/\b(before|since|until) this day\b/i);
    }
  });

  it("GET /api/usage publishes the label notes and the day notes", async () => {
    const body = (await buildUsage(fakeKv() as never, 1)) as { label_notes: unknown; day_notes: unknown };
    expect(body.label_notes).toEqual(USAGE_LABEL_NOTES);
    expect(body.day_notes).toEqual(USAGE_DAY_NOTES);
  });

  it("2026-10-07 is flagged: it holds our own unidentified probes and is not a baseline", () => {
    const d = USAGE_DAY_NOTES.find((n) => n.day === "2026-10-07");
    expect(d?.dims).toEqual(expect.arrayContaining(["chat_state", "a2a_outcome"]));
    expect(d?.note).toMatch(/Not a baseline/);
    expect(d?.note).toMatch(/x-csoai-self/);
  });

  it("the chat note says the production effect is UNMEASURED, not fixed", () => {
    const chat = USAGE_LABEL_NOTES.find((n) => n.dim === "chat_state");
    expect(chat?.note).toMatch(/UNMEASURED/);
    expect(chat?.note).toMatch(/not the production population/);
  });
});

describe("a2a_outcome prefix: v0.3_ only when the 0.3 shim served the request", () => {
  it.each([
    ["0.2", false, "vother"],
    ["0.3", false, "vother"],
    ["0.3.1", false, "vother"],
    ["0.2", true, "v0.3"],
    ["", true, "v0.3"],
    ["", false, "unversioned"],
    [null, false, "unversioned"],
    ["1.0", false, "v1.0"],
    ["1.0.1", false, "v1.0"],
    ["2.0", false, "vother"],
  ] as const)("a2aUsageShape(%j, %s) = %s", (header, served, want) => {
    expect(a2aUsageShape(header, served)).toBe(want);
  });

  it("a SendMessage that declares A2A-Version 0.2 is counted vother_, never v0.3_", async () => {
    const kv = fakeKv();
    const res = await a2aPost({
      request: new Request(`${ORIGIN}/api/a2a`, {
        method: "POST",
        headers: { "content-type": "application/json", "a2a-version": "0.2" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: {} }),
      }),
      env: { SOV_ARENA_STATE: kv },
      waitUntil,
    } as never);
    expect(res.headers.get("a2a-version")).not.toBe("0.3");
    await settle();
    expect([...kv.store.keys()].map((k) => parseUsageKey(k)?.name)).toEqual(["vother_error-32009"]);
  });
});

describe("reject_shape labels are never cut mid-key", () => {
  it("the longest label a door can produce fits under the reject_shape cap", () => {
    const lens = [...SHAPE_KEYS].map((k) => k.length).sort((a, b) => b - a);
    // shapeLabel: at most four allowlisted keys joined by "_", then "_other".
    const keysPart = lens.slice(0, 4).reduce((a, b) => a + b, 0) + 3 + "_other".length;
    const prefixes = ["a2a.-32600.json.", "a2a.-32700.json.", "chat.json.", "chat.form."];
    const worst = Math.max(...prefixes.map((p) => p.length)) + keysPart;
    expect(worst).toBeLessThanOrEqual(USAGE_NAME_MAX.reject_shape);
  });

  it("an AG-UI body refused at /api/a2a is recorded whole", async () => {
    const kv = fakeKv();
    await a2aPost({
      request: new Request(`${ORIGIN}/api/a2a`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "t", runId: "r", state: {}, messages: [], forwardedProps: {} }),
      }),
      env: { SOV_ARENA_STATE: kv },
      waitUntil,
    } as never);
    await settle();
    const shapes = [...kv.store.keys()].map((k) => parseUsageKey(k)).filter((p) => p?.dim === "reject_shape").map((p) => p?.name);
    expect(shapes).toEqual(["a2a.-32600.json.forwardedProps_messages_runId_threadId_other"]);
  });
});

describe("an empty latest user turn is an empty question, never an earlier turn", () => {
  const history = { messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello" },
    { role: "user", content: "" },
  ] };

  it("questionOf returns '' rather than falling back to 'hi'", () => {
    expect(questionOf(history)).toBe("");
    expect(questionOf({ messages: [{ role: "user", content: "what does the board say" }, { role: "user", content: [] }] })).toBe("");
    // With no user turn at all, the last non-system message is still read.
    expect(questionOf({ messages: [{ role: "system", content: "s" }, { role: "assistant", content: "board" }] })).toBe("board");
  });

  it("the door answers it exactly as it answers one empty user turn", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
    const post = async (body: unknown) => {
      const res = await chatPost({
        request: new Request(`${ORIGIN}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
        env: {},
      } as never);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { status: res.status, json: (await res.json()) as any };
    };
    const withHistory = await post(history);
    const alone = await post({ messages: [{ role: "user", content: "" }] });
    expect(withHistory.status).toBe(alone.status);
    expect(withHistory.json.state).toBe(alone.json.state);
    expect(withHistory.json.answered_by).toBe(alone.json.answered_by);
  });
});

describe("GET /api/chat privacy names what is recorded", () => {
  it("mentions the refused-body shape, not only the state word", async () => {
    const res = await chatGet({ request: new Request(`${ORIGIN}/api/chat`) });
    const d = (await res.json()) as { privacy: string };
    expect(d.privacy).toMatch(/reject_shape/);
    expect(d.privacy).toMatch(/never a value/);
  });
});

describe("our own axis-doors probe is not counted, and asks A2A in the version it names", () => {
  const src = fs.readFileSync(path.resolve(__dirname, "../../scripts/axis-doors-probe.mjs"), "utf8");

  it("its User-Agent is self-excluded", () => {
    const ua = /const UA = "([^"]+)"/.exec(src)?.[1];
    expect(ua).toBeTruthy();
    expect(selfToolOf(new Headers({ "user-agent": ua as string }))).toBe("axis-doors-probe");
  });

  it("its SendMessage declares A2A-Version 1.0, and that request is not refused with -32009", async () => {
    const block = src.slice(src.indexOf("const a2a = await probe("), src.indexOf("const a2a = await probe(") + 700);
    expect(block).toMatch(/"a2a-version": "1\.0"/);
    expect(block).toMatch(/role: "ROLE_USER"/);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ totals: { lid: "lid" }, axes: [{ axis: "a" }] })));
    const res = await handlePost(new Request(`${ORIGIN}/api/a2a`, {
      method: "POST",
      headers: { "content-type": "application/json", "a2a-version": "1.0" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: { message: { messageId: "axis-doors-1", role: "ROLE_USER", parts: [{ data: { skill: "gspc-board", input: {} } }] } } }),
    }));
    const j = (await res.json()) as { error?: { code: number } };
    expect(j.error?.code).not.toBe(-32009);
  });
});
