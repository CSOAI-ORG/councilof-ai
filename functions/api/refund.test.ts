import { describe, expect, it, vi } from "vitest";
import { onRequestPost, onRequestGet } from "./refund";

function fakeKV() {
  const store = new Map<string, string>();
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => { store.set(k, v); },
  } as unknown as KVNamespace;
}

function call(env: any, body: unknown, method = "POST") {
  return (onRequestPost as unknown as Function)(
    { request: new Request("https://councilof.ai/api/refund", { method, body: JSON.stringify(body) }), env },
  ).then(async (res: Response) => ({ status: res.status, body: await res.json() }));
}

const valid = {
  schema: "csoai.refund-record/0.1",
  observed_at: "2026-09-15T12:00:00Z",
  source: {
    channel: "paddle_webhook",
    reference: "evt_abc123",
    timestamp_buyer: "2026-09-15T11:55:00Z",
    amount: 25,
    currency: "USD",
  },
  subject: { kind: "cert", id: "acct_42" },
  revocations: {
    entitlement: { revoked: true, original_grant_at: "2026-09-01T00:00:00Z", sku: "csoai.measurement-card.issuance" },
    cert: { revoked: true, cert_sha256: "a".repeat(64) },
  },
};

describe("/api/refund — refund/chargeback intake (PHASE3) ", () => {
  it("GET returns the endpoint contract", async () => {
    const res = await (onRequestGet as unknown as Function)({ env: {} });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.endpoint).toBe("/api/refund");
    expect(body.schema_url).toContain("refund-record");
  });

  it("records a refund with a stable idempotency key", async () => {
    const { status, body } = await call({ LEADS: fakeKV() }, valid);
    expect(status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.refund_id).toMatch(/^rf_/);
    expect(body.idempotency_key).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("collapses identical retries to the same record (idempotent)", async () => {
    const kv = fakeKV();
    const r1 = await call({ LEADS: kv }, valid);
    const r2 = await call({ LEADS: kv }, valid);
    expect(r1.body.refund_id).toBe(r2.body.refund_id);
    expect(r2.body.idempotent).toBe(true);
    expect(r2.body.first_seen_at).toBe(r1.body.first_seen_at);
  });

  it("treats different timestamp_buyer as distinct events", async () => {
    const kv = fakeKV();
    const a = await call({ LEADS: kv }, valid);
    const differentBuyerTimestamp = {
      ...valid,
      source: { ...valid.source, timestamp_buyer: "2026-09-15T11:30:00Z" },
    };
    const b = await call({ LEADS: kv }, differentBuyerTimestamp);
    expect(a.body.refund_id).not.toBe(b.body.refund_id);
  });

  it("rejects bad channel", async () => {
    const r = await call({}, { ...valid, source: { ...valid.source, channel: "bitcoin_wallet" } });
    expect(r.status).toBe(422);
    expect(r.body.code).toBe("BAD_SOURCE_CHANNEL");
  });

  it("rejects missing revocations.cert.revoked=true", async () => {
    const r = await call({}, {
      ...valid,
      revocations: { ...valid.revocations, cert: { revoked: false, cert_sha256: "a".repeat(64) } },
    });
    expect(r.status).toBe(422);
    expect(r.body.code).toBe("CERT_NOT_REVOKED");
  });

  it("rejects malformed cert_sha256", async () => {
    const r = await call({}, {
      ...valid,
      revocations: { ...valid.revocations, cert: { revoked: true, cert_sha256: "abc" } },
    });
    expect(r.status).toBe(422);
    expect(r.body.code).toBe("BAD_CERT_SHA256");
  });

  it("rejects bad schema", async () => {
    const r = await call({}, { ...valid, schema: "csoai.refund-record/0.2" });
    expect(r.status).toBe(422);
    expect(r.body.code).toBe("BAD_SCHEMA");
  });

  it("works without LEADS binding (in-memory only, but still idempotent within request)", async () => {
    const r = await call({}, valid);
    expect(r.status).toBe(201);
    expect(r.body.ok).toBe(true);
  });

  it("always returns writes_board: false on the recorded event", async () => {
    const r = await call({ LEADS: fakeKV() }, valid);
    expect(r.body.revocations.entitlement.revoked).toBe(true);
    expect(r.body.revocations.cert.revoked).toBe(true);
  });
});
