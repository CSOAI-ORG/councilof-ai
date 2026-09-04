import { describe, expect, it } from "vitest";
import { ANCHORS, effectiveAnchorStatus, hoursSinceLastPass } from "./anchors";

describe("anchor freshness is derived from the current clock", () => {
  const anchor = ANCHORS[0];

  it("does not reuse the watcher verdict after its timestamp ages", () => {
    expect(anchor.recorded_status).toBe("live");
    expect(effectiveAnchorStatus(anchor, new Date("2026-09-04T03:45:01Z"))).toBe("degraded");
    expect(effectiveAnchorStatus(anchor, new Date("2026-09-06T03:45:01Z"))).toBe("unreachable");
  });

  it("keeps the thresholds explicit", () => {
    expect(hoursSinceLastPass(anchor.last_passed, new Date("2026-09-04T02:45:00Z"))).toBe(24);
    expect(effectiveAnchorStatus(anchor, new Date("2026-09-04T02:45:00Z"))).toBe("live");
    expect(effectiveAnchorStatus(anchor, new Date("2026-09-06T02:45:00Z"))).toBe("degraded");
  });
});
