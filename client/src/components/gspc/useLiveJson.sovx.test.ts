import { describe, expect, it } from "vitest";
import { sovxFigure } from "./useLiveJson";

// The dashboard's "wrapped-asset pairs read" tile. Until 22 Nov 2026 it printed the roster count
// with as_of null ("Source date not supplied") although the parity ledger it stands on is dated.
const AS_OF = "2026-09-14T10:51:51.468Z";
const index = (overrides: Record<string, unknown> = {}) => ({
  counts: { assets: 45, pairs: 24, assets_with_archive: 17, unkeyed_sides: 2 },
  public_ledger_read: { ledger: "/interop/wrapped-asset-parity-latest.json", as_of: AS_OF, pairs_with_a_record: 24 },
  ...overrides,
});

describe("sovxFigure", () => {
  it("prints the pairs with a ledger record, dated by the ledger's own as_of", () => {
    const f = sovxFigure(index());
    expect(f).not.toBeNull();
    expect(f!.value).toBe("24");
    expect(f!.as_of).toBe(AS_OF);
    expect(f!.label).toMatch(/pairs read/);
    expect(f!.source).toMatch(/public_ledger_read\.pairs_with_a_record/);
  });

  it("falls back to the roster count, undated and labelled as a list, when the ledger read is absent", () => {
    for (const read of [undefined, { ledger: "/interop/wrapped-asset-parity-latest.json", as_of: null, pairs_with_a_record: 0 }]) {
      const f = sovxFigure(index({ public_ledger_read: read }));
      expect(f).toEqual({ value: "24", label: "wrapped-asset pairs on the roster (a list, not a read)", source: "/api/wrapper/index.json → counts.pairs", as_of: null });
    }
  });

  it("never dates a zero-record read, and never dates the roster count with the ledger's time", () => {
    const f = sovxFigure(index({ public_ledger_read: { as_of: AS_OF, pairs_with_a_record: 0 } }));
    expect(f!.as_of).toBeNull();
    expect(f!.value).toBe("24");
    expect(f!.label).toMatch(/roster/);
  });

  it("is null when the index carries no count at all", () => {
    expect(sovxFigure({})).toBeNull();
    expect(sovxFigure(null)).toBeNull();
    expect(sovxFigure({ public_ledger_read: { as_of: AS_OF, pairs_with_a_record: 3 } })).toMatchObject({ value: "3", as_of: AS_OF });
  });
});
