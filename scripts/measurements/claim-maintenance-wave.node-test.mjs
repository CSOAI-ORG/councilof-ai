// The claim-maintenance wave must be a faithful re-read, and it must not claim more than it can.
//   node --test scripts/measurements/claim-maintenance-wave.node-test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = path.resolve(new URL("../../", import.meta.url).pathname);
const sha = (b) => createHash("sha256").update(b).digest("hex");
const WAVE = path.join(ROOT, "public/interop/claim-maintenance-wave-2026-10-28.json");
const skip = !existsSync(WAVE) && "no wave published yet — run scripts/measurements/claim-maintenance-wave.mjs";
const opt = { skip: skip || false };

const wave = opt.skip ? null : JSON.parse(readFileSync(WAVE, "utf8"));

test("the wave counts add up to the rows it reports", opt, () => {
  assert.equal(wave.rows.length, wave.counts.claims);
  const tally = {};
  for (const r of wave.rows) tally[r.outcome] = (tally[r.outcome] || 0) + 1;
  for (const k of ["UNCHANGED", "CHANGED", "WITHDRAWN", "UNREACHABLE"]) {
    assert.equal(wave.counts[k] || 0, tally[k] || 0, "the count for " + k + " disagrees with the rows");
  }
});

test("n_valid is the rows that were actually read, and it clears the slot's threshold", opt, () => {
  const unreachable = wave.rows.filter((r) => r.outcome === "UNREACHABLE").length;
  assert.equal(wave.thresholds.n_valid, wave.rows.length - unreachable);
  assert.equal(wave.thresholds.min_valid, 30, "the slot's own threshold is 30");
  assert.ok(wave.thresholds.meets_threshold, "the wave does not clear the threshold, so the slot cannot be promoted");
  assert.ok(wave.thresholds.n_valid >= wave.thresholds.min_valid);
});

test("the wave never asserts a disclosure verdict it cannot decide", opt, () => {
  for (const r of wave.rows) {
    if (r.outcome === "CHANGED") {
      assert.equal(r.disclosure, "NOT_DECIDABLE_BY_THIS_METHOD",
        "a changed claim must not claim a disclosure verdict the method cannot decide");
      assert.ok(r.disclosure_reason && r.disclosure_reason.length > 40, "the refusal must say why");
    }
  }
});

test("every row names the method it was read with", opt, () => {
  assert.ok(wave.method.specification.includes("councilof.ai/spec/claim-maintenance"));
  assert.ok(wave.method.extractor.startsWith("csoai-visible-text/"),
    "the wave must name the visible-text rule it used");
  for (const r of wave.rows) {
    assert.ok(r.claim_id, "a row has no claim id");
    assert.ok(r.source_url, "a row has no source url");
    assert.ok(r.captured_digest, "a row has no captured digest to compare against");
  }
});

test("the wave says it does not establish that any claim is true", opt, () => {
  const text = JSON.stringify(wave);
  assert.ok(text.includes("Whether any claim is true"), "the wave must disclaim truth");
  assert.ok(/ranking|grade|verdict/.test(text), "the wave must disclaim a ranking or verdict");
});

test("the registers the wave read are the ones on disk, byte for byte", opt, () => {
  for (const reg of wave.registers) {
    const raw = readFileSync(path.join(ROOT, "public/claims", reg.file));
    assert.equal(sha(raw), reg.sha256, "the register digest disagrees: " + reg.file);
  }
  const onDisk = readdirSync(path.join(ROOT, "public/claims"))
    .filter((f) => /^claimreg-.*\.json$/.test(f) && !f.includes(".signed."))
    .filter((f) => {
      try { return (JSON.parse(readFileSync(path.join(ROOT, "public/claims", f), "utf8")).claims || []).length; }
      catch { return false; }
    });
  assert.equal(onDisk.length, wave.registers.length, "the wave did not read every register with claims");
});
