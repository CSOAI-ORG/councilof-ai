import { describe, expect, it } from "vitest";
import {
  dashboardViewFromSearch,
  dashboardViewHref,
  normalizeDashboardView,
} from "./dashboardView";

describe("dashboard embedded views", () => {
  it("accepts only same-app routes", () => {
    expect(normalizeDashboardView("/methodology?section=cards#proof")).toBe(
      "/methodology?section=cards#proof",
    );
    expect(normalizeDashboardView("https://example.com/tools")).toBeNull();
    expect(normalizeDashboardView("//example.com/tools")).toBeNull();
    expect(normalizeDashboardView("tools")).toBeNull();
  });

  it("rejects recursive application shells", () => {
    for (const path of [
      "/",
      "/os",
      "/dashboard",
      "/chat",
      "/console",
      "/ag-ui",
    ]) {
      expect(normalizeDashboardView(path)).toBeNull();
    }
  });

  it("round-trips a catalogue destination", () => {
    const href = dashboardViewHref("/industries/finance", "Finance");
    expect(href).toContain("tab=explore");
    expect(dashboardViewFromSearch(href.split("?")[1] || "")).toBe(
      "/industries/finance",
    );
  });
});
