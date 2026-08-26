import { describe, expect, it } from "vitest";
import {
  DASHBOARD_TABS, isDashboardTab, LOBBY_ROUTES, LOBBY_TABS, matchRoute, matchTab, routesIn, tabById,
} from "./tabs";

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

  // ── one destination, one owner ───────────────────────────────────────────
  it("never serves the same path from two destinations", () => {
    const paths = [
      ...LOBBY_TABS.filter((t) => t.path).map((t) => t.path),
      ...LOBBY_ROUTES.map((r) => r.path),
    ];
    const seen = new Map<string, number>();
    for (const p of paths) seen.set(p, (seen.get(p) ?? 0) + 1);
    expect([...seen.entries()].filter(([, n]) => n > 1)).toEqual([]);
  });

  it("keeps /honesty on the rail tab only — the audited duplicate is gone", () => {
    expect(tabById("claimguard").path).toBe("/honesty");
    expect(LOBBY_ROUTES.some((r) => r.path === "/honesty")).toBe(false);
  });

  it("no longer sends an audience tile to the assessment form", () => {
    expect(routesIn("audience").some((r) => r.path === "/assess")).toBe(false);
    expect(routesIn("audience").map((r) => r.path)).toContain("/regulators");
    expect(tabById("measured").path).toBe("/assess");
  });

  // ── the shipped products are real OS destinations ────────────────────────
  it("gives every shipped product a destination inside the OS", () => {
    const owned = new Set([
      ...LOBBY_TABS.filter((t) => t.path).map((t) => t.path),
      ...LOBBY_ROUTES.map((r) => r.path),
    ]);
    // Framed product routes.
    for (const p of ["/products", "/report", "/honesty", "/regulators", "/cra-readiness",
      "/financial-axes", "/distribution-integrity", "/cobolbridge"]) {
      expect(owned.has(p)).toBe(true);
    }
    // …and the two whose product IS a workflow are native panes, not framed pages.
    expect(tabById("evidence").kind).toBe("native");
    expect(tabById("embed").kind).toBe("native");
  });

  it("gives a native workflow pane no standalone path, so a framed page cannot bounce onto it", () => {
    expect(tabById("evidence").path).toBe("");
    expect(tabById("embed").path).toBe("");
    // Board and Verify keep theirs: there the framed route and the pane are the same thing.
    expect(tabById("board").kind).toBe("native");
    expect(tabById("board").path).toBe("/gspc-scoreboard");
  });

  it("opens the two workflow panes from a chat command", () => {
    expect(matchTab("open the evidence pack")?.id).toBe("evidence");
    expect(matchTab("show the embed kit")?.id).toBe("embed");
    expect(matchTab("open products")?.id).toBe("products");
  });

  // ── the most specific destination wins, not the first one listed ─────────
  it("sends 'financial axes' to the financial axes, not to the board's bare 'axes' cue", () => {
    expect(matchTab("show the financial axes")).toBeNull();
    expect(matchRoute("show the financial axes")?.path).toBe("/financial-axes");
    // The bare word still belongs to the board.
    expect(matchTab("show the axes")?.id).toBe("board");
  });

  it("no longer lets a bare 'readiness' swallow the CRA kit", () => {
    expect(matchRoute("open the cra readiness kit")?.path).toBe("/cra-readiness");
    expect(matchTab("open the readiness assessment")?.id).toBe("ras");
    expect(matchTab("open the assessment")?.id).toBe("measured");
  });

  it("frames the remaining product pages from a chat command", () => {
    expect(matchRoute("open distribution integrity")?.path).toBe("/distribution-integrity");
    expect(matchRoute("show the legacy on-ramp")?.path).toBe("/cobolbridge");
    expect(matchRoute("open the regulators page")?.path).toBe("/regulators");
    expect(matchRoute("show insurers")?.path).toBe("/insurers");
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
