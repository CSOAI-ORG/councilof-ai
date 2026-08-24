import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchAxes, publicCaption, quotable } from "./gspcAxes";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("publicCaption", () => {
  it("prefers the living-board sentence and never invents a slot count", () => {
    expect(publicCaption("13 measured of 14 quotable (GSPC ruling 2026-08-18)", 13, 14))
      .toBe("13 measured of 14 quotable (GSPC ruling 2026-08-18)");
    expect(publicCaption(undefined, 13, 14)).toBe("13 measured of 14");
    expect(publicCaption("")).toBe("Counts from GET /api/gspc");
  });
});

describe("fetchAxes", () => {
  it("keeps in-lane axes off the board and still returns every published board row", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        totals: { public_count: "13 measured of 14 quotable (GSPC ruling 2026-08-18)" },
        measured_on: { date: "2026-08-18" },
        axes: [
          { axis: "governance", bench: "GovBench", n: 237, accuracy: 0.7, status: "MEASURED" },
          { axis: "jail", bench: "JailBench", n: 71, accuracy: 0.59, status: "MEASURED" },
        ],
        measured_in_lane: [
          { axis: "slot15", bench: "Slot15-Honesty", task: "refuses to fabricate", n: 35, accuracy: 0.33, status: "MEASURED" },
        ],
      }),
    })));

    const r = await fetchAxes();
    expect(r.source).toBe("wire");
    expect(r.publicCount).toBe("13 measured of 14 quotable (GSPC ruling 2026-08-18)");
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
