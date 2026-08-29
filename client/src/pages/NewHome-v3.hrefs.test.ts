import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { hrefFor } from "@/components/home/ToolStack";

const home = readFileSync(resolve(__dirname, "NewHome-v3.tsx"), "utf8");

describe("homepage is Council OS, not a poster", () => {
  it("inlines OsShell as the hero — same product as /os", () => {
    expect(home).toMatch(/import OsShell from "\.\.\/components\/os\/OsShell"/);
    expect(home).toContain('<OsShell variant="hero"');
    expect(home).not.toContain("<HeroBoard");
    expect(home).not.toContain("<HomeWorlds");
    expect(home).toContain("<LobbyVerifyPane");
    expect(home).toContain('href="/methodology"');
  });

  it("does not keep leftover tiles, lifestyle worlds, or govbench as the primary CTA", () => {
    expect(home).not.toContain("/xrpl-attest");
    expect(home).not.toContain("/mcp-fleet");
    expect(home).not.toContain('href="/arena"');
    expect(home).not.toContain("/gspc-arena");
    expect(home).not.toContain("/govbench");
    expect(home).not.toContain("HeroSlides");
    expect(home).not.toContain("OutcomesBand");
    expect(home).not.toContain("USPStrip");
    expect(home).not.toMatch(/OpenTelemetry|otel/i);
    expect(home).not.toMatch(/measure\.mp4|verify\.mp4/);
  });
});

describe("ToolStack hrefs are real pages, not /?lobby=", () => {
  it("maps the nine tools onto living doors", () => {
    expect(hrefFor({ kind: "pane", pane: "home" })).toBe("/os?lobby=board");
    expect(hrefFor({ kind: "pane", pane: "board" })).toBe("/os?lobby=board");
    expect(hrefFor({ kind: "pane", pane: "verify" })).toBe("/gspc-verify");
    expect(hrefFor({ kind: "pane", pane: "measured" })).toBe("/assess");
    expect(hrefFor({ kind: "pane", pane: "evidence" })).toBe("/evidence-rail");
    expect(hrefFor({ kind: "pane", pane: "embed" })).toBe("/embed");
    expect(hrefFor({ kind: "pane", pane: "watchdog" })).toBe("/report");
    expect(hrefFor({ kind: "task", task: "insurer-rail" })).toBe("/insurers");
    expect(hrefFor({ kind: "task", task: "specialist-registers" })).toBe("/registers");
    expect(hrefFor({ kind: "route", path: "/os?lobby=home" })).toBe("/os?lobby=home");
  });
});
