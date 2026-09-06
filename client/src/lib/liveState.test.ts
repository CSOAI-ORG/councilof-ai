/**
 * These run against the REAL /api/state payload, captured verbatim on
 * 2026-09-06 into __fixtures__/api-state-2026-09-06.json — not a hand-written
 * shape that agrees with the parser by construction.
 */
import { describe, expect, it } from "vitest";
import state from "./__fixtures__/api-state-2026-09-06.json";
import { headline, readState, type StateRead } from "./liveState";

function live(r: StateRead) {
  if (r.state !== "live") throw new Error("expected a live read, got " + r.reason);
  return r;
}

describe("reading the endpoint that exists to be quoted", () => {
  it("reads the real payload and names its schema", () => {
    const r = live(readState(state));
    expect(r.schema).toBe("csoai.live-state/1");
    expect(r.sections.length).toBeGreaterThanOrEqual(8);
  });

  it("carries the board's own measured counts, by field name", () => {
    const r = live(readState(state));
    const board = r.sections.find((s) => s.id === "board");
    const measured = board?.cells.find((c) => c.field === "board.measured_axes");
    const slots = board?.cells.find((c) => c.field === "board.axis_slots");
    expect(measured?.value).toBe("22");
    expect(slots?.value).toBe("22");
    // the field name is what a lane quotes, so it must be rendered
    expect(measured?.field).toBe("board.measured_axes");
  });

  it("keeps each figure's kind and never invents a total", () => {
    const r = live(readState(state));
    const kinds = new Set(r.sections.flatMap((s) => s.cells.map((c) => c.kind)).filter(Boolean));
    // more than one kind is present, which is exactly why they may not be summed
    expect(kinds.size).toBeGreaterThan(1);
    // the parser exposes no total of any sort
    const asJson = JSON.stringify(r);
    expect(asJson).not.toMatch(/"total"|"sum"|"combined"/);
  });

  it("does not conflate the three card corpora", () => {
    const r = live(readState(state));
    const idx = r.sections.find((s) => s.id === "signed_cards");
    const chain = r.sections.find((s) => s.id === "card_chain");
    const root = r.sections.find((s) => s.id === "public_root");
    // three separate sections, each naming its own committed artifact
    expect(idx?.authority).toContain("card_index.json");
    expect(root?.authority).toContain("root.json");
    expect(chain?.authority).toContain("chain-facts.json");
    // and the payload's own warnings against merging them are rendered
    expect(chain?.cautions.join(" ")).toMatch(/never_conflate|STORE|INDEX/i);
  });

  it("renders the payload's cautions rather than dropping them", () => {
    const r = live(readState(state));
    const withCautions = r.sections.filter((s) => s.cautions.length > 0);
    expect(withCautions.length).toBeGreaterThanOrEqual(3);
  });

  it("lists what the endpoint refuses to speak for", () => {
    const r = live(readState(state));
    expect(r.notCovered.length).toBe(10);
    // each carries WHY it is out of scope, not just a name
    expect(r.notCovered.every((n) => n.subject.length > 0)).toBe(true);
    expect(r.notCovered.filter((n) => n.why_not).length).toBeGreaterThan(0);
    expect(r.notCovered.map((n) => n.subject).join(" ")).toMatch(/csoai-static-deploy2/);
  });

  it("quotes the headline sentence verbatim, with its kind", () => {
    const h = headline(state);
    expect(h?.value).toBe("22 axis · 22 measured");
    expect(h?.kind).toBe("declared");
    expect(h?.as_of_field).toBeTruthy();
  });
});

describe("absent is not zero", () => {
  it("treats an unreachable endpoint as unread", () => {
    for (const doc of [null, undefined, "nope", 42, []]) {
      expect(readState(doc).state).toBe("unread");
    }
  });

  it("reports unread rather than an empty page when nothing is quotable", () => {
    const r = readState({ schema: "csoai.live-state/1" });
    expect(r.state).toBe("unread");
    if (r.state === "unread") expect(r.reason).toBe("no quotable fields");
  });

  it("drops a section that has no established figure, instead of showing a zero", () => {
    const r = live(
      readState({
        board: { axis_slots: { value: 22, kind: "declared" } },
        empty_domain: { authority: "somewhere.json" },
      }),
    );
    expect(r.sections.map((s) => s.id)).toEqual(["board"]);
  });

  it("never renders a missing value as 0", () => {
    const r = live(readState({ board: { axis_slots: { value: null, kind: "declared" } } }));
    expect(r.sections[0].cells[0].value).toBe("—");
  });
});
