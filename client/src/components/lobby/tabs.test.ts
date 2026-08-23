import { describe, expect, it } from "vitest";
import { DASHBOARD_TABS, LOBBY_TABS, matchTab, tabById } from "./tabs";

describe("Council OS tabs", () => {
  it("keeps Home as a native desktop", () => {
    const home = tabById("home");
    expect(home.kind).toBe("local");
    expect(home.path).toBe("");
  });

  it("exposes measurement workspace tabs and surface paths", () => {
    expect(tabById("board").kind).toBe("local");
    expect(tabById("models").kind).toBe("local");
    expect(tabById("routes").kind).toBe("local");
    expect(tabById("measured").path).toBe("/assess");
    expect(tabById("verify").path).toBe("/gspc-verify");
  });

  it("opens Home for an OS command and Play for a game command", () => {
    expect(matchTab("open the council os")?.id).toBe("home");
    expect(matchTab("open local play")?.id).toBe("play");
    expect(matchTab("show me the models")?.id).toBe("models");
  });

  it("lists every pane exactly once", () => {
    const ids = LOBBY_TABS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives DSH the same destinations minus Home and Software", () => {
    const ids = DASHBOARD_TABS.map((t) => t.id);
    expect(ids).not.toContain("home");
    expect(ids).not.toContain("software");
    expect(ids.length).toBeGreaterThan(5);
  });
});
