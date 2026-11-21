import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./contact";

const valid = { name: "Example Person", email: "buyer@example.org", subject: "Scope request", message: "Please quote an evidence review.", turnstile_token: "synthetic-verification-token" };
const protectedEnv = { CONTACT_TURNSTILE_SECRET: "local-fake-secret-for-unit-tests" };
const req = (body: unknown, extra: Record<string, string> = {}) => new Request("https://councilof.ai/api/contact", {
  method: "POST",
  headers: { "content-type": "application/json", "origin": "https://councilof.ai", ...extra },
  body: JSON.stringify(body),
});
const call = (request: Request, env: any) => onRequestPost({ request, env } as any) as Promise<Response>;

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      success: true, hostname: "councilof.ai", action: "contact_enquiry",
    })));
  });
  afterEach(() => vi.unstubAllGlobals());
  it("confirms storage only after KV put, without pretending an email was sent", async () => {
    const writes: any[][] = [];
    const kv = { put: async (...args: any[]) => { writes.push(args); } };
    const response = await call(req(valid), { ...protectedEnv, LEADS: kv });
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.stored).toBe(true);
    expect(data.receipt_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.notification_state).toBe("NOT_SENT");
    expect(writes).toHaveLength(1);
    expect(writes[0][2]).toEqual({ expirationTtl: 30 * 24 * 60 * 60 });
    const stored = JSON.parse(writes[0][1]);
    expect(stored.email).toBe(valid.email);
    expect(stored.notification_state).toBe("NOT_CONFIGURED");
    expect(JSON.stringify(stored)).not.toContain("request_ip");
    expect(JSON.stringify(stored)).not.toContain("turnstile_token");
  });

  it("does not claim success without a KV binding or after a failed put", async () => {
    const missing = await call(req(valid), {});
    expect(missing.status).toBe(503);
    expect((await missing.json()).stored).toBe(false);
    const failed = await call(req(valid), { ...protectedEnv, LEADS: { put: async () => { throw Error("failed"); } } });
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

  it("fails closed with no Turnstile secret even when KV is available", async () => {
    const kv = { put: vi.fn() };
    const response = await call(req(valid), { LEADS: kv });
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("CHALLENGE_NOT_CONFIGURED");
    expect(kv.put).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not contact Siteverify or KV for a missing or oversized token", async () => {
    const kv = { put: vi.fn() };
    for (const token of [undefined, "", "x".repeat(2049)]) {
      const res = await call(req({ ...valid, turnstile_token: token }), { ...protectedEnv, LEADS: kv });
      expect(res.status).toBe(403);
      expect((await res.json()).code).toBe("CHALLENGE_DENIED");
    }
    expect(kv.put).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("denies a forged success for a different hostname or action before KV", async () => {
    const kv = { put: vi.fn() };
    for (const reply of [
      { success: true, hostname: "other.example", action: "contact_enquiry" },
      { success: true, hostname: "councilof.ai", action: "login" },
      { success: false, hostname: "councilof.ai", action: "contact_enquiry" },
    ]) {
      vi.stubGlobal("fetch", vi.fn(async () => Response.json(reply)));
      const response = await call(req(valid), { ...protectedEnv, LEADS: kv });
      expect(response.status).toBe(403);
      expect((await response.json()).code).toBe("CHALLENGE_DENIED");
    }
    expect(kv.put).not.toHaveBeenCalled();
  });

  it("never writes when Siteverify is unreachable or malformed", async () => {
    const kv = { put: vi.fn() };
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("siteverify timeout"); }));
    let response = await call(req(valid), { ...protectedEnv, LEADS: kv });
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("CHALLENGE_UNAVAILABLE");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: "true" })));
    response = await call(req(valid), { ...protectedEnv, LEADS: kv });
    expect(response.status).toBe(403);
    expect(kv.put).not.toHaveBeenCalled();
  });

  it("sends the verification token only to Siteverify and not to LEADS", async () => {
    const kv = { put: vi.fn(async () => {}) };
    const response = await call(req(valid), { ...protectedEnv, LEADS: kv });
    expect(response.status).toBe(202);
    const verifyCalls = vi.mocked(fetch).mock.calls;
    expect(verifyCalls).toHaveLength(1);
    expect(verifyCalls[0][0]).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(String(verifyCalls[0][1]?.body)).toContain("response=synthetic-verification-token");
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(kv.put.mock.calls[0][1]).not.toContain("synthetic-verification-token");
  });
});
