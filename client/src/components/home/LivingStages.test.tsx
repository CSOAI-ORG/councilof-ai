import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import LivingStages from "./LivingStages";

const source = readFileSync(resolve(__dirname, "LivingStages.tsx"), "utf8");
const html = renderToStaticMarkup(
  <Router ssrPath="/">
    <LivingStages />
  </Router>,
);

describe("compact lower homepage stories", () => {
  it("keeps all six topics in shorter image-and-copy bands", () => {
    expect(html.match(/data-living-topic=/g)).toHaveLength(6);
    for (const heading of [
      "The board is not for sale.",
      "Evidence people can verify. Decisions people retain.",
      "Verify a published card yourself.",
      "Errors stay visible.",
      "Regulation changes. Evidence ages.",
      "One board. No invented cells.",
    ]) {
      expect(html).toContain(heading);
    }
    expect(source).not.toMatch(
      /min-h-\[78svh\]|bg-gradient|schematic of occupancy/,
    );
  });

  it("keeps technical proof and correction boundaries accessible", () => {
    expect(html.match(/<details/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain("Technical verification and anchoring boundary");
    expect(html).toContain("Why the DR-0007 council claim was withdrawn");
    expect(html).toContain("not yet automatic");
    expect(html).toContain("historical numeric result is unbound");
    expect(html).toContain("rho=1 and n_eff=1");
    expect(html).toContain("independent review or fault tolerance");
  });

  it("retains the film, its caption, verification sources, and canonical board link", () => {
    expect(html).toContain("/videos/trust-lobby.jpg");
    expect(html).toContain(
      "Two minutes on what we measure and what we refuse to claim",
    );
    expect(html).toContain("Verify us everywhere");
    expect(html).toContain("/dashboard?tab=board");
    expect(html).not.toContain("/images/band/clock.png");
  });

  it("uses only real local artwork selected for these stories", () => {
    for (const asset of [
      "/images/band/independence.png",
      "/videos/trust-lobby.jpg",
      "/images/infographics/crop/trust-root-offline-verify.jpg",
      "/images/public_watchdog_intake.jpg",
      "/images/loop/four-states.png",
      "/images/band/hardened.png",
    ]) {
      expect(existsSync(resolve(process.cwd(), `public${asset}`)), asset).toBe(
        true,
      );
    }
  });
});
