import { describe, expect, it, vi, afterEach } from "vitest";
import { onRequestGet, onRequestPost, verifyPaddleSignature } from "./booking-webhook";
import { onRequestPost as waitlistPost, onRequestGet as waitlistGet } from "./waitlist";

const SECRET = "pdl_ntfset_test_secret";
async function sign(raw: string, ts: number) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const m = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${ts}:${raw}`)));
  return `ts=${ts};h1=${[...m].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
const call = (h: unknown, ctx: unknown) => (h as (c: unknown) => Promise<Response>)(ctx);
afterEach(() => vi.unstubAllGlobals());

describe("/api/booking-webhook", () => {
  it("is DOOR_CLOSED by default and issues nothing", async () => {
    for (const r of [await call(onRequestGet, { env: {} }), await call(onRequestPost, { env: { PADDLE_BOOKING_WEBHOOK_SECRET: SECRET }, request: new Request("https://x/", { method: "POST", body: "{}" }) })]) {
      expect(r.status).toBe(503);
      const t = await r.text();
      expect(t).toContain("DOOR_CLOSED");
      expect(t).not.toMatch(/certificate|entitlement"/i);
    }
  });
  it("verifies signatures and rejects tampering and stale timestamps", async () => {
    const raw = '{"event_type":"transaction.completed"}';
    const now = 1_760_000_000;
    expect(await verifyPaddleSignature(await sign(raw, now), raw, SECRET, now)).toBe(true);
    expect(await verifyPaddleSignature(await sign(raw, now), raw + " ", SECRET, now)).toBe(false);
    expect(await verifyPaddleSignature(await sign(raw, now - 1000), raw, SECRET, now)).toBe(false);
    expect(await verifyPaddleSignature(null, raw, SECRET, now)).toBe(false);
  });
  it("when enabled, a signed event becomes one Busabase bookings proposal", async () => {
    const f = vi.fn(async () => new Response('{"data":{"id":"cr1"}}', { status: 200 }));
    vi.stubGlobal("fetch", f);
    const raw = JSON.stringify({ event_id: "evt_1", event_type: "transaction.completed", data: { id: "txn_1" } });
    const env = { BOOKING_WEBHOOK_ENABLED: "true", PADDLE_BOOKING_WEBHOOK_SECRET: SECRET, BUSABASE_INTAKE_URL: "https://intake.example" };
    const req = new Request("https://x/", { method: "POST", body: raw, headers: { "paddle-signature": await sign(raw, Math.floor(Date.now() / 1000)) } });
    const r = await call(onRequestPost, { env, request: req });
    expect(r.status).toBe(200);
    expect(f).toHaveBeenCalledOnce();
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://intake.example/bases/bookings/records/bulk-change-request");
    expect(JSON.parse(String(init.body)).autoMerge).toBe(false);
    const bad = new Request("https://x/", { method: "POST", body: raw, headers: { "paddle-signature": "ts=1;h1=00" } });
    expect((await call(onRequestPost, { env, request: bad })).status).toBe(401);
  });
});

describe("/api/waitlist", () => {
  it("is DOOR_CLOSED until intake is configured", async () => {
    expect((await call(waitlistGet, { env: {} })).status).toBe(503);
  });
  it("proposes a waitlist record and shows no price", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", f);
    const env = { BUSABASE_INTAKE_URL: "https://intake.example" };
    const r = await call(waitlistPost, { env, request: new Request("https://x/", { method: "POST", body: JSON.stringify({ email: "a@b.co", product: "ras-booking" }) }) });
    expect(r.status).toBe(202);
    expect(await r.text()).not.toMatch(/[$£€]\s?\d/);
    const bad = await call(waitlistPost, { env, request: new Request("https://x/", { method: "POST", body: '{"email":"nope"}' }) });
    expect(bad.status).toBe(400);
  });
});
