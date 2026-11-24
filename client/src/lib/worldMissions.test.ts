import { describe, expect, it } from "vitest";
import { MISSIONS, missionForId, missionHref, suggestMission } from "./worldMissions";

describe("Council World mission routing", () => {
  it("covers every unique mission with an internal fixed Council OS route", () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    for (const m of MISSIONS) {
      expect(missionHref(m)).toMatch(/^\/dashboard\?tab=/);
      expect(m.boundary.length).toBeGreaterThan(30);
      expect(m.promise.length).toBeGreaterThan(20);
    }
  });

  it("sends RAS, incidents and human approvals to honest intake/review instead of a run", () => {
    expect(suggestMission("I want a RAS measurement request")?.id).toBe("ras");
    expect(suggestMission("report an AI incident")?.id).toBe("watchdog-intake");
    expect(suggestMission("human in the loop approval for the WG charter")?.id).toBe("human");
    expect(suggestMission("approve the bot and run a simulation")?.id).toBe("human");
    expect(suggestMission("x402 settlement")?.id).toBe("x402");
    expect(suggestMission("open A2UI widget and AG-UI")?.id).toBe("connect");
    expect(suggestMission("my academy exams")?.id).toBe("academy");
    expect(suggestMission("I want to see the ontology graph")?.id).toBe("ontology");
    expect(suggestMission("simulate the same scenario")?.id).toBe("simulation");
  });

  it("does not invent an action for unknown text or arbitrary URLs", () => {
    expect(suggestMission("")).toBeNull();
    expect(suggestMission("javascript:alert(1)")).toBeNull();
    expect(suggestMission("SAS")).toBeNull();
    expect(missionForId("javascript:alert(1)")).toBeNull();
    expect(() => missionHref({ ...MISSIONS[0], route: "https://evil.example" })).toThrow();
    expect(() => missionHref({ ...MISSIONS[0], route: "/dashboard?tab=staff&approve=1" })).toThrow();
  });
});
