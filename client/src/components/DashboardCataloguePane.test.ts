import { describe, expect, it } from "vitest";
import {
  buildDashboardCatalogue,
  DEFAULT_CATALOGUE_KIND,
  filterCatalogue,
  KIND_FILTERS,
} from "./DashboardCataloguePane";
import { LOBBY_ROUTES, LOBBY_TABS, normalizeLobbyTabId } from "@/components/lobby/tabs";

describe("Council master catalogue", () => {
  const entries = buildDashboardCatalogue();

  it("gives every curated workflow and public surface one workspace destination", () => {
    // An alias id (results -> board, watchdog -> corrections) opens another tab's pane, so it is
    // catalogued once, under the tab that owns the pane (tools audit, 6 Oct 2026).
    for (const tab of LOBBY_TABS.filter(
      (item) =>
        !["home", "software", "explore"].includes(item.id) &&
        normalizeLobbyTabId(item.id) === item.id,
    )) {
      expect(
        entries.some((entry) => entry.id === `tab:${tab.id}`),
        tab.id,
      ).toBe(true);
    }
    for (const route of LOBBY_ROUTES) {
      expect(
        entries.some((entry) => entry.path === route.path || entry.href === route.path),
        route.path,
      ).toBe(true);
    }
  });

  it("deduplicates destinations and never frames another Council application shell", () => {
    const paths = entries.flatMap((entry) => entry.path ? [entry.path] : []);
    const hrefs = entries.map((entry) => entry.href);
    const framedPaths = hrefs.map((href) => {
      const query = href.split("?")[1] || "";
      return new URLSearchParams(query).get("view");
    });
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(framedPaths).not.toContain("/dashboard");
    expect(framedPaths).not.toContain("/os");
  });

  it("keeps supporting routes in the centre pane", () => {
    const crosswalk = entries.find((entry) => entry.path === "/crosswalk");
    expect(crosswalk?.href).toContain("/dashboard?tab=explore&view=%2Fcrosswalk");
  });

  it("opens every supporting destination through the canonical dashboard", () => {
    for (const entry of entries) {
      expect(entry.href, entry.id).toMatch(/^\/dashboard\?/);
    }
  });

  // 6 Oct 2026: the default filter was "Workflows", so Everything A-Z answered "No Council
  // destination matches" for current pages such as /methodology.
  it("finds current pages under the default filter", () => {
    expect(DEFAULT_CATALOGUE_KIND).toBe("all");
    for (const [q, path] of [
      ["methodology", "/methodology"],
      // /enterprise itself is no longer catalogued: it 308s to the request pane, and "enterprise"
      // in chat opens that pane natively (#2823). The default filter still finds its library page.
      ["enterprise", "/how-it-works/enterprise"],
      ["crosswalk", "/crosswalk"],
    ] as const) {
      const hits = filterCatalogue(entries, DEFAULT_CATALOGUE_KIND, q);
      expect(hits.some((entry) => entry.path === path), `${q} -> ${path}`).toBe(true);
    }
    // /tc260 is in the Regions & Jurisdictions sector, held back until its content is corrected
    // (#2823, tools audit): its URL keeps working, but the in-app listing does not offer it.
    expect(filterCatalogue(entries, DEFAULT_CATALOGUE_KIND, "tc260").some((entry) => entry.path === "/tc260")).toBe(false);
  });

  it("a chosen chip still narrows, and the wider search is what the empty state offers", () => {
    const narrowed = filterCatalogue(entries, "workflow", "methodology");
    expect(narrowed.every((entry) => entry.kind === "workflow")).toBe(true);
    expect(filterCatalogue(entries, "all", "methodology").length).toBeGreaterThan(narrowed.length);
  });

  it("offers no filter chip the builder cannot fill (the Industries chip only ever said no match)", () => {
    for (const filter of KIND_FILTERS.filter((f) => f.id !== "all")) {
      expect(entries.some((entry) => entry.kind === filter.id), filter.id).toBe(true);
    }
  });
});
