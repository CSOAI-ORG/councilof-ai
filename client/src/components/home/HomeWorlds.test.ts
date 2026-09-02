import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { OS_DOORS } from "./HomeWorlds";

const src = readFileSync(resolve(__dirname, "HomeWorlds.tsx"), "utf8");

describe("HomeWorlds — named OS doors, not leftover tiles", () => {
  it("ships World A / World B / OS named links", () => {
    expect(OS_DOORS.map((d) => d.label)).toEqual(["Board", "Verify", "Cards", "Assess", "Evidence"]);
    expect(OS_DOORS.map((d) => d.href)).toEqual([
      "/dashboard?tab=board",
      "/dashboard?tab=verify",
      "/dashboard?tab=cards",
      "/assess",
      "/evidence-rail",
    ]);
    expect(src).toContain('href="/gspc-scoreboard"');
    expect(src).toContain('href="/gspc-verify"');
    expect(src).toContain('href="/dashboard?tab=home"');
    expect(src).toContain("VALID ·");
    expect(src).toContain("UNCHECKABLE");
  });

  it("does not sell XRPL, leftover /arena, MCP fleet, or OTEL as hero outcomes", () => {
    expect(src).not.toContain("/xrpl-attest");
    expect(src).not.toContain("/mcp-fleet");
    expect(src).not.toContain('href="/arena"');
    expect(src).not.toContain("/gspc-arena");
    expect(src).not.toMatch(/href="\/os"/);
    expect(src).not.toMatch(/OpenTelemetry|otel/i);
  });

  it("links four public OSS tools, not lifestyle MCPs", () => {
    expect(src).toContain("github.com/CSOAI-ORG/inspect-receipts");
    expect(src).toContain("github.com/CSOAI-ORG/claimguard");
    expect(src).toContain("github.com/CSOAI-ORG/corpus-watch");
    expect(src).toContain("github.com/CSOAI-ORG/signed-receipts");
    expect(src).not.toMatch(/fishkeeper|qidi-printer|habit/i);
  });

  it("uses shipped posters; videos are optional", () => {
    expect(src).toContain("/images/coliseum_hero_arena.jpg");
    expect(src).toContain("/images/secure_evidence_vault.jpg");
    expect(src).toContain("/video/measure.mp4");
    expect(src).toContain("/video/verify.mp4");
  });

  it("does not autoplay worlds when prefers-reduced-motion is set", () => {
    expect(src).toContain('prefers-reduced-motion: reduce');
    expect(src).toContain("!reduceMotion");
  });
});
