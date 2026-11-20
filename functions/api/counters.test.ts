import { describe, expect, it } from "vitest";
import { onRequestGet } from "./counters";
import artifact, { deriveVerifyExecutions, VERIFY_EXECUTIONS_PATH } from "./_verify_executions";

describe("public counters regulatory inventory", () => {
  it("keeps inventory counts separate from legal and measurement claims", async () => {
    const response = await onRequestGet({} as Parameters<typeof onRequestGet>[0]);
    const body = await response.json() as {
      counters: Array<{ id: string; count: number | null; kind: string; note: string }>;
    };
    const byId = Object.fromEntries(body.counters.map((row) => [row.id, row]));

    expect(byId.frozen_provision_counter).toMatchObject({ count: 417, kind: "catalogued" });
    expect(byId.frozen_provision_counter.note).toContain("unresolved-row");
    expect(byId.regulator_authority_adapters).toMatchObject({ count: 17, kind: "catalogued" });
    expect(byId.crosswalk_assets).toMatchObject({ count: 26, kind: "catalogued" });
    expect(byId.published_crosswalk_regimes).toMatchObject({ count: 4, kind: "catalogued" });
    expect(byId.crosswalk_assets.note).toContain("not a count of equivalent signed legal crosswalks");
  });
});

describe("verify_page_executions — aggregate-only, derived from the committed artifact", () => {
  it("with no artifact, or a bucketless one, the row stays UNPUBLISHED — never zero", () => {
    for (const absent of [null, undefined, {} as never]) {
      const derived = deriveVerifyExecutions(absent);
      expect(derived.measured).toBe(false);
      expect(derived.total).toBeNull();
    }
    const bucketless = deriveVerifyExecutions({ ...artifact, days: [] });
    expect(bucketless.measured).toBe(false);
    expect(bucketless.total).toBeNull();
    const zeroDayIsStillNotMeasuredAsAFabricatedTotal = deriveVerifyExecutions({
      ...artifact,
      days: [{ date: "2026-11-18", executions: 0 }],
    });
    // a real bucket whose value is 0 is a measured 0 — the artifact carries it, so it publishes
    expect(zeroDayIsStillNotMeasuredAsAFabricatedTotal).toMatchObject({ measured: true, total: 0, day_count: 1 });
  });

  it("with real buckets, the row is the artifact's own sum and its own as_of", () => {
    const withDays = deriveVerifyExecutions({
      schema: "csoai.verify-executions/0.1",
      as_of: "2026-11-19T07:31:00Z",
      status: "measured",
      days: [{ date: "2026-11-18", executions: 7 }, { date: "2026-11-19", executions: 3 }],
      stale_after_hours: 48,
      retention_days: 120,
    });
    expect(withDays).toMatchObject({ measured: true, total: 10, day_count: 2, as_of: "2026-11-19T07:31:00Z" });
  });

  it("refuses a number from malformed bucket bytes", () => {
    for (const bad of [
      { ...artifact, days: [{ date: "18 Nov 2026", executions: 5 }] },
      { ...artifact, days: [{ date: "2026-11-18", executions: -2 }] },
      { ...artifact, days: [{ date: "2026-11-18", executions: "seven" }] },
      { ...artifact, days: "seven" } as never,
    ]) {
      expect(deriveVerifyExecutions(bad)).toMatchObject({ measured: false, total: null });
    }
  });

  it("the served row always agrees with the committed artifact's own bytes", async () => {
    const response = await onRequestGet({} as Parameters<typeof onRequestGet>[0]);
    const body = await response.json() as {
      counters: Array<{ id: string; count: number | null; kind: string; source: string | null; as_of: string | null; as_of_field: string | null; status: string }>;
    };
    const row = body.counters.find((c) => c.id === "verify_page_executions");
    expect(row).toBeDefined();
    const derived = deriveVerifyExecutions(artifact);
    if (derived.measured) {
      expect(row).toMatchObject({
        count: derived.total,
        kind: "measured",
        status: "PUBLISHED",
        as_of: derived.as_of,
        as_of_field: "as_of",
      });
      expect(row!.source).toContain(VERIFY_EXECUTIONS_PATH);
    } else {
      // deployment-order safe: while the artifact names no bucket, UNPUBLISHED is the whole answer
      expect(row).toMatchObject({ count: null, kind: "unmeasured", status: "UNPUBLISHED", source: null, as_of: null, as_of_field: null });
      expect(row!.note).toContain("aggregate-only");
    }
  });
});
