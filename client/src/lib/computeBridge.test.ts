import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { attachThatWriteMeasured } from "./twoSpeed";
import {
  aguiLane,
  CENSUS_MACHINE,
  COMPUTE_ENDPOINT,
  formatComputeReply,
  GROKBOT_FNS,
  MEASUREMENT_MACHINE,
  measuredWritesFromBridge,
  OWNER_GATE,
  OS_VIEW,
  TWO_MACHINE_RULING,
} from "./computeBridge";

const root = resolve(__dirname, "../../..");
const census = JSON.parse(
  readFileSync(resolve(root, "public/signed/hub-census-baseline.json"), "utf8"),
);
const computeSrc = readFileSync(resolve(root, "functions/api/compute.ts"), "utf8");
const stateSrc = readFileSync(resolve(root, "functions/api/state.ts"), "utf8");

describe("compute bridge — two machines, one view", () => {
  it("keeps census, measurement and OS apart, and only GSPC writes MEASURED", () => {
    expect(TWO_MACHINE_RULING).toMatch(/view, not a second scoreboard/);
    expect(CENSUS_MACHINE.never).toMatch(/MEASURED/);
    expect(MEASUREMENT_MACHINE.never).toMatch(/lobby/);
    expect(OS_VIEW.never).toMatch(/\/api\/state/);
    expect(OWNER_GATE).toMatch(/AGUI_WIRE_URL/);
    expect(COMPUTE_ENDPOINT).toBe("/api/compute");
    expect(GROKBOT_FNS).toContain("COMPUTE");
    expect(GROKBOT_FNS).toContain("CENSUS");
    expect(measuredWritesFromBridge()).toEqual(["gspc-cell"]);
    expect(attachThatWriteMeasured()).toHaveLength(1);
  });

  it("quotes a finished walk as DISCOVERED and zero graded", () => {
    expect(census.n_unique_ids).toBe(3_032_028);
    expect(census.n_measured).toBe(0);
    expect(census.listing_state_all).toBe("DISCOVERED");
    expect(census.status_all).toBe("UNMEASURED");
    expect(census.complete).toBe(true);
    expect(census.complete_reason).toBe("hub-exhausted");
    expect(census.weights_downloaded).toBe(0);
    expect(census.note).not.toMatch(/Speed 0|Card v2|living board/i);
    expect(stateSrc).toContain("hub_census");
    expect(stateSrc).toContain("listings_observed");
    expect(computeSrc).toContain("csoai.compute-bridge/1");
    expect(computeSrc).toContain("inventory_kind");
    expect(computeSrc).not.toMatch(/new Date\(/);
  });

  it("formats COMPUTE without inventing a pod or a grade", () => {
    expect(aguiLane({ status: "unconfigured" })).toBe("unconfigured");
    expect(aguiLane({ configured: true, status: "live" })).toBe("live");
    const text = formatComputeReply({
      census: {
        n_unique_ids: 3_032_028,
        n_measured: 0,
        as_of: "2026-08-31T03:58:08Z",
      },
      agui: { status: "unconfigured" },
      runpod: { inventory_kind: "unmeasured" },
    });
    expect(text).toMatch(/3,032,028 listings observed, 0 graded/);
    expect(text).toMatch(/AG-UI wire: unconfigured/);
    expect(text).toMatch(/RunPod inventory: unmeasured/);
    expect(text).toMatch(/DISCOVERED/);
    expect(text).not.toMatch(/£79|£499|rank for sale|213\.173\.105\.83|we scored/i);
    expect(formatComputeReply(null)).toMatch(/never writes MEASURED/);
  });
});
