/**
 * board.test.mjs — the popup prints the board, it never counts it. Against a captured
 * /api/gspc payload (fixtures/api-gspc.snapshot.json) and hand-built axes.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { boardView, axisRow, WITHHELD } from "../lib/board.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const snap = JSON.parse(readFileSync(path.join(here, "../fixtures/api-gspc.snapshot.json"), "utf8"));

describe("boardView over a captured payload", () => {
  const view = boardView(snap);
  it("prints totals.lid verbatim", () => {
    expect(view.lid).toBe(snap.totals.lid);
    expect(view.lid).toMatch(/not a certificate/);
  });
  it("prints totals.public_count verbatim", () => expect(view.public_count).toBe(snap.totals.public_count));
  it("one row per axis in the payload — the row count is derived, never typed", () => {
    expect(view.rows.length).toBe(snap.axes.length);
  });
  it("withheld leader states are shown as withheld states, never as a leader or a zero", () => {
    const withheld = view.rows.filter((r) => r.leaderState);
    const inPayload = snap.axes.filter((a) => typeof a.public_leader_state === "string");
    expect(withheld.length).toBe(inPayload.length);
    for (const r of withheld) expect(r.leader).toMatch(/^withheld/);
  });
  it("TIE is TIE — a tied leader carries the word", () => {
    for (const a of snap.axes.filter((x) => x.separation === "TIE" && typeof x.leader === "string")) {
      expect(axisRow(a).leader.startsWith("TIE — ")).toBe(true);
    }
  });
  it("fact runs carry no leader", () => {
    for (const a of snap.axes.filter((x) => x.kind === "deterministic-facts")) {
      expect(axisRow(a).leader).toMatch(/fact run — no leader/);
    }
  });
});

describe("axisRow edge cases", () => {
  it("absence of status means UNMEASURED", () => expect(axisRow({ axis: "x" }).status).toBe("UNMEASURED"));
  it("EXCLUDED_OWN_MODEL and NO_SIGNED_CARD map to their withheld labels", () => {
    expect(axisRow({ axis: "a", kind: "model-comparison", public_leader_state: "EXCLUDED_OWN_MODEL" }).leader).toBe(WITHHELD.EXCLUDED_OWN_MODEL);
    expect(axisRow({ axis: "b", kind: "model-comparison", public_leader_state: "NO_SIGNED_CARD" }).leader).toBe(WITHHELD.NO_SIGNED_CARD);
  });
  it("an unknown withheld state is still shown as withheld, not invented", () => {
    expect(axisRow({ axis: "c", public_leader_state: "SOMETHING_NEW" }).leader).toBe("withheld — SOMETHING_NEW");
  });
  it("a payload with no lid yields null — the popup then says so instead of composing one", () => {
    expect(boardView({ totals: {}, axes: [] }).lid).toBeNull();
  });
});
