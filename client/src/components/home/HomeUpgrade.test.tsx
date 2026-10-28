import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import HomeHero, { HERO_SLIDES } from "./HomeHero";
import HomeProducts, { PRODUCTS } from "./HomeProducts";
import HomeProofPoints, { PROOF_POINTS } from "./HomeProofPoints";
import LiveBoardGlance from "./LiveBoardGlance";

function render(node: React.ReactNode): string {
  return renderToStaticMarkup(<Router ssrPath="/">{node}</Router>);
}

const UNSUPPORTED = /first in market|first-to-market|most advanced|industry-leading|world-leading|get certified|we certify/i;

describe("image-led homepage upgrade", () => {
  it("offers six distinct, working hero stories with accessible controls", () => {
    expect(HERO_SLIDES).toHaveLength(6);
    expect(new Set(HERO_SLIDES.map((slide) => slide.id)).size).toBe(6);
    for (const slide of HERO_SLIDES) {
      expect(slide.href).toMatch(/^\/[a-z0-9]/i);
      expect(slide.image).toMatch(/^\/images\//);
      expect(slide.alt.length).toBeGreaterThan(20);
      expect(slide.cta.length).toBeGreaterThan(3);
      expect(`${slide.title} ${slide.body}`).not.toMatch(UNSUPPORTED);
    }
    const html = render(<HomeHero />);
    expect(html.match(/data-hero-dot=/g)).toHaveLength(6);
    expect(html).toContain('aria-label="Previous slide"');
    expect(html).toContain('aria-label="Next slide"');
    expect(html).toContain("Pause rotation");
    expect(html).toContain('aria-label="Council of AI services and benefits"');
  });

  it("presents exactly nine concise product cards, each with an image and a real route", () => {
    expect(PRODUCTS).toHaveLength(9);
    expect(new Set(PRODUCTS.map((product) => product.id)).size).toBe(9);
    for (const product of PRODUCTS) {
      expect(product.href).toMatch(/^\/[a-z0-9]/i);
      expect(product.href).not.toBe("#");
      expect(product.image).toMatch(/^\/images\//);
      expect(product.body.length).toBeLessThan(180);
      expect(`${product.title} ${product.body}`).not.toMatch(UNSUPPORTED);
    }
    const html = render(<HomeProducts />);
    expect(html.match(/data-product=/g)).toHaveLength(9);
    expect(html.match(/<img\b/g)).toHaveLength(9);
    for (const href of ["/board", "/gspc-verify", "/dashboard", "/contact?arm=run", "/connect/", "/board/#board-download", "/claim-maintenance/", "/embed", "/registers"]) {
      expect(html).toContain(`href="${href}"`);
    }
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

  it("composes products, board and proof points without repeating the old story band", () => {
    const home = readFileSync(resolve(__dirname, "../../pages/HomeVerify.tsx"), "utf8");
    expect(home).not.toContain("<HomeSteps");
    for (const component of ["<HomeHero", "<HomeProducts", "<LiveBoardGlance", "<HomeProofPoints", "<HomeWaysIn"]) {
      expect(home).toContain(component);
    }
    expect(home.indexOf("<HomeHero")).toBeLessThan(home.indexOf("<HomeProducts"));
    expect(home.indexOf("<HomeProducts")).toBeLessThan(home.indexOf("<LiveBoardGlance"));
    expect(home.indexOf("<LiveBoardGlance")).toBeLessThan(home.indexOf("<HomeProofPoints"));
  });
});
