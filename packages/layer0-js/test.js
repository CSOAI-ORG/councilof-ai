import test from "node:test";
import assert from "node:assert/strict";
import { Layer0 } from "./index.js";

function makeMockFetch({ gateDecision, attestEnvelope, attestFails = false }) {
  return async (url) => {
    if (url.endsWith("/api/gate")) {
      return {
        ok: true,
        status: 200,
        json: async () => gateDecision,
      };
    }
    if (url.endsWith("/api/a2a/route")) {
      if (attestFails) {
        return { ok: false, status: 503, json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ envelope: attestEnvelope }),
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
}

test("allow + signed attestation returns status=attested", async () => {
  const l0 = new Layer0({
    base: "https://councilof.ai",
    identity: "did:csoai:test",
    fetchImpl: makeMockFetch({
      gateDecision: { state: "allow" },
      attestEnvelope: { sig: "ed25519:abc123" },
    }),
  });
  const res = await l0.governed("evidence.collect", { a: 1 }, async () => "ok");
  assert.equal(res.status, "attested");
  assert.equal(res.result, "ok");
  assert.deepEqual(res.attestation, { sig: "ed25519:abc123" });
});

test("deny throws before run() is called", async () => {
  let ran = false;
  const l0 = new Layer0({
    base: "https://councilof.ai",
    identity: "did:csoai:test",
    fetchImpl: makeMockFetch({
      gateDecision: { state: "deny", reason: "policy-blocked" },
      attestEnvelope: { sig: "ed25519:abc123" },
    }),
  });
  await assert.rejects(
    () => l0.governed("evidence.collect", { a: 1 }, async () => { ran = true; }),
    /Layer-0 Gate denied: policy-blocked/
  );
  assert.equal(ran, false);
});

test("escalate without approval receipt refuses before run()", async () => {
  let ran = false;
  const l0 = new Layer0({
    base: "https://councilof.ai",
    identity: "did:csoai:test",
    fetchImpl: makeMockFetch({
      gateDecision: { state: "escalate", reason: "human-review-needed" },
      attestEnvelope: { sig: "ed25519:abc123" },
    }),
  });
  await assert.rejects(
    () => l0.governed("evidence.collect", { a: 1 }, async () => { ran = true; }),
    /escalation requires an approval receipt/
  );
  assert.equal(ran, false);
});

test("escalate with approval receipt runs and returns status=attested", async () => {
  const l0 = new Layer0({
    base: "https://councilof.ai",
    identity: "did:csoai:test",
    fetchImpl: makeMockFetch({
      gateDecision: { state: "escalate", reason: "human-review-needed" },
      attestEnvelope: { sig: "ed25519:approved" },
    }),
  });
  const res = await l0.governed(
    "evidence.collect",
    { a: 1 },
    async ({ approval }) => `approved-by:${approval.approver}`,
    { approvalReceipt: { approver: "nick@csoai.org", receipt_id: "rcpt-001" } }
  );
  assert.equal(res.status, "attested");
  assert.equal(res.result, "approved-by:nick@csoai.org");
});

test("attestation failure returns status=executed_unattested and never claims attested", async () => {
  const l0 = new Layer0({
    base: "https://councilof.ai",
    identity: "did:csoai:test",
    fetchImpl: makeMockFetch({
      gateDecision: { state: "allow" },
      attestFails: true,
    }),
  });
  const res = await l0.governed("evidence.collect", { a: 1 }, async () => "work-done");
  assert.equal(res.status, "attested" === res.status ? "fail" : "executed_unattested");
  assert.equal(res.attestation, null);
  assert.equal(res.result, "work-done");
});

test("governedLocal: signs a verifiable Ed25519 constitutional effect receipt offline", async () => {
  const l0 = new Layer0({ identity: "did:csoai:local-dev", tenantId: "t1", harnessId: "langgraph" });
  const res = await l0.governedLocal("read_evidence", { query: "gspc-axes" }, async () => ({ rows: 33 }));
  assert.equal(res.status, "attested");
  assert.equal(res.attestation.schema, "csoai.constitutional-effect-receipt/0.1");
  assert.equal(
    res.attestation.charter_sha256,
    "3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e"
  );
  const v = l0.verifyLocalReceipt(res.attestation);
  assert.equal(v.verdict, "VALID");

  // Tampering with the receipt produces INVALID
  const tampered = { ...res.attestation, action: "tampered_action" };
  assert.equal(l0.verifyLocalReceipt(tampered).verdict, "INVALID");
});

test("governedLocal: enforces CH-10 secret minimization and CH-13 regulatory refusal", async () => {
  const l0 = new Layer0({ identity: "did:csoai:local-dev" });
  await assert.rejects(
    () => l0.governedLocal("read_evidence", { api_key: "sk-secret-123" }, async () => "ok"),
    /CH-10: raw secret field 'api_key'/
  );
  await assert.rejects(
    () => l0.governedLocal("certify_compliance", { model: "x" }, async () => "ok"),
    /CH-13: action 'certify_compliance' is outside CSOAI constitutional boundary/
  );
});

test("governedLocal: enforces CH-03/CH-04 HITL approval receipt on consequential execute_* actions", async () => {
  const l0 = new Layer0({ identity: "did:csoai:local-dev" });
  await assert.rejects(
    () => l0.governedLocal("execute_order", { symbol: "ETH" }, async () => "done"),
    /escalation requires an approval receipt/
  );

  const res = await l0.governedLocal(
    "execute_order",
    { symbol: "ETH" },
    async () => "done",
    { approvalReceipt: { approver: "nick@csoai.org", receipt_id: "hitl-rcpt-01" } }
  );
  assert.equal(res.status, "attested");
  assert.equal(res.attestation.human_in_the_loop.required, true);
  assert.equal(res.attestation.human_in_the_loop.approved, true);
  assert.equal(res.attestation.human_in_the_loop.approver, "nick@csoai.org");
});

