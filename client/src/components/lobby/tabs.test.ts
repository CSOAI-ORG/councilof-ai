import { describe, expect, it } from "vitest";
import { LOBBY_TABS, matchTab, tabById } from "./tabs";

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

  it("opens Home for an OS command and Play for a game command", () => {
    expect(matchTab("open the council os")?.id).toBe("home");
    expect(matchTab("open local play")?.id).toBe("play");
  });

  it("lists every pane exactly once", () => {
    const ids = LOBBY_TABS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
