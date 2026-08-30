import { describe, it, expect } from "vitest";
import { LOBBY_TABS, matchTab, tabById, DASHBOARD_TABS } from "./tabs";

describe("harness tab", () => {
  it("is registered with the right path", () => {
    const t = tabById("harness" as any);
    expect(t).toBeTruthy();
    expect(t!.path).toBe("/harness");
    expect(t!.label).toBe("The harness");
  });
  it("resolves from a chat cue", () => {
    expect(matchTab("open the harness")?.id).toBe("harness");
    expect(matchTab("show me the measurement harness")?.id).toBe("harness");
  });
  it("does not steal another tab's cue", () => {
    expect(matchTab("open the board")?.id).toBe("board");
    expect(matchTab("show the products")?.id).toBe("products");
    expect(matchTab("verify a card")?.id).not.toBe("harness");
  });
  it("appears in the dashboard sidebar (it has a real path)", () => {
    expect(DASHBOARD_TABS.some((t) => t.id === "harness")).toBe(true);
  });
  it("has no duplicate path across tabs except the two /assess doors", () => {
    const paths = LOBBY_TABS.map((t) => t.path).filter(Boolean);
    const counts = new Map<string, number>();
    for (const p of paths) counts.set(p, (counts.get(p) ?? 0) + 1);
    expect([...counts.entries()].filter(([, n]) => n > 1)).toEqual([["/assess", 2]]);
  });
});
