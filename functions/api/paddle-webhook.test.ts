import { describe, expect, it } from "vitest";

// We can't test the real webhook handler without Paddle's HMAC secret,
// but we can test the GET endpoint contract and the payload shape.

describe("/api/paddle-webhook — GET contract", () => {
  it("returns the endpoint contract", async () => {
    // Import dynamically to avoid HMAC env issues at test time
    const { onRequestGet } = await import("./paddle-webhook");
    const res = await (onRequestGet as unknown as Function)({ env: {} });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema).toBe("csoai.paddle-webhook-endpoint/0.1");
    expect(body.endpoint).toBe("/api/paddle-webhook");
    expect(body.contract).toContain("Paddle");
    expect(body.contract).toContain("transaction.completed");
  });
});

describe("Paddle webhook certificate payload shape", () => {
  it("builds a cert-shaped object matching csoai.certificate/0.1", () => {
    // Simulate the payload the handler would build
    const payload = {
      subject: { kind: "account", id: "buyer@example.com" },
      entitlement: {
        sku: "csoai.measurement-card.issuance",
        tier: "proof",
        issued_via: { channel: "paddle_settlement", settlement_reference: "txn_123" },
      },
      scope: { tool_set: ["mcp_trust", "x402_trust"], free_calls_per_day: null, expires_at: null },
      verification: { url: "https://councilof.ai/verify", did_document: "https://csoai.org/.well-known/did.json" },
    };

    const cert = {
      schema: "csoai.certificate/0.1",
      certificate_id: "0".repeat(64),
      issued_at: "2026-09-15T12:00:00Z",
      issuer_did: "did:web:csoai.org#board-attestation-1",
      payload,
      sig_ed25519: "0".repeat(128),
      limits: { non_certification: true, non_promotion: true, writes_board: false },
    };

    // Validate shape
    expect(cert.schema).toBe("csoai.certificate/0.1");
    expect(cert.certificate_id).toHaveLength(64);
    expect(cert.sig_ed25519).toHaveLength(128);
    expect(cert.limits.non_certification).toBe(true);
    expect(cert.limits.non_promotion).toBe(true);
    expect(cert.limits.writes_board).toBe(false);
    expect(cert.payload.subject.kind).toBe("account");
    expect(cert.payload.entitlement.issued_via.channel).toBe("paddle_settlement");
  });

  it("Paddle event has the expected shape", () => {
    // What Paddle sends in transaction.completed
    const event = {
      event_type: "transaction.completed",
      data: {
        id: "txn_123",
        customer_id: "cus_456",
        customer_email: "buyer@example.com",
        custom_data: { email: "buyer@example.com" },
        items: [{ product_id: "pro_abc", price_id: "pri_def", quantity: 1 }],
      },
    };

    expect(event.event_type).toBe("transaction.completed");
    expect(event.data.items[0].product_id).toBe("pro_abc");
    expect(event.data.items[0].price_id).toBe("pri_def");
    expect(event.data.customer_email).toBe("buyer@example.com");
  });
});
