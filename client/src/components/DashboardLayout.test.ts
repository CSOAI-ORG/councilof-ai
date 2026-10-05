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

  it("renders the evidence lifecycle as a native product pane", () => {
    expect(tabById("lifecycle")).toMatchObject({ kind: "native", path: "" });
    expect(hasPane("lifecycle")).toBe(true);
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

  it("renders the one site header, seven sections and no second tab strip", () => {
    const layout = readFileSync(resolve(__dirname, "./DashboardLayout.tsx"), "utf8");
    expect(layout).toMatch(/<Header inApp \/>/);
    const workspace = readFileSync(
      resolve(__dirname, "./DashboardWorkspace.tsx"),
      "utf8",
    );
    expect(workspace).not.toMatch(/aria-label="Council workspace modes"/);
  });
});
