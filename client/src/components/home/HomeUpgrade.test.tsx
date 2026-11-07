import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import HomeHero, { HOME_HERO } from "./HomeHero";
import HomeProducts, { PRODUCTS } from "./HomeProducts";
import HomeProofPoints, { PROOF_POINTS } from "./HomeProofPoints";
import HomeHumanReview, { HUMAN_REVIEW_STEPS } from "./HomeHumanReview";
import LiveBoardGlance from "./LiveBoardGlance";

function render(node: React.ReactNode): string {
  return renderToStaticMarkup(<Router ssrPath="/">{node}</Router>);
}

const UNSUPPORTED = /first in market|first-to-market|most advanced|industry-leading|world-leading|get certified|we certify/i;

describe("image-led homepage upgrade", () => {
  it("keeps one stable proposition and the approved image without rotating content", () => {
    const html = render(<HomeHero />);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain(HOME_HERO.image);
    expect(html).toContain(HOME_HERO.alt);
    expect(html).toContain('href="#board"');
    expect(html).toContain('href="/gspc-verify"');
    expect(html).toContain("Verification is free, forever.");
    expect(html).not.toContain('aria-roledescription="carousel"');
    expect(html).not.toContain("Pause rotation");
    expect(html).not.toMatch(UNSUPPORTED);
  });

  it("gives each service a distinct task, bounded description and working route", () => {
    expect(new Set(PRODUCTS.map((product) => product.id)).size).toBe(PRODUCTS.length);
    for (const product of PRODUCTS) {
      expect(product.href).toMatch(/^\/[a-z0-9]/i);
      expect(product.href).not.toBe("#");
      expect(product.body.length).toBeLessThan(200);
      expect(`${product.title} ${product.body}`).not.toMatch(UNSUPPORTED);
    }
    const html = render(<HomeProducts />);
    for (const href of ["/dashboard", "/dashboard?tab=art50", "/contact?arm=run", "/services/", "/claim-maintenance/", "/open-source/", "/registers", "/regulators", "/working-groups/"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain("Terms before any paid request");
  });

  it("makes nine linked, proof-backed USPs without unsupported market claims", () => {
    expect(PROOF_POINTS).toHaveLength(9);
    expect(new Set(PROOF_POINTS.map((point) => point.id)).size).toBe(9);
    for (const point of PROOF_POINTS) {
      expect(point.href).toMatch(/^\/[a-z0-9]/i);
      expect(`${point.title} ${point.body}`).not.toMatch(UNSUPPORTED);
    }
    const html = render(<HomeProofPoints />);
    expect(html.match(/data-proof-point=/g)).toHaveLength(9);
    expect(html).toContain("CSOAI Ltd");
    expect(html).toContain("16939677");
    expect(html).toContain("Measurement, not certification.");
  });

  it("explains every board state before asking visitors to read the tiles", () => {
    const html = render(<LiveBoardGlance data={null} models={null} />);
    expect(html).toContain('data-testid="board-reading-guide"');
    expect(html).toContain("Measured is not the same as separated.");
    for (const label of ["Separated", "Tie", "Fact run", "Untested / Unmeasured", "Neither means zero."]) {
      expect(html).toContain(label);
    }
  });

  it("links decision recording while keeping identity, authority and effects separate", () => {
    expect(HUMAN_REVIEW_STEPS.map((step) => step.id)).toEqual([
      "challenge",
      "competency",
      "decision",
      "receipt",
    ]);
    const html = render(<HomeHumanReview />);
    expect(html.match(/data-human-review-step=/g)).toHaveLength(4);
    expect(html).toContain('href="/dashboard?tab=staff"');
    expect(html).toContain("AI proposes. Review and record the decision.");
    expect(html).toContain("An operator records the decision");
    expect(html).toContain("again before a decision");
    expect(html).toContain("does not verify the person");
    expect(html).toContain("does not authorize or perform the proposed action");
    expect(html).toContain("does not prove the proposed action happened");
    expect(html).not.toMatch(UNSUPPORTED);
  });

  it("mounts one results section and keeps the deeper resources discoverable", () => {
    const home = readFileSync(resolve(__dirname, "../../pages/HomeVerify.tsx"), "utf8");
    expect(home.match(/<HomeResults\s*\//g)).toHaveLength(1);
    for (const retired of ["<LivingBoardStrip", "<LiveBoardGlance", "<HomeWaysIn", "<HomeProofPoints", "<MomentumStrip", "<HomeLast30Days"]) expect(home).not.toContain(retired);
    for (const component of ["<HomeHero", "<HomeResults", "<HomeProducts", "<HomeEvidence", "<HomeDevelopers", "<HomeUpdates"]) expect(home).toContain(component);
    expect(home.indexOf("<HomeHero")).toBeLessThan(home.indexOf("<HomeResults"));
    expect(home.indexOf("<HomeResults")).toBeLessThan(home.indexOf("<HomeProducts"));
  });
});
