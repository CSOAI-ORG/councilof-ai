import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const source = readFileSync(fileURLToPath(new URL("./CouncilTown.tsx", import.meta.url)), "utf8");
describe("Dormant CouncilTown source truth boundary", () => {
  it("shows unknown on unavailable rather than a fabricated fallback", () => {
    expect(source).toContain("UNKNOWN_SOV_TOWN");
    expect(source).toContain("Source-reported simulation episodes");
    expect(source).toContain("counts unknown");
  });
  it("does not claim certification, world-first or real-world proof", () => {
    for (const phrase of ["world&rsquo;s first signed record", "177 jurisdictions", "proves &mdash; visually", "1_458_000_000", "120_500_000", "Every Council Town episode is signed"]) {
      expect(source).not.toContain(phrase);
    }
    expect(source).toContain("not independently authenticated");
    expect(source).toContain("No original episode signature");
  });
  it("keeps simulation separate from actual authorization", () => {
    expect(source).toContain("human approvals");
    expect(source).toContain("separate authorized workflows");
  });
});
