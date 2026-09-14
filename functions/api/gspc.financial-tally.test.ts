import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AXES_FIN } from "./_gspc_axes_fin";

// C-2026-0914-01: the reserve-attestation note carried the custody-disclosure tally
// (1/6/9) and the regulatory-framework note had PASS and FAIL swapped (3/4 for 4/3).
// A typed tally in a note must equal the tally in the evidence file the axis cites.

type Tally = { PASS: number; FAIL: number; UNCHECKABLE: number };

// Reads the first "N PASS <sep> N FAIL <sep> N UNCHECKABLE" triple in a note.
function noteTally(note: string): Tally | null {
  const m = note.match(/(\d+)\s+PASS\s*[,/]\s*(\d+)\s+FAIL\s*[,/]\s*(\d+)\s+UNCHECKABLE/);
  return m ? { PASS: Number(m[1]), FAIL: Number(m[2]), UNCHECKABLE: Number(m[3]) } : null;
}

function evidenceTally(evidenceUrl: string): Tally {
  const path = new URL(`../../public${evidenceUrl}`, import.meta.url);
  const tally = JSON.parse(readFileSync(path, "utf8")).tally ?? {};
  return { PASS: tally.PASS ?? 0, FAIL: tally.FAIL ?? 0, UNCHECKABLE: tally.UNCHECKABLE ?? 0 };
}

describe("financial axis notes quote the tally of the evidence they cite", () => {
  const typed = AXES_FIN.filter((a) => typeof a.note === "string" && noteTally(a.note) && a.evidence_url);

  it("finds the typed tallies it is meant to guard", () => {
    const axes = typed.map((a) => a.axis);
    expect(axes).toContain("reserve-attestation");
    expect(axes).toContain("regulatory-framework");
    expect(axes).toContain("custody-disclosure");
  });

  for (const axis of AXES_FIN) {
    const typedTally = typeof axis.note === "string" ? noteTally(axis.note) : null;
    if (!typedTally || !axis.evidence_url) continue;
    it(`${axis.axis}: note tally equals ${axis.evidence_url}`, () => {
      const path = new URL(`../../public${axis.evidence_url}`, import.meta.url);
      expect(existsSync(path)).toBe(true);
      expect(typedTally).toEqual(evidenceTally(axis.evidence_url!));
    });
  }

  it("failing controls: the two pre-correction notes are rejected", () => {
    const reserve = evidenceTally("/interop/financial-measure-run-reserve-attestation.json");
    const regime = evidenceTally("/interop/financial-measure-run-regulatory-framework.json");
    expect(noteTally("Three-state per fact: 1 PASS, 6 FAIL, 9 UNCHECKABLE")).not.toEqual(reserve);
    expect(noteTally("3 PASS, 4 FAIL, 9 UNCHECKABLE (no on-chain Domain)")).not.toEqual(regime);
    expect(noteTally("custodian 1 PASS / 6 FAIL / 9 UNCHECKABLE")).toEqual({ PASS: 1, FAIL: 6, UNCHECKABLE: 9 });
  });
});
