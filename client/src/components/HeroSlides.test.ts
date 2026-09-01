import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "HeroSlides.tsx"), "utf8");

describe("HeroSlides merges Ken Burns stills into the green reel", () => {
  it("keeps the three canvas scenes and the four arena plates", () => {
    expect(src).toContain('scene: "cells"');
    expect(src).toContain('scene: "council"');
    expect(src).toContain('scene: "glyphs"');
    expect(src).toContain("/images/coliseum_hero_arena.jpg");
    expect(src).toContain("/images/coliseum_swarm_clash.jpg");
    expect(src).toContain("/images/coliseum_logic_duel.jpg");
    expect(src).toContain("/images/coliseum_humans_vs_humanoids.jpg");
    expect(src).toContain("@keyframes coaiKenBurns");
  });

  it("gives every image slide its own title and does not sell certification", () => {
    expect(src).toContain("The arena is open.");
    expect(src).toContain("AI versus AI.");
    expect(src).toContain("Probe it yourself.");
    expect(src).toContain("Humans stay");
    expect(src).not.toMatch(/certified organization|CASA Certification|buy a rank/i);
    expect(src).not.toMatch(/all 22 measured|13 of 14/);
  });

  it("honors reduced motion and does not invent a board count", () => {
    expect(src).toContain("prefers-reduced-motion");
    expect(src).toContain("GET /api/gspc");
  });
});
