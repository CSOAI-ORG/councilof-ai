import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { hrefFor } from "@/components/home/ToolStack";

const home = readFileSync(resolve(__dirname, "NewHome-v3.tsx"), "utf8");

describe("homepage doors — named hrefs, not leftover tiles", () => {
  it("ships World A / World B / OS named links", () => {
    expect(home).toContain('href="/gspc-scoreboard"');
    expect(home).toContain("/os?lobby=board");
    expect(home).toContain('href="/gspc-verify"');
    expect(home).toContain("/os?lobby=verify");
    expect(home).toContain("/os?lobby=cards");
    expect(home).toContain('"/assess"');
    expect(home).toContain("/evidence-rail");
    expect(home).toContain("VALID ·");
    expect(home).toContain("UNCHECKABLE");
  });

  it("does not sell XRPL, OTEL, leftover /arena, or MCP fleet as hero outcomes", () => {
    expect(home).not.toContain("/xrpl-attest");
    expect(home).not.toContain("/mcp-fleet");
    expect(home).not.toContain('href="/arena"');
    expect(home).not.toContain("/gspc-arena");
    expect(home).not.toMatch(/href="\/os"/);
  });

  it("does not iframe the homepage: Open OS is a named lobby, Verify is /gspc-verify", () => {
    expect(home).toContain('href="/os?lobby=home"');
    expect(home).toContain('href="/gspc-verify"');
    expect(home).not.toContain("council-town.pages.dev");
  });

  it("does not touch HeroBoard — that import stays the doctrine hero", () => {
    expect(home).toMatch(/import HeroBoard from "\.\.\/components\/home\/HeroBoard"/);
    expect(home).toContain("<HeroBoard />");
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
  });
});
