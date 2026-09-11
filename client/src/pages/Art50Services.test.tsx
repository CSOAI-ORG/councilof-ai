import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import Art50Services from "./Art50Services";

/**
 * Structure and labels only — never numbers. The countdown date comes from the
 * regulation register and the fine record from the enforcement register; a
 * test that pins one is a test that goes stale on purpose.
 */
describe("/art50 services page", () => {
  const html = renderToStaticMarkup(
    <Router ssrPath="/art50">
      <Art50Services />
    </Router>,
  );

  it("renders the services frame with the estate line and the discipline line", () => {
    expect(html).toContain("verification services");
    expect(html).toContain("measurement, not certification");
    expect(html).toContain("Derived, never typed");
    expect(html).toContain("root wins");
  });

  it("renders the live marking-grace countdown from the register", () => {
    expect(html).toContain('data-testid="art50-grace-countdown"');
    expect(html).toContain("marking grace ends");
    expect(html).toContain("Penalty exposure");
  });

  it("renders the three service cards, each linked to an existing surface", () => {
    expect(html).toContain("Marking-presence census");
    expect(html).toContain("Detector-interop bench");
    expect(html).toContain("Specimen ledger");
    expect(html).toContain("/api/art50/marking-evidence");
    expect(html).toContain("/gspc/detector-interop");
    expect(html).toContain("/specimens/clarity");
  });

  it("states the specimen ledger honestly as in build", () => {
    expect(html).toContain("In build");
    expect(html).toContain("we do not link what does not exist");
  });

  it("renders the enforcement tracker derived from the register, with source and stamp", () => {
    expect(html).toContain('data-testid="art50-enforcement-tracker"');
    expect(html).toContain("Enforcement tracker");
    expect(html).toContain("/api/fines");
    expect(html).toContain("verified_as_of");
    expect(html).toContain("/first-fine-watch");
  });

  it("renders the free-vs-paid line with the 402 copy formula and no typed amounts", () => {
    expect(html).toContain("free, forever");
    expect(html).toContain("Data free, proofs paid");
    expect(html).toContain("amounts live at the 402, never typed here");
    expect(html).toContain("/gspc-verify");
    expect(html).not.toMatch(/USDC\s*\d|\$\d+(\.\d+)?\s*(per|\/)/i);
  });

  it("cross-links the family instead of duplicating it", () => {
    expect(html).toContain("/article-50");
    expect(html).toContain("/packs/eu-article-50");
    expect(html).toContain("/countdown");
  });
});
