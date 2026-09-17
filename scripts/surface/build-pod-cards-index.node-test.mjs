import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildIndex, rowFromCard, splitModelRef } from "./build-pod-cards-index.mjs";

const card = (model, axis, n, status, id = "a".repeat(64)) => ({
  alg: "Ed25519", id, signature: "ff".repeat(32), did: "did:web:csoai.org#board-attestation-1",
  body: { model, axis, n, status, compute_evidence: { bank_sha256: "b".repeat(64), run_id: "20260914T032410.595977Z-a7bb0359af" } },
});

test("splitModelRef reads subject and digest from an ollama ref, refuses hub refs", () => {
  assert.deepEqual(splitModelRef("ollama:llama3.2:3b@sha256:abc"), { subject: "llama3.2:3b", digest: "sha256:abc" });
  assert.deepEqual(splitModelRef("ollama:qwen3:4b"), { subject: "qwen3:4b", digest: null });
  assert.equal(splitModelRef("Qwen/Qwen2-0.5B"), null);
  assert.equal(splitModelRef(undefined), null);
});

test("rowFromCard carries the card's own fields and never a verdict", () => {
  const r = rowFromCard("signed-swarm-c78b9cf6cdc9.json", card("ollama:llama3.2:3b@sha256:a80c", "swarm", 37, "MEASURED"));
  assert.equal(r.subject, "llama3.2:3b");
  assert.equal(r.url, "https://councilof.ai/interop/mill-cards-signed/signed-swarm-c78b9cf6cdc9.json");
  assert.equal(r.status, "MEASURED"); assert.equal(r.n, 37); assert.equal(r.verified_here, false);
  assert.equal(r.run_id, "20260914T032410.595977Z-a7bb0359af");
  assert.equal(rowFromCard("x.json", card("Qwen/Qwen2-0.5B", "swarm", 37, "MEASURED")), null, "hub card excluded");
  assert.equal(rowFromCard("x.json", { id: "z", body: { model: "ollama:m" } }), null, "unsigned refused");
});

test("buildIndex groups by subject, skips unreadable and non-pod files, and counts what it saw", () => {
  const dir = mkdtempSync(join(tmpdir(), "podidx-")); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "signed-swarm-1.json"), JSON.stringify(card("ollama:llama3.2:3b@sha256:a", "swarm", 37, "MEASURED", "1".repeat(64))));
  writeFileSync(join(dir, "signed-safety-2.json"), JSON.stringify(card("ollama:llama3.2:3b@sha256:a", "safety", 9, "UNMEASURED", "2".repeat(64))));
  writeFileSync(join(dir, "signed-affect-3.json"), JSON.stringify(card("Qwen/Qwen2-0.5B", "affect", 33, "MEASURED", "3".repeat(64))));
  writeFileSync(join(dir, "signed-junk-4.json"), "{not json");
  writeFileSync(join(dir, "SUPERSEDED.jsonl"), "{}\n{}\n");
  const idx = buildIndex(dir);
  assert.equal(idx.count, 2); assert.equal(idx.signed_files_seen, 4); assert.equal(idx.skipped_non_pod_or_unreadable, 2);
  assert.deepEqual(Object.keys(idx.subjects), ["llama3.2:3b"]); assert.deepEqual([...idx.subjects["llama3.2:3b"]].sort(), ["1".repeat(64), "2".repeat(64)]);
  assert.equal(buildIndex(join(dir, "missing")).count, 0);
});

// ---------------------------------------------------------------------------
// Excluded attempts. body.n is graded_n, NOT the attempts: the pod worker writes
// n = transport_ok - parse_errors (scripts/runpod_gspc_worker.py). A row that
// published n alone let a reader read 235 as "235 items were put to the model",
// when 237 were and 2 were dropped. The row must carry the same names /api/worker
// already publishes, and must never turn an ABSENT count into 0.
const ce = (extra) => ({
  alg: "Ed25519", id: "c".repeat(64), signature: "ff".repeat(32), did: "did:web:csoai.org#board-attestation-1",
  body: { model: "ollama:llama3.2:3b@sha256:a80c", axis: "governance", n: 235, status: "MEASURED",
          compute_evidence: { bank_sha256: "b".repeat(64), run_id: "20260914T032626.887163Z-ec5e190ebe", ...extra } },
});

test("rowFromCard carries the excluded attempts and the attempted denominator", () => {
  const r = rowFromCard("signed-governan-e9bc92b7b39b.json", ce({ parse_errors_excluded: 2, transport_errors_excluded: 0 }));
  assert.equal(r.n, 235, "the card's own n is unchanged");
  assert.equal(r.graded_n, 235, "n IS graded_n — say so in the estate's vocabulary");
  assert.equal(r.parse_errors_excluded, 2);
  assert.equal(r.transport_errors_excluded, 0);
  assert.equal(r.attempted, 237, "235 graded + 2 parse + 0 transport = the 237 attempts behind the row");
  assert.equal(r.exclusions_state, "EXCLUSIONS_PUBLISHED");
});

test("an absent exclusion count is null and said to be absent — never 0", () => {
  // Real corpus: signed-governan-3c96b82c7e64.json (qwen3:4b) carries
  // transport_errors_excluded and NO parse_errors_excluded.
  const partial = rowFromCard("x.json", ce({ transport_errors_excluded: 0 }));
  assert.equal(partial.parse_errors_excluded, null, "absent is not zero");
  assert.equal(partial.transport_errors_excluded, 0);
  assert.equal(partial.attempted, null, "attempted cannot be completed from one of the two counts");
  assert.equal(partial.graded_n, null, "n is only known to be graded_n when both exclusions are published");
  assert.equal(partial.exclusions_state, "EXCLUSIONS_PARTIAL");

  const none = rowFromCard("x.json", ce({}));
  assert.deepEqual(
    { p: none.parse_errors_excluded, t: none.transport_errors_excluded, a: none.attempted, g: none.graded_n },
    { p: null, t: null, a: null, g: null },
  );
  assert.equal(none.exclusions_state, "EXCLUSIONS_ABSENT");
});

test("buildIndex counts the rows by exclusions state and states the rule once", () => {
  const dir = mkdtempSync(join(tmpdir(), "podidx-excl-")); mkdirSync(dir, { recursive: true });
  const w = (f, card) => writeFileSync(join(dir, f), JSON.stringify(card));
  w("signed-a.json", { ...ce({ parse_errors_excluded: 2, transport_errors_excluded: 0 }), id: "1".repeat(64) });
  w("signed-b.json", { ...ce({ parse_errors_excluded: 0, transport_errors_excluded: 0 }), id: "2".repeat(64) });
  w("signed-c.json", { ...ce({}), id: "3".repeat(64) });
  const idx = buildIndex(dir);
  assert.equal(idx.count, 3);
  assert.deepEqual(idx.denominator.rows_by_exclusions_state,
    { EXCLUSIONS_PUBLISHED: 2, EXCLUSIONS_PARTIAL: 0, EXCLUSIONS_ABSENT: 1 });
  assert.equal(idx.denominator.rows_with_excluded_attempts, 1, "only the row that actually excluded attempts");
  assert.match(idx.denominator.rule, /attempted/);
  assert.match(idx.denominator.rule, /graded_n/);
});
