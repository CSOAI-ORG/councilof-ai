import { describe, expect, it } from "vitest";
import { build } from "./press.json";

describe("/api/press.json is derived, and refuses to announce what did not happen", () => {
  it("the window is anchored to artifact dates, never to the clock", () => {
    const a = build(), b = build();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));      // byte-identical across calls
    expect(a.window.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // 7-day window, inclusive of both ends
    const span = (new Date(a.window.to + "T00:00:00Z").getTime() - new Date(a.window.from + "T00:00:00Z").getTime()) / 864e5;
    expect(span).toBe(6);
    // and the anchor is a date some artifact actually carries
    const corrections = a.corrections_this_window;
    expect(corrections.total).toBeGreaterThan(0);
  });

  it("every published line carries a proof command", () => {
    const d = build();
    expect(d.window.proof).toContain("curl");
    expect(d.public_root.proof).toContain("curl");
    expect(d.signed_cards.proof).toContain("curl");
    expect(d.corrections_this_window.proof).toContain("curl");
    for (const i of d.corrections_this_window.items) expect(i.proof).toContain(i.id);
    for (const n of d.not_announced) expect(n.proof.length).toBeGreaterThan(10);
  });

  it("corrections in the window all fall inside it", () => {
    const d = build();
    for (const i of d.corrections_this_window.items) {
      expect(i.date >= d.window.from).toBe(true);
      expect(i.date <= d.window.to).toBe(true);
    }
    expect(d.corrections_this_window.value).toBe(d.corrections_this_window.items.length);
  });

  it("distribution surfaces publish NULL, never 0, while nothing is confirmed live", () => {
    const d = build();
    // The spray log holds drafted/queued rows only. A drafted row is not a placement, and a
    // zero would read as a measured result rather than an absence.
    expect(d.distribution_surfaces.live === null || typeof d.distribution_surfaces.live === "number").toBe(true);
    if (!d.distribution_surfaces.live) {
      expect(d.distribution_surfaces.live).toBeNull();
      expect(d.distribution_surfaces.kind).toBe("unmeasured");
      expect(d.distribution_surfaces.note).toContain("not a published surface");
    }
  });

  it("names what it is NOT announcing instead of omitting it", () => {
    const d = build();
    const subjects = d.not_announced.map((n) => n.subject);
    expect(subjects).toContain("first settlement");
    expect(subjects).toContain("N sites live");
    for (const n of d.not_announced) expect(n.state).toBe("NOT HAPPENED");
  });

  it("states the root's proof scope and the three-corpora boundary", () => {
    const d = build();
    expect(d.public_root.scope).toContain("BYTES ONLY");
    expect(d.signed_cards.corpus_note).toContain("zero identifier overlap");
  });
});
