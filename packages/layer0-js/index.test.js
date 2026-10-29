import test from "node:test";
import assert from "node:assert/strict";
import { Layer0 } from "./index.js";

class Stub extends Layer0 {
  constructor(state, { attest = true, verifyApproval } = {}) {
    super({ identity: "did:csoai:test", base: "http://stub", verifyApproval });
    this.state = state;
    this.attest = attest;
    this.ran = 0;
  }
  async gate() { return { state: this.state, reason: "policy" }; }
  async _attest() { return this.attest ? { envelope: { sig: "x" } } : null; }
}

test("escalate without an approval receipt does not run", async () => {
  const l0 = new Stub("escalate");
  await assert.rejects(
    () => l0.governed("evidence.collect", {}, async () => { l0.ran++; }),
    (e) => e.code === "ESCALATION_REQUIRED",
  );
  assert.equal(l0.ran, 0, "the operation must not execute before approval");
});

test("escalate with an approval receipt runs and is attested", async () => {
  const l0 = new Stub("escalate", { verifyApproval: async (receipt, context) =>
    receipt.id === "APR-1" && context.action === "evidence.collect" &&
    context.identity === "did:csoai:test" && context.inputsHash.startsWith("sha256:") });
  const out = await l0.governed("evidence.collect", {}, async ({ approval }) => `ok:${approval.id}`,
    { approval: { id: "APR-1" } });
  assert.equal(out.result, "ok:APR-1");
  assert.equal(out.attested, true);
  assert.equal(out.status, "attested");
});

test("the legacy escape flag cannot bypass an escalation", async () => {
  const l0 = new Stub("escalate");
  await assert.rejects(() => l0.governed("evidence.collect", {}, async () => { l0.ran++; },
    { allowUnapprovedEscalation: true }), { code: "ESCALATION_REQUIRED" });
  assert.equal(l0.ran, 0);
});

test("missing attestation is executed_unattested, never a plain success", async () => {
  const l0 = new Stub("allow", { attest: false });
  const out = await l0.governed("evidence.collect", {}, async () => "done");
  assert.equal(out.attestation, null);
  assert.equal(out.attested, false);
  assert.equal(out.status, "executed_unattested");
});

test("deny still throws and never runs", async () => {
  const l0 = new Stub("deny");
  await assert.rejects(() => l0.governed("evidence.collect", {}, async () => { l0.ran++; }));
  assert.equal(l0.ran, 0);
});

test("malformed and unknown gate decisions never dispatch", async () => {
  for (const decision of [null, undefined, {}, [], true, { state: true },
    { state: "ALLOW" }, { state: "unknown" }, { state: "" }]) {
    const l0 = new Stub("allow");
    l0.gate = async () => decision;
    await assert.rejects(() => l0.governed("x", {}, async () => { l0.ran++; }),
      { code: "INVALID_GATE_DECISION" });
    assert.equal(l0.ran, 0);
  }
});

test("a supplied receipt without a trusted verifier is insufficient", async () => {
  const l0 = new Stub("escalate");
  await assert.rejects(() => l0.governed("x", {}, async () => { l0.ran++; },
    { approval: { id: "forged" }, verifyApproval: () => true }),
  { code: "APPROVAL_NOT_VERIFIED" });
  assert.equal(l0.ran, 0);
});

test("only literal true from the trusted verifier permits escalation", async () => {
  for (const result of [false, undefined, null, 1, "true", {}, { approved: true }]) {
    const l0 = new Stub("escalate", { verifyApproval: async () => result });
    await assert.rejects(() => l0.governed("x", {}, async () => { l0.ran++; },
      { approval: { id: "APR-1" } }), { code: "APPROVAL_NOT_VERIFIED" });
    assert.equal(l0.ran, 0);
  }
});

test("verifier failure never dispatches", async () => {
  const l0 = new Stub("escalate", { verifyApproval: async () => { throw new Error("revocation unavailable"); } });
  await assert.rejects(() => l0.governed("x", {}, async () => { l0.ran++; },
    { approval: { id: "APR-1" } }), /revocation unavailable/);
  assert.equal(l0.ran, 0);
});

test("malformed approval values never reach the verifier", async () => {
  let checked = 0;
  const l0 = new Stub("escalate", { verifyApproval: async () => { checked++; return true; } });
  for (const approval of [false, true, 1, "APR-1", []]) {
    await assert.rejects(() => l0.governed("x", {}, async () => { l0.ran++; }, { approval }),
      { code: "ESCALATION_REQUIRED" });
  }
  assert.equal(checked, 0);
  assert.equal(l0.ran, 0);
});

test("pre-cancelled tasks do not call the gateway or dispatch", async () => {
  const l0 = new Stub("allow");
  let gated = 0;
  l0.gate = async () => { gated++; return { state: "allow" }; };
  await assert.rejects(() => l0.governed("x", {}, async () => { l0.ran++; },
    { signal: AbortSignal.abort() }), { code: "EXECUTION_CANCELLED" });
  assert.equal(gated, 0);
  assert.equal(l0.ran, 0);
});

test("cancellation while awaiting the gateway prevents dispatch", async () => {
  const controller = new AbortController();
  const l0 = new Stub("allow");
  l0.gate = async () => { controller.abort(); return { state: "allow" }; };
  await assert.rejects(() => l0.governed("x", {}, async () => { l0.ran++; },
    { signal: controller.signal }), { code: "EXECUTION_CANCELLED" });
  assert.equal(l0.ran, 0);
});

test("cancellation during approval verification prevents dispatch", async () => {
  const controller = new AbortController();
  const l0 = new Stub("escalate", { verifyApproval: async () => { controller.abort(); return true; } });
  await assert.rejects(() => l0.governed("x", {}, async () => { l0.ran++; },
    { approval: { id: "APR-1" }, signal: controller.signal }), { code: "EXECUTION_CANCELLED" });
  assert.equal(l0.ran, 0);
});

test("cancellation after dispatch preserves the returned effect and reports the request", async () => {
  const controller = new AbortController();
  const l0 = new Stub("allow");
  const result = await l0.governed("x", {}, async ({ signal }) => {
    assert.equal(signal, controller.signal);
    controller.abort();
    return "effect already occurred";
  }, { signal: controller.signal });
  assert.equal(result.result, "effect already occurred");
  assert.equal(result.cancellationRequested, true);
});

test("input changes during authorization prevent dispatch", async () => {
  const inputs = { destination: "approved" };
  const l0 = new Stub("allow");
  l0.gate = async () => { inputs.destination = "changed"; return { state: "allow" }; };
  await assert.rejects(() => l0.governed("x", inputs, async () => { l0.ran++; }),
    { code: "AUTHORIZATION_INPUTS_CHANGED" });
  assert.equal(l0.ran, 0);
});

test("attestation retains the authorized input digest when the callback mutates inputs", async () => {
  const inputs = { value: "before" };
  const l0 = new Layer0({ identity: "did:csoai:test", base: "http://stub" });
  let checkedHash;
  let attestedHash;
  l0._post = async (path, body) => {
    if (path === "/api/gate") { checkedHash = body.inputsHash; return { state: "allow" }; }
    attestedHash = body.payload.inputsHash;
    return { envelope: { fixture: true } };
  };
  await l0.governed("x", inputs, async () => { inputs.value = "after"; });
  assert.equal(attestedHash, checkedHash);
});

