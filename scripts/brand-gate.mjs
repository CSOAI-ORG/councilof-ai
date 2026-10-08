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
const SELFTEST = process.argv.includes("--selftest");
// A rule marked `held: true` is built and self-tested but only REPORTS until the owner rules on it.
const ENFORCE_HELD = process.argv.includes("--enforce-held") || process.env.BRAND_GATE_ENFORCE_HELD === "1";
const heldHits = [];
const DIST = path.resolve(REPO, (process.argv[2] && !process.argv[2].startsWith("--")) ? process.argv[2] : "dist/client");


// HTML ENTITY DECODING (added 2026-10-07).
// WHY. Every rule below is about the CHARACTERS a reader sees, but the scanner used to look at the
// SOURCE: visibleText() replaced each named entity with a space and left numeric references as
// written. So a price written "&pound;499/mo" (#2882, the Article 50 probe page) reached the
// pricing rule as " 499/mo" and passed, while every browser renders "£499/mo". "&#163;499/mo",
// "&#xA3;499/mo", "&pound499/mo" (legacy names decode without the semicolon) and "&#128;10/month"
// (HTML maps 0x80-0x9F through windows-1252, so that is "€") passed the same way. A doubly
// escaped "&amp;pound;499/mo" renders as the literal text "&pound;499/mo", which a reader and an
// answer engine still read as £499 a month, so text is decoded to a fixed point, not once.
// Decoding runs AFTER tags are stripped, so a decoded "&lt;script&gt;" in a code sample is inert
// text, never markup. Page text, .txt bodies and JSON strings are all decoded before any rule.
// The table is inline (no dependency): all 252 HTML 4 names, the HTML5 names for ASCII
// punctuation, and every currency sign HTML names. Numeric references cover every other
// character. An unknown name followed by ";" becomes a space, which is what the scanner did with
// every name before this.
const LATIN1_NAMES = "nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml".split(" ");
const NAMED_ENTITIES = (() => {
  const t = Object.create(null);
  LATIN1_NAMES.forEach((n, i) => { t[n] = String.fromCodePoint(160 + i); });
  "Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho".split(" ").forEach((n, i) => { t[n] = String.fromCodePoint(913 + i); });
  "Sigma Tau Upsilon Phi Chi Psi Omega".split(" ").forEach((n, i) => { t[n] = String.fromCodePoint(931 + i); });
  "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigmaf sigma tau upsilon phi chi psi omega".split(" ").forEach((n, i) => { t[n] = String.fromCodePoint(945 + i); });
  const rest =
    // HTML 4: markup-significant, Latin Extended, spacing, punctuation
    "quot:34 amp:38 apos:39 lt:60 gt:62 QUOT:34 AMP:38 LT:60 GT:62 COPY:169 REG:174 " +
    "OElig:338 oelig:339 Scaron:352 scaron:353 Yuml:376 fnof:402 circ:710 tilde:732 " +
    "thetasym:977 upsih:978 piv:982 ensp:8194 emsp:8195 thinsp:8201 zwnj:8204 zwj:8205 lrm:8206 rlm:8207 " +
    "ndash:8211 mdash:8212 lsquo:8216 rsquo:8217 sbquo:8218 ldquo:8220 rdquo:8221 bdquo:8222 " +
    "dagger:8224 Dagger:8225 bull:8226 hellip:8230 permil:8240 prime:8242 Prime:8243 lsaquo:8249 rsaquo:8250 " +
    "oline:8254 frasl:8260 euro:8364 image:8465 weierp:8472 real:8476 trade:8482 alefsym:8501 " +
    // HTML 4: arrows, mathematical operators, misc symbols (lang/rang as HTML5 maps them)
    "larr:8592 uarr:8593 rarr:8594 darr:8595 harr:8596 crarr:8629 lArr:8656 uArr:8657 rArr:8658 dArr:8659 hArr:8660 " +
    "forall:8704 part:8706 exist:8707 empty:8709 nabla:8711 isin:8712 notin:8713 ni:8715 prod:8719 sum:8721 " +
    "minus:8722 lowast:8727 radic:8730 prop:8733 infin:8734 ang:8736 and:8743 or:8744 cap:8745 cup:8746 int:8747 " +
    "there4:8756 sim:8764 cong:8773 asymp:8776 ne:8800 equiv:8801 le:8804 ge:8805 sub:8834 sup:8835 nsub:8836 " +
    "sube:8838 supe:8839 oplus:8853 otimes:8855 perp:8869 sdot:8901 lceil:8968 rceil:8969 lfloor:8970 rfloor:8971 " +
    "lang:10216 rang:10217 loz:9674 spades:9824 clubs:9827 hearts:9829 diams:9830 " +
    // HTML5: ASCII punctuation and whitespace by name (&dollar; is the one a price can hide behind)
    "Tab:9 NewLine:10 excl:33 num:35 dollar:36 percnt:37 lpar:40 rpar:41 ast:42 midast:42 plus:43 comma:44 " +
    "period:46 sol:47 colon:58 semi:59 equals:61 quest:63 commat:64 lsqb:91 lbrack:91 bsol:92 rsqb:93 rbrack:93 " +
    "Hat:94 lowbar:95 UnderBar:95 grave:96 DiacriticalGrave:96 lcub:123 lbrace:123 verbar:124 vert:124 VerticalLine:124 " +
    "rcub:125 rbrace:125 NonBreakingSpace:160 hyphen:8208 dash:8208 horbar:8213 nbsp:160";
  for (const pair of rest.split(" ")) { const [n, cp] = pair.split(":"); t[n] = String.fromCodePoint(Number(cp)); }
  return t;
})();
// Names a browser decodes even without the semicolon, in text: the Latin-1 set plus the five
// markup names (the HTML5 "legacy" list). `&pound499` renders "£499".
const LEGACY_ENTITY_NAMES = new Set([...LATIN1_NAMES, "quot", "amp", "lt", "gt", "QUOT", "AMP", "LT", "GT", "COPY", "REG"]);
// Numeric references 0x80-0x9F are read as windows-1252 (HTML Living Standard, "numeric character
// reference end state"): &#128; is "€", not a C1 control.
const CP1252_C1 = { 0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x2c6, 0x89: 0x2030, 0x8a: 0x160, 0x8b: 0x2039, 0x8c: 0x152, 0x8e: 0x17d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x2dc, 0x99: 0x2122, 0x9a: 0x161, 0x9b: 0x203a, 0x9c: 0x153, 0x9e: 0x17e, 0x9f: 0x178 };
function entityCodePoint(cp) {
  if (!Number.isFinite(cp) || cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return "�";
  return String.fromCodePoint(CP1252_C1[cp] ?? cp);
}
const ENTITY_REF = /&(#[0-9]+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*)(;?)/g;
function decodeEntitiesOnce(s) {
  return s.replace(ENTITY_REF, (whole, body, semi) => {
    if (body[0] === "#") {
      return entityCodePoint(body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10));
    }
    if (semi && NAMED_ENTITIES[body] !== undefined) return NAMED_ENTITIES[body];
    for (let n = Math.min(body.length, 6); n >= 2; n--) {
      const head = body.slice(0, n);
      if (LEGACY_ENTITY_NAMES.has(head)) return NAMED_ENTITIES[head] + body.slice(n) + semi;
    }
    return semi ? " " : whole; // unknown name: a space, as before; "R&D" is left alone
  });
}
/** Decode HTML character references to a fixed point (bounded), so "&amp;pound;" reads as "£". */
function decodeEntities(s) {
  if (typeof s !== "string" || !s.includes("&")) return s;
  for (let i = 0; i < 4; i++) {
    const next = decodeEntitiesOnce(s);
    if (next === s) return s;
    s = next;
  }
  return s;
}

// Each rule: a forbidden DISPLAY pattern + WHY. `allowOn` (optional) is a path regex for pages
// that legitimately QUOTE the term to retract/document it (the "refutation-ledger historical
// context" the audit explicitly carves out). Everything else is a hard fail.
// TUI 4 weekend checklist — every ship, rendered copy:
//   certify / CSOAI Certified / sov33 / Inspect model-judge / 2410 stickers /
//   GPAI Code signature / rank-for-sale / 2 Nov 2026 cliff / MEASURED-INDEX-v0.1.
// The corrections ledger page is the retraction-history page: every entry states what we published
// and got wrong, so some entries necessarily quote the withdrawn string (a priced string, the
// withdrawn index sticker, a third-party signatory count). It is prerendered with its entries from
// 2026-09-30 (owner goal, journey A: a no-JS reader got an empty shell). Exactly this one built
// path is exempt, and only from the three rules its entries quote; every other page, and every
// other rule on this page, is still enforced (the selftest pins both).
const CORRECTIONS_LEDGER_PAGE = /^\/corrections\/index\.html$/;
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
    // "Sovereign wealth fund" is a financial instrument, not our brand. The financial axes
    // name real funds (persona-tests.json carries the Norwegian Oil Fund); a gate that
    // forced those to be renamed would falsify domain vocabulary to satisfy a branding rule.
    nearAllow: /wealth\s+fund|oil\s+fund|\bSWF\b/i,
    why: 'De-branded surface: "Sovereign" is not the product name. Use Council / Council Signal / the measurement engine.',
  },
  {
    id: "internal_codenames",
    // sov3 / sov33 / sov34 (and hyphenated variants like sov33-dist-c3), SOVOS,
    // dorado, cibola — internal names, never public. Caught live on /benchmarks
    // 2026-08-25 because this class was missing from the gate.
    // venturi / pontius / laputa (added 2026-09-28, lane codename-hygiene): internal architecture
    // names (the outside-in measurement engine, the bridge fabric, and one more). No trailing \b,
    // so venturi_capsule and CamelCase joins are caught too. Public copy says "measurement capsule",
    // "wrapped-asset measurements". "SovX" is NOT here: the owner made it a public product name for
    // the wrapped-asset measurements on 2026-09-28 (15:30Z ruling); the selftest pins that.
    pattern: /\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b|\bventuri|\bpontius|\blaputa/i,
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
    allowOn: /^\/corrections\/index\.html$/, // CORRECTIONS_LEDGER_PAGE (inlined: RULES is evaluated standalone)
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
    allowOn: /^\/corrections\/index\.html$/, // CORRECTIONS_LEDGER_PAGE (inlined: RULES is evaluated standalone)
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
    id: "certificate_term",
    // HELD 2026-09-28 (owner ruling pending): CSOAI issues no certificates; the Academy's record is
    // a "completion record" (csoai.completion-record/0.1). While `held` is set this rule REPORTS and
    // never fails the build. To enforce: delete `held: true`, or run with --enforce-held /
    // BRAND_GATE_ENFORCE_HELD=1 to see what would fail first.
    held: true,
    pattern: /\bcertificates?\b/i,
    // Negations and retirement notices are disclosure, not an offer. The technical senses of the
    // word (PKI, TLS, X.509, C2PA signing certificates, certificate transparency) are not ours to ban.
    nearAllow: /\bnot\s+(?:a\s+|an\s+)?certificates?\b|\bno\s+certificates?\b|issues?\s+no\s+[a-z ,]{0,40}\bcertificates?\b|\bnever\s+(?:issues?\s+)?(?:a\s+)?certificates?\b|issues?\s+no\s+certificates?|withdrawn|retired|legacy|superseded|completion record|x\.?509|\btls\b|\bssl\b|\bpki\b|signing certificate|code[\s-]signing|c2pa|certificate transparency|root certificate|leaf certificate|certificate chain|self[\s-]signed|\bmtls\b|\bacme\b|let'?s encrypt/i,
    allowOn: /certificate-verification|verify-certificate|(^|\/)certificates(\/|\.html|$)|refutation|corrections/i,
    why: 'CSOAI issues no certificates. The Academy issues free "completion records" (csoai.completion-record/0.1).',
  },
  {
    id: "compliance_artifact_offer",
    // Persona audit T04 (2026-10-06): /readiness sold "Ed25519-signed compliance passports … provable
    // transparency you can show a regulator", and /me listed a "Compliance Passport · Live". We measure;
    // we issue no compliance passport, certificate, seal or badge, and no compliance determination.
    // nearAllow holds SPECIFIC negation phrases only. A bare "never"/"no" is not enough: the window is
    // ±90 chars, and "never deniable" sat right next to "Compliance Passport" on /me.
    pattern: /\bcompliance passports?\b|\bprovable (?:compliance|transparency)\b|\byou can show a regulator\b|\bcompliance (?:certificate|seal|badge)s?\b/i,
    nearAllow: /issues? no compliance|no compliance (?:passport|certificate|determination)|not a compliance|never a compliance|neither can anyone|withdrawn|retired/i,
    allowOn: /refutation|corrections/i,
    why: "CSOAI issues no compliance passports, certificates, seals or badges, and no compliance determination. Offer the measurement (e.g. /dashboard?tab=art50: DETECTED / NOT_DETECTED / UNCHECKABLE), never a compliance artefact.",
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
    allowOn: /^\/corrections\/index\.html$/, // CORRECTIONS_LEDGER_PAGE (inlined: RULES is evaluated standalone)
  },
  {
    id: "agent_instruction_leak",
    // Persona sweep 6 Oct 2026 (finding T05): instructions written for agents and operators —
    // "Do not restore…", "public door", "This VM", "planted key", "in-lane only", "Apex 522",
    // "SPEC only, not a live mill", strategy-note titles — were rendering on /products, /tools,
    // /benchmarks and in the header menu. A visitor reads them as the site talking to itself.
    // The corrections ledger quotes withdrawn copy verbatim, so it alone is exempt. JS-only text
    // (menus, panes) is pinned separately by client/src/components/HeaderNav.copy.test.ts.
    // "Do not …" is an IMPERATIVE only when no subject precedes it: "We do not invent scores" is
    // doctrine stated to the reader and must ship, so a first-person/second-person subject right
    // before it is excluded (the scanner always matches case-insensitively).
    pattern: /(?<!\b(?:we|i|you|they)\s)\b(?:Do not (?:invent|restore|paint|mint|put|ship|build from)|public door|This VM\b|planted key|per-site agent|in-lane only|Apex 5\d\d|SPEC only, not a live|war brief|domination playbook)\b/i,
    why: "Agent/operator instruction or internal strategy note on a public surface. Say what the reader can do, or move the note to /status/internal (noindex).",
    // Exempt, by exact built path: the corrections ledger (quotes withdrawn copy verbatim), the two
    // files WRITTEN FOR AGENTS (instructions to agents are their purpose), and the noindex operator
    // page the notes were moved to.
    allowOn: /^\/(?:corrections\/index\.html|llms\.txt|llms-full\.txt|status\/internal\/index\.html)$/,
    // Rendered pages and text files only. A served JSON body is machine data, often dated or
    // OTS-stamped (e.g. /owm/v0.1/latest.json labels a subject "this snapshot's public door"); its
    // wording is fixed at its producer, not by this rule.
    pagesOnly: true,
  },
  {
    id: "infra_leak",
    // Any localhost:<port>, not just 4400: prerender binds an OS-assigned port unless --port
    // is passed, so a missed canonical rewrite can now bake ANY port into the shipped HTML.
    pattern: /localhost:\d+|os\.meok\.ai|oracle-micro/i,
    why: "Infra hostname / staging origin must not ship. Use the public API councilof.ai/api/gspc.",
  },
];

const PATH_BANNED = /\b(sovos|sov3\d*|dorado|cibola|ceasai)\b|\b(venturi|pontius|laputa)/i;

/** The distribution catalogues: a confirmed list of package names and the measurement over it. */
const DISTRIBUTION_CATALOGUE = /^\/interop\/(footprint-packages|distribution-(latest|\d{4}-\d{2}-\d{2}))\.json$/;

/**
 * Strip the registry identifiers out of a distribution catalogue, leaving every word of its prose
 * to be gated. `packages[].name` is what PyPI, npm and the Hub call the artifact — the string the
 * measurement loop fetches by. Some of those names carry an internal codename because that is the
 * name they were published under years ago and it is public on pypi.org today. Renaming them here
 * would falsify the record and break the measurement, the same reason the defoneos rule already
 * spares `csoai-defoneos-mcp`. Withholding them is not an option either: a catalogue that silently
 * omits rows understates the estate, which is the defect this file's own /api/footprint had.
 */
function stripPackageIdentifiers(node) {
  if (Array.isArray(node)) return node.map(stripPackageIdentifiers);
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === "packages" && Array.isArray(v)) {
      out[k] = v.map((row) =>
        row && typeof row === "object" && !Array.isArray(row)
          ? Object.fromEntries(Object.entries(row).map(([rk, rv]) => (rk === "name" || rk === "source_url" ? [rk, ""] : [rk, stripPackageIdentifiers(rv)])))
          : stripPackageIdentifiers(row),
      );
    } else {
      out[k] = stripPackageIdentifiers(v);
    }
  }
  return out;
}

/**
 * Whole-body public-JSON codename scan. `/signed/` is evidence (real model ids).
 * `/fleet/*.lock.json` is a catalog of other people's models — a Kaggle author
 * named "Jhoan Dorado" is not our product (brand-gate #1694). `/interop/footprint-packages.json`
 * and `/interop/distribution-*.json` are catalogs of registry identifiers we published. Estate
 * prose on all of those files (note, purpose, reason, coverage_note, …) is still gated.
 */
function publicJsonCodenameHit(rel, raw) {
  if (/^\/signed\//.test(rel)) return null;
  let scan = raw;
  // Measurement-capsule shards embed each signed capsule verbatim as `capsule_json`: the bytes the
  // capsule id and batch Merkle root commit to, including what a THIRD-PARTY endpoint advertised
  // (30 Sep 2026: an MCP server's tool names "VENTURIGAS", "VENTURILIQ" tripped \bventuri on the
  // 29 Sep index). Rewriting them would break the capsule id and falsify the observation, so they are
  // evidence like /signed/. Everything else in the shard (doctrine, key_rule, …) is still scanned.
  if (/^\/measurement-capsules\/.*\.json$/.test(rel)) {
    try {
      scan = JSON.stringify(JSON.parse(raw), (k, v) => (k === "capsule_json" && typeof v === "string" ? "" : v));
    } catch {
      /* unparseable shard: keep scanning the whole body */
    }
  }
  if (DISTRIBUTION_CATALOGUE.test(rel)) {
    try {
      return decodeEntities(JSON.stringify(stripPackageIdentifiers(JSON.parse(raw)))).match(PATH_BANNED);
    } catch {
      /* unparseable catalogue: keep scanning the whole body */
    }
  }
  if (/^\/fleet\/[^/]+\.lock\.json$/.test(rel)) {
    try {
      const lock = JSON.parse(raw);
      scan = JSON.stringify({
        kind: lock.kind,
        fleet: lock.fleet,
        note: lock.note,
        coverage_note: lock.coverage_note,
        downloads_rank_note: lock.downloads_rank_note,
        halt: lock.halt,
      });
    } catch {
      /* unparseable lock: keep scanning the whole body */
    }
  }
  return decodeEntities(scan).match(PATH_BANNED);
}

const DISPLAY_KEYS = /^(name|title|label|headline|criteria|tagline|cta|heading|display_name|badge_name)$/i;

/**
 * An MCP Registry server identifier: `io.github.<owner>/<server>` and nothing else in the string.
 * It lands in a `name` key because that is what the registry calls the field, but it is the
 * address of a published artifact, not copy anyone wrote for a reader. Renaming one would
 * falsify the record and break every lookup that resolves it — the same reason the defoneos rule
 * already spares `csoai-defoneos-mcp`. Caught 2026-09-22: the effect-binding probe artifact
 * quotes `io.github.CSOAI-ORG/bft-progress-council-mcp`, whose bytes are pinned by a signed
 * companion and must not be edited at all, and the whole public sweep was failing on it.
 * Estate prose that USES the word, anywhere, is untouched by this.
 */
const REGISTRY_IDENTIFIER = /^io\.github\.[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
function jsonDisplayHits(obj, rel) {
  const hits = [];
  (function rec(node, at, key) {
    if (typeof node === "string") {
      if (!DISPLAY_KEYS.test(key || "")) return;
      // `packages[i].name` in a distribution catalogue is the registry's identifier for the
      // artifact, not display copy. See stripPackageIdentifiers.
      if (DISTRIBUTION_CATALOGUE.test(rel) && /(^|\.)packages\[\d+\]\.name$/.test(at)) return;
      if (REGISTRY_IDENTIFIER.test(node.trim())) return;
      const text = decodeEntities(node); // what a consumer that renders the field shows
      for (const rule of RULES) {
        if (rule.pagesOnly) continue; // see the rule: pages and text files only
        if (rule.allowOn && rule.allowOn.test(rel)) continue;
        const re = new RegExp(rule.pattern.source, "gi");
        let m;
        while ((m = re.exec(text)) !== null) {
          const w = text.slice(Math.max(0, m.index - 90), m.index + m[0].length + 90);
          if (rule.nearAllow && rule.nearAllow.test(w)) continue; // disclosure, not assertion
          hits.push({ at, rule: rule.id, why: rule.why, hit: m[0], ctx: text.slice(0, 120) });
          break;
        }
      }
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => rec(v, at + "[" + i + "]", key));
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) rec(v, at ? at + "." + k : k, k);
    }
  })(obj, "", null);
  return hits;
}

// A guard that cannot fail enforces nothing. This proves every rule still matches the string it
// exists to catch, and still permits the context it is meant to allow — without needing a built
// tree, so it can run before the prerender and in any checkout.
//   node scripts/brand-gate.mjs --selftest
if (SELFTEST) {
  const CASES = [
    // [rule id, text that MUST be caught, text that MUST be allowed]
    ["retracted_fault_tolerance", "the 33-agent BFT council", "the retraction of the BFT claim is in the refutation ledger"],
    ["sovereign_brand", "Project: Sovereign Signed-Card Anchor", null],
    ["internal_codenames", "PixiJS + SOV3 substrate", null],
    ["internal_codenames", "the Venturi throat seals one capsule per event", null],
    ["internal_codenames", "venturi_capsule.py build --adapter operations", null],
    ["internal_codenames", "Pontius carries admitted evidence across rails", null],
    ["internal_codenames", "Laputa", null],
    ["pricing_leak", "$0.005/card", "/corrections/index.html"],
    ["gpai_code_signature", "GPAI Code of Practice signatory", "/corrections/index.html"],
    ["measured_index_sticker", "MEASURED-INDEX-v0.1", "/corrections/index.html"],
    ["agent_instruction_leak", "Do not restore MEASURED-INDEX-v0.1", "/corrections/index.html"],
    ["agent_instruction_leak", "In build — COBOL lineage. Apex 522. SPEC only, not a live mill", "/corrections/index.html"],
    ["agent_instruction_leak", "Slot 15 / human-vs-ai stay in-lane only.", "/corrections/index.html"],
    ["agent_instruction_leak", "This VM holds the planted key behind the public door", "/corrections/index.html"],
  ];
  let bad = 0;
  // The corrections-ledger exemption is one built path, never a prefix or a lookalike.
  for (const id of ["pricing_leak", "gpai_code_signature", "measured_index_sticker"]) {
    const r = RULES.find((x) => x.id === id);
    if (!r || !r.allowOn || r.allowOn.source !== CORRECTIONS_LEDGER_PAGE.source) { console.error(`\u2716 selftest: rule "${id}" allowOn is not exactly the corrections ledger page`); bad++; }
  }
  for (const p of ["/pricing/index.html", "/corrections-archive/index.html", "/x/corrections/index.html", "/corrections/other.html", "/index.html"]) {
    if (CORRECTIONS_LEDGER_PAGE.test(p)) { console.error(`\u2716 selftest: corrections exemption leaks to ${p}`); bad++; }
  }
  for (const [id, mustCatch, mustAllow] of CASES) {
    const rule = RULES.find((r) => r.id === id);
    if (!rule) { console.error(`\u2716 selftest: rule "${id}" no longer exists`); bad++; continue; }
    if (!rule.pattern.test(mustCatch)) {
      console.error(`\u2716 selftest: rule "${id}" no longer catches ${JSON.stringify(mustCatch)}`); bad++;
    }
    if (mustAllow && rule.allowOn && !rule.allowOn.test(mustAllow)) {
      console.error(`\u2716 selftest: rule "${id}" no longer allows its documented exemption`); bad++;
    }
  }
  // Public names the gate must never catch. "SovX" is the owner-approved public product name for the
  // wrapped-asset measurements (ruling 2026-09-28 15:30Z); a codename rule that swallowed it would strip
  // an approved name at integration. The neutral names already in public copy must pass too.
  for (const ok of ["SovX wrapped-asset measurements", "SovX", "measurement capsule", "wrapped-asset parity ledger"]) {
    for (const rule of RULES) {
      if (new RegExp(rule.pattern.source, rule.pattern.flags).test(ok)) {
        console.error(`\u2716 selftest: rule "${rule.id}" catches the public name ${JSON.stringify(ok)}`); bad++;
      }
    }
    if (PATH_BANNED.test(ok) || PATH_BANNED.test("/" + ok.toLowerCase().replace(/\s+/g, "-") + "/")) {
      console.error(`\u2716 selftest: PATH_BANNED catches the public name ${JSON.stringify(ok)}`); bad++;
    }
  }
  if (!PATH_BANNED.test("/interop/venturi-capsule-index.json") || !publicJsonCodenameHit("/interop/x.json", JSON.stringify({ schema: "csoai.venturi-capsule/0.1" }))) {
    console.error("\u2716 selftest: path/JSON sweep no longer catches venturi"); bad++;
  }
  // The JSON display sweep is a gate in its own right, so it proves itself the same way:
  // it must CATCH the badge copy that actually shipped, and must PASS the negation keys,
  // the retraction register, the domain vocabulary and the identifiers that must keep
  // shipping. A sweep that only caught things would push honest copy toward silence.
  const SWEEP_CATCH = [
    ["/interop/hf-badges-index.json", { badges: [{ name: "CSOAI 23/33 BFT attested" }] }],
    ["/interop/hf-badges-index.json", { badges: [{ criteria: "Attested by 23 of 33 sovereign council agents" }] }],
  ];
  const SWEEP_PASS = [
    // semantic negation keys — these DENY the claim, which is the copy we want to keep
    ["/interop/axes-v2-web3.json", { claim_boundary: "Design proposal only. No deployment, signature, chain inclusion, BFT independence, universal coverage, legal compliance, or certification is established by this record." }],
    ["/interop/council-independence.json", { does_not_establish: "Fault tolerance. n_eff is a measurement of independence, not a guarantee." }],
    // domain vocabulary, not our brand
    ["/interop/persona-tests.json", { name: "Sovereign wealth fund (Norwegian Oil Fund)" }],
    // identifiers and published URLs are not display copy
    ["/interop/hf-badges-index.json", { badges: [{ id: "csoai-bft-23", image: "https://councilof.ai/badge/csoai-bft-23.svg" }] }],
    // the corrected copy now in the tree
    ["/interop/hf-badges-index.json", { badges: [{ name: "CSOAI 23/33 council threshold", criteria: "Attested by 23 of 33 council agents (designed threshold)" }] }],
  ];
  // Capsule shards: a third-party tool name inside the signed capsule bytes is evidence, not our
  // codename; our own prose in the shard is still caught.
  if (publicJsonCodenameHit("/measurement-capsules/v0.2/endpoints/13.json", JSON.stringify({
    doctrine: "Measurement only.",
    endpoints: { e: { capsules: [{ capsule_json: JSON.stringify({ observed: [["VENTURIGAS", "ab"], ["VENTURILIQ", "cd"]] }) }] } },
  }))) {
    console.error("\u2716 selftest: a third-party tool name inside capsule_json now fails public-json"); bad++;
  }
  if (!publicJsonCodenameHit("/measurement-capsules/v0.2/endpoints/13.json", JSON.stringify({
    doctrine: "Sealed by the Venturi throat.",
    endpoints: {},
  }))) {
    console.error("\u2716 selftest: capsule shard estate prose no longer catches venturi"); bad++;
  }
  // Fleet locks quote third-party identity. The public-json sweep must not
  // treat a Kaggle surname as our Dorado product; estate prose still fails.
  if (publicJsonCodenameHit("/fleet/KAGGLE.lock.json", JSON.stringify({
    note: "EVERY row UNMEASURED. Being in this lock is not coverage.",
    models: [{ author: "Jhoan Dorado", ref: "jhoandorado/basic-datection", title: "basic-datection" }],
  }))) {
    console.error("\u2716 selftest: fleet lock third-party author now fails public-json"); bad++;
  }
  if (!publicJsonCodenameHit("/fleet/KAGGLE.lock.json", JSON.stringify({
    note: "Dorado mill of Kaggle weights",
    models: [],
  }))) {
    console.error("\u2716 selftest: fleet lock estate prose no longer catches Dorado in note"); bad++;
  }
  // Distribution catalogues quote registry identifiers we published. The sweep must not read one
  // as product copy; estate prose in the same file must still fail.
  if (publicJsonCodenameHit("/interop/footprint-packages.json", JSON.stringify({
    purpose: "The confirmed list of what this estate publishes.",
    pypi: { packages: [{ name: "sovos-city", role: "Owner", source_url: "https://pypi.org/project/sovos-city/" }] },
  }))) {
    console.error("\u2716 selftest: a published package identifier now fails the public-json sweep"); bad++;
  }
  if (!publicJsonCodenameHit("/interop/footprint-packages.json", JSON.stringify({
    purpose: "The SOVOS estate's distribution",
    pypi: { packages: [] },
  }))) {
    console.error("\u2716 selftest: catalogue prose no longer catches an internal codename"); bad++;
  }
  if (jsonDisplayHits({ pypi: { packages: [{ name: "sovos-city" }] } }, "/interop/footprint-packages.json").length) {
    console.error("\u2716 selftest: package identifier now fails the display sweep"); bad++;
  }
  if (!jsonDisplayHits({ title: "SOVOS downloads" }, "/interop/footprint-packages.json").length) {
    console.error("\u2716 selftest: catalogue display copy no longer gated"); bad++;
  }
  // A whole-string MCP Registry identifier is an address, not copy; the same words as prose still fail.
  if (jsonDisplayHits({ servers: [{ name: "io.github.CSOAI-ORG/bft-progress-council-mcp" }] }, "/interop/effect-binding-server-probe-2026-09-22.json").length) {
    console.error("\u2716 selftest: an MCP Registry identifier now fails the display sweep"); bad++;
  }
  if (!jsonDisplayHits({ name: "the BFT progress council" }, "/interop/anything.json").length) {
    console.error("\u2716 selftest: the retracted claim no longer fails as prose"); bad++;
  }
  for (const [rel, obj] of SWEEP_CATCH) {
    if (jsonDisplayHits(obj, rel).length === 0) {
      console.error(`\u2716 selftest: json display sweep no longer catches ${JSON.stringify(obj)}`); bad++;
    }
  }
  for (const [rel, obj] of SWEEP_PASS) {
    const h = jsonDisplayHits(obj, rel);
    if (h.length) {
      console.error(`\u2716 selftest: json display sweep now FAILS copy that must ship: ${JSON.stringify(obj)} -> [${h[0].rule}]`); bad++;
    }
  }
  // The held certificate rule must catch an offer and pass a negation, a retirement notice and a
  // technical sense of the word — exercised through the same window logic the scan uses.
  {
    const rule = RULES.find((r) => r.id === "certificate_term");
    const trips = (t) => { const m = rule.pattern.exec(t); if (!m) return false; const w = t.slice(Math.max(0, m.index - 90), m.index + m[0].length + 90); return !rule.nearAllow.test(w); };
    if (!rule || !rule.held) { console.error("\u2716 selftest: certificate_term missing or no longer held"); bad++; }
    else {
      for (const t of ["Get your AI governance certificate today", "Download your certificate"])
        if (!trips(t)) { console.error(`\u2716 selftest: certificate_term no longer catches ${JSON.stringify(t)}`); bad++; }
      for (const t of ["This is not a certificate.", "CSOAI issues no certificates.", "CSOAI issues no compliance passports, certificates or compliance determinations.", "This legacy certificate page is withdrawn.", "signed with a C2PA signing certificate", "an X.509 certificate chain"])
        if (trips(t)) { console.error(`\u2716 selftest: certificate_term now fails copy that must ship: ${JSON.stringify(t)}`); bad++; }
    }
  }
  // The compliance-artefact rule catches the offer and passes the specific negations, through the
  // same ±90-char window the scan uses.
  {
    const rule = RULES.find((r) => r.id === "compliance_artifact_offer");
    const trips = (t) => { const m = rule.pattern.exec(t); if (!m) return false; const w = t.slice(Math.max(0, m.index - 90), m.index + m[0].length + 90); return !rule.nearAllow.test(w); };
    if (!rule) { console.error("\u2716 selftest: compliance_artifact_offer missing"); bad++; }
    else {
      for (const t of [
        "CSOAI issues Ed25519-signed compliance passports and C2PA watermark attestations for Article 50",
        "Compliance Passport Live",
        "Your Ed25519-signed governance identity - provable, portable, never deniable. Compliance Passport",
        "provable transparency you can show a regulator",
      ])
        if (!trips(t)) { console.error(`\u2716 selftest: compliance_artifact_offer no longer catches ${JSON.stringify(t)}`); bad++; }
      for (const t of [
        "CSOAI issues no compliance passports, certificates or compliance determinations.",
        "Can we obtain a NIST compliance certificate? No — and neither can anyone else",
      ])
        if (trips(t)) { console.error(`\u2716 selftest: compliance_artifact_offer now fails copy that must ship: ${JSON.stringify(t)}`); bad++; }
    }
  }
  {
    const r = RULES.find((x) => x.id === "agent_instruction_leak");
    const trips = (t) => new RegExp(r.pattern.source, "gi").test(t);
    for (const t of [
      "Three proposed index measures. Reference test sets only; none is a signed result.",
      "In development: COBOL lineage under DORA / Basel / SOX. UNMEASURED until a signed card exists.",
      "The v0.1 sticker stays withdrawn (C-2026-0826-05).",
      "No public leader (no signed per-model card)",
      "Empty cells stay empty. We do not invent scores.",
      "If we cannot verify it, we do not ship it.",
      "we do not put other people's numbers on our board",
    ])
      if (trips(t)) { console.error(`\u2716 selftest: agent_instruction_leak now fails copy that must ship: ${JSON.stringify(t)}`); bad++; }
    for (const t of ["Empty stays empty — do not invent drift numbers or a Merkle seal.", "C-2026-0826-05: do not restore MEASURED-INDEX-v0.1."])
      if (!trips(t)) { console.error(`\u2716 selftest: agent_instruction_leak no longer catches ${JSON.stringify(t)}`); bad++; }
    if (jsonDisplayHits({ subjects: [{ label: "this snapshot's public door" }] }, "/owm/v0.1/latest.json").some((h) => h.rule === "agent_instruction_leak")) {
      console.error("\u2716 selftest: agent_instruction_leak now runs on JSON display fields (it is pages-only)"); bad++;
    }
    // The exemption is four exact built paths, never a prefix or a lookalike.
    for (const p of ["/corrections/index.html", "/llms.txt", "/llms-full.txt", "/status/internal/index.html"])
      if (!r.allowOn.test(p)) { console.error(`\u2716 selftest: agent_instruction_leak no longer exempts ${p}`); bad++; }
    for (const p of ["/products/index.html", "/status/index.html", "/x/llms.txt", "/status/internal/other.html", "/index.html"])
      if (r.allowOn.test(p)) { console.error(`\u2716 selftest: agent_instruction_leak exemption leaks to ${p}`); bad++; }
  }
  // HTML entities (2026-10-07). Every rule must see the characters a reader sees, through the same
  // path the scan uses (visibleText -> scanRendered, jsonDisplayHits, publicJsonCodenameHit).
  {
    const pageHits = (rel, html) => scanRendered(rel, visibleText(html));
    const caught = (rel, html, id) => pageHits(rel, html).some((h) => h.rule === id);
    const P = "/csoai-eu-ai-act-art50-measurement-probe.html";
    if (LATIN1_NAMES.length !== 96) { console.error(`✖ selftest: Latin-1 entity table has ${LATIN1_NAMES.length} names, not 96`); bad++; }
    const dec = decodeEntities("&pound;&#163;&#xA3;&#XA3;&pound&dollar;&#36;&euro;&#8364;&#128;&yen;&cent;&nbsp;&amp;&amp;pound;");
    if (dec !== "£££££$$€€€¥¢ &£") { console.error(`✖ selftest: decodeEntities gave ${JSON.stringify(dec)}`); bad++; }
    // The exact strings #2882 shipped (single- and double-escaped), and the numeric spellings.
    for (const html of [
      "<p>Ongoing programmes: Probe tier &pound;499/mo per surface &middot; Governance tier &pound;2,499/mo (all surfaces, quarterly re-measurement, regulator-ready evidence pack) &middot; Enterprise from &pound;9,999/yr (multi-product, named measurement officer).</p>",
      "<p>Probe tier &amp;pound;499/mo per surface</p>",
      "<p>Enterprise from &amp;pound;9,999/yr (multi-product, named measurement officer).</p>",
      "<p>Enterprise from &pound;9,999/yr</p>",
      "<p>Probe tier &#163;499/mo</p>",
      "<p>Probe tier &#xA3;499/mo</p>",
      "<p>Probe tier &#XA3;499/mo</p>",
      "<p>Probe tier &pound499/mo</p>",
      "<p>Probe tier &pound;&nbsp;499/mo</p>",
      "<p>&dollar;0.005/card</p>",
      "<p>&#36;45&ndash;150/hr</p>",
      "<p>&euro;10/month</p>",
      "<p>&#8364;10/month</p>",
      "<p>&#128;10/month</p>",
    ])
      if (!caught(P, html, "pricing_leak")) { console.error(`✖ selftest: pricing_leak misses an entity-written price: ${JSON.stringify(html)}`); bad++; }
    // Not only prices: every rule reads decoded text.
    if (!caught("/index.html", "<p>&#83;OVOS substrate</p>", "internal_codenames")) { console.error("✖ selftest: a numerically escaped codename now passes"); bad++; }
    if (!caught("/index.html", "<p>the 33-agent &#66;FT council</p>", "retracted_fault_tolerance")) { console.error("✖ selftest: an escaped BFT claim now passes"); bad++; }
    // JSON display fields and the whole-body JSON sweep decode too.
    for (const t of ["&pound;499/mo per surface", "&amp;pound;9,999/yr", "&#xA3;499/mo"])
      if (!jsonDisplayHits({ title: t }, "/interop/x.json").some((h) => h.rule === "pricing_leak")) { console.error(`✖ selftest: json display sweep misses ${JSON.stringify(t)}`); bad++; }
    if (!publicJsonCodenameHit("/interop/x.json", JSON.stringify({ note: "the &#83;OVOS estate" }))) { console.error("✖ selftest: public-json sweep misses an escaped codename"); bad++; }
    // Copy that must keep shipping exactly as before: an ampersand in prose, a code sample, a
    // regulation penalty, the no-pricing disclosure, and the corrections ledger's quoted errata.
    for (const [rel, html] of [
      ["/index.html", "<footer>Regulation (EU) 2024/1689 Articles 50 &amp; 99. R&amp;D at AT&amp;T. Q&amp;A.</footer>"],
      ["/docs/index.html", "<pre><code>&lt;script src=&quot;/sdk.js&quot;&gt;&lt;/script&gt; fetch(&#39;/api/gspc&#39;) &amp;&amp; ok</code></pre>"],
      ["/index.html", "<p>Exposure ceiling: &euro;15M or 3% of worldwide turnover.</p>"],
      ["/index.html", "<p>Verification is free forever &mdash; we never charge &pound;5/mo for a grade.</p>"],
      ["/corrections/index.html", "<li>We published &ldquo;Probe tier &pound;499/mo&rdquo; and &amp;pound;9,999/yr; withdrawn. GPAI Code of Practice signatory. MEASURED-INDEX-v0.1.</li>"],
    ]) {
      const h = pageHits(rel, html);
      if (h.length) { console.error(`✖ selftest: entity decoding now fails copy that must ship on ${rel}: [${h[0].rule}] ${JSON.stringify(h[0].hit)}`); bad++; }
    }
    // The ledger exemption is per rule, not per page: an escaped codename there still fails.
    if (!caught("/corrections/index.html", "<li>&#83;OVOS</li>", "internal_codenames")) { console.error("✖ selftest: corrections ledger escaped codename now passes"); bad++; }
  }
  if (bad) { console.error(`\u2716 brand-gate selftest FAILED (${bad})`); process.exit(1); }
  console.log(`\u2713 brand-gate selftest: ${CASES.length}/${CASES.length} rules still catch what they exist to catch`);
  process.exit(0);
}


function visibleText(html) {
  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ") // JS bundle tags + JSON-LD
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");                             // all remaining tags → route paths in href etc. drop with the tag
  // Character references are decoded AFTER the tags are gone (see decodeEntities): the rules see
  // "£499/mo" where the source says "&pound;499/mo", and a decoded "&lt;" can never become a tag.
  return decodeEntities(stripped).replace(/\s+/g, " ");
}

/**
 * Every rule over one rendered file's text. `rel` is the built path with a leading slash; `text` is
 * what a reader sees (visibleText for .html/.svg, the decoded body for .txt). Returns one hit per
 * rule at most, each marked `held` when its rule only reports.
 */
function scanRendered(rel, text) {
  const hits = [];
  for (const rule of RULES) {
    if (rule.allowOn && rule.allowOn.test(rel)) continue; // retraction-history page
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
      hits.push({ rel: rel.replace(/^\//, ""), rule: rule.id, why: rule.why, hit: m[0], ctx, held: !!rule.held });
      break; // one report per rule per file is enough
    }
  }
  return hits;
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
const EXCLUDE_PAGES = /(^|\/)(regulator-console\.html$|refutation-ledger(\/|\.html|$)|mcps?(\/|\.html|$)|mcp-|ai-transparency|authority|(?<!images\/)badges|j-space(\/|\.html|$))/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "assets" || e.name === "vendor") continue; // hashed bundles/static packs
      walk(full, out);
    } else if (/\.(html|txt|svg)$/.test(e.name) && !EXCLUDE_PAGES.test("/" + path.relative(DIST, full))) {
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
    let raw = "";
    try { raw = fs.readFileSync(f, "utf8"); } catch { continue; }
    const m = publicJsonCodenameHit(rel, raw);
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
  // .svg joins .html here: an SVG's <title> IS its accessible name and its <text> IS rendered
  // prose, so a shipped image can carry a banned display string just as a page can. Tag-stripping
  // is the same operation for both.
  // A .txt body is served as text/plain, so its references show literally — and "&pound;5/mo" still
  // reads as a price; it is decoded the same way.
  const text = /\.(html|svg)$/.test(file) ? visibleText(raw) : decodeEntities(raw);
  for (const { held, ...h } of scanRendered("/" + rel, text)) (held && !ENFORCE_HELD ? heldHits : failures).push(h);
}

// PUBLIC-JSON *DISPLAY FIELD* SWEEP (added 2026-09-05).
// The page walk above is .html/.txt only, so the DISPLAY rules never reached a JSON body —
// while the path/JSON sweep above checks a different, narrower list (internal codenames).
// A badge asserting the RETRACTED fault-tolerance claim therefore shipped in
// public/interop/hf-badges-index.json ("CSOAI 23/33 BFT attested", status active,
// qualifying_models 104) while this gate reported clean. HuggingFace renders that name: a
// served JSON string that a consumer displays is display copy.
//
// Scoped to keys that RENDER, deliberately. A whole-body scan was tried first and produced
// 28 false positives out of 30 — this estate's JSON says the honest thing in semantic
// negation keys (`claim_boundary`, `does_not_establish`), quotes retracted claims in a
// register (`claim`/`notes`/`why`), and carries third-party model ids and filesystem paths
// in free text. Failing those would push honest copy toward silence, which is the opposite
// of the point. Identifiers and URLs (`id`, `image`) are excluded too: renaming a published
// badge URL breaks consumers and is the retirement-redirect question, not a display one.
for (const jf of walkAll(DIST)) {
  if (!jf.endsWith(".json")) continue;
  const jrel = "/" + path.relative(DIST, jf);
  if (/^\/signed\//.test(jrel)) continue; // signed evidence carries the real model id — same carve-out
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(jf, "utf8")); } catch { continue; }
  for (const h of jsonDisplayHits(parsed, jrel)) {
    const held = RULES.find((r) => r.id === h.rule)?.held && !ENFORCE_HELD;
    (held ? heldHits : failures).push({ rel: jrel + " -> " + h.at, rule: h.rule, why: h.why, hit: h.hit, ctx: h.ctx });
  }
}

if (heldHits.length) {
  // Reported, not failed: these rules await an owner ruling (see `held` on the rule).
  const byRule = {};
  for (const h of heldHits) byRule[h.rule] = (byRule[h.rule] || 0) + 1;
  console.warn(`⚠ brand-gate HELD rules (not enforced): ${Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(", ")} — first hits:`);
  for (const h of heldHits.slice(0, 15)) console.warn(`    ${h.rel}  [${h.rule}] "${h.hit}"  …${h.ctx}…`);
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
const jsonScanned = walkAll(DIST).filter((f) => f.endsWith(".json") && !/^\/signed\//.test("/" + path.relative(DIST, f))).length;
console.log(`✓ brand-gate: no forbidden display strings in ${path.relative(REPO, DIST)} (${walk(DIST).length} pages/txt + ${jsonScanned} public JSON display-field scanned)`);
