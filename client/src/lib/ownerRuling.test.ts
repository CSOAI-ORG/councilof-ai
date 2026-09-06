import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * OWNER RULING, 6 September 2026:
 *   "no prices on any page, no tiers, no payment processor names — everything is
 *    free or pay-as-you-go x402 at the 402."
 *
 * WHAT THIS FOUND when first run. Rendered copy carried: "Coming — Paddle waitlist" in the
 * site navigation on EVERY page; "Coming — Paddle" on /assess, the home tool stack and the OS
 * launcher; our own prices printed on pages ("$1.00 USDC on Base" on /mcp-fleet, "x402 0.02
 * USD/query" on the Eunomia catalogue and data pages); a "Self-serve · paid tier" badge; "two
 * tiers / the paid tier / the free tier" in the whitepaper and model card; and on /comparison a
 * claim that "the free tier supports up to 3 AI systems" — a tier limit describing a product
 * that, under this ruling, does not exist.
 *
 * WHAT IT DELIBERATELY ALLOWS. The ruling governs OUR commercial terms. An EU AI Act fine of
 * €35 million is the subject matter of the product, not a price; a competitor's published rate
 * in a comparison is not our rate; a liability cap is a legal necessity; and naming a processor
 * in order to say we do NOT use it is the ruling being kept, not broken. Each exemption below
 * carries its reason, and a test asserts every exemption still matches something — an allowlist
 * that outlives its cause quietly becomes a blanket permission.
 */
const SRC = new URL("../", import.meta.url).pathname;

type Allow = { file: string; why: string };

const ALLOW_PRICE: Allow[] = [
  { file: "pages/EUAIActUrgency.tsx", why: "EU AI Act penalty ceilings — the regulation's own figures" },
  { file: "pages/EUAIActCompliance.tsx", why: "EU AI Act penalty ceilings, the regulation own figures" },
  { file: "pages/Article50.tsx", why: "Article 50 penalty ceiling from the regulation" },
  { file: "components/art50/Article50Explained.tsx", why: "Article 50 penalty ceiling from the regulation" },
  { file: "components/art50/Article50Kit.tsx", why: "Article 50 penalty ceiling from the regulation" },
  { file: "pages/GpaiEvidencePack.tsx", why: "GPAI penalty ceiling from the regulation" },
  { file: "pages/Training-v2.tsx", why: "other providers' published rates, quoted as comparison; ours reads FREE" },
  { file: "pages/CobolBridge.tsx", why: "market-size statistic cited to Communications of the ACM" },
  { file: "pages/RegulatoryAuthority.tsx", why: "third-party revenue statistic" },
  { file: "pages/CaseStudies.tsx", why: "a customer's reported saving, not our price" },
  { file: "pages/ProsperityFund.tsx", why: "fund mechanics illustrated with worked examples" },
  { file: "pages/About.tsx", why: "regulatory exposure figure" },
  { file: "pages/legal/TermsOfService.tsx", why: "liability cap — a legal necessity" },
  { file: "pages/AiActBenchmark.tsx", why: "cost of a published run, stated as $0" },
  { file: "pages/NewHome.tsx", why: "third-party earnings figure" },
  { file: "pages/Support.tsx", why: "regex backreference $1 in a replace(), not a currency amount" },
];

const ALLOW_PROCESSOR: Allow[] = [
  { file: "pages/TrustCenter.tsx", why: "subprocessor register stating card payments are RETIRED — a disclosure that we take none" },
  { file: "pages/LicenceManifest.tsx", why: "states the checkout JS is gone (410) and does not sell this rail" },
  { file: "pages/legal/LicensingAgreement.tsx", why: "legal disclaimer that old checkout links do not sell access" },
  { file: "pages/LegacyBridge.tsx", why: "names two companies rhetorically ('X built checkout'), offers nothing" },
];

const ALLOW_TIER: Allow[] = [
  { file: "pages/SocialOS.tsx", why: "describes WhatsApp Business's own tier, not ours" },
  { file: "pages/PlansPage.tsx", why: "the phrase is a DENIAL: 'No subscription, no per-seat tier'" },
  { file: "pages/CharterArticle.tsx", why: "charter text: licensing provisions are governance wording, not ours to reword — flagged to the owner" },
];

const PRICE = /[£$€]\s?\d[\d,]*(?:\.\d{2})?\b|\b\d+(?:\.\d{2})?\s?(?:USD|USDC|GBP|EUR)\b/;
const PROCESSOR = /\b(paddle|stripe|paypal|braintree|adyen|lemonsqueezy|gumroad)\b/i;
const TIER = /\b(paid tier|free tier|two tiers|growing tier|per-seat|pricing tier)\b/i;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".tsx") || COPY_DATA.has(p)) out.push(p);
  }
  return out;
}
// Copy that lives in a .ts data file and is rendered verbatim on a page. The .tsx-only walk
// missed data/home-faq.ts, so "Payment processing is coming via Paddle" stayed on the home
// page after #1502 removed every other mention (06 Sep live walk). Add a file here when it
// carries reader-facing sentences, not when it carries ids, URLs or third-party product names.
const COPY_DATA = new Set([join(SRC, "data/home-faq.ts")]);
const rel = (f: string) => f.split("/client/src/")[1] ?? f;
// what a reader sees: not block comments, line comments or imports
const rendered = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/^\s*import .*$/gm, " ")
   .replace(/["'`]\/stripe-checkout\.js["'`]/g, " "); // a legacy route answering Gone is a removal

const FILES = walk(SRC).filter((f) => !f.includes(".test."));

function offenders(re: RegExp, allow: Allow[]): string[] {
  const skip = new Set(allow.map((a) => a.file));
  const out: string[] = [];
  for (const f of FILES) {
    if (skip.has(rel(f))) continue;
    const m = rendered(readFileSync(f, "utf8")).match(re);
    if (m) out.push(`${rel(f)}: ${m[0]}`);
  }
  return out;
}

describe("the 6 Sep owner ruling holds in rendered copy", () => {
  it("prints no price of ours", () => {
    expect(offenders(PRICE, ALLOW_PRICE), "our price belongs at the 402, never on a page").toEqual([]);
  });
  it("names no payment processor as a way to pay us", () => {
    expect(offenders(PROCESSOR, ALLOW_PROCESSOR)).toEqual([]);
  });
  it("offers no tiers", () => {
    expect(offenders(TIER, ALLOW_TIER)).toEqual([]);
  });
});

describe("the exemptions stay honest", () => {
  for (const [name, allow, re] of [
    ["price", ALLOW_PRICE, PRICE], ["processor", ALLOW_PROCESSOR, PROCESSOR], ["tier", ALLOW_TIER, TIER],
  ] as [string, Allow[], RegExp][]) {
    it(`every ${name} exemption still matches something and says why`, () => {
      const stale: string[] = [];
      for (const a of allow) {
        expect(a.why.length, `${a.file} exempted with no reason`).toBeGreaterThan(20);
        const f = FILES.find((x) => rel(x) === a.file);
        if (!f) { stale.push(`${a.file} (file gone)`); continue; }
        if (!re.test(rendered(readFileSync(f, "utf8")))) stale.push(`${a.file} (no longer matches)`);
      }
      expect(stale, "a stale exemption is a blanket permission — delete it").toEqual([]);
    });
  }
});

/**
 * Page titles were missed by the checks above and carried the clearest violations of all:
 *   "/pricing": "Pricing — AI governance plans & MCP tiers | CSOAI"
 *   "/products": "Council OS — four SKUs, one workspace"      (a typed count)
 * A <title> is what a browser tab and a search result show, so it is the most-read copy we own,
 * and the body-text checks skipped it because "MCP tiers" and "plans" are not the specific
 * phrases those regexes look for. Titles are few and high-visibility, so they get a stricter
 * rule than body text: no bare tier/plan/subscription words, no currency, no typed count.
 */
describe("route titles obey the ruling and type no count", () => {
  const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  const block = app.match(/const ROUTE_TITLES[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1] ?? "";
  // Only the TITLE VALUE is copy. The route key is a URL — /plans may keep its path while its
  // title says the rail is free, and renaming a live route to satisfy a copy rule breaks links.
  const titles = [...block.matchAll(/"[^"]*"\s*:\s*"([^"]*)"/g)].map((m) => m[1]);

  it("finds the title map, so this cannot pass vacuously", () => {
    expect(block.length).toBeGreaterThan(500);
    expect(block).toMatch(/"\/products":/);
    expect(titles.length, "no titles parsed — the guard would be empty").toBeGreaterThan(50);
  });

  it("no title sells a tier, a plan or a subscription", () => {
    const bad = titles.filter((t) => /\b(tier|tiers|plans?|subscription|per-seat)\b/i.test(t));
    expect(bad, "a page title names a tier or plan").toEqual([]);
  });

  it("no title prints a price or a payment processor", () => {
    const bad = titles.filter((t) =>
      /[£$€]\s?\d|\b\d+(?:\.\d{2})?\s?(?:USD|USDC|GBP|EUR)\b|\b(paddle|stripe|paypal)\b/i.test(t));
    expect(bad).toEqual([]);
  });

  it("no title types a count", () => {
    const bad = titles.filter((t) =>
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(SKUs?|tools?|axes|tiers?|models?|servers?)\b/i.test(t));
    expect(bad, "the page's own rule is that no page types a count").toEqual([]);
  });
});

/**
 * JSON-LD is the copy a search engine reads, and the body-text checks above cannot see it: a price
 * there is written `price: "99"` with the currency in a SEPARATE key, so no currency-symbol regex
 * matches it. MCPDetail.tsx carried `price: "99", priceCurrency: "USD", category: "subscription"`
 * on the /mcp/:slug route — one page per MCP server in the registry, every one of them advertising
 * a $99 subscription for a free, permissively-licensed package. Structured data gets its own check.
 */
describe("structured data offers nothing we do not sell", () => {
  it("no JSON-LD price is non-zero", () => {
    // ONLY structured data. A first pass matched every `price:` key and flagged seventeen UI cards
    // reading "Free", "per evaluation", "Market-set" — all compliant, none of them machine-readable
    // offers. Scope to the inside of an Offer block, which is what a search engine renders.
    const bad: string[] = [];
    for (const f of FILES) {
      const src = readFileSync(f, "utf8");
      for (const off of src.matchAll(/@type["'`]?\s*:\s*["'`]Offer["'`][\s\S]{0,220}/g)) {
        const m = off[0].match(/\bprice:\s*["'`]([^"'`]+)["'`]/);
        if (m && m[1].trim() !== "0") bad.push(`${rel(f)}: Offer price "${m[1]}"`);
      }
    }
    expect(bad, "structured data prints a price; the amount belongs at the 402").toEqual([]);
  });

  it("no JSON-LD offer is categorised as a subscription", () => {
    const bad: string[] = [];
    for (const f of FILES) {
      const src = readFileSync(f, "utf8");
      if (/category:\s*["'`]subscription["'`]/i.test(src)) bad.push(rel(f));
    }
    expect(bad, "there are no subscriptions").toEqual([]);
  });

  it("finds JSON-LD at all, so this cannot pass vacuously", () => {
    const withLd = FILES.filter((f) => /@type["'`]?\s*:\s*["'`]Offer/.test(readFileSync(f, "utf8")));
    expect(withLd.length, "no Offer blocks found — the guard would be empty").toBeGreaterThan(0);
  });
});
