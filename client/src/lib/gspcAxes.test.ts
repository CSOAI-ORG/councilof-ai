import { describe, expect, it, vi, afterEach } from "vitest";
import {
  fetchAxes, formatPublishedInterval, hasMacroF1, inLaneFacts, publicCaption,
  publishedInterval, publishedSeparation, quotable,
} from "./gspcAxes";
import { BOARD_COUNT_OBSERVED } from "./boardCount";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("publicCaption", () => {
  it("prefers the living-board sentence and never invents a slot count", () => {
    expect(publicCaption("14 measured of 14 quotable", 14, 14))
      .toBe("14 measured of 14 quotable");
    // Historical sitting-day wording still echoes when provided verbatim:
    expect(publicCaption("13 measured of 14 quotable", 13, 14))
      .toBe("13 measured of 14 quotable");
  });

  it("falls back to the recorded board observation, not to a local family count", () => {
    // The measured/total arguments count the LOCAL behavioural snapshot, not the
    // board. Formatting them as the caption published a family count as the whole
    // board. The fallback is now BOARD_COUNT_OBSERVED, so both of the board's
    // numbers travel and neither is invented here.
    expect(publicCaption(undefined, 14, 14)).toBe(BOARD_COUNT_OBSERVED.public_count);
    expect(publicCaption("")).toBe(BOARD_COUNT_OBSERVED.public_count);
    // Whatever it returns, it must carry BOTH numbers — a lone slot count would
    // claim measurements that do not exist.
    expect(BOARD_COUNT_OBSERVED.public_count).toContain(String(BOARD_COUNT_OBSERVED.axes));
    expect(BOARD_COUNT_OBSERVED.public_count).toContain(String(BOARD_COUNT_OBSERVED.measured_axes));
    expect(BOARD_COUNT_OBSERVED.axes - BOARD_COUNT_OBSERVED.measured_axes)
      .toBe(BOARD_COUNT_OBSERVED.unmeasured_axes);
  });
});

describe("fetchAxes", () => {
  it("keeps in-lane axis off the board and still returns every published board row", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        totals: { public_count: "22 axes · 15 measured" },
        measured_on: { date: "2026-08-25" },
        axes: [
          { axis: "governance", bench: "GovBench", n: 237, accuracy: 0.7, status: "MEASURED" },
          { axis: "jail", bench: "JailBench", n: 71, accuracy: 0.59, status: "MEASURED", separation: "TIE" },
        ],
        measured_in_lane: [
          { axis: "slot15", bench: "Slot15-Honesty", task: "refuses to fabricate", n: 35, accuracy: 0.33, status: "MEASURED" },
        ],
      }),
    })));

    const r = await fetchAxes();
    expect(r.source).toBe("wire");
    expect(r.publicCount).toBe("22 axes · 15 measured");
    expect(r.axes.map((a) => a.axis)).toEqual(["governance", "jail"]);
    expect(r.axes.every((a) => a.axis !== "slot15")).toBe(true);
    expect(r.inLane.map((a) => a.axis)).toEqual(["slot15"]);
    expect(r.axes.filter(quotable)).toHaveLength(2);
  });

  it("keeps published interval and McNemar mark, and does not invent a withheld interval", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        totals: { public_count: "22 axis · 15 measured" },
        measured_on: { date: "2026-08-26" },
        axes: [
          {
            axis: "governance", bench: "GovBench", n: 237, accuracy: 0.7, status: "MEASURED",
            separation: "SEPARATED", interval: [0.639, 0.755], kind: "model-comparison",
          },
          {
            axis: "swarm", bench: "SwarmBench", n: 37, accuracy: 0.384, status: "MEASURED",
            separation: "SEPARATED", interval: null, kind: "model-comparison",
          },
          {
            axis: "jail", bench: "JailBench", n: 71, accuracy: 0.5915, status: "MEASURED",
            separation: "TIE", interval: [0.475, 0.698], kind: "model-comparison",
          },
          {
            axis: "reserve-attestation", n: 0, accuracy: null, status: "UNMEASURED", kind: "declared-slot",
          },
        ],
        measured_in_lane: [
          {
            axis: "human-vs-ai",
            bench: "Colosseum-Pairs",
            n: 35,
            accuracy: 1,
            leader: "qwen3:4b (base model)",
            separation: "UNTESTED",
            fleet_mean: 0.8498,
            dataset: "pending publication (f2-measure, 3090 pod)",
            status: "MEASURED",
            per_model: {
              "council-safe": { n: 32, aligned: 8, alignment_rate: 0.25 },
            },
          },
          {
            axis: "slot15",
            bench: "Slot15-Honesty",
            n: 35,
            accuracy: 0.3333,
            leader: "qwen2.5:7b (base model)",
            separation: "UNTESTED",
            fleet_mean: 0.1543,
            status: "MEASURED",
            per_model: {
              "council-safe": { n: 35, honest: 5, fabricated: 30, honesty_rate: 0.1429 },
            },
          },
        ],
      }),
    })));

    const r = await fetchAxes();
    const gov = r.axes.find((a) => a.axis === "governance")!;
    const swarm = r.axes.find((a) => a.axis === "swarm")!;
    const jail = r.axes.find((a) => a.axis === "jail")!;
    const empty = r.axes.find((a) => a.axis === "reserve-attestation")!;

    expect(publishedInterval(gov)).toEqual([0.639, 0.755]);
    expect(formatPublishedInterval(publishedInterval(gov)!)).toBe("0.639–0.755");
    expect(publishedSeparation(gov)).toBe("SEPARATED");

    expect(publishedInterval(swarm)).toBeNull();
    expect(publishedSeparation(swarm)).toBe("SEPARATED");

    expect(publishedInterval(jail)).toEqual([0.475, 0.698]);
    expect(publishedSeparation(jail)).toBe("TIE");

    expect(quotable(empty)).toBe(false);
    expect(publishedSeparation(empty)).toBeNull();
    expect(publishedInterval(empty)).toBeNull();

    expect(r.inLane.map((a) => a.axis)).toEqual(["human-vs-ai", "slot15"]);
    const hv = inLaneFacts(r.inLane[0]);
    expect(hv.separation).toBe("UNTESTED");
    expect(hv.specialistLine).toBe("council-safe 0.25 (n=32)");
    expect(hv.leaderLine).toContain("1");
    const slot = inLaneFacts(r.inLane[1]);
    expect(slot.separation).toBe("UNTESTED");
    expect(slot.fleetLine).toBe("fleet mean 0.1543");
    expect(slot.specialistLine).toBe("council-safe 0.1429 (n=35)");
  });

  it("retries once when the first response is HTML instead of JSON", async () => {
    const html = {
      ok: true,
      headers: { get: () => "text/html" },
      json: async () => "<!doctype html>",
    };
    const wire = {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        totals: { public_count: "live from GET /api/gspc" },
        measured_on: { date: "2026-08-18" },
        axes: [{ axis: "governance", bench: "GovBench", n: 237, accuracy: 0.7, status: "MEASURED" }],
      }),
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(html)
      .mockResolvedValueOnce(wire);
    vi.stubGlobal("fetch", fetchMock);

    const r = await fetchAxes();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(r.source).toBe("wire");
    expect(r.publicCount).toBe("live from GET /api/gspc");
    expect(r.axes.map((a) => a.axis)).toEqual(["governance"]);
  });
});

describe("no fabricated zero — the 2026-08-26 regression", () => {
  /**
   * Live /api/gspc on 2026-08-26 published these three rows verbatim:
   *
   *   provenance-controls  MEASURED  n=6   accuracy null  macro_f1 null
   *   jail                 MEASURED  n=71  accuracy 0.5915  macro_f1 null
   *   swarm                MEASURED  n=37  accuracy 0.384   macro_f1 null
   *
   * The wire reader wrote `Number(w.accuracy ?? 0)`, so provenance-controls
   * arrived as accuracy 0 and every OS panel printed "0.000 accuracy · n=6 ·
   * macro F1 0.000" — three numbers, none of them measured. A fabricated zero on
   * a MEASURED row is the exact defect class this estate exists to eliminate: it
   * reads as a catastrophic result rather than as an absent one.
   */
  const wire = (axes: unknown[]) => ({
    ok: true,
    headers: { get: () => "application/json" },
    json: async () => ({
      totals: { public_count: "22 axes · 15 measured" },
      measured_on: { date: "2026-08-12" },
      axes,
      measured_in_lane: [
        { axis: "no-acc-lane", bench: "L", task: "t", n: 12, accuracy: null, status: "MEASURED" },
      ],
    }),
  });

  it("keeps a null accuracy null, and refuses to quote the row", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => wire([
      { axis: "provenance-controls", bench: "ChainFacts", n: 6, accuracy: null, macro_f1: null, status: "MEASURED" },
    ])));
    const r = await fetchAxes();
    const a = r.axes[0];
    expect(a.accuracy).toBeNull();
    expect(a.macro_f1).toBeNull();
    // MEASURED with a bank, but not quotable — so no panel can print a number.
    expect(a.status).toBe("MEASURED");
    expect(a.n).toBe(6);
    expect(quotable(a)).toBe(false);
    expect(hasMacroF1(a)).toBe(false);
  });

  it("quotes an accuracy that IS published, while still refusing an absent macro F1", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => wire([
      { axis: "jail", bench: "GoldBank-Detector", n: 71, accuracy: 0.5915, macro_f1: null, status: "MEASURED" },
    ])));
    const r = await fetchAxes();
    const a = r.axes[0];
    expect(quotable(a)).toBe(true);
    expect(a.accuracy).toBe(0.5915);
    expect(hasMacroF1(a)).toBe(false);
    expect(a.macro_f1).toBeNull();
  });

  it("applies the same rule to in-lane rows", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => wire([
      { axis: "governance", bench: "GovBench", n: 237, accuracy: 0.7, macro_f1: 0.705, status: "MEASURED" },
    ])));
    const r = await fetchAxes();
    expect(r.inLane[0].accuracy).toBeNull();
  });

  it("never lets a non-numeric accuracy become a number", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => wire([
      { axis: "junk", bench: "B", n: 10, accuracy: "0.9", macro_f1: NaN, status: "MEASURED" },
    ])));
    const r = await fetchAxes();
    expect(r.axes[0].accuracy).toBeNull();
    expect(r.axes[0].macro_f1).toBeNull();
    expect(quotable(r.axes[0])).toBe(false);
  });
});
