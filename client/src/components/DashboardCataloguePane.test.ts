import { describe, expect, it } from "vitest";
import { buildDashboardCatalogue } from "./DashboardCataloguePane";
import { industriesForGrid } from "@/data/industries";
import { LOBBY_ROUTES, LOBBY_TABS } from "@/components/lobby/tabs";

describe("Council master catalogue", () => {
  const entries = buildDashboardCatalogue();

  it("gives every curated workflow, public surface and industry one workspace destination", () => {
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
    for (const industry of industriesForGrid) {
      expect(entries.some((entry) => entry.path === `/industries/${industry.slug}`)).toBe(true);
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
    const insurance = entries.find((entry) => entry.path === "/industries/insurance");
    expect(crosswalk?.href).toContain("/dashboard?tab=explore&view=%2Fcrosswalk");
    expect(insurance?.href).toContain("/dashboard?tab=explore&view=%2Findustries%2Finsurance");
  });

  it("opens every supporting destination through the canonical dashboard", () => {
    for (const entry of entries) {
      expect(entry.href, entry.id).toMatch(/^\/dashboard\?/);
    }
  });
});
