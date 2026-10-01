import { beforeAll, describe, expect, it } from "vitest";
import { evaluateMeasurementFreshness, withMeasurementTime } from "./_gspc_measurement_time";
import { onRequestGet } from "./gspc";
import type { AxisScore } from "./_gspc_types";

const dummy = (overrides: Partial<AxisScore> = {}): AxisScore => ({
  axis: "dummy", bench: "dummy", task: "dummy", family: "gspc", kind: "deterministic-facts",
  n: 1, status: "MEASURED", colour: "#000000", hue: 0, ...overrides,
});

describe("GSPC structured measurement time", () => {
  let payload: any;

  beforeAll(async () => {
    (globalThis as unknown as { caches: unknown }).caches = {
      default: { match: async () => undefined, put: async () => undefined },
    };
    const response = await onRequestGet({
      request: new Request("https://councilof.ai/api/gspc"),
      env: {},
      waitUntil: () => undefined,
    } as any);
    payload = await response.json();
  });

  it("every measured public axis carries structured measurement time", () => {
    const measured = payload.axes.filter((a: any) => a.status === "MEASURED");
    expect(measured).toHaveLength(23);
    expect(measured.every((a: any) => a.measurement_time && typeof a.measurement_time.state === "string")).toBe(true);
    expect(payload.measurement_time_contract.states.UNCHECKABLE).toEqual([]);
  });

  it("preserves source precision instead of inventing midnight timestamps", () => {
    const governance = payload.axes.find((a: any) => a.axis === "governance");
    expect(governance.measurement_time).toMatchObject({
      state: "DAY", observed_on: "2026-08-12", precision: "day",
    });
    expect(governance.measurement_time.observed_at).toBeUndefined();

    const swarm = payload.axes.find((a: any) => a.axis === "swarm");
    expect(swarm.measurement_time.state).toBe("NOT_AFTER");
    expect(swarm.measurement_time.not_after).toBe("2026-08-19T09:24:39.162060+00:00");
  });

  it("uses exact producer/run time where evidence supplies it", () => {
    expect(payload.axes.find((a: any) => a.axis === "effect-binding").measurement_time).toMatchObject({
      state: "EXACT", observed_at: "2026-09-22T05:43:05Z",
    });
    expect(payload.axes.find((a: any) => a.axis === "jail").measurement_time).toMatchObject({
      state: "EXACT", observed_at: "2026-08-18T03:22:16Z",
    });
    for (const a of payload.axes.filter((x: any) => x.family === "financial")) {
      expect(a.measurement_time.state).toBe("EXACT");
      expect(a.measurement_time.observed_at).toBe(a.facts_as_of);
    }
  });

  it("fails closed when no structured time exists", () => {
    const timed = withMeasurementTime(dummy());
    expect(timed.measurement_time.state).toBe("UNCHECKABLE");
    expect(evaluateMeasurementFreshness(timed.measurement_time, "2026-10-01T05:00:00Z", 86400).state).toBe("UNCHECKABLE");
  });
});

describe("freshness evaluation is precision-aware and fail-closed", () => {
  const now = "2026-10-01T05:00:00Z";

  it("exact timestamps can be current or stale", () => {
    expect(evaluateMeasurementFreshness({
      state: "EXACT", precision: "instant", observed_at: "2026-10-01T04:30:00Z", source: "x", source_field: "x",
    }, now, 3600).state).toBe("CURRENT");
    expect(evaluateMeasurementFreshness({
      state: "EXACT", precision: "instant", observed_at: "2026-09-30T04:30:00Z", source: "x", source_field: "x",
    }, now, 3600).state).toBe("STALE");
  });

  it("day precision becomes UNCHECKABLE when the boundary cuts through that day", () => {
    const r = evaluateMeasurementFreshness({
      state: "DAY", precision: "day", observed_on: "2026-09-30", source: "x", source_field: "x",
    }, "2026-10-01T12:00:00Z", 24 * 3600);
    expect(r.state).toBe("UNCHECKABLE");
    expect(r.reason).toBe("DAY_PRECISION_STRADDLES_BOUND");
  });

  it("NOT_AFTER can prove stale but never current", () => {
    const t = {
      state: "NOT_AFTER" as const,
      precision: "instant-upper-bound" as const,
      not_after: "2026-10-01T04:30:00Z",
      source: "x",
      source_field: "x",
      note: "upper bound",
    };
    expect(evaluateMeasurementFreshness(t, now, 3600).state).toBe("UNCHECKABLE");
    expect(evaluateMeasurementFreshness(t, now, 60).state).toBe("STALE");
  });
});
