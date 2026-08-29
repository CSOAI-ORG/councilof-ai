import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { hrefFor } from "@/components/home/ToolStack";

const home = readFileSync(resolve(__dirname, "NewHome-v3.tsx"), "utf8");

describe("homepage doors — HomeWorlds, not leftover tiles", () => {
  it("mounts HomeWorlds and leaves HeroBoard as the doctrine hero", () => {
    expect(home).toMatch(/import HomeWorlds from "\.\.\/components\/home\/HomeWorlds"/);
    expect(home).toContain("<HomeWorlds />");
    expect(home).toMatch(/import HeroBoard from "\.\.\/components\/home\/HeroBoard"/);
    expect(home).toContain("<HeroBoard />");
  });

  it("does not keep the leftover CTA, white verify card, four-pill encore, or outcome tiles", () => {
    expect(home).not.toContain("/xrpl-attest");
    expect(home).not.toContain("/mcp-fleet");
    expect(home).not.toContain('href="/arena"');
    expect(home).not.toContain("/gspc-arena");
    expect(home).not.toContain("HeroSlides");
    expect(home).not.toContain("OutcomesBand");
    expect(home).not.toContain("USPStrip");
    expect(home).not.toMatch(/href="\/os"/);
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
