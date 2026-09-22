// LiveCounters — the formatter prints a number only when the payload carries one; every other
// shape prints a state word. The component source never types a figure and shows "—" until the
// payload lands.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { TONE } from "./LiveCounters";
import {
  FOOTER_STAGES,
  HERO_STAGES,
  FUNNEL_LABELS,
  coverageText,
  evidenceHref,
  formatRow,
  pillsFor,
  rowTitle,
  rowWindow,
  toPill,
  type FootprintPayload,
} from "./liveCountersFormat";

const component = readFileSync(resolve(__dirname, "LiveCounters.tsx"), "utf8");
const formatSource = readFileSync(resolve(__dirname, "liveCountersFormat.ts"), "utf8");

describe("formatRow — state mapping", () => {
  it("READ with a number prints the number, grouped", () => {
    expect(formatRow({ state: "READ", value: 66713 })).toEqual({ text: "66,713", tone: "numeric" });
    expect(formatRow({ state: "READ", value: 0 })).toEqual({ text: "0", tone: "numeric" });
  });

  it("PARTIAL prints a lower bound, never the bare number", () => {
    expect(formatRow({ state: "PARTIAL", value: 1175 })).toEqual({ text: "≥ 1,175", tone: "PARTIAL" });
  });

  it("STALE prints the real figure AND that it is stale, in the same glance", () => {
    expect(formatRow({ state: "STALE", value: 288138 })).toEqual({ text: "288,138 · stale", tone: "STALE" });
  });

  it("no state ever prints a bare number except a fresh, complete READ", () => {
    for (const state of ["PARTIAL", "STALE"] as const) {
      expect(formatRow({ state, value: 42 }).text).not.toBe("42");
    }
    expect(formatRow({ state: "READ", value: 42 }).text).toBe("42");
  });

  it("READ with a string (the board's public_count) prints the string verbatim", () => {
    expect(formatRow({ state: "READ", value: "23 axis · 23 measured" })).toEqual({ text: "23 axis · 23 measured", tone: "numeric" });
  });

  it("a STALE row with no readable number is UNCHECKABLE, not a stale nothing", () => {
    expect(formatRow({ state: "STALE", value: null }).text).toBe("UNCHECKABLE");
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

  describe("a download row measured on the pod and read out by the endpoint", () => {
    const measured = {
      state: "PARTIAL" as const,
      value: 288138,
      unit: "downloads",
      window: "2026-08-23..2026-09-21 (30 complete UTC days)",
      covered: 697,
      attempted: 721,
      as_of: "2026-09-22T11:00:00Z",
      age_hours: 3.2,
      evidence_url: "/interop/distribution-latest.json",
      source_url: "https://pepy.tech/api/v2/projects/<name>",
      reason: "697 of 721 counters answered",
    };

    it("prints the window beside the figure, so nobody assumes which one it is", () => {
      const p = toPill("gross_distribution", measured);
      expect(p.window).toBe("2026-08-23..2026-09-21 (30 complete UTC days)");
      expect(p.title).toContain("window 2026-08-23..2026-09-21");
    });

    it("prefers the evidence artifact over the upstream counter for its link", () => {
      const p = toPill("gross_distribution", measured);
      expect(p.evidenceHref).toBe("/interop/distribution-latest.json");
      expect(p.href).toBe("https://pepy.tech/api/v2/projects/<name>");
    });

    it("puts the fan-out's coverage in the tooltip, never only the sum", () => {
      expect(coverageText(measured)).toBe("697 of 721 counters answered");
      expect(toPill("gross_distribution", measured).title).toContain("697 of 721 counters answered");
      expect(coverageText({ state: "READ", value: 1 })).toBeNull();
      expect(coverageText({ covered: 0, attempted: 0 })).toBeNull();
    });

    it("a stale measurement prints the figure, the staleness and how old it is", () => {
      const p = toPill("gross_distribution", { ...measured, state: "STALE", age_hours: 73.4, reason: "measured 73.4 h ago, past the 48 h the artifact declares" });
      expect(p.text).toBe("288,138 · stale");
      expect(p.tone).toBe("STALE");
      expect(p.title).toContain("measured 73.4 h ago");
    });

    it("names no window and no evidence when the row carries none — never a guessed one", () => {
      expect(rowWindow({ state: "READ", value: 1 })).toBeNull();
      expect(rowWindow({ state: "READ", value: 1, window: "  " })).toBeNull();
      expect(evidenceHref({ state: "READ", value: 1 })).toBeNull();
      const p = toPill("github_stars", { state: "READ", value: 4 });
      expect(p.window).toBeNull();
      expect(p.evidenceHref).toBeNull();
    });
  });

  it("hero pills follow HERO_STAGES in order and print state words for the unreadable", () => {
    const pills = pillsFor(payload, HERO_STAGES);
    expect(pills.map((p) => p.key)).toEqual(["gross_distribution", "economic_use", "registry_listings"]);
    expect(pills.map((p) => p.text)).toEqual(["≥ 1,175", "UNCHECKABLE", "41"]);
    expect(pills[1].title).toContain("http 401");
  });

  it("every pill's tone names its state, so PARTIAL and STALE are never coloured as a clean read", () => {
    const tones = pillsFor(
      {
        gross_distribution: { state: "STALE", value: 10 },
        economic_use: { state: "PARTIAL", value: 2 },
        registry_listings: { state: "READ", value: 41 },
      },
      HERO_STAGES,
    ).map((p) => p.tone);
    expect(tones).toEqual(["STALE", "PARTIAL", "numeric"]);
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

  it("types no counter number in either file: every figure is read from the payload", () => {
    // The real figures this component shows (2,455,924 cumulative and 288,138 over 30 days on
    // 2026-09-22) must never appear in source. If one is ever pasted in, this fails.
    for (const [name, src] of [["LiveCounters.tsx", component], ["liveCountersFormat.ts", formatSource]] as const) {
      const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      expect(code, `${name} types a grouped number`).not.toMatch(/\d{1,3}(?:,\d{3})+/);
      // A bare run of 4+ digits outside a Tailwind arbitrary value is a count, not a size.
      const bare = code.match(/(?<![\w[-])\d{4,}(?![\w\]px])/g) ?? [];
      expect(bare, `${name} types ${bare.join(", ")}`).toHaveLength(0);
    }
  });

  it("gives every state a colour — a state with no tone is a state a reader never sees", () => {
    expect(Object.keys(TONE).sort()).toEqual(["PARTIAL", "STALE", "UNCHECKABLE", "UNMEASURED", "numeric"]);
    for (const state of ["READ", "PARTIAL", "STALE", "UNCHECKABLE", "UNMEASURED"] as const) {
      const { tone } = formatRow({ state, value: state === "UNCHECKABLE" || state === "UNMEASURED" ? null : 7 });
      expect(TONE[tone], `${state} has no class`).toBeTruthy();
    }
    // PARTIAL and STALE must not be painted as a clean read.
    expect(TONE.PARTIAL).not.toBe(TONE.numeric);
    expect(TONE.STALE).not.toBe(TONE.numeric);
  });

  it("emits the state and the window as data attributes, in both variants", () => {
    expect(component).toContain("data-state={placeholder ? \"pending\" : pill.tone}");
    expect(component).toContain("data-window=");
    expect(component).toContain('data-testid={`live-counters-${variant}`}');
    expect(component).toMatch(/variant === "hero" \? HERO_STAGES : FOOTER_STAGES/);
  });

  it("links the evidence artifact when the row names one, and the upstream source otherwise", () => {
    expect(component).toContain("pill.evidenceHref ?? pill.href");
    expect(component).toContain('pill.evidenceHref ? "evidence" : "source"');
  });

  it("a failed fetch clears the window and the links rather than leaving a stale label", () => {
    expect(component).toMatch(/href: null, evidenceHref: null, window: null/);
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
