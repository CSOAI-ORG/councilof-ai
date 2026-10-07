import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertNotStamped, buildIndex, cardsDigest, checkCurrentIndex, hasCurrentAdmission, otsSubjectDigest, readStamped, rowFromCard,
  writeIndexPreservingStamp, writeVersionedIndex } from "./build-hub-cards-index.mjs";

const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
};
const sha = (value) => createHash("sha256").update(value).digest("hex");

const base = {
  id: "a".repeat(64), signature: "ff",
  body: {
    model: "org/model", axis: "safety", n: 30, status: "MEASURED", run_id: "gha-7",
    evidence: { schema: "csoai.mill-item-evidence/0.2" },
    admission: { schema: "csoai.mill-evidence-admission/0.2", sha256: "b".repeat(64) },
  },
};

test("indexes only current admitted Hub cards", () => {
  assert.equal(rowFromCard("signed-safety-a.json", base).subject, "org/model");
  assert.equal(rowFromCard("x.json", { ...base, body: { ...base.body, model: "ollama:qwen:3b" } }), null);
  assert.equal(rowFromCard("x.json", { ...base, body: { ...base.body,
    evidence: { schema: "csoai.mill-item-evidence/0.1" } } }), null);
  assert.equal(rowFromCard("x.json", { ...base, body: { ...base.body, admission: undefined } }), null);
});

test("build requires the current receipt and exact evidence bytes", () => {
  const root = mkdtempSync(join(tmpdir(), "hub-index-"));
  try {
    const cards = join(root, "cards"), evidence = join(root, "evidence"); mkdirSync(cards); mkdirSync(evidence);
    const items = Buffer.from("{}\n"), bank = Buffer.from("{}\n");
    const sourceBody = { ...base.body, status: "UNMEASURED", unmeasured: ["signed-pending-verify"],
      signature_state: "STAGED_UNSIGNED", evidence: { schema: "csoai.mill-item-evidence/0.2",
        items_file: `items-safety-${sha(items).slice(0, 12)}.jsonl`, items_sha256: sha(items),
        bank_file: `bank-safety-${sha(bank).slice(0, 12)}.jsonl`, bank_sha256: sha(bank) } };
    delete sourceBody.admission;
    writeFileSync(join(evidence, sourceBody.evidence.items_file), items);
    writeFileSync(join(evidence, sourceBody.evidence.bank_file), bank);
    const receipt = { schema: "csoai.mill-evidence-admission/0.2", state: "VERIFIED_ADMISSION",
      source_card_id: sha(canonical(sourceBody)), source_body: sourceBody,
      items_sha256: sha(items), bank_sha256: sha(bank), summary: {} };
    const receiptRaw = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
    const admission = { schema: receipt.schema, file: `admission-${sha(receiptRaw).slice(0, 12)}.json`, sha256: sha(receiptRaw) };
    writeFileSync(join(evidence, admission.file), receiptRaw);
    const signedBody = { ...sourceBody, status: "MEASURED", unmeasured: [], signature_state: "SIGNED", admission };
    const signed = { ...base, id: sha(canonical(signedBody)), body: signedBody };
    writeFileSync(join(cards, "signed-safety-a.json"), JSON.stringify(signed));
    assert.equal(hasCurrentAdmission(signed, evidence), true);
    assert.equal(buildIndex(cards, evidence).count, 1);
    // C-2026-0914-01: a withdrawn card is admitted, signed and still not current.
    const ledger = join(cards, "WITHDRAWN.jsonl");
    writeFileSync(ledger, JSON.stringify({ withdrawn_id: signed.id, correction: "C-2026-0914-01" }) + "\n");
    assert.equal(buildIndex(cards, evidence).count, 0);
    assert.equal(buildIndex(cards, evidence).withdrawn_excluded, 1);
    writeFileSync(ledger, JSON.stringify({ withdrawn_id: signed.id }) + "\n");
    assert.throws(() => buildIndex(cards, evidence), /correction are required/);
    rmSync(ledger);
    assert.equal(buildIndex(cards, evidence).count, 1);
    writeFileSync(join(evidence, sourceBody.evidence.items_file), "changed\n");
    assert.equal(buildIndex(cards, evidence).count, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("stamped index preserves exact bytes while admitted cards are unchanged", () => {
  const root = mkdtempSync(join(tmpdir(), "hub-index-stamp-"));
  try {
    const out = join(root, "hub-cards-index.json");
    const original = { schema: "csoai.hub-cards-index/0.1", as_of: "2026-09-16T00:00:00Z",
      source: "admitted cards", count: 1, signed_files_seen: 1,
      skipped_non_current_or_unreadable: 0, withdrawn_excluded: 0,
      withdrawn_ledger: "WITHDRAWN.jsonl", cards: [{ id: "a" }] };
    const originalBytes = JSON.stringify(original, null, 1) + "\n";
    writeFileSync(out, originalBytes);
    writeFileSync(out + ".ots", "test stamp");
    const later = { ...original, as_of: "2026-09-23T00:00:00Z",
      signed_files_seen: 2, skipped_non_current_or_unreadable: 1 };
    assert.deepEqual(writeIndexPreservingStamp(out, later),
      { state: "PRESERVED_STAMPED", count: 1, metadata_drift: true });
    assert.equal(readFileSync(out, "utf8"), originalBytes);
    assert.throws(() => writeIndexPreservingStamp(out,
      { ...later, cards: [{ id: "b" }] }), /versioned index and proof/);
    assert.throws(() => writeIndexPreservingStamp(out,
      { ...later, schema: "changed" }), /versioned index and proof/);
    assert.equal(readFileSync(out, "utf8"), originalBytes);
    rmSync(out + ".ots");
    assert.equal(writeIndexPreservingStamp(out, later).state, "WRITTEN");
    assert.equal(JSON.parse(readFileSync(out, "utf8")).signed_files_seen, 2);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// ── versioned stamped index (the migration the PRESERVED_STAMPED guard asked for) ─────────────
const OTS_HEADER = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");
/** Header-only detached proof committing to the file's sha256: enough for the byte binding. */
const fakeStamp = (path) => writeFileSync(path + ".ots", Buffer.concat([OTS_HEADER, Buffer.from([1, 8]),
  Buffer.from(sha(readFileSync(path)), "hex"), Buffer.from("pending-test")]), { flag: "wx" });
const indexWith = (ids, as_of = "2026-10-07T01:02:03.000Z") => ({ schema: "csoai.hub-cards-index/0.1", as_of,
  source: "admitted cards", count: ids.length, signed_files_seen: ids.length,
  skipped_non_current_or_unreadable: 0, withdrawn_excluded: 0, withdrawn_ledger: "WITHDRAWN.jsonl",
  cards: ids.map((id) => ({ id })) });
const snapshot = (dir) => Object.fromEntries(readdirSync(dir).sort().map((f) => [f, sha(readFileSync(join(dir, f)))]));

function stampedFixture() {
  const root = mkdtempSync(join(tmpdir(), "hub-index-ver-"));
  const out = join(root, "hub-cards-index.json");
  writeFileSync(out, JSON.stringify(indexWith(["a"], "2026-09-16T00:00:00Z"), null, 1) + "\n");
  fakeStamp(out);
  return { root, out };
}

test("(a) a changed card set writes a new stamped version and leaves the stamped snapshot byte-identical", () => {
  const { root, out } = stampedFixture();
  try {
    const before = snapshot(root);
    assert.throws(() => checkCurrentIndex(out, indexWith(["a", "b"])), /--version/);
    assert.deepEqual(snapshot(root), before, "the build mode wrote nothing on a changed set");
    const result = writeVersionedIndex(out, indexWith(["a", "b"]), { stamp: fakeStamp });
    assert.equal(result.state, "VERSIONED");
    assert.match(result.file, /^hub-cards-index-2026-10-07-[0-9a-f]{12}\.json$/);
    assert.equal(result.file.slice(27, 39), cardsDigest([{ id: "a" }, { id: "b" }]).slice(0, 12));
    const after = snapshot(root);
    assert.equal(after["hub-cards-index.json"], before["hub-cards-index.json"]);
    assert.equal(after["hub-cards-index.json.ots"], before["hub-cards-index.json.ots"]);
    assert.ok(after[`${result.file}.ots`], "the new version carries its own proof");
    const version = readStamped(root, result.file);
    assert.equal(version.doc.count, 2);
    assert.equal(version.doc.supersedes.index_url, "/interop/hub-cards-index.json");
    const pointer = JSON.parse(readFileSync(join(root, "hub-cards-index-latest.json"), "utf8"));
    assert.equal(pointer.kind, "DISCOVERY_POINTER_ONLY");
    assert.equal(pointer.index_url, `/interop/${result.file}`);
    assert.equal(pointer.index_sha256, version.sha256);
    assert.deepEqual(pointer.versions.map((v) => v.index_url), ["/interop/hub-cards-index.json", `/interop/${result.file}`]);
    // The build now resolves the new version through the pointer and passes without writing.
    const settled = snapshot(root);
    assert.equal(checkCurrentIndex(out, indexWith(["a", "b"], "2026-10-08T00:00:00Z")).file, result.file);
    assert.deepEqual(snapshot(root), settled);
    // A card set that returns to an earlier stamped version re-points; no new file, no new proof.
    assert.equal(writeVersionedIndex(out, indexWith(["a"]), { stamp: fakeStamp }).state, "REPOINTED");
    assert.equal(JSON.parse(readFileSync(join(root, "hub-cards-index-latest.json"), "utf8")).index_url, "/interop/hub-cards-index.json");
    assert.equal(Object.keys(snapshot(root)).length, Object.keys(settled).length);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("(b) an unchanged card set writes nothing new, in build and --version modes", () => {
  const { root, out } = stampedFixture();
  try {
    const before = snapshot(root);
    const later = { ...indexWith(["a"], "2026-10-07T00:00:00Z"), signed_files_seen: 3 };
    assert.deepEqual(checkCurrentIndex(out, later),
      { state: "PRESERVED_STAMPED", file: "hub-cards-index.json", count: 1, metadata_drift: true });
    assert.deepEqual(snapshot(root), before, "no pointer: build mode is exactly the old behaviour");
    let stamped = 0;
    assert.equal(writeVersionedIndex(out, later, { stamp: () => { stamped++; } }).state, "POINTER_WRITTEN");
    const withPointer = snapshot(root);
    assert.deepEqual(Object.keys(withPointer).filter((f) => !(f in before)), ["hub-cards-index-latest.json"]);
    assert.equal(writeVersionedIndex(out, later, { stamp: () => { stamped++; } }).state, "UNCHANGED");
    assert.equal(checkCurrentIndex(out, later).state, "PRESERVED_STAMPED");
    assert.deepEqual(snapshot(root), withPointer);
    assert.equal(stamped, 0, "nothing was stamped");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("(c) a stamped file still cannot be edited, and a proof that misses its bytes fails closed", () => {
  const { root, out } = stampedFixture();
  try {
    assert.throws(() => assertNotStamped(out), /never rewritten/);
    assert.throws(() => writeIndexPreservingStamp(out, indexWith(["a", "b"])), /versioned index and proof/);
    const v = writeVersionedIndex(out, indexWith(["a", "b"]), { stamp: fakeStamp });
    assert.throws(() => assertNotStamped(join(root, v.file)), /never rewritten/);
    // A failed stamp releases nothing: the new file is removed and the pointer does not move.
    const before = snapshot(root);
    assert.throws(() => writeVersionedIndex(out, indexWith(["a", "b", "c"]), { stamp: () => { throw new Error("calendars down"); } }),
      /nothing was released/);
    assert.throws(() => writeVersionedIndex(out, indexWith(["a", "b", "c"]), { stamp: (p) => writeFileSync(p + ".ots", "not a proof") }),
      /nothing was released/);
    assert.deepEqual(snapshot(root), before);
    assert.throws(() => writeVersionedIndex(out, indexWith(["a", "b", "c"])), /needs a stamper/);
    // Editing stamped bytes in place is caught on the next build, in either mode.
    const versioned = join(root, v.file);
    writeFileSync(versioned, readFileSync(versioned, "utf8").replace('"count": 2', '"count": 2 '));
    assert.throws(() => checkCurrentIndex(out, indexWith(["a", "b"])), /does not commit to the bytes/);
    assert.throws(() => writeVersionedIndex(out, indexWith(["a", "b"]), { stamp: fakeStamp }), /does not commit to the bytes/);
    rmSync(versioned); writeFileSync(versioned, "{}\n");
    rmSync(join(root, "hub-cards-index-latest.json"));
    writeFileSync(out, readFileSync(out, "utf8") + " ");
    assert.throws(() => checkCurrentIndex(out, indexWith(["a"])), /does not commit to the bytes/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a pointer naming an unlisted file or disagreeing bytes fails closed", () => {
  const { root, out } = stampedFixture();
  try {
    writeVersionedIndex(out, indexWith(["a"]), { stamp: fakeStamp });
    const pointerPath = join(root, "hub-cards-index-latest.json");
    const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
    writeFileSync(pointerPath, JSON.stringify({ ...pointer, index_url: "/interop/../secrets.json" }));
    assert.throws(() => checkCurrentIndex(out, indexWith(["a"])), /malformed/);
    writeFileSync(pointerPath, JSON.stringify({ ...pointer, count: 9 }));
    assert.throws(() => checkCurrentIndex(out, indexWith(["a"])), /disagrees/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("otsSubjectDigest reads only a real detached-proof header", () => {
  assert.equal(otsSubjectDigest(Buffer.from("plain text")), null);
  const digest = "c".repeat(64);
  assert.equal(otsSubjectDigest(Buffer.concat([OTS_HEADER, Buffer.from([1, 8]), Buffer.from(digest, "hex")])), digest);
  assert.equal(otsSubjectDigest(Buffer.concat([OTS_HEADER, Buffer.from([1, 2]), Buffer.from(digest, "hex")])), null);
});
