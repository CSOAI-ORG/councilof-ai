import { describe, expect, it } from "vitest";
import manifest from "../../public/measurement/subject-axes/2026-10-24/manifest.json";
import { AXES_D } from "./_gspc_axes_d";

const OBSERVED: Record<string, number> = {
  "lab-practice": 37,
  "measurer-integrity": 40,
  "regulator-transparency": 36,
  "claim-maintenance": 67,
};
const RUNS = new Map(manifest.axes.map((run) => [run.axis, run]));

describe("subject-axis observation rows", () => {
  it("publishes four measured deterministic-fact runs and retains six declared slots", () => {
    expect(AXES_D).toHaveLength(10);
    const measured = AXES_D.filter((axis) => axis.status === "MEASURED");
    const slots = AXES_D.filter((axis) => axis.status === "UNMEASURED");
    expect(measured.map((axis) => axis.axis).sort()).toEqual(Object.keys(OBSERVED).sort());
    expect(slots).toHaveLength(6);
    expect(slots.every((axis) => axis.kind === "declared-slot" && axis.n === 0)).toBe(true);
  });

  it("pins each measured run without inventing a score, leader or separation", () => {
    for (const axis of AXES_D.filter((row) => row.status === "MEASURED")) {
      const run = RUNS.get(axis.axis);
      expect(run).toBeDefined();
      expect(axis.n).toBe(OBSERVED[axis.axis]);
      expect(axis.kind).toBe("deterministic-facts");
      expect(axis.family).toBe("subject");
      expect(axis.method_status).toBe("meets-rule");
      expect(axis.method_sha).toBe(run?.reader_sha256);
      expect(axis.evidence_url).toBe(`/measurement/subject-axes/2026-10-24/${run?.artifact}`);
      expect(axis.facts_as_of).toBe(run?.observed_at);
      expect(axis.run_attestation).toBe("CONTENT_ADDRESSED_UNSIGNED");
      expect(axis.accuracy).toBeUndefined();
      expect(axis.leader).toBeUndefined();
      expect(axis.separation).toBeUndefined();
    }
  });
});
