import { describe, expect, it } from "vitest";
import { DASHBOARD_TABS, LOBBY_TABS, matchTab, tabById } from "./tabs";

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

  it("lists every pane exactly once", () => {
    const ids = LOBBY_TABS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives DSH the same destinations, minus Play, Home, and Software", () => {
    const ids = DASHBOARD_TABS.map((t) => t.id);
    expect(ids).not.toContain("play");
    expect(ids).not.toContain("home");
    expect(ids).not.toContain("software");
    expect(ids).toEqual(
      LOBBY_TABS.filter((t) => t.kind === "route" && t.id !== "play" && t.id !== "software").map((t) => t.id),
    );
  });
});
