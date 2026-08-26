#!/usr/bin/env node
/**
 * price-gate — find PUBLISHED PRICES and UNEVIDENCED POPULARITY CLAIMS in shipped HTML.
 *
 * WHY A NAIVE CURRENCY REGEX IS USELESS HERE. This site legitimately prints a great deal
 * of money: EU AI Act penalties (€35M / 7% turnover), competitor course fees ("other
 * providers charge £500-2,000"), market sizes, fund figures, ROI arithmetic. A gate that
 * flags every "£" would fire on ~34 files, be switched to continue-on-error within a day,
 * and join facts-gate as decoration. That is the failure mode this repo already learned:
 * a gate nobody can leave blocking is not a gate.
 *
 * THE STRUCTURAL TELL. A *price* is a currency amount standing ALONE as a display element —
 *     <div class="text-3xl font-black">£5k</div>
 * Money in *prose* is embedded in a sentence — "fines up to €35M", "providers charge £500".
 * So this gate flags a currency amount only when it is the ENTIRE text content of an
 * element. That is how a price tag renders and almost never how a sentence mentions money.
 * Tight signal, near-zero false positives, therefore safe to leave blocking.
 *
 * IT ALSO CATCHES UNEVIDENCED POPULARITY. "Most Popular" / "Best Value" / "Recommended"
 * on a tier card is a claim about customer behaviour. On a product with no published
 * customer count it is fabricated social proof — the same defect class as the unverified
 * counters the counter-lint already kills, and a worse one than the price beside it,
 * because a price is a decision while "Most Popular" is an assertion about the world.
 *
 * Usage:  node scripts/price-gate.mjs [dist/client]     (default dist/client)
 * Exit 1 on any finding. --report prints findings and exits 0 (for triage runs).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2).filter((a) => a !== "--report");
const REPORT_ONLY = process.argv.includes("--report");
const DIST = path.resolve(REPO, args[0] || "dist/client");

// A currency amount and nothing else: "£5k", "$1,200", "€35", "£10k/yr", "Free".
// Anchored to the whole string, so it only matches a standalone display element.
const BARE_PRICE = /^\s*(?:from\s+)?[£$€]\s?\d[\d,.]*\s*(?:[kKmM]|bn)?\s*(?:\/\s*(?:mo|yr|month|year|seat|user))?\s*(?:\+\s*VAT)?\s*$/;

// Popularity claims — assertions about what OTHER CUSTOMERS chose.
// "Recommended" was in this list and was WRONG: on /regulatory-compliance it is a
// regulatory-status value in a framework comparison table — NIST AI RMF *recommends*
// human oversight where the EU AI Act *requires* it. That is a true statement about a
// framework's stance, not social proof, and flagging it would have pushed someone to
// delete accurate information to satisfy a gate. A gate that forces a true claim off a
// page is worse than no gate. The phrases below are unambiguous; "Recommended" is not.
const SOCIAL_PROOF = /^\s*(?:most\s+popular|best\s+value|most\s+chosen|customer\s+favou?rite|top\s+pick)\s*$/i;

// £0 / $0 / "Free" is not a price — it is the free-forever commitment, which doctrine
// requires us to state. Never flag it.
const IS_FREE = /^\s*(?:from\s+)?[£$€]\s?0(?:\.00)?\s*$/;

// A standalone amount is still not OUR price when the surrounding copy makes it someone
// else's money. Verified against the real dist: "€15M"/"€30M" are EU AI Act penalties,
// the ROI calculator prints the READER's inputs back at them, and the prosperity-fund
// figures are fund sizes. Flagging those would put ~13 false positives in a blocking
// gate, and a gate that cries wolf gets set to continue-on-error and stops mattering.
// So: look at the ~240 chars either side of the hit and stand down on foreign money.
const FOREIGN_MONEY =
  /\bfine|penalt|sanction|turnover|up to|maximum|fund|grant|raise[sd]?\b|valuation|revenue|ARR|market size|competitor|other providers|elsewhere|typical(?:ly)?|charge[sd]?\b|average|estimate|savings?|cost of|budget|salary|calculator|your\b|annulled|GDPR|enforcement|free\s+(?:training|tier)/i;
const CONTEXT_WINDOW = 240;

// Named exemptions. Each is a DECISION with a reason, not a regex hole — the same shape
// as brand-gate's allowOn. If a page is here, someone judged that its money is not a
// price we are charging. Adding a page requires writing why.
const ALLOW = [
  {
    pages: /^(prosperity|prosperity-fund)\//,
    why: "Fund sizes (the fund's own capital), not a price anyone pays us.",
  },
  {
    pages: /^(roi|roi-calculator)\//,
    why:
      "Calculator slider bounds and the reader's own inputs echoed back. The page charges " +
      "nothing; the money on it belongs to the visitor's business, not to us.",
  },
  {
    pages: /^(legal\/licensing|legal\/membership|licensing-agreement|membership-agreement)\//,
    why:
      "Contractual fee schedules inside a published legal agreement. A contract that hides " +
      "its own fees is worse than one that states them; the doctrine bans marketing a price, " +
      "not disclosing the terms of an agreement a party is being asked to sign.",
  },
];
const allowedFor = (rel) => ALLOW.find((a) => a.pages.test(rel));

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
};

// Pull the text content of every leaf element (one with no child tags). Those are the
// only places a standalone price can live.
const leafTexts = (html) => {
  const out = [];
  // Strip script/style first — a JS bundle is full of string literals.
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const re = /<([a-z][a-z0-9]*)\b[^>]*>([^<]*)<\/\1>/gi;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const text = m[2].replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
    if (!text) continue;
    // Keep the neighbourhood, tags stripped, so a rule can ask what this money is FOR.
    const ctx = cleaned
      .slice(Math.max(0, m.index - CONTEXT_WINDOW), m.index + m[0].length + CONTEXT_WINDOW)
      .replace(/<[^>]+>/g, " ");
    out.push({ text, ctx });
  }
  return out;
};

const files = walk(DIST);
if (!files.length) {
  console.error(`price-gate: no HTML under ${DIST} — nothing scanned. Did the prerender run?`);
  process.exit(2);
}

const findings = [];
for (const f of files) {
  const rel = path.relative(DIST, f);
  const seen = new Set();
  for (const { text: t, ctx } of leafTexts(fs.readFileSync(f, "utf8"))) {
    if (seen.has(t)) continue;
    if (BARE_PRICE.test(t) && !IS_FREE.test(t)) {
      if (FOREIGN_MONEY.test(ctx)) continue; // someone else's money, not our price
      if (allowedFor(rel)) continue; // named exemption, reason recorded in ALLOW
      seen.add(t);
      findings.push({ rel, text: t, rule: "published_price" });
    } else if (SOCIAL_PROOF.test(t)) {
      seen.add(t);
      findings.push({ rel, text: t, rule: "unevidenced_popularity" });
    }
  }
}

console.log(`price-gate: scanned ${files.length} page(s) under ${path.relative(REPO, DIST)}`);
if (!findings.length) {
  console.log("✓ price-gate: no published price and no unevidenced popularity claim.");
  process.exit(0);
}

const byRule = (r) => findings.filter((x) => x.rule === r);
for (const rule of ["published_price", "unevidenced_popularity"]) {
  const hits = byRule(rule);
  if (!hits.length) continue;
  const why =
    rule === "published_price"
      ? 'Doctrine: no public prices. Verification is free forever; a grade is never sold. Quote a service privately — never print a tier price on a public page.'
      : 'A popularity claim is a statement about other customers. Without a published customer count it is fabricated social proof.';
  console.error(`\n✗ ${rule} — ${hits.length} finding(s)\n  ${why}`);
  for (const h of hits) console.error(`    ${h.rel}: "${h.text}"`);
}
console.error(`\nprice-gate: ${findings.length} finding(s).`);
process.exit(REPORT_ONLY ? 0 : 1);
