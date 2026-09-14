import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildIndex, hubAdmitted, rowFromCard, splitModelRef } from "./build-pod-cards-index.mjs";

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
  assert.equal(rowFromCard("x.json", card("Qwen/Qwen2-0.5B", "swarm", 37, "MEASURED")), null, "legacy hub card (no admission) excluded");
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
  assert.equal(idx.count, 2); assert.equal(idx.signed_files_seen, 4); assert.equal(idx.skipped_legacy_or_unreadable, 2);
  assert.deepEqual(Object.keys(idx.subjects), ["llama3.2:3b"]); assert.deepEqual([...idx.subjects["llama3.2:3b"]].sort(), ["1".repeat(64), "2".repeat(64)]);
  assert.equal(buildIndex(join(dir, "missing")).count, 0);
});

test("a Hub card with a current v0.2 admission is a deliverable; without it, it is not", () => {
  const hub = card("Qwen/Qwen3-14B", "care", 30, "MEASURED", "h".repeat(64));
  hub.body.evidence = { schema: "csoai.mill-item-evidence/0.2", items_file: "items-care-d2154338e911.jsonl", bank_file: "bank-care-3cf9c16dbb6b.jsonl", bank_revision: "0683ea4628dc0231cc7ad950d633d0539a052ec1", model_hf_revision: "40c069824f4251a91eefaf281ebe4c544efd3e18", bank_sha256: "c".repeat(64), items_sha256: "d".repeat(64), instrument_sha256: "e".repeat(64), bank_dataset: "csoai/gspc-care" };
  hub.body.admission = { schema: "csoai.mill-evidence-admission/0.2", file: "admission-aa3e2e9e5738.json", sha256: "aa3e2e9e5738c4e0d0dde69af29720e4ea65135d2d41d4f210206ec55aeeca79" };
  assert.equal(hubAdmitted(hub.body), true);
  const r = rowFromCard("signed-care-eda16a8fc969.json", hub);
  assert.equal(r.kind, "hub"); assert.equal(r.subject, "Qwen/Qwen3-14B"); assert.equal(r.n, 30);
  assert.equal(r.admission.url, "https://councilof.ai/interop/mill-evidence/admission-aa3e2e9e5738.json");
  assert.equal(r.model_hf_revision, "40c069824f4251a91eefaf281ebe4c544efd3e18");
  const legacy = card("Qwen/Qwen2.5-7B-Instruct", "safety", 30, "MEASURED", "l".repeat(64));
  assert.equal(hubAdmitted(legacy.body), false);
  assert.equal(rowFromCard("signed-safety-legacy.json", legacy), null);
  const pod = rowFromCard("signed-swarm-c.json", card("ollama:llama3.2:3b@sha256:a80c", "swarm", 37, "MEASURED"));
  assert.equal(pod.kind, "pod");
});
