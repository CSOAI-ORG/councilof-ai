import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { isLibraried, libraryItems, WITHDRAWN_PATHS } from "./library-ia";
import { ROUTE_MANIFEST } from "./route-manifest";
import { buildDashboardCatalogue } from "../components/DashboardCataloguePane";

const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const homeBoard = readFileSync(resolve(__dirname, "../components/home/HomeGspcBoard.tsx"), "utf8");

describe("live GSPC axis routes", () => {
  it("does not mark the board's promoted axis detail pages as archived", () => {
    expect(app).toContain('<Route path="/gspc/:axis" component={GspcScoreboard} />');
    expect(homeBoard).toContain('href={`/gspc/${encodeURIComponent(a.axis)}/`}');
    expect(isLibraried("/gspc/governance/")).toBe(false);
    expect(isLibraried("/gspc/safety/")).toBe(false);
    expect(isLibraried("/gspc/jail")).toBe(false);
    expect(isLibraried("/pdca")).toBe(true);
  });
});

describe("current legal terms", () => {
  it("does not mark any operative Terms alias as an archived reference", () => {
    expect(app).toContain('<Route path="/terms-of-service" component={TermsOfService} />');
    expect(app).toContain('<Route path="/terms" component={TermsOfService} />');
    expect(app).toContain('<Route path="/legal/terms" component={TermsOfService} />');
    for (const path of ["/terms-of-service/", "/terms/", "/legal/terms/"]) {
      expect(isLibraried(path)).toBe(false);
    }
  });
});

/**
 * Tools audit, 6 Oct 2026: A–Z entries opened another page, the app itself, or a duplicate.
 * A Pages Function that answers `location: "/os?lobby=home"` sends its path to the start page, so
 * a catalogue or Library card for it framed the workspace inside itself. The redirect set is read
 * from functions/ on every run, so a new redirect cannot be listed again quietly.
 */
function redirectsToStartPage(): string[] {
  const root = resolve(__dirname, "../../../functions");
  const out = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
        if (!readFileSync(full, "utf8").includes('location: "/os?lobby=home"')) continue;
        const route = "/" + relative(root, full).replace(/\\/g, "/").replace(/\.ts$/, "").replace(/(^|\/)index$/, "");
        out.add(route.replace(/\/$/, "") || "/");
      }
    }
  };
  walk(root);
  return [...out].sort();
}

describe("withdrawn catalogue entries (tools audit, 6 Oct 2026)", () => {
  const redirected = redirectsToStartPage();
  const catalogue = buildDashboardCatalogue();
  const cataloguePaths = new Set(catalogue.map((entry) => entry.path).filter(Boolean));
  const libraryPaths = new Set(libraryItems().map((item) => item.path));

  it("reads a real redirect set from functions/", () => {
    // Guard against a vacuous pass: the scan must find the known redirects.
    expect(redirected).toContain("/watchdog-hub");
    expect(redirected).toContain("/jobs");
    expect(redirected.length).toBeGreaterThan(10);
  });

  it("lists no path that a Function sends to the start page", () => {
    expect(redirected.filter((path) => cataloguePaths.has(path))).toEqual([]);
    expect(redirected.filter((path) => libraryPaths.has(path))).toEqual([]);
  });

  it("lists no alias path that renders the same page as a redirected one", () => {
    // /heatmap renders WatchdogMap and /watchdog/report renders PublicWatchdogHub: the same pages
    // as /watchdog-map and /watchdog-hub, which the edge sends to the start page.
    const comps = new Set(
      ROUTE_MANIFEST.filter((route) => redirected.includes(route.path)).map((route) => route.comp),
    );
    expect(comps.size).toBeGreaterThan(5);
    const aliases = ROUTE_MANIFEST.filter(
      (route) => comps.has(route.comp) && !redirected.includes(route.path),
    ).map((route) => route.path);
    expect(aliases.filter((path) => cataloguePaths.has(path) || libraryPaths.has(path))).toEqual([]);
  });

  it("lists none of the withdrawn paths", () => {
    for (const path of WITHDRAWN_PATHS) {
      expect(cataloguePaths.has(path), path).toBe(false);
      expect(libraryPaths.has(path), path).toBe(false);
    }
    expect([...libraryPaths].filter((path) => path.startsWith("/battlecards"))).toEqual([]);
  });

  it("does not list a duplicate of a page it already lists", () => {
    for (const path of ["/help-center", "/usp", "/tracks", "/connect-gspc"])
      expect(cataloguePaths.has(path), path).toBe(false);
  });

  it("holds back the Regions library and the /compliance pages until they are corrected", () => {
    expect(catalogue.some((entry) => entry.group === "Library · Regions & Jurisdictions")).toBe(false);
    expect(
      [...cataloguePaths].filter(
        (path) => path === "/global-ai-safety-initiative" || path!.startsWith("/compliance/"),
      ),
    ).toEqual([]);
  });

  it("shows one pane under one name: alias ids are not catalogued twice", () => {
    const ids = catalogue.map((entry) => entry.id);
    expect(ids).not.toContain("tab:results");
    expect(ids).not.toContain("tab:watchdog");
    expect(ids).toContain("tab:board");
    expect(ids).toContain("tab:corrections");
  });

  it("files developer panes under one For developers group", () => {
    for (const id of ["tab:state", "tab:archive", "tab:harness", "tab:products", "tab:workbench", "tab:embed"])
      expect(catalogue.find((entry) => entry.id === id)?.group, id).toBe("For developers");
    expect(catalogue.find((entry) => entry.path === "/government")?.group).toBe("Previews: not live yet");
    expect(catalogue.find((entry) => entry.path === "/mcps")?.group).toBe("For developers and analysts");
  });
});
