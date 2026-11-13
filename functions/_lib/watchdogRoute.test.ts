import { describe, it, expect } from "vitest";
import { evidenceLinkResult, fromVerdict, retrievalState, ROUTES } from "./watchdogRoute";
describe("watchdogRoute", () => {
  it("tombstoned Zenodo 410 is UNCHECKABLE, never FAILED or VERIFIED", () => {
    const r = evidenceLinkResult("https://zenodo.org/records/22307626", 410, false, "2026-10-14T03:12:02Z");
    expect(r.conclusion.state).toBe("UNCHECKABLE");
    expect(r.signature_valid.state).toBe("UNMEASURED");
    expect(r.root_inclusion.state).toBe("UNMEASURED");
  });
  it("timeout UNCHECKABLE, absent UNMEASURED", () => {
    expect(retrievalState(null, true)).toBe("UNCHECKABLE");
    expect(retrievalState(null)).toBe("UNMEASURED");
    expect(retrievalState(503)).toBe("UNCHECKABLE");
  });
  it("maps verdicts without collapsing UNCHECKABLE into FAILED", () => {
    expect(fromVerdict("VALID")).toBe("VERIFIED");
    expect(fromVerdict("INVALID")).toBe("FAILED");
    expect(fromVerdict("UNCHECKABLE")).toBe("UNCHECKABLE");
    expect(fromVerdict(null)).toBe("UNMEASURED");
  });
  it("every artifact type has an existing verifier", () => {
    for (const v of Object.values(ROUTES)) expect(v.source.length).toBeGreaterThan(0);
  });
});
