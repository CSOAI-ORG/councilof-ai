import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const films = readFileSync(resolve(__dirname, "HomeFilms.tsx"), "utf8");
const understand = readFileSync(resolve(__dirname, "HomeUnderstand.tsx"), "utf8");
const stack = readFileSync(resolve(__dirname, "ToolStack.tsx"), "utf8");

describe("homepage films and understand lists", () => {
  it("puts a takeaway list under each of the three films", () => {
    expect(films).toContain("architecture-of-measurement.mp4");
    expect(films).toContain("architecture-of-trust.mp4");
    expect(films).toContain("trust-lobby.mp4");
    expect(films).toContain("What this film is saying");
    expect(films).toContain("HomeUnderstand");
    expect(films).toContain("Frozen, published tests");
    expect(films).toContain("Empty cells stay empty");
    expect(films).toContain("We measure. We do not certify");
    expect(films).not.toMatch(/certified organization|buy a rank|all 22 measured/i);
  });

  it("does not reuse a homepage film beside the three verify steps", () => {
    const living = readFileSync(resolve(__dirname, "LivingStages.tsx"), "utf8");
    const verify = living.slice(living.indexOf("function VerifyYourself"), living.indexOf("function OwnErrors"));
    expect(verify).not.toContain("/videos/proving-ground.mp4");
    expect(verify).toContain("FooterVerifyStrip");
    expect(verify).toContain("lg:grid-cols-3");
    expect(verify).not.toContain("lg:grid-cols-[1.15fr_1fr]");
    expect(verify).not.toContain("architecture-of-measurement.mp4");
    expect(verify).not.toContain("architecture-of-trust.mp4");
    expect(verify).not.toContain("trust-lobby.mp4");
    expect(verify).not.toContain("csoai-demo.mp4");
  });

  it("desk demo and product tiles teach with ticks, not invented counts", () => {
    expect(understand).toContain("only here");
    expect(stack).toContain("ticks:");
    expect(stack).toContain("Why these nine, and not a catalogue");
    expect(stack).toContain("Three states only: VALID · INVALID · UNCHECKABLE.");
    expect(stack).not.toMatch(/all 22 measured|13 of 14|Six-axis/);
  });
});
