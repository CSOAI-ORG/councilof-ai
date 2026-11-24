/**
 * /investors/ (24 Nov 2026): the company brief tells the front door's story. It names Council of
 * AI as the public name of CSOAI Ltd, as /about/ and the lead of /llms.txt do, links every outside
 * claim to the third party's own record, and carries no certification or accreditation wording, no
 * subscription tier and no per-unit price.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import Investors from "./Investors";

const html = renderToStaticMarkup(<Router ssrPath="/investors/"><Investors /></Router>);
const text = html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

describe("/investors/ tells the front-door story", () => {
  it("names Council of AI as the public name of CSOAI Ltd and says payment never buys a result", () => {
    expect(text).toContain("Council of AI is the public name of CSOAI Ltd");
    expect(text).not.toContain("trading name");
    expect(text).toContain("AI models, agents and the systems they call");
    expect(text).toContain("Payment never buys a better result");
    expect(html).toContain('href="/how-we-work/"');
    expect(text).toContain("holds no designation, registration or licence under any AI-verification or AI-audit scheme");
  });

  it("links every outside claim to the third party's own record", () => {
    const section = html.match(/aria-labelledby="inv-outside"[\s\S]*?<\/section>/)?.[0] ?? "";
    const items = [...section.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item).toMatch(/href="https:\/\/[a-z0-9.-]+\//);
  });

  it("carries no certification or accreditation wording, no subscription tier and no per-unit price", () => {
    expect(text).not.toMatch(/certif|accredit/i);
    expect(text).not.toMatch(/subscription|\bplans?\b|\btiers?\b|\bSaaS\b/i);
    // "leading the company" is a verb about the founder; the superlatives are what may not appear.
    expect(text).not.toMatch(/world'?s first|\bthe leading\b|(?:industry|world)-leading|most advanced/i);
    expect(text).not.toMatch(/(?:£|\$|€)\s?\d[\d,.]*\s?(?:\/|\bper\s)(?:mo\b|month|year|card|seat|user|call|run)/i);
  });
});
