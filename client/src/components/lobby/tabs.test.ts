import { describe, expect, it } from "vitest";
import { DASHBOARD_TABS, isDashboardTab, LOBBY_TABS, matchRoute, matchTab, tabById } from "./tabs";

describe("Council OS tabs", () => {
  it("keeps Home as a native desktop, not an /os iframe", () => {
    const home = tabById("home");
    expect(home.kind).toBe("local");
    expect(home.path).toBe("");
  });

  it("still frames the live measurement routes", () => {
    expect(tabById("board").path).toBe("/gspc-scoreboard");
    expect(tabById("verify").path).toBe("/gspc-verify");
    expect(tabById("measured").path).toBe("/assess");
  });

  it("frames the signed-in software dashboard", () => {
    expect(tabById("software").path).toBe("/dashboard");
    expect(tabById("software").kind).not.toBe("local");
  });

  it("opens Home for an OS command and Play for a game command", () => {
    expect(matchTab("open the council os")?.id).toBe("home");
    expect(matchTab("open local play")?.id).toBe("play");
  });

  it("opens Software for a dashboard command", () => {
    expect(matchTab("open the dashboard")?.id).toBe("software");
    expect(matchTab("go to dsh")?.id).toBe("software");
  });

  it("treats chat / AG UI as the Council OS home, and frames models and tools", () => {
    expect(matchTab("open chat")?.id).toBe("home");
    expect(matchTab("open the ag ui")?.id).toBe("home");
    expect(tabById("models").path).toBe("/models");
    expect(tabById("tools").path).toBe("/tools");
    expect(matchTab("open the model registry")?.id).toBe("models");
    expect(matchTab("show tools")?.id).toBe("tools");
  });

  it("eats results, library, and workbench as rail tabs", () => {
    expect(tabById("results").path).toBe("/benchmarks");
    expect(tabById("library").path).toBe("/library");
    expect(tabById("workbench").path).toBe("/workbench");
    expect(matchTab("open the benchmarks")?.id).toBe("results");
    expect(matchTab("show results")?.id).toBe("results");
    expect(matchTab("open the library")?.id).toBe("library");
    expect(matchTab("open the workbench")?.id).toBe("workbench");
  });

  it("frames extra live routes from a chat command without a new tab", () => {
    expect(matchRoute("open the instrument")?.path).toBe("/instrument");
    expect(matchRoute("show the system card")?.path).toBe("/system-card");
    expect(matchRoute("open the mcp fleet")?.path).toBe("/mcp-fleet");
    expect(matchRoute("show the regulation feed")?.path).toBe("/feed");
    expect(matchRoute("open the crosswalk")?.path).toBe("/crosswalk");
    expect(matchRoute("what is the weather")).toBeNull();
  });

  it("lists every pane exactly once", () => {
    const ids = LOBBY_TABS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives DSH the same destinations, minus Play, Home, and Software", () => {
    const ids = DASHBOARD_TABS.map((t) => t.id);
    expect(ids).not.toContain("play");
    expect(ids).not.toContain("home");
    expect(ids).not.toContain("software");
    expect(ids).toContain("board");
    expect(ids).toContain("verify");
    expect(ids).toContain("models");
    expect(ids).toContain("tools");
    expect(ids).toContain("results");
    expect(ids).toContain("library");
    expect(ids).toContain("workbench");
    expect(ids).toEqual(LOBBY_TABS.filter(isDashboardTab).map((t) => t.id));
  });
});
