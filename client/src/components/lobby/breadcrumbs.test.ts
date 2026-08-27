import { describe, expect, it } from "vitest";
import { dashboardCrumbs, isKnownDestination, paneCrumbs } from "./breadcrumbs";
import { LOBBY_TABS, tabById } from "./tabs";

const tab = (id: Parameters<typeof tabById>[0]) => tabById(id);

describe("paneCrumbs — the OS pane trail", () => {
  it("home is a single current crumb, not a link to itself", () => {
    const crumbs = paneCrumbs(tab("home"), "");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].current).toBe(true);
    expect(crumbs[0].tab).toBeUndefined();
  });

  it("a tab at its own root: Home is the link, the tab is current", () => {
    const crumbs = paneCrumbs(tab("results"), "/benchmarks");
    expect(crumbs.map((c) => c.label)).toEqual(["Home", "Benchmarkers"]);
    expect(crumbs[0].tab?.id).toBe("home");
    expect(crumbs[1].current).toBe(true);
  });

  it("a native pane (no framed path) is current under Home", () => {
    const crumbs = paneCrumbs(tab("verify"), "");
    expect(crumbs[crumbs.length - 1].current).toBe(true);
    expect(crumbs[0].tab?.id).toBe("home");
  });

  it("in-pane navigation appends only the segments the tab crumb does not already cover", () => {
    const crumbs = paneCrumbs(tab("results"), "/benchmarks/some-report");
    // NOT "Benchmarkers › benchmarks › some-report" — the tab crumb IS /benchmarks.
    expect(crumbs.map((c) => c.label)).toEqual(["Home", "Benchmarkers", "some-report"]);
    expect(crumbs[1].tab?.id).toBe("results");
    // Where you are is never a link.
    const last = crumbs[crumbs.length - 1];
    expect(last.current).toBe(true);
    expect(last.tab).toBeUndefined();
    expect(last.route).toBeUndefined();
  });

  it("an unknown intermediate segment renders as text, not a link that would 404", () => {
    const crumbs = paneCrumbs(tab("results"), "/no-such-parent/child");
    const mid = crumbs.find((c) => c.label === "no-such-parent");
    expect(mid).toBeDefined();
    expect(mid?.tab).toBeUndefined();
    expect(mid?.route).toBeUndefined();
  });

  it("an override route gets no tab crumb — the rail does not own it", () => {
    const crumbs = paneCrumbs(tab("play"), "/gspc-arena", true);
    expect(crumbs.map((c) => c.label)).toEqual(["Home", "gspc-arena"]);
    expect(crumbs[1].current).toBe(true);
  });

  it("normalises trailing slashes and query strings", () => {
    const a = paneCrumbs(tab("results"), "/benchmarks/");
    const b = paneCrumbs(tab("results"), "/benchmarks?embed=1");
    expect(a[a.length - 1].label).toBe("Benchmarkers");
    expect(b[b.length - 1].label).toBe("Benchmarkers");
    expect(a[a.length - 1].current).toBe(true);
  });
});

describe("isKnownDestination", () => {
  it("knows every rail tab path", () => {
    for (const t of LOBBY_TABS) {
      if (t.path) expect(isKnownDestination(t.path)).toBe(true);
    }
  });
  it("does not invent destinations", () => {
    expect(isKnownDestination("/definitely-not-a-page")).toBe(false);
  });
});

describe("dashboardCrumbs — the Council software trail", () => {
  it("the overview is a single current crumb", () => {
    const crumbs = dashboardCrumbs("/dashboard");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].current).toBe(true);
    expect(crumbs[0].path).toBeUndefined();
  });

  it("a sub-page links back to the overview", () => {
    const crumbs = dashboardCrumbs("/dashboard/progress");
    expect(crumbs.map((c) => c.label)).toEqual(["Council software", "progress"]);
    expect(crumbs[0].path).toBe("/dashboard");
    expect(crumbs[1].current).toBe(true);
  });
});
