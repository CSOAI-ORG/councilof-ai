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
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}
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
