import { describe, expect, it } from "vitest";
import { industriesForGrid } from "@/data/industries";
import { LOBBY_ROUTES, LOBBY_TABS } from "@/components/lobby/tabs";
import { buildDashboardCatalogue } from "./DashboardCataloguePane";

describe("dashboard master catalogue", () => {
  it("keeps every workflow, published route and industry reachable without duplicating a path", () => {
    const entries = buildDashboardCatalogue();
    const paths = entries.flatMap((entry) => (entry.path ? [entry.path] : []));
    expect(new Set(paths).size).toBe(paths.length);
    for (const tab of LOBBY_TABS.filter(
      (item) => !["home", "software", "explore"].includes(item.id),
    )) {
      expect(
        entries.some((entry) => entry.id === `tab:${tab.id}`),
        tab.id,
      ).toBe(true);
    }
    for (const route of LOBBY_ROUTES)
      expect(paths, route.path).toContain(route.path);
    for (const industry of industriesForGrid)
      expect(paths).toContain(`/industries/${industry.slug}`);
  });

  it("opens every supporting page through the canonical dashboard", () => {
    for (const entry of buildDashboardCatalogue()) {
      expect(entry.href, entry.id).toMatch(/^\/dashboard\?/);
    }
  });
});
