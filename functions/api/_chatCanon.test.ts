import { describe, expect, it } from "vitest";
import { boardCanon, claimGuardRefuse } from "./_chatCanon";

/**
 * The Council OS chat bar's honesty gate.
 *
 * THE REGRESSION THIS LOCKS DOWN. On 2026-08-26 the live board published
 * `axes: 22, measured_axes: 15, unmeasured_axes: 7` and the deployed guard
 * answered a TRUE question with a refusal citing a number the API no longer
 * served:
 *
 *   Q: "Is it true that 15 axes carry a measurement?"
 *   A: "**Refused (ClaimGuard).** ... Quotable board = **14** slots.
 *       Never invent 22 axes or claim 12/15/16."
 *
 * An honesty gate that refuses the truth, and asserts a stale figure while doing
 * it, is worse than no gate at all.
 */

/** The live payload's totals block, verbatim from GET /api/gspc on 2026-08-26. */
const LIVE = {
  axes: [
    { axis: "governance", status: "MEASURED", n: 237, accuracy: 0.7, separation: "SEPARATED" },
    { axis: "jail", status: "MEASURED", n: 71, accuracy: 0.5915, separation: "TIE" },
    { axis: "provenance-controls", status: "MEASURED", n: 6, accuracy: null },
    { axis: "reserve-attestation", status: "UNMEASURED", n: 0, accuracy: null },
  ],
  totals: {
    axes: 22,
    measured_axes: 15,
    unmeasured_axes: 7,
    quotable_axes: 15,
    public_count: "22 axes · 15 measured",
    count_grammar:
      "22 axes are on the board; 15 of them carry a measurement and 7 are declared slots with no run behind them.",
  },
  jail_floor: null,
};

const canon = boardCanon(LIVE as any);

describe("boardCanon — slots and measurements are two numbers", () => {
  it("keeps the slot count and the measured count apart", () => {
    expect(canon.slots).toBe(22);
    expect(canon.measured).toBe(15);
    expect(canon.unmeasured).toBe(7);
    expect(canon.publicCount).toBe("22 axes · 15 measured");
  });

  it("repeats the API's own published grammar rather than paraphrasing it", () => {
    expect(canon.countGrammar).toBe(LIVE.totals.count_grammar);
  });

  it("types no count when the board cannot be read", () => {
    const blind = boardCanon({ axes: [], totals: {}, jail_floor: null });
    expect(blind.slots).toBeNull();
    // No literal 14, no literal 22, no invented slot count anywhere.
    expect(blind.publicCount).toBe("0 measured");
  });
});

describe("claimGuardRefuse — refuses what the live board contradicts, and nothing else", () => {
  it("ACCEPTS the true measured count (the exact 2026-08-26 false refusal)", () => {
    expect(claimGuardRefuse("Is it true that 15 axes carry a measurement?", canon)).toBeNull();
  });

  it("ACCEPTS the true slot count", () => {
    expect(claimGuardRefuse("Does the board have 22 axes?", canon)).toBeNull();
    expect(claimGuardRefuse("twenty-two axes, right?", canon)).toBeNull();
  });

  it("ACCEPTS the true unmeasured count", () => {
    expect(claimGuardRefuse("So 7 slots are unmeasured?", canon)).toBeNull();
  });

  it("REFUSES a count the board does not carry, and quotes the live sentence", () => {
    const r = claimGuardRefuse("I read that you have 16 measured axes.", canon);
    expect(r).toBeTruthy();
    expect(r).toContain("**16**");
    expect(r).toContain("22 axes · 15 measured");
    expect(r).toContain(LIVE.totals.count_grammar);
  });

  it("no longer asserts a frozen 14 anywhere in its refusal", () => {
    const r = claimGuardRefuse("you have 12 axes", canon)!;
    expect(r).not.toMatch(/Quotable board = \*\*14\*\*/);
    expect(r).not.toMatch(/never invent 22 axes/i);
  });

  it("refuses NOTHING when the board could not be read", () => {
    const blind = boardCanon({ axes: [], totals: {}, jail_floor: null });
    // An unreachable board is not evidence that a reader is wrong.
    expect(claimGuardRefuse("you have 16 measured axes", blind)).toBeNull();
    expect(claimGuardRefuse("you have 16 measured axes", undefined)).toBeNull();
  });

  it("ignores sentences that are not count claims at all", () => {
    expect(claimGuardRefuse("how does the board work?", canon)).toBeNull();
    expect(claimGuardRefuse("explain the governance axis", canon)).toBeNull();
    expect(claimGuardRefuse("n=237 items on GovBench", canon)).toBeNull();
  });

  it("moves with the board — a different board makes different answers true", () => {
    const later = boardCanon({
      axes: [],
      totals: { axes: 25, measured_axes: 18, unmeasured_axes: 7, public_count: "25 axes · 18 measured" },
      jail_floor: null,
    } as any);
    expect(claimGuardRefuse("25 axes", later)).toBeNull();
    expect(claimGuardRefuse("18 measured", later)).toBeNull();
    expect(claimGuardRefuse("22 axes", later)).toBeTruthy();
  });
});
