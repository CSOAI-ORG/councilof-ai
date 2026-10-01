import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";
import { evaluateMeasurementFreshness } from "./_gspc_measurement_time";

type MeasurementTime =
  | { state: "EXACT"; observed_at: string }
  | { state: "DAY"; observed_on: string }
  | { state: "NOT_AFTER"; not_after: string }
  | { state: "UNCHECKABLE" };

type Axis = {
  axis: string;
  family: string;
  kind: string;
  status: string;
  facts_as_of?: string;
  measurement_time: MeasurementTime;
};

type Payload = {
  axes: Axis[];
  measurement_time_contract: {
    global_max_age_seconds: number | null;
    global_freshness_policy: string;
    states: Record<string, string[]>;
  };
};

async function served(): Promise<Payload> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return (await res.json()) as Payload;
}

describe("GET /api/gspc structured measurement time", () => {
  let body: Payload;
  beforeAll(async () => { body = await served(); });

  it("every measured axis carries structured timing and none silently borrows response time", () => {
    const measured = body.axes.filter((a) => a.status === "MEASURED");
    expect(measured).toHaveLength(23);
    expect(measured.every((a) => Boolean(a.measurement_time))).toBe(true);
    expect(measured.filter((a) => a.measurement_time.state === "UNCHECKABLE")).toEqual([]);
    expect(body.measurement_time_contract.global_freshness_policy).toBe("UNSET");
    expect(body.measurement_time_contract.global_max_age_seconds).toBeNull();
  });

  it("financial facts use their producer as_of exactly", () => {
    const financial = body.axes.filter((a) => a.family === "financial");
    expect(financial).toHaveLength(8);
    for (const axis of financial) {
      expect(axis.measurement_time.state).toBe("EXACT");
      expect(axis.measurement_time).toHaveProperty("observed_at", axis.facts_as_of);
    }
  });

  it("effect-binding uses the signed run payload as_of", () => {
    const signed = JSON.parse(readFileSync(new URL("../../public/interop/effect-binding-server-probe-2026-09-22.signed.json", import.meta.url), "utf8"));
    const axis = body.axes.find((a) => a.axis === "effect-binding")!;
    expect(axis.facts_as_of).toBe(signed.payload.as_of);
    expect(axis.measurement_time).toMatchObject({ state: "EXACT", observed_at: signed.payload.as_of });
  });

  it("board-v2 axes preserve day precision instead of inventing midnight", () => {
    const governance = body.axes.find((a) => a.axis === "governance")!;
    expect(governance.measurement_time).toEqual(expect.objectContaining({ state: "DAY", observed_on: "2026-08-12" }));
    expect(governance.measurement_time).not.toHaveProperty("observed_at");
  });

  it("swarm publishes only the signed-card upper bound", () => {
    const card = JSON.parse(readFileSync(new URL("../../public/signed/cards/b44335819f7720966b41e2ee26f5798892b0eb8d2571c71e0c9090506f1ff823.json", import.meta.url), "utf8"));
    const swarm = body.axes.find((a) => a.axis === "swarm")!;
    expect(swarm.measurement_time).toMatchObject({ state: "NOT_AFTER", not_after: card.body.created });
  });

  it("jail uses the published gold-run timestamp", () => {
    const board = JSON.parse(readFileSync(new URL("../../public/signed/board_living.json", import.meta.url), "utf8"));
    const jail = body.axes.find((a) => a.axis === "jail")!;
    expect(jail.measurement_time).toMatchObject({ state: "EXACT", observed_at: board.updated });
  });

  it("contract state counts are exhaustive", () => {
    expect(body.measurement_time_contract.states.EXACT).toHaveLength(10);
    expect(body.measurement_time_contract.states.DAY).toHaveLength(12);
    expect(body.measurement_time_contract.states.NOT_AFTER).toEqual(["swarm"]);
    expect(body.measurement_time_contract.states.UNCHECKABLE).toEqual([]);
    expect(Object.values(body.measurement_time_contract.states).flat()).toHaveLength(23);
  });
});

describe("precision-aware freshness admission", () => {
  const now = "2026-10-01T05:00:00Z";

  it("EXACT timestamps can prove CURRENT or STALE", () => {
    expect(evaluateMeasurementFreshness({ state: "EXACT", precision: "instant", observed_at: "2026-10-01T04:30:00Z", source: "x", source_field: "x" }, now, 3600).state).toBe("CURRENT");
    expect(evaluateMeasurementFreshness({ state: "EXACT", precision: "instant", observed_at: "2026-09-30T04:30:00Z", source: "x", source_field: "x" }, now, 3600).state).toBe("STALE");
  });

  it("DAY precision fails closed when the bound cuts through that day", () => {
    const result = evaluateMeasurementFreshness({ state: "DAY", precision: "day", observed_on: "2026-09-30", source: "x", source_field: "x" }, "2026-10-01T12:00:00Z", 24 * 3600);
    expect(result.state).toBe("UNCHECKABLE");
    expect(result.reason).toBe("DAY_PRECISION_STRADDLES_BOUND");
  });

  it("NOT_AFTER can prove STALE but never CURRENT", () => {
    const bound = { state: "NOT_AFTER" as const, precision: "instant-upper-bound" as const, not_after: "2026-10-01T04:30:00Z", source: "x", source_field: "x", note: "upper bound only" };
    expect(evaluateMeasurementFreshness(bound, now, 3600).state).toBe("UNCHECKABLE");
    expect(evaluateMeasurementFreshness(bound, now, 60).state).toBe("STALE");
  });

  it("UNCHECKABLE never upgrades to CURRENT", () => {
    const missing = { state: "UNCHECKABLE" as const, precision: "unknown" as const, source: "x", source_field: "none", note: "missing" };
    expect(evaluateMeasurementFreshness(missing, now, 86400)).toMatchObject({ state: "UNCHECKABLE", reason: "NO_STRUCTURED_MEASUREMENT_TIME" });
  });
});
