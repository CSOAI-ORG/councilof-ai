import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import DashboardPane, { hasPane, paneLabel, PANE_IDS } from "../components/DashboardPane";
import { dashboardNavGroupOf, LOBBY_TABS, normalizeLobbyTabId } from "../components/lobby/tabs";

// Actual source functions and unknown-pane rendering; no browser, fetch or model call.
const unknownIds = ["constructor", "__proto__", "gspc", "not-a-pane"];
describe("workspace destination integrity", () => {
  it.each(["board", "learn", "home", "results", "verify"])("retains the canonical %s tab", id => {
    expect(normalizeLobbyTabId(`  ${id.toUpperCase()}  `)).toBe(id);
    expect(LOBBY_TABS.some(tab => tab.id === id)).toBe(true);
  });
  it.each([["scoreboard", "board"], ["rankings", "board"], ["chat", "home"], ["assessment", "measured"]])(
    "preserves the declared %s alias", (from, to) => expect(normalizeLobbyTabId(from)).toBe(to),
  );
  it.each(unknownIds)("keeps unknown %s as a string rather than an inherited property", id => {
    expect(normalizeLobbyTabId(id)).toBe(id);
    expect(typeof normalizeLobbyTabId(id)).toBe("string");
  });
  it.each(unknownIds)("does not advertise or label an unknown %s pane", id => {
    expect(hasPane(id)).toBe(false);
    expect(paneLabel(id)).toBeNull();
    expect(dashboardNavGroupOf(id)).toBeNull();
  });
  it.each(unknownIds)("renders the explicit unknown state for %s without substituting a workflow", id => {
    const html = renderToStaticMarkup(createElement(Router, { ssrPath: "/dashboard" }, createElement(DashboardPane, { id })));
    expect(html).toContain('data-testid="dashboard-pane-unknown"');
    expect(html).toContain("Nothing else was substituted");
    expect(html).not.toContain('data-pane-known="yes"');
    expect(html).toContain('aria-label="Available workspace destinations"');
    for (const tab of ["board", "learn", "explore"]) expect(html).toContain(`href="/dashboard?tab=${tab}"`);
  });
  it("escapes an unknown URL-derived label as text", () => {
    const html = renderToStaticMarkup(createElement(Router, { ssrPath: "/dashboard" }, createElement(DashboardPane, { id: '<img src=x onerror="bad">' })));
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
    expect(html).toContain('data-testid="dashboard-pane-unknown"');
  });
  it("retains the explicit default only for empty input", () => {
    expect(normalizeLobbyTabId("  ")).toBe("home");
    expect(normalizeLobbyTabId("__PROTO__")).toBe("__proto__");
  });
  it("binds board and learning to their declared native destinations", () => {
    expect(LOBBY_TABS.find(tab => tab.id === "board")).toMatchObject({ kind: "native", path: "/gspc-scoreboard" });
    expect(LOBBY_TABS.find(tab => tab.id === "learn")).toMatchObject({ kind: "native", path: "" });
    expect(paneLabel("board")).toBe("GSPC board");
    expect(paneLabel("learn")).toBe("Learning arena");
    expect(hasPane("board")).toBe(true);
    expect(hasPane("learn")).toBe(true);
  });
  it("every exported pane remains resolvable", () => expect(PANE_IDS.filter(id => !hasPane(id))).toEqual([]));
});
