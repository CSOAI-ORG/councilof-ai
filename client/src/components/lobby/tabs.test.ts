import { describe, expect, it } from "vitest";
import {
  DASHBOARD_TABS, DEFAULT_TAB, isDashboardTab, isDocumentFrame, isOsRailTab, isSiteDoor, LOBBY_ROUTES, LOBBY_TABS, matchRoute, matchTab, OS_RAIL_TABS, paneLoadFor, routesIn, tabById,
} from "./tabs";
import { PRIMARY_PATHS } from "../../data/library-ia";

describe("Council OS tabs", () => {
  it("keeps Home as a native desktop, not an /os iframe", () => {
    const home = tabById("home");
    expect(home.kind).toBe("local");
    expect(home.path).toBe("");
  });

  it("never iframes /, /os, or /dashboard", () => {
    expect(isSiteDoor("/")).toBe(true);
    expect(isSiteDoor("/os")).toBe(true);
    expect(isSiteDoor("/os?lobby=home")).toBe(true);
    expect(isSiteDoor("/dashboard")).toBe(true);
    expect(isSiteDoor("/products")).toBe(true);
    expect(isSiteDoor("/honesty?x=1")).toBe(true);
    expect(isSiteDoor("/pricing")).toBe(true);
    expect(isSiteDoor("/gspc-scoreboard")).toBe(false);
    expect(isSiteDoor("/gspc-verify")).toBe(false);
    expect(isSiteDoor("/library")).toBe(false);
  });

  it("keeps the OS rail to instruments plus Home and Play", () => {
    expect(OS_RAIL_TABS.map((t) => t.id)).toEqual([
      "home", "board", "verify", "cards", "evidence", "embed", "play",
    ]);
    expect(isOsRailTab("software")).toBe(false);
    expect(isOsRailTab("products")).toBe(false);
    expect(tabById("software").path).toBe("/dashboard");
    expect(isSiteDoor("/dashboard")).toBe(true);
    expect(isDocumentFrame("/methodology")).toBe(true);
    expect(isDocumentFrame("/products")).toBe(false);
  });

  it("keeps board and verify native even though they still name a page", () => {
    expect(tabById("board").kind).toBe("native");
    expect(tabById("verify").kind).toBe("native");
    expect(tabById("measured").path).toBe("/assess");
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
    expect(matchTab("open the crosswalk")?.id).toBe("matrix");
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
    // measured + ras both name /assess (Get-measured vs Readiness). Not on the OS rail.
    expect([...seen.entries()].filter(([, n]) => n > 1)).toEqual([["/assess", 2]]);
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
  it("sends 'financial axis' to the financial axis, not to the board's bare 'axis' cue", () => {
    expect(matchTab("show the financial axis")).toBeNull();
    expect(matchRoute("show the financial axis")?.path).toBe("/financial-axes");
    // The bare word still belongs to the board.
    expect(matchTab("show the axis")?.id).toBe("board");
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

describe("every OS destination is a CURRENT page — the archived-banner trap", () => {
  /**
   * ArchivedBanner mounts globally and renders on any path not in PRIMARY_PATHS,
   * telling the reader (and every answer engine) that the page is a dated
   * reference superseded by something else. A Council OS rail tab or Home tile
   * pointing at such a path therefore promotes a destination that denies its own
   * currency the moment it loads.
   *
   * A sweep on 2026-08-26 found NINE live OS destinations in exactly that state:
   * /readiness-assessment /layer0 /network /hive /intel /benchmark-quality
   * /mcp-fleet /mcps /feed. This test is the guard, so the tenth cannot be added
   * quietly: adding a tab without registering its path fails right here.
   */
  const NOT_LIBRARIED_PREFIX =
    /^\/(404|login|signup|register|admin|dashboard|api-keys|bulk-import|settings|me\b|my-|ab-testing|widget|egg|hatch|enter|onboard|welcome|start|analytics|outreach|marketing|reports?|brief|public|all|region-settings|regional-analytics|government-dashboard|government-portal|old-home|landing|legacy|home-v[0-9]|stripe|prosperity|maternal-covenant|covenant|sov3|sov-town|sovereign|gods-eye|horus|dragonfly|four-wings|opengridworks|certification|certificate|ceasai|get-certified|pricing|plans|payg|billing|roi)/;

  const wouldShowBanner = (p: string) => !PRIMARY_PATHS.has(p) && !NOT_LIBRARIED_PREFIX.test(p);

  it("no rail tab opens a page flagged archived", () => {
    const bad = LOBBY_TABS.map((t) => t.path).filter(Boolean).filter(wouldShowBanner);
    expect(bad).toEqual([]);
  });

  it("no Home-desktop route opens a page flagged archived", () => {
    const bad = LOBBY_ROUTES.map((r) => r.path).filter(wouldShowBanner);
    expect(bad).toEqual([]);
  });

  it("a native pane has no URL, so it cannot be flagged at all", () => {
    for (const t of LOBBY_TABS.filter((x) => x.kind === "native" || x.kind === "local")) {
      if (t.id === "board" || t.id === "verify") continue; // these frame a real page too
      expect(t.path).toBe("");
    }
  });
});

describe("the two panes added by the OS-tools sweep", () => {
  it("registers Signed cards and Estate state as native panes with no standalone URL", () => {
    for (const id of ["cards", "state"] as const) {
      const t = LOBBY_TABS.find((x) => x.id === id)!;
      expect(t).toBeDefined();
      expect(t.kind).toBe("native");
      expect(t.path).toBe("");
    }
  });

  it("routes their names to them from the chat bar", () => {
    expect(matchTab("show the signed cards")?.id).toBe("cards");
    expect(matchTab("open the card index")?.id).toBe("cards");
    expect(matchTab("show the estate state")?.id).toBe("state");
  });

  it("keeps them out of the DSH sidebar, which lists only destinations with a URL", () => {
    const ids = DASHBOARD_TABS.map((t) => t.id);
    expect(ids).not.toContain("cards");
    expect(ids).not.toContain("state");
  });

  it("gives the newly-opened pages a real route to open", () => {
    expect(matchRoute("show rating the raters")?.path).toBe("/rating-the-raters");
    expect(matchRoute("open the first-fine watch")?.path).toBe("/first-fine-watch");
  });
});

describe("TUI 2 — OS instrument chrome", () => {
  it("defaults the workspace to the native board, not the sitemap", () => {
    expect(DEFAULT_TAB).toBe("board");
    expect(tabById(DEFAULT_TAB).kind).toBe("native");
  });

  it("desktop/rail is board, verify, cards, evidence, embed, plus Play", () => {
    expect(OS_RAIL_TABS.filter((t) => t.id !== "home").map((t) => t.id)).toEqual([
      "board", "verify", "cards", "evidence", "embed", "play",
    ]);
  });

  it("board, verify, cards, evidence, embed are native — Play is local", () => {
    for (const id of ["board", "verify", "cards", "evidence", "embed"] as const) {
      expect(tabById(id).kind).toBe("native");
    }
    expect(tabById("play").kind).toBe("local");
  });

  it("software is a full navigation to /dashboard, never a framed pane", () => {
    const software = tabById("software");
    expect(isOsRailTab("software")).toBe(false);
    expect(software.path).toBe("/dashboard");
    expect(software.kind).not.toBe("native");
    expect(paneLoadFor(software.path)).toEqual({ action: "navigate", path: "/dashboard" });
  });

  it("refuses /, /os, /dashboard, and OS chrome aliases as iframe destinations", () => {
    for (const path of [
      "/", "/os", "/os?lobby=board", "/dashboard",
      "/ag-ui", "/chat", "/console", "/sov-os", "/council-os", "/demo", "/os-demo",
    ]) {
      expect(paneLoadFor(path).action).toBe("navigate");
      expect(paneLoadFor(path)).toEqual({ action: "navigate", path });
    }
  });

  it("only document allowlist paths still iframe", () => {
    expect(paneLoadFor("/library")).toEqual({ action: "iframe", path: "/library" });
    expect(paneLoadFor("/methodology")).toEqual({ action: "iframe", path: "/methodology" });
    expect(paneLoadFor("/cra-readiness")).toEqual({ action: "iframe", path: "/cra-readiness" });
    expect(paneLoadFor("/products")).toEqual({ action: "navigate", path: "/products" });
    expect(paneLoadFor("/gspc-scoreboard")).toEqual({ action: "navigate", path: "/gspc-scoreboard" });
  });
});
