import { describe, expect, it } from "vitest";
import { buildDashboardCatalogue } from "./DashboardCataloguePane";
import { industriesForGrid } from "@/data/industries";
import { LOBBY_ROUTES } from "@/components/lobby/tabs";

describe("Council master catalogue", () => {
  const entries = buildDashboardCatalogue();

  it("gives every curated public surface and industry one workspace destination", () => {
    expect(entries.filter((entry) => entry.kind === "surface")).toHaveLength(LOBBY_ROUTES.length);
    expect(entries.filter((entry) => entry.kind === "industry")).toHaveLength(industriesForGrid.length);
  });

  it("deduplicates destinations and never frames another Council application shell", () => {
    const hrefs = entries.map((entry) => entry.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.some((href) => href.includes("view=%2Fdashboard"))).toBe(false);
    expect(hrefs.some((href) => href.includes("view=%2Fos"))).toBe(false);
  });

  it("keeps supporting routes in the centre pane", () => {
    const crosswalk = entries.find((entry) => entry.path === "/crosswalk");
    const insurance = entries.find((entry) => entry.path === "/industries/insurance");
    expect(crosswalk?.href).toContain("/dashboard?tab=explore&view=%2Fcrosswalk");
    expect(insurance?.href).toContain("/dashboard?tab=explore&view=%2Findustries%2Finsurance");
  });
});
