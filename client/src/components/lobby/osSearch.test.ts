import { describe, expect, it } from "vitest";
import { axisHits, cardHits, destinationHits, rank, score } from "./osSearch";
import type { WireAxis } from "./boardWire";

/**
 * A search box that does nothing is worse than none. These tests pin that every
 * result resolves to something the OS can actually open, and that the ranking
 * puts the thing the reader named first.
 */

const axis = (over: Partial<WireAxis>): WireAxis => ({
  axis: "gov",
  bench: "gspc-gov",
  task: "classify",
  n: 100,
  separation: "TIE",
  status: "MEASURED",
  ...over,
});

describe("osSearch — the OS index", () => {
  it("indexes every rail destination and every framed page, and each one opens", () => {
    const hits = destinationHits();
    expect(hits.length).toBeGreaterThan(20);
    for (const h of hits) {
      expect(Boolean(h.tab) || Boolean(h.route)).toBe(true);
      expect(h.label.length).toBeGreaterThan(0);
    }
  });

  it("finds a destination by its own name", () => {
    const r = rank("verify", destinationHits());
    expect(r[0].label).toBe("Verify a card");
    expect(r[0].tab?.id).toBe("verify");
  });

  it("finds a page nobody gave a rail tab", () => {
    const r = rank("crosswalk", destinationHits());
    expect(r[0].route).toBe("/crosswalk");
  });

  it("prefers the shorter name when both matched the same way", () => {
    const hits = axisHits([axis({ axis: "gov" }), axis({ axis: "gov-procurement" })]);
    const r = rank("gov", hits);
    expect(r[0].label).toBe("gov");
  });

  it("shows an axis's published state — an unmeasured axis reads unmeasured", () => {
    const [hit] = axisHits([axis({ axis: "jail", status: "UNMEASURED" })]);
    expect(hit.detail).toContain("unmeasured");
    expect(hit.tab?.id).toBe("board");
  });

  it("does not invent a leader for a tie", () => {
    const [hit] = axisHits([axis({ separation: "TIE", leader: "qwen3:4b" })]);
    expect(hit.detail).toContain("tie — no separated leader");
    expect(hit.detail).not.toContain("qwen3:4b");
  });

  it("names the leader only where the lead is separated", () => {
    const [hit] = axisHits([axis({ separation: "SEPARATED", leader: "qwen3:4b" })]);
    expect(hit.detail).toContain("separated lead: qwen3:4b");
  });

  it("carries a card's content id, and points at the verifier", () => {
    const [hit] = cardHits([
      { slug: "gov", status: "MEASURED", contentId: "ff97b6eaf87cb648", path: "/signals/gov.signed.json" },
    ]);
    expect(hit.detail).toContain("ff97b6eaf87cb648");
    expect(hit.tab?.id).toBe("verify");
  });

  it("returns nothing for a query nothing matches — it never guesses", () => {
    expect(rank("zzzzq", destinationHits())).toEqual([]);
    expect(rank("", destinationHits())).toEqual([]);
  });

  it("scores a name match above a description-only match", () => {
    const hits = destinationHits();
    const byName = hits.find((h) => h.label === "Library")!;
    const other = hits.find((h) => h.label !== "Library" && h.detail.toLowerCase().includes("library"));
    if (other) expect(score("library", byName)).toBeGreaterThan(score("library", other));
  });
});
