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

  it("renders benchmark results natively, and not by duplicating the board", () => {
    // The original invariant here was "no stale iframe": this pane once framed an
    // external results page, and retiring it meant pointing the id at a native
    // component. `kind: "native"` with an empty path is what actually enforces that,
    // and it is still asserted.
    //
    // The old assertion also pinned the component to HomeGspcBoard, which made `board`
    // and `results` two rail tabs onto one component — a tab labelled "Benchmark
    // results" serving the 22-axis board, while GET /api/hub-cards served 699 signed
    // Hub cells that nothing rendered. That pin was a proxy for "not an iframe", not a
    // ruling that results must be the board, so it now asserts the opposite.
    expect(tabById("results")).toMatchObject({ kind: "native", path: "" });
    expect(hasPane("results")).toBe(true);
    const source = readFileSync(
      resolve(__dirname, "./DashboardPane.tsx"),
      "utf8",
    );
    const line = source.split("\n").find((l) => /^\s*results:/.test(l));
    expect(line, "no `results:` entry in the pane map").toBeTruthy();
    expect(
      line,
      "`results` renders HomeGspcBoard again — that is the duplicate entry point, and " +
        "it hides the published Hub population behind a second door onto the board",
    ).not.toMatch(/HomeGspcBoard/);
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
