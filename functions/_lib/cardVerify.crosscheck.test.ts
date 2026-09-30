import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CARD_ATTESTATION_HEX, verifyCard } from "./cardVerify";

/**
 * "Live anchor cross-check" — found 2026-09-26: the row said ok:null while its detail read "The live
 * did.json agrees…". `ok` now states what the cross-check found (true agrees / false drifted), null
 * only when it did not run (detail says UNCHECKED). The row is ADVISORY: it never decides the verdict.
 */
const CARD = JSON.parse(
  readFileSync(resolve(__dirname, "../../public/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json"), "utf8"),
);
const row = (v: Awaited<ReturnType<typeof verifyCard>>) => v.checks.find((c) => c.label === "Live anchor cross-check")!;

describe("verify_card live-anchor cross-check reports its own result", () => {
  it("agrees → ok:true, advisory, and the verdict is VALID", async () => {
    const v = await verifyCard(CARD, [{ id: "did:web:csoai.org#card-attestation-1", hex: CARD_ATTESTATION_HEX }]);
    expect(v.valid).toBe(true);
    expect(row(v)).toMatchObject({ ok: true, advisory: true, code: "live_anchor_agrees" });
    expect(row(v).detail).toMatch(/agrees/);
  });

  it("drifted → ok:false, advisory, and the pinned set still decides (verdict unchanged)", async () => {
    const v = await verifyCard(CARD, [{ id: "did:web:csoai.org#other", hex: "00".repeat(32) }]);
    expect(row(v)).toMatchObject({ ok: false, advisory: true, code: "live_anchor_disagrees" });
    expect(v.valid).toBe(true);
  });

  it("not run → ok:null and the detail says UNCHECKED", async () => {
    const v = await verifyCard(CARD, []);
    expect(row(v)).toMatchObject({ ok: null, code: "live_anchor_unavailable" });
    expect(row(v).detail).toMatch(/^UNCHECKED/);
    expect(v.valid).toBe(true);
  });

  it("control: no row ever pairs ok:null with a detail that claims agreement", async () => {
    for (const anchors of [[], [{ id: "did:web:csoai.org#card-attestation-1", hex: CARD_ATTESTATION_HEX }]]) {
      const r = row(await verifyCard(CARD, anchors));
      expect(r.ok === null && /agrees/.test(r.detail)).toBe(false);
    }
  });
});
