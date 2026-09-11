import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import Countdown from "./Countdown";

/**
 * Structure and labels only — never numbers. Dates and counts on the page are
 * derived from the regulation register and the live board; a test that pins
 * one is a test that goes stale on purpose.
 */
describe("/countdown page", () => {
  const html = renderToStaticMarkup(
    <Router ssrPath="/countdown">
      <Countdown />
    </Router>,
  );

  it("renders the deadline-machine frame with the estate line", () => {
    expect(html).toContain("the deadline machine");
    expect(html).toContain("measurement, not certification");
    expect(html).toContain("GET /api/regulation");
  });

  it("gives CRA Article 14 its own in-force panel, not a plain countdown", () => {
    expect(html).toContain('data-testid="cra-art14-panel"');
    expect(html).toContain("Article 14");
    expect(html).toContain("Early warning");
    expect(html).toContain("Single Reporting");
  });

  it("renders the 'Is it marked?' explainer with the free/paid split", () => {
    expect(html).toContain("Is it marked?");
    expect(html).toContain("machine-readable");
    expect(html).toContain("free, forever");
    expect(html).toContain("/api/art50/marking-evidence");
    expect(html).toContain("amounts live at the 402, never typed here");
    expect(html).toContain("Data free, proofs paid");
  });

  it("renders the Art 50 readiness rows UNMEASURED rather than invented", () => {
    expect(html).toContain('data-testid="art50-readiness-panel"');
    expect(html).toContain("Marking detected?");
    expect(html).toContain("Machine-readable?");
    expect(html).toContain("Interop format?");
    expect(html).toContain("UNMEASURED");
  });

  it("renders the monitoring hooks as doors with no typed amounts", () => {
    expect(html).toContain("Monitor these deadlines for your models");
    expect(html).toContain("/api/evidence-bundle?obligation=article-50");
    expect(html).toContain("/api/proof?bundle=1");
    expect(html).toContain("/.well-known/x402.json");
    expect(html).not.toMatch(/USDC\s*\d|\$\d+(\.\d+)?\s*(per|\/)/i);
  });

  it("renders the full register and the in-force list from the register", () => {
    expect(html).toContain("Everything still ahead");
    expect(html).toContain("Already in force");
    expect(html).toContain("Penalty exposure");
    expect(html).toContain("Official basis");
  });
});
