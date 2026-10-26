/**
 * A chat handler that THROWS is answered as JSON and counted (lane chat-door-20261007). Before,
 * the exception escaped functions/api/chat.ts, the platform served its own error page, and no
 * usage row was written - so chat_state "error" could only ever be a lower bound on failures.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./_chatGrounded", () => ({
  onRequestPost: async () => {
    throw new Error("handler failed");
  },
  onRequestOptions: async () => new Response(null, { status: 204 }),
}));

import { onRequestPost as chatPost } from "./chat";

describe("POST /api/chat — a handler that throws", () => {
  it("answers JSON 500 and records chat_state error", async () => {
    const puts: string[] = [];
    const kv = { put: vi.fn(async (k: string) => { puts.push(k); }), list: vi.fn() };
    const waits: Promise<unknown>[] = [];
    const res = await chatPost({
      request: new Request("https://councilof.ai/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: '{"message":"hi"}' }),
      env: { SOV_ARENA_STATE: kv },
      waitUntil: (p: Promise<unknown>) => { waits.push(p); },
    } as never);
    while (waits.length) await waits.shift();
    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toContain("application/json");
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.error).toBe("internal");
    expect(j.answer).toBeNull();
    expect(puts.filter((k) => k.includes(":chat_state:error:"))).toHaveLength(1);
  });
});
