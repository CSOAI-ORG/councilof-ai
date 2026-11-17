import { describe, expect, it } from "vitest";
import { onRequestPost } from "./contact";

const valid = { name: "Example Person", email: "buyer@example.org", subject: "Scope request", message: "Please quote an evidence review." };
const req = (body: unknown, extra: Record<string, string> = {}) => new Request("https://councilof.ai/api/contact", {
  method: "POST",
  headers: { "content-type": "application/json", "origin": "https://councilof.ai", ...extra },
  body: JSON.stringify(body),
});
const call = (request: Request, env: any) => onRequestPost({ request, env } as any) as Promise<Response>;

describe("POST /api/contact", () => {
  it("confirms storage only after KV put, without pretending an email was sent", async () => {
    const writes: any[][] = [];
    const kv = { put: async (...args: any[]) => { writes.push(args); } };
    const response = await call(req(valid), { LEADS: kv });
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.stored).toBe(true);
    expect(data.receipt_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.notification_state).toBe("NOT_SENT");
    expect(writes).toHaveLength(1);
    const stored = JSON.parse(writes[0][1]);
    expect(stored.email).toBe(valid.email);
    expect(stored.notification_state).toBe("NOT_CONFIGURED");
    expect(JSON.stringify(stored)).not.toContain("request_ip");
  });

  it("does not claim success without a KV binding or after a failed put", async () => {
    const missing = await call(req(valid), {});
    expect(missing.status).toBe(503);
    expect((await missing.json()).stored).toBe(false);
    const failed = await call(req(valid), { LEADS: { put: async () => { throw Error("failed"); } } });
    expect(failed.status).toBe(503);
    expect((await failed.json()).stored).toBe(false);
  });

  it("rejects invalid, bot-filled, oversized and cross-origin submissions", async () => {
    const kv = { put: async () => { throw Error("should never write"); } };
    for (const bad of [
      { ...valid, email: "invalid" },
      { ...valid, message: "" },
      { ...valid, subject: "wrong\nline" },
      { ...valid, website: "https://spam.example" },
      { ...valid, message: "x".repeat(9000) },
    ]) {
      expect((await call(req(bad), { LEADS: kv })).status).toBeGreaterThanOrEqual(400);
    }
    const foreign = await call(req(valid, { origin: "https://elsewhere.example" }), { LEADS: kv });
    expect(foreign.status).toBe(403);
  });
});
