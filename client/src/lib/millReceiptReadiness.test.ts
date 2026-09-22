import { describe, expect, it } from "vitest";
import {
  isMillReceiptReadiness,
  measurementReading,
  regulationLabel,
  summariseReceipts,
  type MillReceipt,
  type MillReceiptReadiness,
} from "./millReceiptReadiness";

// Three rows taken verbatim from public/interop/mill-receipt-readiness.json: one
// receipt with a date, and both of the absences the artifact distinguishes.
const dated: MillReceipt = {
  id: "0a2d4a8a0b6a4b6f9f52f3bb90d1f0b9f2a1c0d3e4f5a6b7c8d9e0f1a2b3c4d5",
  card_url: "/interop/mill-cards-signed/signed-art5-0a2d4a8a0b6a.json",
  supersedes_staged_id: "b".repeat(64),
  model: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
  axis: "art5-safeguard",
  status: "MEASURED",
  unmeasured: [],
  measured_at: "2026-09-11T05:46:39Z",
  measured_at_absence: null,
  outer_signature: { state: "VALID", alg: "Ed25519", key: "did:web:csoai.org#board-attestation-1" },
  declared_lifecycle: "SIGNED",
  regulatory_linkage: {
    state: "LINKED",
    source_state: "DIRECT",
    refs: ["Regulation (EU) 2024/1689 Article 5"],
    regulation_score_eligible: true,
  },
};

const signedWithoutDate: MillReceipt = {
  id: "2f687615af5f1ef485979d06d456c20d13b08337a29d603f0e07b4376620d7df",
  card_url: "/interop/mill-cards-signed/signed-detector-2f687615af5f.json",
  supersedes_staged_id: "919268db78051d67751768d9816e218f2b01223f852f1eff32213ec55b93b2af",
  model: "meta-llama/Meta-Llama-3-8B-Instruct",
  axis: "detector-interop",
  status: "MEASURED",
  unmeasured: [],
  measured_at: null,
  measured_at_absence:
    "the signed body carries no measured_at field: this card is MEASURED but was signed without a date, and signed bytes are superseded, never edited",
  outer_signature: { state: "VALID", alg: "Ed25519", key: "did:web:csoai.org#board-attestation-1" },
  declared_lifecycle: "SIGNED",
  regulatory_linkage: { state: "UNLINKED", source_state: "UNLINKED", refs: [], regulation_score_eligible: false },
};

const unmeasured: MillReceipt = {
  id: "eee506b80d2464fd83f1cc8c7464982b88f2523c7b4c31d2b288b8e24a65f8da",
  card_url: "/interop/mill-cards-signed/signed-safety-eee506b80d24.json",
  supersedes_staged_id: "32bb6e601009cd57af245b10cd44687f984d98118e2739c0753de5acc737ddf6",
  model: "meta-llama/Llama-3.2-1B-Instruct",
  axis: "safety",
  status: "UNMEASURED",
  unmeasured: ["n<30 unquotable"],
  measured_at: null,
  measured_at_absence:
    "the signed body carries no measured_at field: this card is UNMEASURED (n<30 unquotable), so there is no measurement date to record",
  outer_signature: { state: "VALID", alg: "Ed25519", key: "did:web:csoai.org#board-attestation-1" },
  declared_lifecycle: "SIGNED",
  regulatory_linkage: { state: "UNLINKED", source_state: "UNLINKED", refs: [], regulation_score_eligible: false },
};

const readiness: MillReceiptReadiness = {
  schema: "csoai.mill-receipt-readiness/v2",
  derived_from:
    "the 36 original STAGED_UNSIGNED wrappers resolved through public/interop/mill-cards-signed/SUPERSEDED.jsonl to their terminal immutable replacements",
  truth_rule:
    "Outer cryptographic validity, inner declared lifecycle, and regulatory linkage are independent states. UNLINKED receipts are not regulation-scored. measured_at is read off the signed bytes and is never supplied by this generator; where it is null, measured_at_absence states why.",
  counts: {
    receipts: 3,
    outer_signature_valid: 3,
    declared_staged_unsigned: 0,
    declared_signed: 3,
    regulatory_linked: 1,
    regulatory_unlinked: 2,
    regulation_score_eligible: 1,
    measured_at_recorded: 1,
    measured_at_absent_unmeasured_card: 1,
    measured_at_absent_dateless_card: 1,
  },
  receipts: [dated, signedWithoutDate, unmeasured],
};

const withRows = (...rows: MillReceipt[]): MillReceiptReadiness => ({
  ...structuredClone(readiness),
  counts: { ...summariseReceipts(rows) },
  receipts: rows,
});

const mutate = (row: MillReceipt, change: (draft: MillReceipt) => void) => {
  const draft = structuredClone(row);
  change(draft);
  return draft;
};

describe("mill receipt readiness contract", () => {
  it("accepts the v2 artifact and refuses the retired v1 schema", () => {
    expect(isMillReceiptReadiness(readiness)).toBe(true);
    expect(isMillReceiptReadiness({ ...structuredClone(readiness), schema: "csoai.mill-receipt-readiness/v1" })).toBe(false);
  });

  it("requires the SIGNED lifecycle v2 resolves to, not the staged wrapper v1 read", () => {
    expect(readiness.counts.declared_staged_unsigned).toBe(0);
    expect(readiness.counts.declared_signed).toBe(readiness.counts.receipts);
    expect(isMillReceiptReadiness(withRows(mutate(dated, (row) => { row.declared_lifecycle = "STAGED_UNSIGNED"; })))).toBe(false);
  });

  it("keeps outer validity separate from the declared lifecycle", () => {
    expect(isMillReceiptReadiness(withRows(mutate(dated, (row) => { row.outer_signature.state = "UNCHECKABLE"; })))).toBe(false);
  });

  it("rejects a null date with no stated absence, and a date that also claims one", () => {
    expect(isMillReceiptReadiness(withRows(mutate(unmeasured, (row) => { row.measured_at_absence = null; })))).toBe(false);
    expect(isMillReceiptReadiness(withRows(mutate(signedWithoutDate, (row) => { row.measured_at_absence = "   "; })))).toBe(false);
    expect(isMillReceiptReadiness(withRows(mutate(dated, (row) => { row.measured_at_absence = "signed without a date"; })))).toBe(false);
  });

  it("holds status and its reasons to each other", () => {
    expect(isMillReceiptReadiness(withRows(mutate(unmeasured, (row) => { row.unmeasured = []; })))).toBe(false);
    expect(isMillReceiptReadiness(withRows(mutate(dated, (row) => { row.unmeasured = ["n<30 unquotable"]; })))).toBe(false);
    expect(isMillReceiptReadiness(withRows(mutate(dated, (row) => { (row as { status: string }).status = "PENDING"; })))).toBe(false);
  });

  it("prohibits regulation-scored language for unlinked receipts", () => {
    expect(regulationLabel(dated)).toBe("linked evidence; scoring eligible");
    expect(regulationLabel(unmeasured)).toBe("unlinked; no regulation score");
    expect(isMillReceiptReadiness(withRows(mutate(unmeasured, (row) => { row.regulatory_linkage.regulation_score_eligible = true; })))).toBe(false);
    expect(isMillReceiptReadiness(withRows(mutate(dated, (row) => { row.regulatory_linkage.refs = []; })))).toBe(false);
  });

  it("refuses counts that disagree with the rows they count", () => {
    const drifted = structuredClone(readiness);
    drifted.counts.measured_at_recorded = 3;
    expect(isMillReceiptReadiness(drifted)).toBe(false);
    const missing = structuredClone(readiness);
    delete (missing.counts as Record<string, number>).declared_signed;
    expect(isMillReceiptReadiness(missing)).toBe(false);
  });

  it("reads the two absences as different states, and neither as a blank", () => {
    expect(measurementReading(dated)).toEqual({ kind: "DATED", label: "2026-09-11T05:46:39Z", detail: null });
    const noDate = measurementReading(signedWithoutDate);
    const noMeasurement = measurementReading(unmeasured);
    expect(noDate.kind).toBe("SIGNED_WITHOUT_DATE");
    expect(noMeasurement.kind).toBe("UNMEASURED");
    expect(noMeasurement.label).toContain("n<30 unquotable");
    expect(noDate.label).not.toBe(noMeasurement.label);
    for (const reading of [measurementReading(dated), noDate, noMeasurement]) {
      expect(reading.label.trim()).not.toBe("");
      expect(reading.label).not.toContain("—");
    }
  });
});
