// 2026-09-15 end-user test: the footer "Corrections" link opened raw JSON (/api/corrections) and the
// guessable /corrections/ was a 404. The readable ledger already exists: the dashboard attestations
// tab renders /api/corrections entries (DashboardAttestationsPane). The footer points there, and the
// redirect producer sends /corrections and /corrections/ to the same place.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const footer = readFileSync(resolve(__dirname, "Footer.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const redirects = readFileSync(resolve(__dirname, "../../../scripts/generate-redirects.mjs"), "utf8");
const pane = readFileSync(resolve(__dirname, "DashboardAttestationsPane.tsx"), "utf8");

const correctionsHref = (): string => {
  const m = footer.match(/\{\s*name:\s*'Corrections',\s*href:\s*'([^']+)'[^}]*\}/);
  if (!m) throw new Error("footer has no Corrections link");
  return m[1];
};

describe("footer Corrections link lands on a readable page", () => {
  it("is not a raw JSON endpoint and names a route the app defines", () => {
    const href = correctionsHref();
    expect(href.startsWith("/api/")).toBe(false);
    const path = href.split(/[?#]/)[0];
    expect(app).toContain(`<Route path="${path}"`);
  });

  it("lands on the tab that renders the /api/corrections entries", () => {
    expect(correctionsHref()).toBe("/dashboard?tab=attestations");
    expect(pane).toContain('getJson<CorrectionsDoc>("/api/corrections"');
    expect(pane).toContain('data-testid="correction-entry"');
  });

  it("the guessable /corrections and /corrections/ redirect there instead of 404ing", () => {
    for (const from of ["/corrections", "/corrections/"]) {
      const rule = redirects.split("\n").find((l) => new RegExp(`^\\s*"${from.replace(/\//g, "\\/")}\\s`).test(l));
      expect(rule, `no redirect rule for ${from}`).toBeTruthy();
      expect(rule).toMatch(/\/dashboard\?tab=attestations\s+30[278]/);
    }
  });
});
