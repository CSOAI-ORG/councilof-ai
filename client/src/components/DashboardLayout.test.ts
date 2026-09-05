import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { dashboardActiveLabel } from "./DashboardLayout";
import { hasPane } from "./DashboardPane";
import { tabById } from "./lobby/tabs";

describe("dashboard consolidation details", () => {
  it("uses the embedded page label in the header", () => {
    const search = new URLSearchParams({
      tab: "explore",
      view: "/settings",
      label: "Settings",
    }).toString();
    expect(dashboardActiveLabel("explore", search)).toBe("Settings");
    expect(dashboardActiveLabel("explore", "tab=explore")).toBe("All tools");
  });

  it("renders benchmark results as the canonical native board", () => {
    expect(tabById("results")).toMatchObject({ kind: "native", path: "" });
    expect(hasPane("results")).toBe(true);
    const source = readFileSync(
      resolve(__dirname, "./DashboardPane.tsx"),
      "utf8",
    );
    expect(source).toMatch(/results:\s*HomeGspcBoard/);
  });

  it("keeps embedded page controls below the mobile Workspace button", () => {
    const source = readFileSync(
      resolve(__dirname, "./DashboardEmbeddedView.tsx"),
      "utf8",
    );
    expect(source).toContain("top-16");
    expect(source).toContain("xl:top-3");
  });
});
