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
