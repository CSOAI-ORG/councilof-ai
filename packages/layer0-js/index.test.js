import test from "node:test";
import assert from "node:assert/strict";
import { Layer0 } from "./index.js";

class Stub extends Layer0 {
  constructor(state, { attest = true } = {}) {
    super({ identity: "did:csoai:test", base: "http://stub" });
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
  const l0 = new Stub("escalate");
  const out = await l0.governed("evidence.collect", {}, async ({ approval }) => `ok:${approval.id}`,
    { approval: { id: "APR-1" } });
  assert.equal(out.result, "ok:APR-1");
  assert.equal(out.attested, true);
  assert.equal(out.status, "attested");
});

test("a deliberate unapproved escalation is labelled, not silently successful", async () => {
  const l0 = new Stub("escalate");
  const out = await l0.governed("evidence.collect", {}, async () => "done", { allowUnapprovedEscalation: true });
  assert.equal(out.status, "executed_unapproved");
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
