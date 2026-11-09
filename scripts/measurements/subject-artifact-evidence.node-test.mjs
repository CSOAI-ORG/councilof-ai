import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { repositoryFromURL, groupSources, selectArtifacts, verifyBlob, replay } from "./subject-artifact-evidence.mjs";

const bytes = Buffer.from("A real file\n");
const sha = createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest("hex");
const entry = { path: "README.md", type: "blob", mode: "100644", size: bytes.length, sha };
const treeSHA = "a".repeat(40);
const tree = () => ({ sha: treeSHA, truncated: false, tree: [{ ...entry }] });
const blob = () => ({ encoding: "base64", sha, size: bytes.length, content: bytes.toString("base64") });

test("only exact public GitHub repository URLs become repository reads", () => {
  assert.equal(repositoryFromURL("https://github.com/Owner/Repo.git/"), "owner/repo");
  for (const url of ["http://github.com/a/b", "https://github.com/a", "https://github.com/a/b/tree/main", "https://github.com.evil.test/a/b", "https://u:p@github.com/a/b", "https://github.com/a/b?q=x", "https://github.com/a/b#fragment", "https://github.com/a/b%2Fc"]) assert.equal(repositoryFromURL(url), null, url);
});
test("repeated sources share one collection and preserve every original membership", () => {
  const rows = [
    { axis: "measurer-integrity", ordinal: 1, subject: "Example A", url: "https://github.com/Owner/Repo" },
    { axis: "harness-fidelity", ordinal: 2, subject: "Example B", url: "https://github.com/owner/repo/" },
    { axis: "lab-practice", ordinal: 3, subject: "Example C", url: "https://example.org/a" },
    { axis: "lab-practice", ordinal: 4, subject: "Example D", url: "https://example.org/b" },
  ];
  const grouped = groupSources(rows);
  assert.equal(grouped.length, 3);
  assert.equal(grouped.reduce((n, g) => n + g.candidates.length, 0), 4);
  assert.equal(grouped.find((g) => g.repository)?.candidates.length, 2);
});
test("complete matching tree selects actual files without inventing semantic approval", () => {
  const result = selectArtifacts(tree(), treeSHA);
  assert.equal(result.find((r) => r.category === "readme").selected[0].path, "README.md");
  assert.equal(result.find((r) => r.category === "license").selected.length, 0);
  assert.equal(result.some((r) => "score" in r || "admission_eligible" in r), false);
});
for (const truncated of [true, undefined, null]) test(`incomplete tree (${truncated}) is rejected`, () => {
  const t = tree(); t.truncated = truncated; assert.throws(() => selectArtifacts(t, treeSHA), /incomplete/);
});
test("wrong root tree cannot silently select files from another commit", () => assert.throws(() => selectArtifacts(tree(), "b".repeat(40)), /mismatched/));
test("duplicate or unsafe paths fail instead of overwriting evidence", () => {
  for (const p of ["../README.md", "/README.md", "a//README.md", "a/./README.md"]) {
    const t = tree(); t.tree[0].path = p; assert.throws(() => selectArtifacts(t, treeSHA), /path/);
  }
  const t = tree(); t.tree.push({ ...entry }); assert.throws(() => selectArtifacts(t, treeSHA), /duplicate/);
});
test("symlinks, submodules, empty and oversized blobs cannot be file evidence", () => {
  for (const replacement of [{ mode: "120000" }, { mode: "160000", type: "commit" }, { size: 0 }, { size: 1024 * 1024 + 1 }, { size: 1.5 }]) {
    const t = tree(); Object.assign(t.tree[0], replacement); assert.equal(selectArtifacts(t, treeSHA).flatMap((r) => r.selected).length, 0);
  }
});
test("candidate selection is deterministic, bounded and favours shallower paths", () => {
  const t = tree(); t.tree = ["z/test_b.py", "tests/test_a.py", "test_z.py"].map((p) => ({ ...entry, path: p }));
  const selected = selectArtifacts(t, treeSHA).find((r) => r.category === "test_candidate");
  assert.equal(selected.matching_paths, 3); assert.deepEqual(selected.selected.map((r) => r.path), ["test_z.py"]);
});
test("full retained bytes reproduce Git blob identity", () => assert.deepEqual(verifyBlob(blob(), entry), bytes));
test("changed content with unchanged metadata is rejected", () => {
  const b = blob(); b.content = Buffer.from("A fake file\n").toString("base64"); assert.throws(() => verifyBlob(b, entry), /bytes/);
});
test("wrong digest, encoding, size and permissive base64 are rejected", () => {
  for (const change of [{ sha: "0".repeat(40) }, { size: 1 }, { encoding: "utf-8" }, { content: "%%%" }, { content: blob().content + " " }]) assert.throws(() => verifyBlob({ ...blob(), ...change }, entry));
});
test("base64 line wrapping is accepted without changing bytes", () => {
  const b = blob(); b.content = b.content.slice(0, 4) + "\n" + b.content.slice(4) + "\n";
  assert.deepEqual(verifyBlob(b, entry), bytes);
});

// Optional retained-run regression tests: edit report and its local checksum
// together, so rejection must come from evidence binding, not only a file hash.
const retained = process.env.SUBJECT_ARTIFACT_TEST_REPORT;
const mutations = {
  "omitted source": (r) => r.rows.pop(),
  "invented source count": (r) => r.sources++,
  "invented verified count": (r) => r.verified_artifacts++,
  "invented approval": (r) => { r.review_state = "APPROVED"; },
  "invented admission": (r) => { r.admission_eligible = true; },
  "changed method": (r) => { r.method[0].sha256 = "0".repeat(64); },
  "changed citation": (r) => { r.rows.find((v) => v.artifacts?.some((a) => a.url)).artifacts.find((a) => a.url).url = "https://example.invalid/"; },
  "changed frame membership": (r) => { r.rows[0].candidates[0].subject = "invented subject"; },
};
for (const [name, mutate] of Object.entries(mutations)) test(`retained report rejects ${name}`, { skip: !retained }, () => {
  const r = JSON.parse(readFileSync(retained)), custody = JSON.parse(readFileSync(retained + ".custody.json"));
  mutate(r);
  const raw = JSON.stringify(r), directory = mkdtempSync(path.join(os.tmpdir(), "subject-evidence-test-")), file = path.join(directory, "result.json");
  try {
    writeFileSync(file, raw);
    writeFileSync(file + ".custody.json", JSON.stringify({ ...custody, report_sha256: createHash("sha256").update(raw).digest("hex") }));
    assert.throws(() => replay(file));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
