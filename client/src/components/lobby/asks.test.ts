import { describe, expect, it } from "vitest";
import { ASK_COUNT, AUDIENCES, allAsks, asksFor } from "./asks";
import { isExplicitNavigationCommand, matchRoute, matchTab } from "./tabs";
import { routeIntent } from "../../../../functions/_lib/talkRouter";

describe("lobby asks — every demographic we cover", () => {
  it("keeps the homepage buyers in the chip row", () => {
    const ids = AUDIENCES.map((a) => a.id);
    for (const need of ["public", "builder", "insurer", "regulator", "press"]) {
      expect(ids).toContain(need);
    }
  });

  it("returns four suggestions for every audience on Home", () => {
    for (const a of AUDIENCES) {
      const asks = asksFor("/", a.id);
      expect(asks.length).toBe(4);
      expect(new Set(asks).size).toBe(asks.length);
    }
  });

  it("leads with the board questions on the living board", () => {
    const asks = asksFor("/gspc-scoreboard", "press");
    expect(asks[0]).toMatch(/board/i);
  });

  it("cuts compare and Layer 0 to published-material questions", () => {
    expect(asksFor("/compare", "procurement")[0]).toMatch(/measurement|certif/i);
    expect(asksFor("/layer0", "builder")[0]).toMatch(/sign|verif|legal/i);
    expect(asksFor("/for/regulator", "regulator")[0]).toMatch(/measured|measur/i);
  });

  it("computes ASK_COUNT from the registry, never a typed integer", () => {
    expect(ASK_COUNT).toBeGreaterThan(40);
  });

  // Tools audit, 6 Oct 2026: all four compliance suggestions (and most others) answered "I could not
  // match that question to a tool". A suggestion the router cannot answer is not offered.
  it("every suggestion is one the router answers with a tool", () => {
    const asks = allAsks();
    expect(asks.length).toBeGreaterThan(20);
    for (const q of asks) {
      const plan = routeIntent(q);
      expect(plan.kind, q).toBe("tools");
    }
  });

  it("every suggestion every audience sees, on every route, plans tools", () => {
    const paths = ["/", "/dashboard", "/gspc-scoreboard", "/compare", "/layer0", "/for/regulator", "/crosswalk", "/tools", "/insurers", "/regulators"];
    for (const path of paths)
      for (const a of AUDIENCES)
        for (const q of asksFor(path, a.id)) expect(routeIntent(q).kind, `${path} · ${a.id} · ${q}`).toBe("tools");
  });

  it("no suggestion is a pane command, so the composer asks it instead of opening a pane", () => {
    for (const q of allAsks()) {
      const navigates = isExplicitNavigationCommand(q) && Boolean(matchTab(q) || matchRoute(q));
      expect(navigates, q).toBe(false);
    }
  });

  it("the compliance chips ask for signed evidence per obligation", () => {
    const asks = asksFor("/", "compliance");
    const tools = asks.map((q) => {
      const plan = routeIntent(q);
      return plan.kind === "tools" ? plan.calls[0].tool : plan.kind;
    });
    expect(tools.filter((t) => t === "evidence_bundle_preview").length).toBeGreaterThanOrEqual(2);
  });
});
