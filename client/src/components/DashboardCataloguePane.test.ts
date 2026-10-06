import { describe, expect, it } from "vitest";
import {
  buildDashboardCatalogue,
  DEFAULT_CATALOGUE_KIND,
  filterCatalogue,
  KIND_FILTERS,
} from "./DashboardCataloguePane";
import { LOBBY_ROUTES, LOBBY_TABS } from "@/components/lobby/tabs";

describe("Council master catalogue", () => {
  const entries = buildDashboardCatalogue();

  it("gives every curated workflow and public surface one workspace destination", () => {
    for (const tab of LOBBY_TABS.filter(
      (item) => !["home", "software", "explore"].includes(item.id),
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
      ["enterprise", "/enterprise"],
      ["tc260", "/tc260"],
    ] as const) {
      const hits = filterCatalogue(entries, DEFAULT_CATALOGUE_KIND, q);
      expect(hits.some((entry) => entry.path === path), `${q} -> ${path}`).toBe(true);
    }
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
