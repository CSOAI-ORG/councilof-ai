import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
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

for (const [label, action, options] of [
  ['ordinary local read', 'read_evidence', {}],
  ['unknown action', 'remove_fixture', {}],
  ['consequential action', 'delete_fixture', {}],
  ['empty approval object', 'delete_fixture', { approvalReceipt: {} }],
  ['typed reviewer', 'delete_fixture', { approvalReceipt: { approver: 'synthetic-reviewer', receipt_id: 'fixture' } }],
  ['legacy bypass', 'delete_fixture', { allowUnapprovedEscalation: true }],
  ['claimed verified approval', 'delete_fixture', { approvalReceipt: { verified: true, decision: 'APPROVED' } }],
  ['per-call verifier', 'delete_fixture', { verifyApproval: () => true, verifyLocalAuthority: () => true }],
]) {
  test(`unqualified local executor holds ${label} without dispatch or signing`, async () => {
    let effects = 0;
    let keyGenerations = 0;
    let networkCalls = 0;
    const l0 = new Layer0({ identity: 'synthetic-principal', fetchImpl: async () => { networkCalls++; throw new Error('unexpected network'); } });
    l0._ensureKeyPair = () => { keyGenerations++; throw new Error('unexpected signing'); };
    await assert.rejects(
      l0.governedLocal(action, { fixture: true }, async () => { effects++; return 'fixture'; }, options),
      { code: 'LOCAL_EXECUTOR_NOT_QUALIFIED' },
    );
    assert.equal(effects, 0);
    assert.equal(keyGenerations, 0);
    assert.equal(networkCalls, 0);
  });
}

test('secret minimization and regulatory diagnostics remain specific and non-executing', async () => {
  let effects = 0;
  const run = async () => { effects++; };
  const l0 = new Layer0({ identity: 'synthetic-principal' });
  await assert.rejects(l0.governedLocal('read_evidence', { api_key: 'synthetic-secret' }, run), /raw secret field/);
  await assert.rejects(l0.governedLocal('certify_compliance', {}, run), /outside CSOAI constitutional boundary/);
  assert.equal(effects, 0);
});

test('a supplied-key signature establishes byte consistency, not trusted authority', () => {
  const canonical = (value) => value === null || typeof value !== 'object' ? JSON.stringify(value)
    : Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
    : '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  const body = { schema: 'synthetic-verifier-fixture', execution_authority_granted_by_charter: false };
  const bytes = Buffer.from(canonical(body));
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const receipt = { ...body, public_key_jwk: publicKey.export({ format: 'jwk' }),
    receipt_sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    sig_ed25519: crypto.sign(null, bytes, privateKey).toString('base64url') };
  const l0 = new Layer0({ identity: 'synthetic-principal' });
  const result = l0.verifyLocalReceipt(receipt);
  assert.equal(result.verdict, 'VALID');
  assert.equal(result.verification_scope, 'SUPPLIED_KEY_SIGNATURE_ONLY');
  assert.equal(result.authority_verified, false);
  assert.equal(l0.verifyLocalReceipt({ ...receipt, schema: 'tampered' }).verdict, 'INVALID');
});
