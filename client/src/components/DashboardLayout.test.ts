import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { dashboardActiveLabel, EmbeddedDashboardPage } from "./DashboardLayout";
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
    expect(source).toMatch(/board:\s*CanonicalGspcBoard/);
    expect(source).toMatch(/results:\s*CanonicalGspcBoard/);
    expect(source).not.toMatch(/(?:board|results):\s*HomeGspcBoard/);
  });

  it("keeps embedded page controls below the mobile Workspace button", () => {
    const source = readFileSync(
      resolve(__dirname, "./DashboardEmbeddedView.tsx"),
      "utf8",
    );
    expect(source).toContain("top-16");
    expect(source).toContain("xl:top-3");
  });

  it("renders a framed account page as content, never a nested workspace", () => {
    const html = renderToStaticMarkup(createElement(
      EmbeddedDashboardPage,
      null,
      createElement("div", { "data-settings-content": "yes" }, "Settings"),
    ));
    expect(html).toContain('data-testid="dashboard-embedded-page"');
    expect(html).toContain('data-settings-content="yes"');
    expect(html).not.toContain('data-testid="dashboard-workspace"');
    expect(html).not.toContain("Open workspaces, tasks and chat history");
  });

  it("gives legacy native panes the canonical width, inset and one scroll owner", () => {
    const css = readFileSync(resolve(__dirname, "../styles/index.css"), "utf8");
    expect(css).toContain(".coai-pane > .h-full.overflow-y-auto");
    expect(css).toContain("max-width: 72rem");
    expect(css).toContain("overflow: visible");
    expect(css).toContain("padding: 1.75rem 1.25rem");
  });
});
