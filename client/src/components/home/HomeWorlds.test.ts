import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { OS_DOORS } from "./HomeWorlds";

const src = readFileSync(resolve(__dirname, "HomeWorlds.tsx"), "utf8");

describe("HomeWorlds — named OS doors, not leftover tiles", () => {
  it("ships World A / World B / OS named links", () => {
    expect(OS_DOORS.map((d) => d.label)).toEqual(["Board", "Verify", "Cards", "Assess", "Evidence"]);
    expect(OS_DOORS.map((d) => d.href)).toEqual([
      "/os?lobby=board",
      "/os?lobby=verify",
      "/os?lobby=cards",
      "/assess",
      "/evidence-rail",
    ]);
    expect(src).toContain('href="/gspc-scoreboard"');
    expect(src).toContain('href="/gspc-verify"');
    expect(src).toContain('href="/os?lobby=home"');
    expect(src).toContain("VALID ·");
    expect(src).toContain("UNCHECKABLE");
  });

  it("does not sell XRPL, leftover /arena, or MCP fleet as hero outcomes", () => {
    expect(src).not.toContain("/xrpl-attest");
    expect(src).not.toContain("/mcp-fleet");
    expect(src).not.toContain('href="/arena"');
    expect(src).not.toContain("/gspc-arena");
    expect(src).not.toMatch(/href="\/os"/);
  });

  it("uses shipped posters; videos are optional", () => {
    expect(src).toContain("/images/coliseum_hero_arena.jpg");
    expect(src).toContain("/images/secure_evidence_vault.jpg");
    expect(src).toContain("/video/measure.mp4");
    expect(src).toContain("/video/verify.mp4");
  });
});
