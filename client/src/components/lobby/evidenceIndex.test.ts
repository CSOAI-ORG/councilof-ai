import { describe, expect, it, vi, afterEach } from "vitest";
import { composeEvidenceIndex } from "./evidenceIndex";
import { fetchBoard, quotableWire, stateWord, type WireAxis, type WireBoard } from "./boardWire";

/**
 * The Evidence-pack pane's promise, held still and interrogated.
 *
 * The pane claims three things it must be STRUCTURALLY unable to break: it never
 * prints a score an axis has not earned, it never hides an axis, and it never
 * types a count. Those are asserted here against the pure composer, plus the
 * reader that feeds it — including the failure path, where the honest answer is
 * to throw rather than to hand back a stale board.
 */

const axis = (over: Partial<WireAxis>): WireAxis => ({
  axis: "governance",
  bench: "GovBench",
  task: "risk-tier classification",
  n: 237,
  accuracy: 0.7,
  leader: "a council specialist",
  separation: "SEPARATED",
  separation_p: 0.0086,
  interval: [0.639, 0.755],
  fleet_mean: 0.49,
  status: "MEASURED",
  dataset: "csoai/gspc-gov",
  dataset_url: "https://huggingface.co/datasets/csoai/gspc-gov",
  ...over,
});

const board = (axes: WireAxis[]): WireBoard => ({
  axes,
  inLane: [{ axis: "slot15", bench: "", task: "", n: 6, status: "MEASURED" }],
  publicCount: "22 axes · 22 measured",
  measuredOn: "2026-08-12",
  issuer: "CSOAI Ltd",
  doi: "10.5281/zenodo.21991104",
  license: "CC-BY-4.0",
  limitations: ["Scores describe measured runs on frozen splits on a date."],
});

const rows = (o: Record<string, unknown>, k: string) => o[k] as Record<string, unknown>[];

afterEach(() => vi.restoreAllMocks());

describe("evidence index — a number only where the row earned one", () => {
  it("carries the leader's accuracy for a quotable, separated axis", () => {
    const a = axis({});
    const out = composeEvidenceIndex({
      board: board([a]), included: [a], system: "Acme v4", provider: "Acme", now: "T",
    });
    const row = rows(out, "included")[0];
    expect(row.leader_accuracy).toBe(0.7);
    expect(row.leader_interval_95).toEqual([0.639, 0.755]);
    expect(row.bank_url).toBe("https://huggingface.co/datasets/csoai/gspc-gov");
    expect(row.no_score_reason).toBeUndefined();
  });

  it("refuses a number for an UNMEASURED axis, and says why instead", () => {
    const a = axis({ axis: "jail", status: "UNMEASURED", accuracy: 0.59, separation: "UNTESTED" });
    const out = composeEvidenceIndex({
      board: board([a]), included: [a], system: "", provider: "", now: "T",
    });
    const row = rows(out, "included")[0];
    expect(row.leader_accuracy).toBeUndefined();
    expect(row.leader_interval_95).toBeUndefined();
    expect(String(row.no_score_reason)).toMatch(/UNMEASURED is the verdict/);
    expect(row.status).toBe("UNMEASURED");
  });

  it("refuses a number for a MEASURED-but-UNTESTED axis, naming the missing test", () => {
    const a = axis({ axis: "jail", status: "MEASURED", separation: "UNTESTED", accuracy: 0.5915 });
    const out = composeEvidenceIndex({
      board: board([a]), included: [a], system: "", provider: "", now: "T",
    });
    // quotableWire alone would let this through — the composer must not.
    expect(quotableWire(a)).toBe(true);
    const row = rows(out, "included")[0];
    expect(row.leader_accuracy).toBe(0.5915);
    // …but it is still reported as not quotable on this board, so nobody can
    // quote it as a determined lead.
    expect(rows(out, "not_quotable_on_this_board").map((r) => r.axis)).toContain("jail");
    expect(stateWord(a)).toBe("untested");
  });

  it("says 'no resolvable URL' rather than inventing a bank link", () => {
    const a = axis({ dataset: undefined, dataset_url: undefined });
    const out = composeEvidenceIndex({
      board: board([a]), included: [a], system: "", provider: "", now: "T",
    });
    const row = rows(out, "included")[0];
    expect(row.bank).toBe("not published");
    expect(String(row.bank_url)).toMatch(/no resolvable URL/);
  });
});

describe("evidence index — an omission is never invisible", () => {
  const measured = axis({});
  const dropped = axis({ axis: "care", accuracy: 0.535, separation: "SEPARATED" });
  const unmeasured = axis({ axis: "slot16", status: "PLANNED", accuracy: undefined, separation: "UNTESTED" });
  const all = [measured, dropped, unmeasured];

  it("names every axis the reader left out", () => {
    const out = composeEvidenceIndex({
      board: board(all), included: [measured], system: "", provider: "", now: "T",
    });
    const left = rows(out, "not_included").map((r) => r.axis);
    expect(left).toEqual(["care", "slot16"]);
    expect(String(rows(out, "not_included")[0].reason)).toMatch(/omission is visible/);
  });

  it("accounts for every axis on the board exactly once across included/not_included", () => {
    const out = composeEvidenceIndex({
      board: board(all), included: [measured, dropped], system: "", provider: "", now: "T",
    });
    const seen = [
      ...rows(out, "included").map((r) => r.axis),
      ...rows(out, "not_included").map((r) => r.axis),
    ].sort();
    expect(seen).toEqual(all.map((a) => a.axis).sort());
  });

  it("keeps in-lane rows out of the board and labels them", () => {
    const out = composeEvidenceIndex({
      board: board(all), included: all, system: "", provider: "", now: "T",
    });
    expect(rows(out, "included").map((r) => r.axis)).not.toContain("slot15");
    expect(String(rows(out, "in_lane_not_board_rows")[0].note)).toMatch(/never counted in the board totals/);
  });
});

describe("evidence index — no count is ever typed", () => {
  it("every *_count equals the length of the array beside it", () => {
    const all = [axis({}), axis({ axis: "care" }), axis({ axis: "swarm", separation: "UNTESTED" })];
    const out = composeEvidenceIndex({
      board: board(all), included: [all[0], all[2]], system: "", provider: "", now: "T",
    });
    for (const [countKey, arrayKey] of [
      ["included_count", "included"],
      ["not_included_count", "not_included"],
      ["not_quotable_on_this_board_count", "not_quotable_on_this_board"],
    ] as const) {
      expect(out[countKey]).toBe(rows(out, arrayKey).length);
    }
  });

  it("takes the board's own derived public_count rather than restating it", () => {
    const a = axis({});
    const out = composeEvidenceIndex({
      board: board([a]), included: [a], system: "", provider: "", now: "T",
    });
    expect((out.board as Record<string, unknown>).public_count).toBe("22 axes · 22 measured");
  });

  it("never claims the index itself is signed or certified", () => {
    const a = axis({});
    const text = JSON.stringify(
      composeEvidenceIndex({ board: board([a]), included: [a], system: "", provider: "", now: "T" }),
    );
    expect(text).toMatch(/this index is not itself signed/i);
    expect(text).toMatch(/[Nn]ot a certification/);
  });
});

describe("boardWire — the failure path reports, it does not paper over", () => {
  const withFetch = (impl: any) => vi.stubGlobal("fetch", vi.fn(impl));

  it("throws on a non-OK response rather than returning a snapshot", async () => {
    withFetch(async () => new Response("nope", { status: 502, headers: { "content-type": "text/plain" } }));
    await expect(fetchBoard()).rejects.toThrow(/HTTP 502/);
  });

  it("throws when the origin serves the SPA shell instead of JSON", async () => {
    withFetch(async () => new Response("<!doctype html>", { status: 200, headers: { "content-type": "text/html" } }));
    await expect(fetchBoard()).rejects.toThrow(/HTML, not JSON/);
  });

  it("throws when the payload carries no axes", async () => {
    withFetch(async () => new Response(JSON.stringify({ axes: [] }), {
      status: 200, headers: { "content-type": "application/json" },
    }));
    await expect(fetchBoard()).rejects.toThrow(/no axis/);
  });

  it("keeps dataset_url off the wire and drops a malformed interval", async () => {
    withFetch(async () => new Response(JSON.stringify({
      axes: [{ axis: "governance", n: 237, accuracy: 0.7, status: "MEASURED", separation: "SEPARATED",
        dataset: "csoai/gspc-gov", dataset_url: "https://huggingface.co/datasets/csoai/gspc-gov",
        interval: ["bad"] }],
      totals: { public_count: "22 axes · 22 measured" },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const b = await fetchBoard();
    expect(b.axes[0].dataset_url).toBe("https://huggingface.co/datasets/csoai/gspc-gov");
    expect(b.axes[0].interval).toBeUndefined();
    expect(b.publicCount).toBe("22 axes · 22 measured");
  });

  it("treats an unknown status as UNMEASURED, never as measured", async () => {
    withFetch(async () => new Response(JSON.stringify({
      axes: [{ axis: "mystery", n: 10, accuracy: 0.9, status: "GREAT", separation: "SEPARATED" }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const b = await fetchBoard();
    expect(b.axes[0].status).toBe("UNMEASURED");
    expect(quotableWire(b.axes[0])).toBe(false);
  });
});
