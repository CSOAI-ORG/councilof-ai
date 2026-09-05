import { describe, expect, it } from "vitest";
import { buildDashboardCatalogue } from "./DashboardCataloguePane";
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
    const industries = entries.find((entry) => entry.path === "/industries");
    expect(crosswalk?.href).toContain("/dashboard?tab=explore&view=%2Fcrosswalk");
    expect(industries?.href).toContain("/dashboard?tab=explore&view=%2Findustries");
  });

  it("does not promote withdrawn industry detail routes as working tools", () => {
    expect(
      entries.filter((entry) => entry.path?.startsWith("/industries/")),
    ).toEqual([]);
  });

  it("opens every supporting destination through the canonical dashboard", () => {
    for (const entry of entries) {
      expect(entry.href, entry.id).toMatch(/^\/dashboard\?/);
    }
  });
});
