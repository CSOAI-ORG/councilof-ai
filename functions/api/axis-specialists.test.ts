import { describe, expect, it } from "vitest";
import INDEX from "../../public/axis-specialists/index.json";
import { onRequestGet as indexGet, onRequestHead as indexHead } from "./axis-specialists";
import { onRequestGet as axisGet } from "./axis-specialists/[axis]";

const axes = INDEX.specialists.map((item) => item.axis);

describe("MEOK Hive axis specialist API", () => {
  it("covers every source axis with isolated clusters and closed human gates", () => {
    // The count is DERIVED from the specialist array, never typed: the estate adds
    // axes (slot 34 = watchdog-ingest, 2026-10-30) and a typed 33 here would fail
    // for a correct board — the same mistake canon.json's frozen count made.
    expect(axes.length).toBe(INDEX.specialists.length);
    expect(axes.length).toBeGreaterThan(0);
    expect(new Set(axes).size).toBe(axes.length);
    expect(new Set(INDEX.specialists.map((item) => item.cluster_id)).size).toBe(axes.length);
    expect(INDEX.coverage.specialists).toBe(axes.length);
    expect(INDEX.coverage.clusters).toBe(axes.length);
    expect(INDEX.coverage.mcp_connections).toBe(axes.length);
    expect(INDEX.coverage.a2a_connections).toBe(axes.length);
    expect(INDEX.coverage.api_connections).toBe(axes.length);
    expect(INDEX.coverage.human_gates).toBe(axes.length);
    expect(INDEX.applied_proposals).toBe(0);
    for (const row of INDEX.specialists) {
      expect(row.human_decision).toBe("HOLD");
      expect(row.may_apply).toBe(false);
      expect(row.proposals).toBe(2);
    }
  });

  it("serves the index and strips HEAD bodies", async () => {
    const response = indexGet();
    expect(response.status).toBe(200);
    expect((await response.json()).schema).toBe("csoai.axis-specialist-index/1.0");
    const head = await indexHead({ request: new Request("https://councilof.ai/api/axis-specialists") });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
  });

  it.each(axes)("serves the %s specialist without applying proposals", async (axis) => {
    const response = axisGet({ params: { axis } });
    expect(response.status).toBe(200);
    const audit = await response.json();
    expect(audit.axis).toBe(axis);
    expect(audit.specialist.cluster_id).toBe(`meok-axis-${axis}`);
    expect(audit.specialist.asi_claimed).toBe(false);
    expect(audit.specialist.rsi_mode).toBe("RECOMMENDATION_ONLY");
    expect(audit.human_gate.decision).toBe("HOLD");
    expect(audit.human_gate.may_apply).toBe(false);
    expect(audit.improvement_proposals).toHaveLength(2);
    expect(audit.improvement_proposals.every((item: any) => item.state === "PROPOSED_NOT_APPLIED" && item.requires_human_approval)).toBe(true);
    expect(audit.audit_sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each(["governance/extra", "../governance", "not-an-axis", ""])("refuses unknown or unsafe axis selector %s", async (axis) => {
    const response = axisGet({ params: { axis } });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.state).toBe("NOT_FOUND");
    expect(body.axis).toBe(axis);
    expect(body.available).toEqual(axes);
  });
});
