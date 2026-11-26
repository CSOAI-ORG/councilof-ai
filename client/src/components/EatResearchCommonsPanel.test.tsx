import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EatResearchCommonsPanel from "./EatResearchCommonsPanel";

describe("Ecosystem source commons (untrusted public metadata)", () => {
  it("does not fabricate a fresh source or optimistic number during initial render", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    try {
      const html = renderToStaticMarkup(createElement(EatResearchCommonsPanel));
      expect(html).toContain("Open research commons");
      expect(html).toContain("Checking the source revision and access controls");
      expect(html).toContain("not our measurement");
      expect(html).toContain("not a vendor partnership");
      expect(html).toContain("/api/research-plan");
      expect(html).not.toContain("16 observed");
      expect(html).not.toContain("Verified independently");
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("server rendering never triggers a paid RAS request or a vendor API", () => {
    const fetch = vi.fn(() => { throw new Error("No network on server render"); });
    vi.stubGlobal("fetch", fetch);
    try {
      const html = renderToStaticMarkup(createElement(EatResearchCommonsPanel));
      expect(html).toContain("H.I.M.");
      expect(html).toContain("separate authorised process");
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
