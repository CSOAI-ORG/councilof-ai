import { describe, expect, it } from "vitest";
import { deriveSwiftCounts } from "./swift";

describe("/api/swift counts are recomputed, never read off the header and never typed", () => {
  const sources = { a: {}, b: {}, c: {} };

  it("n_measured is counted from rows, so it can rise above zero", () => {
    const none = deriveSwiftCounts(
      [
        { id: "1", name: "x", status: "LIVE", artifact_url: null, source: ["a"] },
        { id: "2", name: "y", status: "DISCOVERED", artifact_url: null, source: [] },
      ],
      sources,
    );
    expect(none.n_measured).toBe(0);

    // The defect this replaces: `n_measured: 0` was a literal, so a MEASURED row
    // could never move it. Derived, it moves.
    const one = deriveSwiftCounts(
      [
        { id: "1", name: "x", status: "MEASURED", artifact_url: null, source: ["a"] },
        { id: "2", name: "y", status: "DISCOVERED", artifact_url: null, source: [] },
      ],
      sources,
    );
    expect(one.n_measured).toBe(1);
  });

  it("a row's n counts only sources that resolve, and unresolvable ones are reported", () => {
    const d = deriveSwiftCounts(
      [{ id: "1", name: "x", status: "LIVE", artifact_url: null, source: ["a", "b", "ghost", "a"] }],
      sources,
    );
    // "a" appears twice and counts once; "ghost" resolves to nothing and counts never.
    expect(d.per_row[0].n).toBe(2);
    expect(d.per_row[0].sources_unresolvable).toBe(1);
    expect(d.per_row[0].quotable).toBe(false);
    expect(d.per_row[0].unmeasured[0]).toContain("below the quotable threshold");
  });

  it("a row with no resolvable source gets n=0, not a borrowed one", () => {
    const d = deriveSwiftCounts(
      [{ id: "1", name: "x", status: "DISCOVERED", artifact_url: null, source: ["ghost"] }],
      sources,
    );
    expect(d.per_row[0].n).toBe(0);
    expect(d.rows_with_no_resolvable_source).toBe(1);
  });

  it("the status split partitions the rows and is never added to n", () => {
    const rows = [
      { id: "1", name: "a", status: "LIVE", artifact_url: null, source: ["a"] },
      { id: "2", name: "b", status: "COMMITTED", artifact_url: null, source: ["b"] },
      { id: "3", name: "c", status: "DISCOVERED", artifact_url: null, source: ["c"] },
    ];
    const d = deriveSwiftCounts(rows, sources);
    expect(d.n).toBe(3);
    expect(d.n_live + d.n_committed + d.n_discovered + d.n_measured).toBe(d.n);
  });

  it("counts name their producer", () => {
    expect(deriveSwiftCounts([], sources).producer).toContain("deriveSwiftCounts");
  });
});
