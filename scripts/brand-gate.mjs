#!/usr/bin/env node
/**
 * brand-gate — the audit §6.2 kill-string gate, done at the RIGHT layer.
 *
 * WHY THIS SCANS RENDERED OUTPUT, NOT SOURCE. A first attempt lived in counter-lint over
 * client/src and produced 219 false positives: a killed URL's redirect must still declare
 * `<Route path="/byzantine">` to catch the old link; component identifiers (CrownJewels,
 * AboutCEASAI) and code comments legitimately name the thing they remove. None of those RENDER
 * as a claim. So this gate runs AFTER prerender and scans the VISIBLE TEXT of the shipped HTML
 * (scripts/styles/tags stripped) plus the static text files. A word only trips the gate if a
 * human or an answer engine would actually read it on the page.
 *
 * Usage:  node scripts/brand-gate.mjs [dist/client]      (default dist/client)
 * Exit 1 on any forbidden DISPLAY string outside its allowlisted retraction-history pages.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.resolve(REPO, process.argv[2] || "dist/client");

// Each rule: a forbidden DISPLAY pattern + WHY. `allowOn` (optional) is a path regex for pages
// that legitimately QUOTE the term to retract/document it (the "refutation-ledger historical
// context" the audit explicitly carves out). Everything else is a hard fail.
// TUI 4 weekend checklist — every ship, rendered copy:
//   certify / CSOAI Certified / sov33 / Inspect model-judge / 2410 stickers /
//   GPAI Code signature / rank-for-sale / 2 Nov 2026 cliff / MEASURED-INDEX-v0.1.
const RULES = [
  {
    id: "retracted_fault_tolerance",
    pattern: /\bbyzantine\b|\bBFT\b|fault[\s-]?toleran(?:t|ce)/i,
    // The retraction itself, the ledger, the charter and the design/method notes may name it.
    allowOn: /refut|retract|ledger|counter-?canon|charter|methodolog|quorum/i,
    // …and ANY page may DISCLOSE the retraction — the point is to block the ASSERTION, not the
    // honest "this claim was retracted / is unproven". If a retraction marker sits within ~90
    // chars of the hit, it is disclosure, not a claim, and passes. ("Our 33-agent council…live
    // fault-tolerance is unproven (n_eff 1.21 of 3)" is exactly the copy we WANT to keep.)
    nearAllow: /retract|withdrawn|unproven|not\s+(?:be\s+)?fault|n_eff|correlat|no longer|is unproven|designed|theatre|effective.{0,10}vote/i,
    why: 'RETRACTED 2026-07-29 — "Byzantine/BFT/fault-tolerant" asserts the withdrawn claim (n_eff≈1.21/3). Use "designed 33-agent council" + "23/33 threshold".',
  },
  {
    id: "sovereign_brand",
    pattern: /\bsovereign\b/i,
    why: 'De-branded surface: "Sovereign" is not the product name. Use Council / Council Signal / the measurement engine.',
  },
  {
    id: "internal_codenames",
    // sov3 / sov33 / sov34 (and hyphenated variants like sov33-dist-c3), SOVOS,
    // dorado, cibola — internal names, never public. Caught live on /benchmarks
    // 2026-08-25 because this class was missing from the gate.
    pattern: /\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b/i,
    why: "Internal codename on a public surface. Use the public-canon name (Council / the fine-tune's neutral description).",
  },
  {
    id: "defoneos_codename",
    // Kill standalone DEFONEOS / DEFONEOS-SEAL as product copy. Do not trip
    // measured model IDs (clan-defoneos-plain) or published MCP artifact names
    // (csoai-defoneos-mcp) — renaming those would falsify the record.
    // /status and /system may name the 2026-07-31 cross-wired deploy.
    pattern: /(?<![A-Za-z0-9-])defoneos(?:-seal)?(?![A-Za-z0-9-])/i,
    allowOn: /status|system|refut|retract|ledger|counter-?canon/i,
    why: "Internal product name. Public credential is the Ed25519-signed GSPC card.",
  },
  {
    id: "cert_overclaim",
    // No trailing \b: CamelCase-derived titles concatenate the brand ("CEASAITraining"
    // shipped on /library because \bCEASAI\b missed it — qa-sweep 2026-08-19).
    pattern: /\bCEASAI/i,
    why: 'CSOAI issues measurement credentials, not certifications. "CEASAI" is killed.',
  },
  {
    id: "framework_overclaim",
    pattern: /\b30\s+(?:regulatory\s+)?frameworks\b|\b26\s+frameworks\b|1,686\s+controls/i,
    why: '"30/26 frameworks" and "1,686 controls" are unevidenced. Live counts live at GET /api/gspc.',
  },
  {
    id: "first_card_price_imply",
    pattern: /first card.{0,24}free/i,
    why: 'Implies later cards are sold. HO.2: a grade is never sold. Say verify stays free.',
  },
  {
    id: "pricing_leak",
    // HO.2 (ruled): no pricing on any public surface — verification is free forever, a grade is
    // never sold. Two priced strings ($0.005/card on /start, $45–150/hr on /about) shipped live
    // and were caught only by the manual qa-sweep 2026-08-19. This makes it a hard build-fail:
    // a currency amount bound to a per-unit or subscription cadence is OUR pricing (distinct from
    // regulation PENALTY amounts, which read "€35M or 7%", never "/mo" or "/card").
    pattern: /(?:£|\$|€)\s?\d[\d,.]*\s?(?:[-–]\s?(?:£|\$|€)?\s?\d[\d,.]*)?(?:\/|\bper\s)(?:mo\b|month|year|yr\b|card|hr\b|hour|seat|user|assessment|report|query|call|run)/i,
    // A page may DISCLOSE the no-pricing rule ("we never charge £/$ per anything") near the hit.
    nearAllow: /free\s+forever|never\s+(?:sold|charge|priced)|no\s+pricing|not\s+for\s+sale|a\s+grade\s+is\s+never/i,
    why: 'HO.2: no pricing on public surfaces — verification is free forever, a grade is never sold. Remove the amount.',
  },
  {
    id: "internal_strategy_codename",
    pattern: /crown[\s-]?jewels?|goldmines|black swans|\bOWEM\b|\bSIGIL\b/i,
    why: "Internal strategy / codename was never for the public surface.",
  },
  {
    id: "gpai_code_signature",
    pattern: /signed the GPAI Code|GPAI Code of Practice signator|we (?:have )?signed (?:the )?GPAI Code/i,
    nearAllow: /do not sign|not a signator|we do not sign|not sign the GPAI/i,
    why: "We are not a GPAI Code signatory. Transparency CoP (detection/marking tool) only, if signed. C2PA remains planned until CR-012 is live.",
  },
  {
    id: "certify_claim",
    // Product-offer strings only. Retraction copy ("we do not certify", "never
    // certification", "we certify nothing") must keep shipping — nearAllow
    // covers those. Do not use a blanket certif* pattern: /library still lists
    // retired /how-it-works/certification paths as index text.
    // Includes "CSOAI Certified" via \bCSOAI certif (no trailing \b — CamelCase).
    pattern: /\bget certified\b|\bwe certify\b|\bcertified by CSOAI\b|\bCSOAI certif/i,
    nearAllow: /we certify nothing|do not certify|does not certify|never certify|certify nothing|not certify|no such mark|issues no certif|misrepresent.{0,40}certif|certificate shop|training record/i,
    why: 'Measurement credential, never certification. Do not offer "get certified".',
  },
  {
    id: "rank_for_sale",
    // Three paid arms only: Run/re-attest, Ledger (feed/packs), Data (corpus).
    // Verify is free. A public rank / score / grade is never the SKU.
    // Retraction ("never a purchased public rank", "can never buy a score") stays.
    pattern: /rank for sale|bought rank|buy a (?:rank|ranking|score|grade)|purchased public rank|sell(?:ing)? (?:the |a )?(?:score|rank|grade)|score for sale|paid (?:public )?rank/i,
    nearAllow: /never (?:a )?(?:bought|purchased|buy)|never (?:the |a )?(?:score|rank|grade)|never sell|do not sell|does not sell|grade is never sold|a grade is never sold|a rank is never sold|can never buy a score|nobody ranked pays|not for sale|whoever is selling/i,
    why: "Paid arms are Run/re-attest, Ledger, and Data. A rank or score is never sold. Verify is free.",
  },
  {
    id: "inspect_scorer",
    // GSPC grade is the estate harness + Ed25519 card. Inspect AI / LLM-as-judge
    // is not the scorer. Do not trip "Quality inspection", PyPI inspect-signed-receipt,
    // or honest "no LLM-as-judge" methodology copy.
    pattern: /inspect[\s_-]?(?:ai\s+)?scorer|\binspect_ai\b.{0,24}scorer|model_graded_fact|llm[\s-]?as[\s-]?judge|model[\s-]?as[\s-]?judge/i,
    nearAllow: /no llm[\s-]?as[\s-]?judge|not llm[\s-]?as[\s-]?judge|not (?:an? )?inspect|not (?:a )?model[\s-]?as[\s-]?judge|do not wrap|harness is not inspect|no `?model_graded_fact|never .{0,20}llm[\s-]?as[\s-]?judge/i,
    why: "GSPC grade is the estate harness + signed card, not Inspect / model-judge. Do not wrap a bank in Inspect model_graded_fact.",
  },
  {
    id: "false_art50_nov",
    // EUR-Lex: Art 50 applied 2 Aug 2026; some marking 2 Dec 2026; Annex III 2 Dec 2027.
    // "2 Nov 2026" / "November 2026 cliff" is a dead Digital-Omnibus rumour.
    pattern: /2\s+Nov(?:ember)?\s+2026|November 2026 cliff/i,
    nearAllow: /not 2 Nov|wrong date|EUR-Lex|2 August 2026|2 Aug 2026/i,
    why: "EUR-Lex only: Art 50 applied 2 Aug 2026; marking grace 2 Dec 2026; Annex III 2 Dec 2027. There is no 2 Nov 2026 cliff.",
  },
  {
    id: "hub_queue_stickers",
    // 2410 is the Hub queue length (all UNMEASURED). Do not ship 2410 scores/stickers.
    // Negative lookahead skips arXiv 2410.07959. nearAllow keeps the honest queue sentence.
    pattern: /\b2,?410\b(?!\.\d).{0,48}(?:sticker|badge|scores?|leaderboard|VALID cards?)|(?:sticker|badge|scores?|leaderboard).{0,48}\b2,?410\b(?!\.\d)/i,
    nearAllow: /unmeasured|named sites|hub-queue|empty stays empty|status_all|no score/i,
    why: "hub-queue is 2410 named UNMEASURED ids, not 2410 scores or stickers. Empty stays empty.",
  },
  {
    id: "measured_index_sticker",
    // C-2026-0826-05: MEASURED-INDEX-v0.1 was an over-claim. Keep the correction
    // until NEW signed cards exist. Disclosure of the withdrawn label stays.
    pattern: /MEASURED-INDEX-v0\.1/i,
    nearAllow: /over-claim|overclaim|superseded|C-2026-0826-05|withdrawn|do not restore|correction/i,
    why: "C-2026-0826-05: MEASURED-INDEX-v0.1 is withdrawn. Board GET /api/gspc is UNMEASURED until a new card. Do not restore the sticker.",
  },
  {
    id: "infra_leak",
    // Any localhost:<port>, not just 4400: prerender binds an OS-assigned port unless --port
    // is passed, so a missed canonical rewrite can now bake ANY port into the shipped HTML.
    pattern: /localhost:\d+|os\.meok\.ai|oracle-micro/i,
    why: "Infra hostname / staging origin must not ship. Use the public API councilof.ai/api/gspc.",
  },
];

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ") // JS bundle tags + JSON-LD
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")                              // all remaining tags → route paths in href etc. drop with the tag
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}

// TRACKED DEBT — secondary surfaces excluded from the gate for now. These are NOT the primary
// buyer-facing site; each needs a dedicated pass:
//   - regulator-console  a RAW measured-results table whose rows are real model IDs
//                        (sov-sovereign-v4-mined-latest, clan-sovereignty-cited from the
//                        2026-08-01 sweep) — renaming them would falsify the measured record.
//   - mcp registry       the ~300-entry MCP dump renders PUBLISHED artifact names
//                        ("BFT Progress Council MCP", "Global BFT Governance Pack", "Based on
//                        Sovereign Temple architecture"). Renaming those is an owner decision at
//                        the artifact source, not a site edit — and audit §2.2 already flags the
//                        whole registry for a curation rewrite. Gated again after that rewrite.
// (The legacy public/tools/ DEFONEOS dashboards were DELETED, not de-branded — off-brand junk
// with unevidenced counters and defence overclaims that never belonged on councilof.ai.)
// The core SPA + identity + killed pages + primary statics (globe, arena, llms/ai/robots) ARE
// gated. Remove an entry here only once that surface has had its own de-brand pass.
//   - refutation-ledger  the honest evidence/retraction page — renders real measured model IDs
//                        (sov-sovereign-v4-mined-latest), SIGIL evidence hashes, and the
//                        Byzantine/BFT RETRACTION history. All legitimate in this exact context.
//   - j-space            the signed-event data artifact viewer — embeds the real 205KB
//                        signature-chain events.json (event world dashboard). It renders the
//                        estate's own production signature-chain records, NOT a marketing claim;
//                        "sigil" appears only as the name of the signed-event chain it visualizes,
//                        the same data-artifact category as regulator-console/refutation-ledger.
const EXCLUDE_PAGES = /(^|\/)(regulator-console\.html$|refutation-ledger(\/|\.html|$)|mcps?(\/|\.html|$)|mcp-|ai-transparency|authority|badges|j-space(\/|\.html|$))/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "assets" || e.name === "vendor") continue; // hashed bundles/static packs
      walk(full, out);
    } else if (/\.(html|txt)$/.test(e.name) && !EXCLUDE_PAGES.test("/" + path.relative(DIST, full))) {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error(`brand-gate: dist not found at ${path.relative(REPO, DIST)} — run the build+prerender first.`);
  process.exit(2);
}

// PATH + PUBLIC-JSON SWEEP (added 2026-08-26 after a live breach).
// The page-content walk above scans .html/.txt only, so an internal codename shipped
// publicly for months as a ROUTE PATH and a JSON FILENAME: /api/dorado and
// /arena/dorado_market.json both served 200 while this gate reported clean. A URL is a
// public surface. So: every served path, and the body of every public .json, is checked.
const PATH_BANNED = /\b(sovos|sov3\d*|dorado|cibola|ceasai)\b/i;
function walkAll(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "assets" || e.name === "vendor") continue;
      walkAll(full, out);
    } else out.push(full);
  }
  return out;
}
// A codenamed path that ONLY 308s to a current page is the deliberate "library, don't
// delete" retirement pattern — it catches old links and serves no content. That is
// allowed. A codenamed path that serves real content is not.
const isRedirectOnly = (raw) =>
  /\b30[178]\b/.test(raw) && !/<body[^>]*>[\s\S]{400,}/i.test(raw);

const pathFailures = [];
for (const f of walkAll(DIST)) {
  const rel = "/" + path.relative(DIST, f);
  if (PATH_BANNED.test(rel)) {
    let raw = "";
    try { raw = fs.readFileSync(f, "utf8"); } catch { /* binary */ }
    if (raw && isRedirectOnly(raw)) continue;   // retirement redirect — allowed
    pathFailures.push(`${rel}  [served-path] internal codename on a PUBLIC URL that serves content — rename it`);
    continue;
  }
  if (f.endsWith(".json")) {
    // Signed measurement cards / chain / index carry the real model id
    // (sov33-v7:latest). Renaming them would falsify the Ed25519 record.
    // Same carve-out as regulator-console — evidence, not marketing display.
    if (/^\/signed\//.test(rel)) continue;
    let raw = "";
    try { raw = fs.readFileSync(f, "utf8"); } catch { continue; }
    const m = raw.match(PATH_BANNED);
    if (m) pathFailures.push(`${rel}  [public-json] "${m[0]}" in a publicly served JSON body`);
  }
}
// functions/ route files are public URLs too — check the source tree, not just dist.
// Same carve-out: a route whose whole job is to 308 an old link is the retirement pattern.
const FUNCS = path.join(REPO, "functions");
for (const f of walkAll(FUNCS)) {
  const rel = "/" + path.relative(FUNCS, f).replace(/\.(ts|js)$/, "");
  if (!PATH_BANNED.test(rel)) continue;
  let raw = "";
  try { raw = fs.readFileSync(f, "utf8"); } catch { continue; }
  if (/\b30[178]\b/.test(raw) && raw.length < 1200) continue;   // pure redirect stub — allowed
  pathFailures.push(`functions${rel}  [route] internal codename on a content-serving public URL`);
}
if (pathFailures.length) {
  console.error("✗ brand-gate: internal codename on a public surface (path/JSON sweep)");
  for (const p of pathFailures) console.error("  " + p);
  process.exit(1);
}

const failures = [];
for (const file of walk(DIST)) {
  const rel = path.relative(DIST, file);
  const raw = fs.readFileSync(file, "utf8");
  const text = file.endsWith(".html") ? visibleText(raw) : raw;
  for (const rule of RULES) {
    if (rule.allowOn && rule.allowOn.test("/" + rel)) continue; // retraction-history page
    // Scan EVERY occurrence, not just the first: a page may disclose the retraction in one place
    // and (regression) assert it in another. Only an occurrence with no nearby retraction marker
    // fails.
    const re = new RegExp(rule.pattern.source, "gi");
    let m;
    while ((m = re.exec(text)) !== null) {
      const idx = m.index;
      const window = text.slice(Math.max(0, idx - 90), idx + m[0].length + 90);
      if (rule.nearAllow && rule.nearAllow.test(window)) continue; // disclosure, not assertion
      const ctx = text.slice(Math.max(0, idx - 40), idx + 50).trim();
      failures.push({ rel, rule: rule.id, why: rule.why, hit: m[0], ctx });
      break; // one report per rule per file is enough
    }
  }
}

if (failures.length) {
  console.error(`\n✖ brand-gate: ${failures.length} forbidden DISPLAY string(s) in rendered output:\n`);
  for (const f of failures) {
    console.error(`  ${f.rel}  [${f.rule}] "${f.hit}"`);
    console.error(`    …${f.ctx}…`);
    console.error(`    ${f.why}\n`);
  }
  process.exit(1);
}
console.log(`✓ brand-gate: no forbidden display strings in ${path.relative(REPO, DIST)} (${walk(DIST).length} pages/txt scanned)`);
