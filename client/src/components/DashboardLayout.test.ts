import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { dashboardActiveLabel } from "./DashboardLayout";
import { hasPane } from "./DashboardPane";
import { DASHBOARD_NAV_GROUPS, tabById } from "./lobby/tabs";
import { NAV_ID } from "./lobby/LobbyPaneTabs";

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

  it("registers Evidence Delivery as a native pane with explicit host submission", () => {
    expect(tabById("evidence-delivery")).toMatchObject({ kind: "native", path: "" });
    expect(hasPane("evidence-delivery")).toBe(true);
    const source = readFileSync(resolve(__dirname, "./gspc/CouncilEvidenceDeliveryPane.tsx"), "utf8");
    expect(source).toContain("Submit unsigned draft to Council A2A");
    expect(source).toContain('fetcher("/api/a2a"');
    expect(source).not.toContain("fetcher(handoff.transport");
  });

  it("pins embedded page controls to the canvas corner — no floating Workspace button to clear", () => {
    // 27 Sep 2026: the floating mobile "Workspace" button left the canvas; the History
    // control now lives in the section bar, so the controls no longer need a top-16 offset.
    const source = readFileSync(
      resolve(__dirname, "./DashboardEmbeddedView.tsx"),
      "utf8",
    );
    expect(source).toContain("right-3 top-3");
    expect(source).not.toContain("top-16");
    const workspace = readFileSync(
      resolve(__dirname, "./DashboardWorkspace.tsx"),
      "utf8",
    );
    expect(workspace).toContain("createPortal(trigger, actionsSlot)");
  });

  it("renders the one site header, eight sections with icons and no second tab strip", () => {
    const layout = readFileSync(resolve(__dirname, "./DashboardLayout.tsx"), "utf8");
    expect(layout).toMatch(/<Header inApp \/>/);
    for (const group of DASHBOARD_NAV_GROUPS) {
      // An absent Record key crashes the entire shell with React error #130.
      expect(layout, `${group.id} has a navigation icon`).toMatch(
        new RegExp(`^  ${group.id}: \\w+,$`, "m"),
      );
    }
    const workspace = readFileSync(
      resolve(__dirname, "./DashboardWorkspace.tsx"),
      "utf8",
    );
    expect(workspace).not.toMatch(/aria-label="Council workspace modes"/);
  });

  it("keeps the workspace navigation id distinct from the site header", () => {
    const header = readFileSync(resolve(__dirname, "./Header.tsx"), "utf8");
    expect(header).toContain('id="navigation"');
    expect(NAV_ID).toBe("coai-workspace-navigation");
    expect(NAV_ID).not.toBe("navigation");
  });
});
