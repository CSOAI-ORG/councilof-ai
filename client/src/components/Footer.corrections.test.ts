// 2026-09-15 end-user test: the footer "Corrections" link opened raw JSON (/api/corrections) and the
// guessable /corrections/ was a 404. It then pointed at the dashboard attestations tab.
// 2026-09-26 (regulator-persona audit): /corrections is a routed page of its own
// (client/src/pages/Corrections.tsx) that renders /api/corrections. The footer links its served
// slash form directly, and no redirect rule sends /corrections anywhere else.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const footer = readFileSync(resolve(__dirname, "Footer.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const redirects = readFileSync(resolve(__dirname, "../../../scripts/generate-redirects.mjs"), "utf8");
const page = readFileSync(resolve(__dirname, "../pages/Corrections.tsx"), "utf8");
const primary = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
const prerender = readFileSync(resolve(__dirname, "../../../scripts/prerender.mjs"), "utf8");
const seoHead = JSON.parse(readFileSync(resolve(__dirname, "../data/seo-head.json"), "utf8"));

const correctionsHref = (): string => {
  const m = footer.match(/\{\s*name:\s*'Corrections',\s*href:\s*'([^']+)'[^}]*\}/);
  if (!m) throw new Error("footer has no Corrections link");
  return m[1];
};

describe("footer Corrections link lands on a readable page", () => {
  it("is not a raw JSON endpoint and names a route the app defines", () => {
    const href = correctionsHref();
    expect(href.startsWith("/api/")).toBe(false);
    const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
    expect(app).toContain(`<Route path="${path}"`);
  });

  it("lands on /corrections, the page that renders the /api/corrections entries", () => {
    expect(correctionsHref()).toBe("/corrections/");
    expect(app).toContain('<Route path="/corrections" component={Corrections} />');
    expect(page).toContain('fetch("/api/corrections"');
    expect(page).toContain('data-testid="correction-entry"');
  });

  it("is wired as a primary, prerendered, titled page — not archived, not redirected", () => {
    expect(primary).toMatch(/^\s*"\/corrections",/m);
    expect(prerender).toMatch(/CLIENT_ONLY_FUNCTION_ROUTES = new Set\(\[[\s\S]*?"\/corrections",/);
    expect(seoHead.routes["/corrections"]?.title).toBeTruthy();
    for (const from of ["/corrections", "/corrections/"]) {
      const rule = redirects.split("\n").find((l) => new RegExp(`^\\s*"${from.replace(/\//g, "\\/")}\\s`).test(l));
      expect(rule, `a redirect rule still sends ${from} elsewhere`).toBeFalsy();
    }
  });
});
