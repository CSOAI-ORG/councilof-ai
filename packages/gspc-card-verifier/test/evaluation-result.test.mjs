/**
 * The conformance corpus IS the test. Every vector records the verdict a conformant verifier must
 * return; this runs the reference verifier over all of them and fails on any disagreement.
 *
 * The UNCHECKABLE cases are the ones that matter: they are what a two-state verifier gets wrong.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, createPrivateKey } from "node:crypto";
import { verifyEvaluationResult, checkPredicate, STATES } from "../src/evaluation-result.mjs";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "vectors");
const manifest = JSON.parse(readFileSync(join(DIR, "manifest.json"), "utf8"));

// The corpus is signed by a fixed seed key; the verifier resolves only that keyid.
const seed = Buffer.alloc(32, 7);
const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
const RAW_PUB = Buffer.from(createPrivateKey({ key: der, format: "der", type: "pkcs8" })
  .export({ format: "jwk" }).x, "base64url");
const resolveKey = async (keyid) => (keyid === "did:web:councilof.ai#eval-1" ? RAW_PUB : null);

const files = readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "manifest.json").sort();

test("corpus is pinned: every vector matches its manifest digest", () => {
  assert.equal(files.length, manifest.total, "file count matches the manifest");
  for (const v of manifest.vectors) {
    const got = createHash("sha256").update(readFileSync(join(DIR, v.file))).digest("hex");
    assert.equal(got, v.sha256, `${v.file} digest matches the manifest`);
  }
});

for (const f of files) {
  const v = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  test(`${v.id} → ${v.expect} (${v.why})`, async () => {
    const r = await verifyEvaluationResult(v.envelope, resolveKey);
    assert.equal(r.state, v.expect, `expected ${v.expect}, got ${r.state}: ${r.why}${r.detail ? " — " + r.detail : ""}`);
  });
}

test("the corpus exercises all three states", () => {
  const seen = new Set(files.map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")).expect));
  for (const s of [STATES.VALID, STATES.INVALID, STATES.UNCHECKABLE]) assert.ok(seen.has(s), `corpus covers ${s}`);
});

// Guard against a vacuous suite: prove the checks can actually fail.
test("checkPredicate rejects what the spec says it rejects", () => {
  const base = JSON.parse(readFileSync(join(DIR, "v001-genuine.json"), "utf8"));
  const stmt = JSON.parse(Buffer.from(base.envelope.payload, "base64").toString("utf8"));
  assert.equal(checkPredicate(stmt.predicate), null, "the genuine predicate is admissible");
  const trunc = structuredClone(stmt.predicate); trunc.harness.commit = "abc1234";
  assert.match(String(checkPredicate(trunc)), /40-hex/, "a truncated pin is rejected");
  const med = structuredClone(stmt.predicate); med.result.aggregation = "median";
  assert.match(String(checkPredicate(med)), /wilson/, "wilson on a median is rejected");
});
