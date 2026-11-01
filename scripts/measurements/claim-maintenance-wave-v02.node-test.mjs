import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildArtifact, artifactDigest, extractorFor, sha256hex } from "../claim-capture.mjs";
import { selectClaims, compareClaim, fetchSource, collectObservations, loadRegisters, replayWave, main } from "./claim-maintenance-wave.mjs";

const html = "<p>The claim &#x41;</p>";
function claim(overrides = {}) {
  return buildArtifact({ claim_id: "X-1", subject: { name: "Example", identifier: "example.com", identifier_kind: "domain" },
    claim_verbatim: "The claim A", source_url: "https://example.com/", access_date: "2026-10-01T00:00:00Z",
    next_read_utc: "2026-11-01T00:00:00Z", measurement_plan: "Re-read the same source.",
    content_hash: sha256hex(extractorFor("csoai-visible-text/2")(html)), ...overrides });
}
function register(file, claims, supersedes) {
  const document = { registry_id: file.slice(0, -5), claims, ...(supersedes ? { supersedes } : {}) };
  const raw = Buffer.from(JSON.stringify(document));
  return { file, document, raw, sha256: sha256hex(raw) };
}
function observed(body = html, extra = {}) {
  body = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return { source_url: "https://example.com/", ok: true, http_status: 200,
    content_type: "text/html; charset=utf-8", body, body_sha256: sha256hex(body),
    completed_at: "2026-10-30T00:00:00Z", ...extra };
}
const record = (c) => ({ claim: c, registers: ["test.json"], lineage: [] });

test("a verified revision replaces its baseline instead of doubling the claim count", () => {
  const a = register("old.json", [claim()]);
  const b = register("new.json", [claim({ access_date: "2026-10-02T00:00:00Z" })],
    { file: "/claims/old.json", sha256: a.sha256, registry_id: a.document.registry_id });
  const selected = selectClaims([a, b]);
  assert.equal(selected.counts.registry_rows, 2);
  assert.equal(selected.counts.unique_claims, 1);
  assert.equal(selected.claims[0].claim.access_date, "2026-10-02T00:00:00Z");
  assert.equal(selected.claims[0].lineage.length, 2);
});
test("a forged supersedes digest cannot retire evidence", () => {
  const a = register("old.json", [claim()]);
  const b = register("new.json", [claim()], { file: "/claims/old.json", registry_id: "old", sha256: "0".repeat(64) });
  assert.throws(() => selectClaims([a, b]), /invalid supersedes/);
});
test("identical active duplicates count once", () => {
  const s = selectClaims([register("a.json", [claim()]), register("b.json", [claim()])]);
  assert.equal(s.claims.length, 1); assert.equal(s.claims[0].registers.length, 2);
});
test("conflicting active copies are held without a newest-timestamp guess", () => {
  const s = selectClaims([register("a.json", [claim()]), register("b.json", [claim({ access_date: "2026-10-02T00:00:00Z" })])]);
  assert.equal(s.claims.length, 0); assert.match(s.rejected[0].reasons.join(), /conflicting/);
});
test("claim IDs are scoped to the subject identity", () => {
  const other = claim({ subject: { name: "Other", identifier: "other.example", identifier_kind: "domain" } });
  assert.equal(selectClaims([register("a.json", [claim(), other])]).claims.length, 2);
});
test("altered claim text and unknown extractors are rejected before a request", () => {
  const c = claim(); c.claim_verbatim += " altered";
  const unknown = claim({ extractor: "unknown" });
  const s = selectClaims([register("a.json", [c]), register("b.json", [{ ...unknown, claim_id: "X-2" }])]);
  assert.equal(s.claims.length, 0); assert.equal(s.rejected.length, 2);
});
test("a missing extractor means rule 1, even where rule 2 would falsely report change", () => {
  const c = claim({ content_hash: sha256hex(extractorFor(undefined)(html)) });
  c.schema = "csoai.claim-maintenance.artifact/0.1";
  delete c.source_content_hash.extractor; c.artifact_sha256 = artifactDigest(c);
  assert.notEqual(c.source_content_hash.value, sha256hex(extractorFor("csoai-visible-text/2")(html)));
  const row = compareClaim(record(c), observed());
  assert.equal(row.extractor, "csoai-visible-text/1"); assert.equal(row.outcome, "UNCHANGED");
});
test("rule 2 still compares the registered reader", () => {
  assert.equal(compareClaim(record(claim()), observed()).outcome, "UNCHANGED");
});
test("binary raw-byte baselines never pass through a text extractor", () => {
  const bytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0xff, 0, 0x80]);
  const c = claim({ covers: "raw-bytes", content_hash: sha256hex(bytes) });
  const r = compareClaim(record(c), observed(bytes, { content_type: "application/pdf" }));
  assert.equal(r.outcome, "UNCHANGED"); assert.equal(r.extractor, null);
  assert.equal(r.claim_text_observation, "NOT_EXTRACTED_FROM_RAW_BODY");
});
test("missing text is an observation, never a withdrawal or silent-change verdict", () => {
  const r = compareClaim(record(claim()), observed("<p>A new page</p>"));
  assert.equal(r.outcome, "CHANGED"); assert.equal(r.claim_text_observation, "NOT_FOUND_IN_EXTRACTED_TEXT");
  assert.equal(r.disclosure, "NOT_DECIDABLE_BY_THIS_METHOD");
});
test("a failed HTTP response is excluded even if it has a hashable error body", () => {
  const r = compareClaim(record(claim()), observed("error", { ok: false, reason: "HTTP_403", http_status: 403 }));
  assert.equal(r.comparable, false); assert.equal(r.outcome, "UNREACHABLE");
});
test("unsupported text encoding, binary MIME and invalid UTF-8 are not page changes", () => {
  for (const o of [observed(html, { content_type: "text/html; charset=windows-1252" }),
    observed(html, { content_type: "application/pdf" }), observed(Buffer.from([0xff]))]) {
    assert.equal(compareClaim(record(claim()), o).outcome, "UNCOMPARABLE");
  }
});
test("corrupted retained bodies refuse comparison", () => {
  assert.throws(() => compareClaim(record(claim()), observed(html, { body_sha256: "0".repeat(64) })), /digest mismatch/);
});
test("a legacy extractor exception is held, never repaired by silently switching readers", () => {
  const c = claim(); delete c.source_content_hash.extractor;
  assert.equal(compareClaim(record(c), observed("<p>&#99999999;</p>")).outcome, "UNCOMPARABLE");
});
test("claims sharing a URL use exactly one response per run", async () => {
  let calls = 0;
  const result = await collectObservations([record(claim()), record(claim({ claim_id: "X-2" }))], async () => {
    calls++; return observed();
  });
  assert.equal(calls, 1); assert.equal(result.length, 1);
});
test("a stalled body is bounded after headers have arrived", async (t) => {
  const server = createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.write("<p>never ends"); });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const result = await fetchSource(`http://127.0.0.1:${server.address().port}/`, { timeoutMs: 100 });
  assert.equal(result.ok, false); assert.equal(result.reason, "TIMEOUT"); assert.equal(result.body, undefined);
});
test("over-limit bodies and unsuccessful HTTP statuses are not retained as complete", async () => {
  const large = await fetchSource("https://example.com", { maxBytes: 8, fetchImpl: async () => new Response("123456789") });
  assert.equal(large.reason, "BODY_TOO_LARGE"); assert.equal(large.body, undefined);
  const denied = await fetchSource("https://example.com", { fetchImpl: async () => new Response("error", { status: 403 }) });
  assert.equal(denied.reason, "HTTP_403"); assert.equal(denied.body_sha256, undefined);
});
test("complete reads preserve the exact body bytes", async () => {
  const result = await fetchSource("https://example.com", { fetchImpl: async () => new Response(Buffer.from([0, 255, 65])) });
  assert.equal(result.ok, true); assert.deepEqual(result.body, Buffer.from([0, 255, 65]));
});
test("malformed registers fail instead of disappearing from the denominator", (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "claim-wave-")); t.after(() => rmSync(dir, { recursive: true }));
  writeFileSync(path.join(dir, "claimreg-bad.json"), "{");
  assert.throws(() => loadRegisters(dir), SyntaxError);
});
test("an existing output refuses a rerun before any fetch", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "claim-wave-")); t.after(() => rmSync(dir, { recursive: true }));
  const out = path.join(dir, "wave.json"); writeFileSync(out, "original");
  await assert.rejects(main(["--out", out]), /already exists/);
  await assert.rejects(main(["--out", out, "--at", "2020-01-01"]), /timestamps cannot/);
});

function replayFixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "claim-replay-"));
  t.after(() => rmSync(dir, { recursive: true })); mkdirSync(path.join(dir, "blobs"));
  const put = (bytes) => { const hash = sha256hex(bytes); writeFileSync(path.join(dir, "blobs", hash), bytes); return hash; };
  const reg = register("a.json", [claim()]), selected = selectClaims([reg]), source = observed();
  const root = new URL("../../", import.meta.url);
  const files = ["scripts/measurements/claim-maintenance-wave.mjs", "scripts/claim-capture.mjs",
    "public/spec/claim-maintenance/v0.2/claim-maintenance-v0.2.md"];
  const method = { methods: files.map((file) => ({ file, sha256: put(readFileSync(new URL(file, root))) })),
    registers: [{ file: reg.file, sha256: put(reg.raw) }] };
  const input_sha256 = put(Buffer.from(JSON.stringify(method)));
  put(source.body);
  const { body, ...metadata } = source;
  const wave = { method, input_sha256, sources: [metadata], rows: [compareClaim(selected.claims[0], source)],
    rejected: [], status: "CANDIDATE_OBSERVATION", axis_promotion_eligible: false,
    counts: { ...selected.counts, distinct_sources: 1, comparable_claims: 1, comparable_sources: 1, UNCHANGED: 1 } };
  return { wave, dir };
}
test("replay recomputes rows from frozen inputs and exact retained bodies", (t) => {
  const { wave, dir } = replayFixture(t); assert.equal(replayWave(wave, dir).verified, true);
});
test("replay rejects inflated counts and invented board admission", (t) => {
  const { wave, dir } = replayFixture(t); wave.counts.comparable_claims = 30;
  assert.throws(() => replayWave(wave, dir), /denominator/);
  wave.counts.comparable_claims = 1; wave.axis_promotion_eligible = true;
  assert.throws(() => replayWave(wave, dir), /cannot promote/);
});
test("replay rejects tampered bytes and missing source responses", (t) => {
  const { wave, dir } = replayFixture(t);
  const body = path.join(dir, "blobs", wave.sources[0].body_sha256); writeFileSync(body, "altered");
  assert.throws(() => replayWave(wave, dir), /evidence digest mismatch/);
  wave.sources = []; assert.throws(() => replayWave(wave, dir), /source set/);
});
