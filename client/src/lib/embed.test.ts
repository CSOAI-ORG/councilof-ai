import { describe, it, expect } from "vitest";
import { pathOnly, tabForPath, withEmbed, isEmbedNav, EMBED_NAV_TYPE } from "./embed";

describe("withEmbed", () => {
  it("adds embed=1 to a bare path", () => {
    expect(withEmbed("/assess")).toBe("/assess?embed=1");
  });

  it("keeps existing query params", () => {
    expect(withEmbed("/gspc-verify?card=abc")).toBe("/gspc-verify?card=abc&embed=1");
  });

  it("does not duplicate embed=1", () => {
    expect(withEmbed("/os?embed=1")).toBe("/os?embed=1");
  });

  it("leaves hash-only and mailto links alone", () => {
    expect(withEmbed("#axes")).toBe("#axes");
    expect(withEmbed("mailto:nicholas@csoai.org")).toBe("mailto:nicholas@csoai.org");
  });

  it("preserves a hash after the query", () => {
    expect(withEmbed("/os#council-town")).toBe("/os?embed=1#council-town");
  });
});

describe("tabForPath", () => {
  it("matches a lobby pane exactly", () => {
    expect(tabForPath("/gspc-scoreboard")?.id).toBe("board");
    expect(tabForPath("/assess")?.id).toBe("measured");
    expect(tabForPath("/dashboard")?.id).toBe("software");
  });

  it("matches a nested path under a pane", () => {
    expect(tabForPath("/academy/foundations")?.id).toBe("academy");
  });

  it("does not treat /watchdog-map as the Watchdog pane", () => {
    expect(tabForPath("/watchdog-map")).toBeNull();
    expect(tabForPath("/watchdog")?.id).toBe("watchdog");
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
