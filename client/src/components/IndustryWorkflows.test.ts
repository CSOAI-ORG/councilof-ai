import { describe, expect, it } from "vitest";
import { INDUSTRY_WORKFLOWS } from "./IndustryWorkflows";
import { LOBBY_TABS } from "./lobby/tabs";
import { normalizeDashboardView } from "@/lib/dashboardView";

describe("guided industry workflows", () => {
  it("covers the seven requested audiences without creating duplicate tools", () => {
    expect(INDUSTRY_WORKFLOWS.map((item) => item.id)).toEqual([
      "enterprise",
      "builders",
      "insurers",
      "regulators",
      "assets",
      "legacy",
      "public",
    ]);
    expect(new Set(INDUSTRY_WORKFLOWS.map((item) => item.id)).size).toBe(7);
  });
  it("every step resolves to a canonical pane or safe supporting view", () => {
    const tabs = new Set(LOBBY_TABS.map((tab) => tab.id));
    for (const workflow of INDUSTRY_WORKFLOWS) {
      expect(workflow.steps).toHaveLength(3);
      expect(workflow.limitation.length).toBeGreaterThan(60);
      expect(workflow.prompt.length).toBeGreaterThan(60);
      for (const step of workflow.steps) {
        const url = new URL(step.href, "https://councilof.ai");
        expect(url.origin).toBe("https://councilof.ai");
        expect(url.pathname).toBe("/dashboard");
        expect(
          tabs.has(
            url.searchParams.get("tab") as (typeof LOBBY_TABS)[number]["id"],
          ),
        ).toBe(true);
        if (url.searchParams.has("view"))
          expect(normalizeDashboardView(url.searchParams.get("view"))).toBe(
            url.searchParams.get("view"),
          );
        expect(step.kind).toBeTruthy();
      }
    }
  });
  it("names missing capabilities before users start", () => {
    expect(
      INDUSTRY_WORKFLOWS.find((item) => item.id === "legacy")?.limitation,
    ).toContain("no live mainframe connection");
    expect(
      INDUSTRY_WORKFLOWS.find((item) => item.id === "insurers")?.limitation,
    ).toContain("not an underwriting decision");
    expect(
      INDUSTRY_WORKFLOWS.find((item) => item.id === "public")?.limitation,
    ).toContain("read-only");
  });
});
