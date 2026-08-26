/**
 * The tamper-detection label must track the state it is reporting.
 *
 * The outside SCITT audit (2026-08-26, D3) found the FAILURE state of the chain
 * verifier rendering as "✗ chain intact — tamper-evidence" — the label was a
 * constant and only the glyph flipped, on the page whose whole pitch is that a
 * broken row is "reported as BROKEN, visibly". These tests make that unshippable.
 */

import { describe, it, expect } from "vitest";
import { verifyChain, canonicalJSON, sha256Hex } from "./verify";
import type { JRecord } from "@/data/arena";

function record(id: string): Omit<JRecord, "sigil"> {
  return {
    record_id: id,
    recorded_at: "2026-07-30T00:00:00Z",
    provision: {
      id: "EU-AIA-Art-5-1-c",
      jurisdiction: "EU",
      instrument: "EU AI Act",
      section: "Article 5(1)(c)",
      corpus_hash: "0".repeat(64),
      as_of: "2026-07-01",
    },
    subject: { id: "test-model", family: "test" },
    verdict: { predicate: "test", passed: true, reason: "fixture", pointer: "#/fixture" },
    budget: { step_cap: 8, steps_used: 1 },
  };
}

async function sealed(id: string): Promise<JRecord> {
  const body = record(id);
  const chain_hash = await sha256Hex(canonicalJSON(body));
  return { ...body, sigil: { chain_hash, sig_alg: "sha256" } } as JRecord;
}

describe("verifyChain label", () => {
  it("says the chain is intact when it is", async () => {
    const r = await verifyChain([await sealed("R-1"), await sealed("R-2")]);
    expect(r.ok).toBe(true);
    expect(r.label).toBe("chain intact — tamper-evidence");
  });

  it("does NOT say 'chain intact' when a record was altered", async () => {
    const records = [await sealed("R-1"), await sealed("R-2")];
    records[0].sigil.chain_hash = "f" + records[0].sigil.chain_hash.slice(1);
    const r = await verifyChain(records);
    expect(r.ok).toBe(false);
    expect(r.label).not.toMatch(/intact/i);
    expect(r.label).toMatch(/BROKEN/);
    expect(r.label).toMatch(/1 record altered/);
    expect(r.lines.filter((l) => !l.body_hash_ok)).toHaveLength(1);
  });

  it("counts every broken row in the label", async () => {
    const records = [await sealed("R-1"), await sealed("R-2")];
    for (const rec of records) rec.sigil.chain_hash = "f" + rec.sigil.chain_hash.slice(1);
    const r = await verifyChain(records);
    expect(r.label).toMatch(/2 records altered/);
  });
});
