import { describe, expect, it } from "vitest";
import { DASHBOARD_NAV_GROUPS } from "@/components/lobby/tabs";
import { MENU_GROUPS, SUPPORT_LINKS } from "./workspaceMenu";

describe("the grouped global menu", () => {
  it("places every section exactly once and adds none", () => {
    const placed = MENU_GROUPS.flatMap((g) => g.sections);
    expect([...placed].sort()).toEqual(DASHBOARD_NAV_GROUPS.map((g) => g.id).sort());
    expect(new Set(placed).size).toBe(placed.length);
  });
  it("leads with the owner's task-named sections, in order", () => {
    const byId = new Map(DASHBOARD_NAV_GROUPS.map((g) => [g.id, g.label]));
    expect(MENU_GROUPS[0].heading).toBeNull();
    expect(MENU_GROUPS[0].sections.map((id) => byId.get(id))).toEqual([
      "Get results", "My results", "Check a result", "Leaderboard", "Connect", "Learn",
    ]);
  });
  it("links support and resources to same-site pages and machine files only", () => {
    for (const l of SUPPORT_LINKS) expect(l.href.startsWith("/")).toBe(true);
    expect(JSON.stringify(SUPPORT_LINKS)).not.toMatch(/\b(certified|best|leader)\b|\$\s?\d/);
  });
});
