import { describe, it, expect } from "vitest";
import { pathOnly, tabForPath, withEmbed, isEmbedNav, decideEmbedNav, EMBED_NAV_TYPE } from "./embed";

describe("withEmbed", () => {
  it("adds embed=1 to a bare path", () => {
    expect(withEmbed("/assess")).toBe("/assess?embed=1");
  });

  it("keeps existing query params", () => {
    expect(withEmbed("/gspc-verify?card=abc")).toBe("/gspc-verify?card=abc&embed=1");
  });

  it("does not duplicate embed=1 on a document pane", () => {
    expect(withEmbed("/library?embed=1")).toBe("/library?embed=1");
  });

  it("leaves hash-only and mailto links alone", () => {
    expect(withEmbed("#axis")).toBe("#axis");
    expect(withEmbed("mailto:nicholas@csoai.org")).toBe("mailto:nicholas@csoai.org");
  });

  it("never stamps embed=1 on marketing or host doors (no nested homepage, no /os in /os)", () => {
    expect(withEmbed("/")).toBe("/");
    expect(withEmbed("/products")).toBe("/products");
    expect(withEmbed("/honesty")).toBe("/honesty");
    expect(withEmbed("/pricing")).toBe("/pricing");
    expect(withEmbed("/os")).toBe("/os");
    expect(withEmbed("/os?lobby=board")).toBe("/os?lobby=board");
    expect(withEmbed("/os#council-town")).toBe("/os#council-town");
    expect(withEmbed("/dashboard")).toBe("/dashboard");
    expect(withEmbed("/ag-ui")).toBe("/ag-ui");
    expect(withEmbed("/chat")).toBe("/chat");
    expect(withEmbed("/console")).toBe("/console");
    expect(withEmbed("/sov-os")).toBe("/sov-os");
    expect(withEmbed("/council-os")).toBe("/council-os");
    expect(withEmbed("/demo")).toBe("/demo");
    expect(withEmbed("/os-demo")).toBe("/os-demo");
  });

  it("preserves a hash after the query on a document pane", () => {
    expect(withEmbed("/library#axis")).toBe("/library?embed=1#axis");
  });
});

describe("tabForPath", () => {
  it("matches a lobby pane exactly", () => {
    expect(tabForPath("/gspc-scoreboard")?.id).toBe("board");
    expect(tabForPath("/assess")?.id).toBe("measured");
    expect(tabForPath("/dashboard")?.id).toBe("software");
    expect(tabForPath("/models")?.id).toBe("models");
    expect(tabForPath("/tools")?.id).toBe("tools");
    expect(tabForPath("/benchmarks")?.id).toBe("results");
    expect(tabForPath("/library")?.id).toBe("library");
    expect(tabForPath("/workbench")?.id).toBe("workbench");
  });

  // These two cases were written against a rail that no longer exists: they asked
  // for an `academy` tab (there is none — /academy is opened from the Play gallery
  // as an ordinary in-pane route) and for the Watchdog tab to own `/watchdog`
  // (it owns `/report`; /watchdog is a separate live page). Both had been RED ON
  // MASTER. The behaviour each was guarding is still worth guarding, so they are
  // re-pointed at destinations the rail actually has rather than deleted.
  it("matches a nested path under a pane", () => {
    // /library/:sector is a real route under the Library pane.
    expect(tabForPath("/library/finance")?.id).toBe("library");
    expect(tabForPath("/gspc-scoreboard/anything")?.id).toBe("board");
  });

  it("does not let a pane path swallow a longer sibling route", () => {
    // The Report-an-incident pane owns /report. /reports is a DIFFERENT live page
    // (App.tsx) and a naive startsWith would hand it to that pane.
    expect(tabForPath("/report")?.id).toBe("watchdog");
    expect(tabForPath("/reports")).toBeNull();
    // /watchdog and /watchdog-map are live pages that no pane owns.
    expect(tabForPath("/watchdog")).toBeNull();
    expect(tabForPath("/watchdog-map")).toBeNull();
  });

  it("returns null for a page that is not a pane", () => {
    expect(tabForPath("/methodology")).toBeNull();
    expect(tabForPath("/" )).toBeNull();
    expect(tabForPath("/os")).toBeNull();
  });
});

describe("pathOnly / isEmbedNav", () => {
  it("strips query and hash", () => {
    expect(pathOnly("/os?embed=1#x")).toBe("/os");
  });

  it("accepts a well-formed nav message", () => {
    expect(isEmbedNav({ type: EMBED_NAV_TYPE, path: "/assess", search: "", title: "x" })).toBe(true);
    expect(isEmbedNav({ type: "nope", path: "/assess" })).toBe(false);
  });
});

describe("decideEmbedNav — parent listener branches", () => {
  it("never promotes path / to an override — leave OS without embed=1", () => {
    expect(decideEmbedNav("/")).toEqual({ action: "leave", href: "/" });
    expect(decideEmbedNav("/", "?embed=1")).toEqual({ action: "leave", href: "/" });
    expect(decideEmbedNav("/os", "?embed=1&lobby=home")).toEqual({
      action: "leave",
      href: "/os?lobby=home",
    });
    expect(decideEmbedNav("/dashboard")).toEqual({ action: "leave", href: "/dashboard" });
    expect(decideEmbedNav("/ag-ui")).toEqual({ action: "leave", href: "/ag-ui" });
    expect(decideEmbedNav("/chat")).toEqual({ action: "leave", href: "/chat" });
  });

  it("follows a route tab without remounting", () => {
    expect(decideEmbedNav("/library")).toEqual({
      action: "follow-route",
      tabId: "library",
      path: "/library",
    });
    expect(decideEmbedNav("/products")).toEqual({
      action: "follow-route",
      tabId: "products",
      path: "/products",
    });
  });

  it("drops the iframe when the path belongs to a native or local pane", () => {
    expect(decideEmbedNav("/gspc-scoreboard")).toEqual({ action: "drop-iframe", tabId: "board" });
    expect(decideEmbedNav("/gspc-verify")).toEqual({ action: "drop-iframe", tabId: "verify" });
  });

  it("sets an override chip for a page no tab owns (Pricing inside Products)", () => {
    expect(decideEmbedNav("/pricing")).toEqual({ action: "override", path: "/pricing" });
    expect(decideEmbedNav("/login")).toEqual({ action: "override", path: "/login" });
  });
});
