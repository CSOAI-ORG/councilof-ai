import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DASHBOARD_NAV_GROUPS,
  LOBBY_ROUTES,
  LOBBY_TABS,
} from "@/components/lobby/tabs";
import { PLAY_CARDS } from "@/components/lobby/play";

/**
 * The Council OS menu is localised through the estate's i18next layer (13 locale
 * files). These controls hold the wiring shut:
 *  - every locale carries the SAME dashboard key set (parity), so no language
 *    can silently lose a section;
 *  - every nav group id and every heading used by the shell has a dashboard
 *    key in en-US (the fallback root);
 *  - the new games/academy doors respect ONE DESTINATION, ONE OWNER;
 *  - every new localised string passes the same brand-gate leak pattern the
 *    menu copy test applies (no operator instructions in any language).
 */
const LOCALES_DIR = resolve(__dirname, "../locales");
const LOCALES = [
  "en-US", "en-GB", "fr", "de", "es", "it", "nl", "pl", "pt", "sv", "da", "fi", "zh-CN",
] as const;

function loadDashboard(locale: string): Record<string, unknown> {
  const raw = JSON.parse(readFileSync(resolve(LOCALES_DIR, `${locale}.json`), "utf8")) as {
    dashboard?: Record<string, unknown>;
  };
  expect(raw.dashboard, `${locale}.json must carry a dashboard subtree`).toBeTruthy();
  return raw.dashboard as Record<string, unknown>;
}

function flatten(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k),
  );
}

function stringsOf(value: unknown): string[] {
  if (value === null || typeof value !== "object") return [];
  return Object.values(value as Record<string, unknown>).flatMap((v) =>
    typeof v === "string" ? [v] : stringsOf(v),
  );
}

describe("dashboard menu localisation wiring", () => {
  const dashboards = Object.fromEntries(LOCALES.map((l) => [l, loadDashboard(l)]));
  const enUS = dashboards["en-US"];
  const enKeys = flatten(enUS).sort();

  it("every locale carries the same dashboard key set (parity)", () => {
    for (const locale of LOCALES) {
      expect(flatten(dashboards[locale]).sort(), `${locale} key set`).toEqual(enKeys);
    }
  });

  it("every nav group id has label+description keys in en-US", () => {
    const groups = enUS["groups"] as Record<string, Record<string, string>>;
    for (const group of DASHBOARD_NAV_GROUPS) {
      expect(groups[group.id]?.label, `groups.${group.id}.label`).toBeTruthy();
      expect(groups[group.id]?.description, `groups.${group.id}.description`).toBeTruthy();
    }
  });

  it("chrome keys exist: menu title, brand, tagline, headings, support, language", () => {
    expect(enUS["title"]).toBe("Menu");
    expect(enUS["brand"]).toBe("Council OS");
    expect(typeof enUS["tagline"]).toBe("string");
    const headings = enUS["headings"] as Record<string, string>;
    expect(headings["more"]).toBe("More");
    expect(typeof enUS["support"]).toBe("string");
    expect(typeof enUS["language"]).toBe("string");
  });

  it("the games and academy doors exist exactly once and never collide with LOBBY_ROUTES", () => {
    const rulerTabs = LOBBY_TABS.filter((t) => t.path === "/games/ruler");
    const academyTabs = LOBBY_TABS.filter((t) => t.path === "/academy");
    expect(rulerTabs).toHaveLength(1);
    expect(academyTabs).toHaveLength(1);
    const routePaths = LOBBY_ROUTES.map((r) => r.path.replace(/\/$/, ""));
    for (const p of ["/games/ruler", "/academy"]) {
      expect(routePaths).not.toContain(p);
    }
    // Every route path is unique across the whole destination space.
    const allPaths = [...LOBBY_TABS.map((t) => t.path), ...routePaths].filter(Boolean);
    expect(new Set(allPaths).size).toBe(allPaths.length);
  });

  it("the H.I.M. door exists exactly once, with keys in every locale and an honest blurb", () => {
    const himTabs = LOBBY_TABS.filter((t) => t.path === "/him");
    expect(himTabs).toHaveLength(1);
    expect(LOBBY_ROUTES.map((r) => r.path.replace(/\/$/, ""))).not.toContain("/him");
    expect(himTabs[0].blurb).toMatch(/does not certify/i);
    for (const locale of LOCALES) {
      const tabs = dashboards[locale]["tabs"] as Record<string, Record<string, string>>;
      expect(tabs["him"]?.label, `${locale} tabs.him.label`).toBeTruthy();
      expect(tabs["him"]?.blurb, `${locale} tabs.him.blurb`).toBeTruthy();
    }
  });

  it("THE RULER is a playable card in the gallery with an honest reality line", () => {
    const card = PLAY_CARDS.find((c) => c.id === "ruler");
    expect(card).toBeTruthy();
    expect(card!.status).toBe("route");
    expect(card!.route).toBe("/games/ruler");
    expect(card!.chip).toBe("playable now");
    expect(card!.reality).toMatch(/not another person|not collected|practice/i);
  });

  it("no localised dashboard string carries an operator instruction", () => {
    const gate = readFileSync(
      resolve(__dirname, "../../../scripts/brand-gate.mjs"),
      "utf8",
    );
    const block = gate.slice(gate.indexOf('id: "agent_instruction_leak"'));
    const literal = block.match(/pattern: \/(.+)\/i,\n/);
    expect(literal, "leak pattern found in brand-gate").toBeTruthy();
    const LEAK = new RegExp(literal![1], "i");
    const hits: string[] = [];
    for (const locale of LOCALES) {
      for (const text of stringsOf(dashboards[locale])) {
        if (LEAK.test(text)) hits.push(`${locale}: ${text}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
