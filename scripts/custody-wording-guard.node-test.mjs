// node --test scripts/custody-wording-guard.node-test.mjs
// C-2026-0925-01: split-custody wording may not return without a ceremony record.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runGuard, scanText } from "./custody-wording-guard.mjs";

function fixtureRepo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "custody-guard-"));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), body);
  }
  return dir;
}

test("the repository as committed passes", () => {
  const r = runGuard();
  assert.equal(r.ok, true, JSON.stringify(r.violations.slice(0, 5), null, 2));
  assert.ok(r.scanned > 100, `scanned only ${r.scanned} files`);
});

test("the exact wording C-2026-0925-01 corrected is caught", () => {
  assert.equal(scanText("Paid sign is hidden while the stamp is live. KEY is 2-of-3.").length, 1);
  assert.equal(scanText('"custody": "3-party MPC (Coinbase cb-mpc, Ed25519 additive), owner\'s own Oracle tenancy"').length, 1);
  assert.equal(scanText("signed under three-party custody").length, 1);
  assert.equal(scanText("a threshold key signs the board").length, 1);
});

test("correction or planning context within reach allows the mention", () => {
  assert.equal(scanText("A 2-of-3 key split is planned for the root ceremony and has not been performed.").length, 0);
  assert.equal(scanText("3-party protocol, all three shares on one host: one failure domain.").length, 0);
  assert.equal(scanText("(3-party) [custody corrected by C-2026-0925-01]").length, 0);
});

test("context further away than the window does not launder a claim", () => {
  const far = "KEY is 2-of-3." + " filler".repeat(120) + " the split is planned.";
  assert.equal(scanText(far).length, 1);
});

test("council design figures and absence assertions are not custody claims", () => {
  assert.equal(scanText("a designed 23-of-33 supermajority threshold").length, 0);
  assert.equal(scanText("assert.doesNotMatch(custody, /3-party/);").length, 0);
  assert.equal(scanText("expect(s.custody).not.toMatch(/3-party MPC/);").length, 0);
});

test("a fixture surface with the old wording fails; a PERFORMED ceremony with a record makes it pass", () => {
  const surface = { "public/x.json": '{"custody":"3-party MPC custody"}' };
  const none = fixtureRepo({ ...surface, "council-os/custody-ceremonies.json": JSON.stringify({ performed: [] }) });
  const r0 = runGuard({ repo: none, roots: ["public"] });
  assert.equal(r0.ok, false);
  assert.equal(r0.violations[0].file, "public/x.json");

  const oneDomain = fixtureRepo({
    ...surface,
    "council-os/custody-ceremonies.json": JSON.stringify({ performed: [{ id: "R1", state: "PERFORMED", distinct_custody_domains: 1, record: "rec.json" }] }),
    "rec.json": "{}",
  });
  assert.equal(runGuard({ repo: oneDomain, roots: ["public"] }).ok, false, "one custody domain is not a split");

  const noRecord = fixtureRepo({
    ...surface,
    "council-os/custody-ceremonies.json": JSON.stringify({ performed: [{ id: "R1", state: "PERFORMED", distinct_custody_domains: 3, record: "missing.json" }] }),
  });
  assert.equal(runGuard({ repo: noRecord, roots: ["public"] }).ok, false, "a ceremony without its record is not a ceremony");

  const planned = fixtureRepo({
    ...surface,
    "council-os/custody-ceremonies.json": JSON.stringify({ performed: [{ id: "R1", state: "PLANNED", distinct_custody_domains: 3, record: "rec.json" }] }),
    "rec.json": "{}",
  });
  assert.equal(runGuard({ repo: planned, roots: ["public"] }).ok, false, "planned is not performed");

  const done = fixtureRepo({
    ...surface,
    "council-os/custody-ceremonies.json": JSON.stringify({ performed: [{ id: "R1", state: "PERFORMED", distinct_custody_domains: 3, record: "rec.json" }] }),
    "rec.json": "{}",
  });
  const r1 = runGuard({ repo: done, roots: ["public"] });
  assert.equal(r1.ok, true);
  assert.match(r1.ceremony.why, /PERFORMED with 3 custody domains/);
});

test("pinned signed bytes pass only while their correction document exists", () => {
  const signed = { "public/signed/gspc-board.signed.json": '{"custody":"3-party MPC"}' };
  const without = fixtureRepo(signed);
  const r0 = runGuard({ repo: without, roots: ["public"] });
  assert.equal(r0.ok, false);
  assert.equal(r0.pinnedMissingCorrection.length, 1);
  const withCorr = fixtureRepo({ ...signed, "public/signed/gspc-board.status.json": "{}" });
  assert.equal(runGuard({ repo: withCorr, roots: ["public"] }).ok, true);
});

test("a captured dated receipt passes only while the correction it points to is in place", () => {
  const roots = ["council-os", "public"];
  const receipt = {
    "council-os/receipts/ecosystem-install-20260930/helm-rendered.yaml":
      '      "_gspcBoardKeyNote": "#gspc-board-22axis-2026 is the 3-party Coinbase cb-mpc Ed25519 additive key"\n',
  };
  const corrected = { "public/.well-known/did.json": '{"_gspcBoardKeyNote":"one host, so treat it as single-key custody."}' };

  const without = runGuard({ repo: fixtureRepo(receipt), roots });
  assert.equal(without.ok, false, "a receipt whose correction file is absent is not exempt");
  assert.equal(without.receiptsMissingCorrection.length, 1);

  const reverted = runGuard({ repo: fixtureRepo({ ...receipt, "public/.well-known/did.json": '{"_gspcBoardKeyNote":"an Ed25519 key"}' }), roots });
  assert.equal(reverted.ok, false, "a correction file that no longer carries the correction does not exempt");

  const ok = runGuard({ repo: fixtureRepo({ ...receipt, ...corrected }), roots });
  assert.equal(ok.ok, true, JSON.stringify(ok, null, 2));
  assert.equal(ok.datedReceipts.length, 1);
  assert.equal(ok.datedReceipts[0].captured, "2026-09-30");

  // Only the named file is exempt: a sibling capture in the same receipts directory is not.
  const sibling = runGuard({
    repo: fixtureRepo({ ...receipt, ...corrected, "council-os/receipts/ecosystem-install-20260930/other.yaml": "signed under 3-party custody\n" }),
    roots,
  });
  assert.equal(sibling.ok, false);
  assert.equal(sibling.violations[0].file, "council-os/receipts/ecosystem-install-20260930/other.yaml");
});
