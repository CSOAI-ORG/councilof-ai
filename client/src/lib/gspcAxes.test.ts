import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchAxes, publicCaption, quotable } from "./gspcAxes";
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
        totals: { public_count: "14 measured of 14 quotable" },
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
    expect(r.publicCount).toBe("14 measured of 14 quotable");
    expect(r.axes.map((a) => a.axis)).toEqual(["governance", "jail"]);
    expect(r.axes.every((a) => a.axis !== "slot15")).toBe(true);
    expect(r.inLane.map((a) => a.axis)).toEqual(["slot15"]);
    expect(r.axes.filter(quotable)).toHaveLength(2);
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
