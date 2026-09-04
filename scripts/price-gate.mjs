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
const SELFTEST = process.argv.includes("--selftest");
const DIST = path.resolve(REPO, (args[0] && !args[0].startsWith("--")) ? args[0] : "dist/client");

// A currency amount and nothing else: "£5k", "$1,200", "€35", "£10k/yr", "£3.5K-£7.5K".
// Anchored to the whole string, so it only matches a standalone display element.
//
// THE RANGE ARM IS NOT DECORATION. "£3.5K-£7.5K" shipped live on /eu-ai-act-urgency
// against the words "CSOAI measurement credential" and passed BOTH gates. brand-gate
// requires a cadence (/mo, per card) to tell our pricing from a regulation penalty, and
// this pattern required a SINGLE amount. A bare range has neither, so it fell straight
// between them. Ranges are how a price is usually written when it is a quote rather than
// a rate, which is exactly the shape most likely to appear beside a product name.
// Prose is still safe because of the ^...$ anchor: "providers charge £500-2,000" and
// "fines up to €35M" do not match.
//
// THE TRAILING-TICKER ARM IS NOT DECORATION EITHER. "$0.50 USDC" is a price by any reading,
// but this pattern stopped at the number, so naming the currency after it was enough to pass.
// Five invented amounts shipped live on /pay in exactly that shape — see the INLINE note in
// leafTexts for the other half of why they were invisible here.
const BARE_PRICE = /^\s*(?:from\s+)?[£$€]\s?\d[\d,.]*\s*(?:[kKmM]|bn)?\s*(?:[-–—]\s*(?:[£$€]\s?)?\d[\d,.]*\s*(?:[kKmM]|bn)?\s*)?(?:\s*(?:USDC|USDT|USD|GBP|EUR)\b)?\s*(?:\/\s*(?:mo|yr|month|year|seat|user))?\s*(?:\+\s*VAT)?\s*$/i;

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

// A guard that cannot fail enforces nothing. price-gate blocked a deploy today over an operator
// runbook served on the open web, so it has to keep working. This proves each rule still does its
// job without needing a built tree.
//   node scripts/price-gate.mjs --selftest
if (SELFTEST) {
  const checks = [
    ["IS_FREE allows the free-forever commitment", () => IS_FREE.test("$0")],
    ["IS_FREE allows £0.00", () => IS_FREE.test("£0.00")],
    ["IS_FREE does NOT swallow a real price", () => !IS_FREE.test("$49")],
    ["SOCIAL_PROOF catches an unevidenced claim", () => SOCIAL_PROOF.test("most popular")],
    ["SOCIAL_PROOF allows an ordinary word", () => !SOCIAL_PROOF.test("Recommended")],
    ["FOREIGN_MONEY stands down on a penalty", () => FOREIGN_MONEY.test("a fine of up to EUR 15M turnover")],
    ["FOREIGN_MONEY stands down on a grant", () => FOREIGN_MONEY.test("grant of EUR 50,000 from the fund")],
    ["FOREIGN_MONEY does NOT stand down on a bare amount", () => !FOREIGN_MONEY.test("Total potential: 280,000")],
  ];
  let bad = 0;
  for (const [what, fn] of checks) {
    let ok = false;
    try { ok = !!fn(); } catch { ok = false; }
    if (!ok) { console.error(`\u2716 selftest: ${what}`); bad++; }
  }
  if (bad) { console.error(`\u2716 price-gate selftest FAILED (${bad} of ${checks.length})`); process.exit(1); }
  console.log(`\u2713 price-gate selftest: ${checks.length}/${checks.length} rules behave as documented`);
  process.exit(0);
}

// Named exemptions. Each is a DECISION with a reason, not a regex hole — the same shape
// as brand-gate's allowOn. If a page is here, someone judged that its money is not a
// price we are charging. Adding a page requires writing why.
const ALLOW = [
  {
    pages: /^(prosperity|prosperity-fund)\//,
    why: "Fund sizes (the fund's own capital), not a price anyone pays us.",
  },
  {
    pages: /^grants\//,
    why:
      "Grant amounts we are applying FOR — money that would come to us from funders — not a " +
      "price anyone pays us. Same shape as the prosperity exemption above. Verified before " +
      "adding: the page's only money is \"$280K in grants ready to send\", and it prices no " +
      "CSOAI service (no tier, fee, subscription or per-year figure anywhere on it). This " +
      "single finding blocked every production deploy, so the site went 20 hours and 123 " +
      "commits stale on a page that sells nothing.",
  },
  {
    pages: /^(roi|roi-calculator)\//,
    why:
      "Calculator slider bounds and the reader's own inputs echoed back. The page charges " +
      "nothing; the money on it belongs to the visitor's business, not to us.",
  },
  {
    pages: /^grants\//,
    why:
      "Award sizes we would RECEIVE from funders, not a price anyone pays us — the same class " +
      "as the prosperity-fund entry above. The page lists 'Sloan Foundation — $75,000', 'Ford " +
      "Foundation — $100,000' and 'Total potential: $280,000'. FOREIGN_MONEY should have stood " +
      "this down and does not: its \\bfund|grant arm needs one of those words within " +
      "CONTEXT_WINDOW, and the surrounding copy says 'Foundation' and 'application body' " +
      "instead — 'Foundation' does not contain 'fund'. Recorded as a decision rather than " +
      "widened into the regex, because loosening FOREIGN_MONEY to match 'Foundation' would " +
      "stand down real prices on any page that happens to name one. This carve-out cannot " +
      "become a price list: nothing under grants/ is a thing we sell.",
  },
  // EXEMPTION WITHDRAWN 2026-08-26. It read: "contractual fee schedules inside a published
  // legal agreement… the doctrine bans marketing a price, not disclosing the terms of an
  // agreement a party is being asked to sign." That reasoning was defensible and the outcome
  // was not. A front-end audit found the four exempted pages publishing full annual fee
  // tables (£2,500 / £10,000 / £25,000 / £50,000 by revenue band; £500–£25,000+ per system;
  // "Expedited +50% premium"), two of them linked from the footer bottom bar — so the
  // "contract terms" carve-out was functioning as the site's price list. Worse,
  // /licensing-agreement priced "Verified ranking access", which is selling a grade: the one
  // thing the doctrine names outright. The owner ruled "strip ALL public prices" and I
  // introduced this hole on my own judgement. A carve-out that reproduces the thing the rule
  // forbids is not a carve-out.
];
const allowedFor = (rel) => ALLOW.find((a) => a.pages.test(rel));

const walk = (dir, out = [], ext = ".html") => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, ext);
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
};

/**
 * THE JSON SURFACE, and why this gate was blind to it until 2026-09-04.
 *
 * The doctrine is "no public $ prices". On that day the claim was found in TEN separate homes,
 * and this gate — which walks dist/client for HTML — could see none of them, because every one
 * lived in JSON that machines read:
 *
 *   · 10 .well-known game documents with  "price_usdc": 0.50  and an invented "x402_sku"
 *   · 8 public/interop/engine-*.json with "x402_price_usdc": 0.5, likewise invented
 *   · a Python client whose banner printed five amounts matching no SKU at all
 *
 * A machine-readable price is worse than one in HTML, not better: an agent acts on it without a
 * human ever reading the page. And these are the harder kind to catch by eye, because nobody
 * opens a .well-known file to admire it.
 *
 * The check is deliberately narrow — a NUMERIC value under a key that names money. A number is
 * unambiguous in a way prose is not: "price_usdc": 0.5 cannot be a penalty, a fund size or a
 * reader's own input, which is the ambiguity FOREIGN_MONEY exists to handle on the HTML side.
 * Zero is allowed, because "free" is a commitment doctrine requires us to state.
 */
// NAMED "price", not merely denominated in a currency. The first draft of this rule also matched
// a bare currency suffix (usd|eur|gbp|usdc) and produced 21 false positives on the real tree, all
// of them foreign money the estate reports rather than charges:
//   exposure_cap_eur: 15000000        the EU AI Act Art 99(4) fine ceiling
//   distributed_asset_value_usd: …    market TVL cited from rwa.xyz, whose own file says
//                                     "figures are theirs. We hash the page."
//   represented_tvl.usd: …            likewise, in publisher-health
// A gate that flags a penalty ceiling as our price gets switched off, and then it protects
// nothing — which is the failure this file already records for the HTML side. Every genuine
// finding across the ten homes named the field "price" (price_usdc, x402_price_usdc, price_usd),
// so the narrower rule loses no true positive and drops all 21 false ones.
const MONEY_KEY = /price|(^|_)(fee|cost)(_|$)/i;
// Money-shaped names that are never OUR published price, even when they contain one of the above.
const NOT_A_PRICE_KEY = /^(gas_?fee|network_?fee|fee_tier|penalty|fine|turnover|threshold|budget|raised|valuation)$/i;

const jsonPriceFindings = (obj, rel, at = "$", out = []) => {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => jsonPriceFindings(v, rel, `${at}[${i}]`, out));
    return out;
  }
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj)) {
    const here = `${at}.${k}`;
    if (typeof v === "number" && v > 0 && MONEY_KEY.test(k) && !NOT_A_PRICE_KEY.test(k)) {
      out.push({ rel, text: `${k}: ${v}`, rule: "published_price", where: here });
    } else if (typeof v === "object") {
      jsonPriceFindings(v, rel, here, out);
    }
  }
  return out;
};

// Pull the text content of every leaf element (one with no child tags). Those are the
// only places a standalone price can live.
const leafTexts = (html) => {
  const out = [];
  // Strip script/style first — a JS bundle is full of string literals.
  //
  // THEN FLATTEN INLINE TAGS, BEFORE LOOKING FOR LEAVES. The leaf regex below requires an
  // element's content to contain no `<` at all, so ONE inline child hides the whole element
  // from this gate. That is not hypothetical: /pay shipped
  //     <p class="price">$0.50 <span class="price-currency">USDC</span></p>
  // five times and the gate reported the site clean — the <p> was never a "leaf", and the
  // only leaf it did see was the harmless word "USDC". Four of those five amounts matched no
  // SKU in functions/api/_skus.ts at any tier. A guard that any inline <span> switches off is
  // not a guard. Inline elements carry no block meaning, so dropping their tags (never their
  // text) makes a price split across one visible as the single amount it displays as.
  // BOTH PASSES RUN, and that is the whole point. Flattening ALONE is a regression: where a
  // price is the inline child — <p>Total: <strong>$280,000</strong></p> on /grants — the old
  // scan matched the <strong> leaf exactly, and flattening merges it into "Total: $280,000",
  // which the anchored patterns correctly refuse. Caught in review: the flatten-only version
  // found the five /pay amounts and silently stopped reporting the /grants one it had always
  // found. So scan the leaves as authored, THEN scan them flattened, and union the two. The
  // caller already dedupes on text, so a price visible to both passes is reported once.
  const INLINE = /<\/?(?:span|b|strong|em|i|small|sup|sub|a|code|abbr|mark|u|wbr)\b[^>]*>/gi;
  const base = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  for (const cleaned of [base, base.replace(INLINE, "")]) scanLeaves(cleaned, out);
  return out;
};

/** One pass of the leaf scan over already-cleaned HTML, appending {text, ctx} to `out`. */
const scanLeaves = (cleaned, out) => {
  const re = /<([a-z][a-z0-9]*)\b[^>]*>([^<]*)<\/\1>/gi;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const text = m[2].replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
    if (!text) continue;
    // Keep the neighbourhood, tags stripped, so a rule can ask what this money is FOR.
    //
    // STRIP FIRST, THEN MEASURE. This used to slice CONTEXT_WINDOW chars of RAW HTML and
    // strip afterwards, so markup ate the budget: around a price in a table cell, 480 raw
    // chars carried only 123 chars of readable text — not enough to reach the column
    // header saying whose money it is. That is why "£500-2,000" under an "Other Providers"
    // heading was not stood down by FOREIGN_MONEY. Stripping first makes CONTEXT_WINDOW
    // mean what it says: characters a reader would actually see.
    const before = cleaned.slice(0, m.index).replace(/<[^>]+>/g, " ");
    const after = cleaned.slice(m.index + m[0].length).replace(/<[^>]+>/g, " ");
    const ctx = before.slice(-CONTEXT_WINDOW) + " " + text + " " + after.slice(0, CONTEXT_WINDOW);
    out.push({ text, ctx });
  }
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

// Machine-readable surfaces get the same rule. Scanned from the SOURCE tree (public/), because
// these files are served as-is and a prerender is not required to reach them — the gate should
// catch a published price before a build, not after.
const jsonRoot = path.resolve(REPO, "public");
const jsonFiles = walk(jsonRoot, [], ".json");
for (const f of jsonFiles) {
  const rel = path.relative(jsonRoot, f);
  if (allowedFor(rel)) continue;
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    continue; // not our problem here; a malformed JSON file is a different gate's finding
  }
  findings.push(...jsonPriceFindings(doc, rel));
}

console.log(
  `price-gate: scanned ${files.length} page(s) under ${path.relative(REPO, DIST)} ` +
    `and ${jsonFiles.length} JSON file(s) under public/`,
);
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
