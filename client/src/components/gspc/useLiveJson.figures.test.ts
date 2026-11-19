/**
 * The dashboard's corrections tile (E2E 2026-11-19): it printed "94 corrections published · newest
 * C-2026-1118-01 · Source date not supplied" while every entry in the ledger behind it is dated. The
 * tile now cites the producer's newest_date, and still says "not supplied" when the payload lacks it —
 * it never derives a date from the head id or from another field.
 */
import { describe, expect, it } from "vitest";
import { correctionsFigure, sovxFigure, verifiedCardsFigure } from "./useLiveJson";

const state = (corr: Record<string, unknown>) => ({ ledgers: { corrections_in_this_deploy: corr } });

describe("correctionsFigure", () => {
  it("cites the producer's newest entry date as the figure's as_of", () => {
    const f = correctionsFigure(state({ count: 94, head_id: "C-2026-1118-01", newest_date: "2026-11-18" }));
    expect(f).toEqual({
      value: "94",
      label: "corrections published · newest C-2026-1118-01",
      source: "/api/state → ledgers.corrections_in_this_deploy",
      as_of: "2026-11-18",
    });
  });

  it("leaves as_of null when the payload carries no newest_date (never derived from the head id)", () => {
    const f = correctionsFigure(state({ count: 93, head_id: "C-2026-1006-13" }));
    expect(f?.value).toBe("93");
    expect(f?.as_of).toBeNull();
    expect(correctionsFigure(state({ count: 93, head_id: "C-2026-1006-13", newest_date: "" }))?.as_of).toBeNull();
    expect(correctionsFigure(state({ count: 93, head_id: "C-2026-1006-13", newest_date: 20261006 }))?.as_of).toBeNull();
  });

  it("is null, not a number, when the count is absent or malformed", () => {
    expect(correctionsFigure(state({ head_id: "C-2026-1118-01", newest_date: "2026-11-18" }))).toBeNull();
    expect(correctionsFigure(state({ count: "94" }))).toBeNull();
    expect(correctionsFigure(state({ count: -1 }))).toBeNull();
    expect(correctionsFigure({})).toBeNull();
    expect(correctionsFigure(null)).toBeNull();
  });

  it("the other figures keep their own date rule (no date is invented for them here)", () => {
    expect(verifiedCardsFigure({ card_chain: { bodies_verified_valid: { value: 335, as_of: "2026-09-29T03:11:13Z" } } })?.as_of).toBe(
      "2026-09-29T03:11:13Z",
    );
    expect(sovxFigure({ counts: { pairs: 24 } })?.as_of).toBeNull();
  });
});
