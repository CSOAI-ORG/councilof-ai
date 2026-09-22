// LiveCounters — the formatter prints a number only when the payload carries one; every other
// shape prints a state word. The component source never types a figure and shows "—" until the
// payload lands.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { FOOTER_STAGES, HERO_STAGES, FUNNEL_LABELS, formatRow, pillsFor, rowTitle, toPill, type FootprintPayload } from "./liveCountersFormat";

const component = readFileSync(resolve(__dirname, "LiveCounters.tsx"), "utf8");

describe("formatRow — state mapping", () => {
  it("READ with a number prints the number, grouped", () => {
    expect(formatRow({ state: "READ", value: 66713 })).toEqual({ text: "66,713", tone: "numeric" });
    expect(formatRow({ state: "READ", value: 0 })).toEqual({ text: "0", tone: "numeric" });
  });

  it("PARTIAL prints a lower bound, never the bare number", () => {
    expect(formatRow({ state: "PARTIAL", value: 1175 })).toEqual({ text: "≥ 1,175", tone: "numeric" });
  });

  it("READ with a string (the board's public_count) prints the string verbatim", () => {
    expect(formatRow({ state: "READ", value: "23 axis · 23 measured" })).toEqual({ text: "23 axis · 23 measured", tone: "numeric" });
  });

  it("UNCHECKABLE and UNMEASURED print as those words, whatever value rides along", () => {
    expect(formatRow({ state: "UNCHECKABLE", value: null })).toEqual({ text: "UNCHECKABLE", tone: "UNCHECKABLE" });
    expect(formatRow({ state: "UNMEASURED", value: null })).toEqual({ text: "UNMEASURED", tone: "UNMEASURED" });
    expect(formatRow({ state: "UNCHECKABLE", value: 0 }).text).toBe("UNCHECKABLE");
  });

  it("a row that claims READ without a readable number is UNCHECKABLE, never 0", () => {
    expect(formatRow({ state: "READ", value: null }).text).toBe("UNCHECKABLE");
    expect(formatRow({ state: "READ", value: Number.NaN }).text).toBe("UNCHECKABLE");
    expect(formatRow({ state: "READ", value: "" }).text).toBe("UNCHECKABLE");
    expect(formatRow({ state: "MEASURED", value: 5 } as never).text).toBe("UNCHECKABLE");
  });

  it("an absent row is UNCHECKABLE", () => {
    expect(formatRow(undefined).text).toBe("UNCHECKABLE");
    expect(formatRow(null as never).text).toBe("UNCHECKABLE");
  });
});

describe("toPill / pillsFor", () => {
  const payload: FootprintPayload = {
    gross_distribution: { state: "PARTIAL", value: 1175, unit: "downloads", as_of: "2026-09-22T12:00:00Z", source_url: ["https://pypistats.org/api/packages/csoai-gspc/recent", "https://api.npmjs.org/downloads/point/last-month/csoai-gspc-mcp"], reason: "lower bound" },
    economic_use: { state: "UNCHECKABLE", value: null, as_of: null, reason: "/api/revenue: http 401", source_url: "https://councilof.ai/api/revenue" },
    registry_listings: { state: "READ", value: 41, as_of: "2026-09-22T12:00:00Z", source_url: "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.CSOAI-ORG&limit=100" },
    qualified_distribution: { state: "UNMEASURED", value: null, as_of: null, sampled_note: "a sample, not the fleet" },
  };

  it("carries the label, the first source and an as_of tooltip", () => {
    const p = toPill("gross_distribution", payload.gross_distribution);
    expect(p.label).toBe(FUNNEL_LABELS.gross_distribution);
    expect(p.text).toBe("≥ 1,175");
    expect(p.href).toBe("https://pypistats.org/api/packages/csoai-gspc/recent");
    expect(p.title).toContain("as of 2026-09-22T12:00:00Z");
    expect(p.title).toContain("lower bound");
  });

  it("hero pills follow HERO_STAGES in order and print state words for the unreadable", () => {
    const pills = pillsFor(payload, HERO_STAGES);
    expect(pills.map((p) => p.key)).toEqual(["gross_distribution", "economic_use", "registry_listings"]);
    expect(pills.map((p) => p.text)).toEqual(["≥ 1,175", "UNCHECKABLE", "41"]);
    expect(pills[1].title).toContain("http 401");
  });

  it("footer pills cover the whole funnel; stages the payload lacks are UNCHECKABLE", () => {
    const pills = pillsFor(payload, FOOTER_STAGES);
    expect(pills).toHaveLength(7);
    const byKey = Object.fromEntries(pills.map((p) => [p.key, p.text]));
    expect(byKey.qualified_distribution).toBe("UNMEASURED");
    expect(byKey.observed_execution).toBe("UNCHECKABLE");
    expect(byKey.institutional_use).toBe("UNCHECKABLE");
    expect(rowTitle("observed_execution", undefined)).toContain("row absent");
  });

  it("a null payload yields only state words, never a number", () => {
    for (const p of pillsFor(null, FOOTER_STAGES)) expect(p.text).toBe("UNCHECKABLE");
  });

  it("the funnel order is download → execution → customer → recurring, and never sums", () => {
    expect(FOOTER_STAGES.indexOf("gross_distribution")).toBeLessThan(FOOTER_STAGES.indexOf("observed_execution"));
    expect(FOOTER_STAGES.indexOf("observed_execution")).toBeLessThan(FOOTER_STAGES.indexOf("economic_use"));
    expect(FOOTER_STAGES.indexOf("economic_use")).toBeLessThan(FOOTER_STAGES.indexOf("repeat_payers"));
  });
});

describe("LiveCounters.tsx — no typed figure, dash until the payload lands", () => {
  it("fetches /api/footprint and renders the em dash placeholder while loading or in a snapshot", () => {
    expect(component).toContain('FOOTPRINT_ENDPOINT = "/api/footprint"');
    expect(component).toMatch(/status\.kind === "loading" \|\| status\.kind === "snapshot" \? "—" : null/);
    expect(component).toContain("webdriver === true");
  });

  it("carries no digit-only literal that could be mistaken for a count", () => {
    // Tailwind sizes (px-3, text-[11px]) are the only numerals allowed; a bare count literal is not.
    const jsx = component.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(jsx).not.toMatch(/[>{"'\s]\d{2,}(?:,\d{3})*[<}"'\s](?![^<]*px)/);
  });

  it("prints the honesty line once, in the hero variant", () => {
    expect(component.match(/variant === "hero" && \(/g)).toHaveLength(1);
    expect(component).toContain("downloads are not users and users are not customers");
  });

  it("uses no banned vocabulary", () => {
    expect(component).not.toMatch(/certif|sovereign|\bBFT\b|byzantine/i);
    expect(component).not.toMatch(/[$£€]\s?\d/);
  });
});
