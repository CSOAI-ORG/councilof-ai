import { describe, expect, it } from "vitest";
import { UNMEASURED, provenance, quotable, quote, readLiveState } from "./liveState";

/**
 * The header prints counts. These tests pin the ONE property that matters: a
 * value only reaches the bar when the endpoint actually published it, and every
 * other outcome comes out as the word this estate publishes for "not measured".
 */

const fact = (value: unknown, kind: string, extra: Record<string, unknown> = {}) => ({
  value,
  kind,
  source: "public/signed/gspc-board.signed.json → totals.public_count",
  as_of: "2026-08-12",
  as_of_field: "measured_on.date",
  ...extra,
});

const payload = {
  board: {
    public_count: fact("22 axis · 22 measured", "declared"),
    count_grammar: fact("22 axis are on the board; 22 of them carry a measurement.", "declared"),
    measured_axes: fact(22, "measured"),
    axis_slots: fact(22, "declared"),
  },
  mcp_fleet: {
    reachable_distinct_servers: fact(1, "probed"),
    catalogued_not_probed: fact(6, "catalogued"),
  },
  signed_cards: {
    count: fact(150, "catalogued"),
    signed_entries: fact(150, "catalogued"),
  },
};

describe("liveState — reading /api/state", () => {
  it("quotes the board sentence verbatim rather than recomposing it", () => {
    const s = readLiveState(payload);
    expect(quote(s.board.publicCount)).toBe("22 axis · 22 measured");
    expect(quotable(s.board.publicCount)).toBe(true);
  });

  it("keeps the fleet's kinds apart and never adds them", () => {
    const s = readLiveState(payload);
    expect(s.fleet.reachable?.kind).toBe("probed");
    expect(s.fleet.catalogued?.kind).toBe("catalogued");
    expect(quote(s.fleet.reachable)).toBe("1");
    expect(quote(s.fleet.catalogued)).toBe("6");
  });

  it("prints the WORD unmeasured when the kind says unmeasured, value or not", () => {
    const s = readLiveState({
      mcp_fleet: { reachable_distinct_servers: fact(378, "unmeasured") },
    });
    expect(quote(s.fleet.reachable)).toBe(UNMEASURED);
    expect(quotable(s.fleet.reachable)).toBe(false);
  });

  it("prints unmeasured for a null value rather than a zero or a blank", () => {
    const s = readLiveState({ signed_cards: { count: fact(null, "catalogued") } });
    expect(quote(s.cards.count)).toBe(UNMEASURED);
  });

  it("prints unmeasured when the field is absent entirely", () => {
    const s = readLiveState({});
    expect(s.board.publicCount).toBeNull();
    expect(quote(s.board.publicCount)).toBe(UNMEASURED);
  });

  it("refuses to read a bare number as a fact — a fact carries its kind", () => {
    const s = readLiveState({ signed_cards: { count: 150 } });
    expect(s.cards.count).toBeNull();
    expect(quote(s.cards.count)).toBe(UNMEASURED);
  });

  it("carries the kind, the source and the as_of field into the provenance line", () => {
    const s = readLiveState(payload);
    const p = provenance(s.board.publicCount);
    expect(p).toContain("kind: declared");
    expect(p).toContain("gspc-board.signed.json");
    expect(p).toContain("as_of: 2026-08-12 (measured_on.date)");
  });

  it("reads hub census as catalogued listings, never as a grade", () => {
    const s = readLiveState({
      hub_census: {
        listings_observed: fact(3032028, "catalogued"),
        n_measured: fact(0, "catalogued"),
      },
    });
    expect(quote(s.census.listingsObserved)).toBe("3,032,028");
    expect(quote(s.census.nMeasured)).toBe("0");
    expect(s.census.listingsObserved?.kind).toBe("catalogued");
  });

  it("says an artifact has no timestamp instead of substituting one", () => {
    const s = readLiveState({
      signed_cards: { count: { value: 150, kind: "catalogued", source: "x", as_of: null, as_of_field: null } },
    });
    expect(provenance(s.cards.count)).toContain("as_of: none in the artifact");
  });
});
