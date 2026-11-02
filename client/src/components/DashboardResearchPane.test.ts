import { describe, expect, it } from "vitest";
import { researchPlanUrl, watchdogSourcesUrl } from "./DashboardResearchPane";

describe("Continuous research pane", () => {
  it("uses the same-origin API in production and the deployed read-only API for local development", () => {
    expect(researchPlanUrl("councilof.ai")).toBe("/api/research-plan");
    expect(researchPlanUrl("localhost")).toBe("https://councilof.ai/api/research-plan");
    expect(researchPlanUrl("127.0.0.1")).toBe("https://councilof.ai/api/research-plan");
    expect(watchdogSourcesUrl("councilof.ai")).toBe("/api/watchdog-sources");
    expect(watchdogSourcesUrl("localhost")).toBe("https://councilof.ai/api/watchdog-sources");
    expect(watchdogSourcesUrl("127.0.0.1")).toBe("https://councilof.ai/api/watchdog-sources");
  });
});
