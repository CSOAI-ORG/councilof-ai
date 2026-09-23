import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildIndex, hasCurrentAdmission, rowFromCard, writeIndexPreservingStamp } from "./build-hub-cards-index.mjs";

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
