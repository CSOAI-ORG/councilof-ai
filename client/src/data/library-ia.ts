// Library IA — the "align, don't delete" taxonomy (EU-gov / gov.uk pattern).
//
// The primary experience stays lean (PRIMARY_PATHS below). Everything else is not
// deleted — it is LIBRARIED: kept, dated, sector-organized, schema-marked, and reachable
// from the footer Library + the /library hub. This is an AEO/A2A growth surface: every
// archived page is citation surface for an answer engine and a queryable node for an agent.
//
// Nothing here rewrites a page. It classifies routes so the Library hub can present them
// and the ArchivedBanner can mark non-primary pages with a link to their current home.

import { ROUTE_MANIFEST, type RouteEntry } from "./route-manifest";

/** The lean current experience — kept in primary nav, never shown an "archived" banner. */
// Kept in lockstep with the six master-nav groups in components/Header.tsx
// (Measure · Regulation · Solutions · Evidence · Academy · Company) plus the
// always-current surfaces the footer needs. A path here renders NO archive banner.
export const PRIMARY_PATHS = new Set<string>([
  "/",
  // Measure
  "/gspc-scoreboard", "/benchmarks", "/benchmark-index", "/gspc-arena", "/gspc-verify", "/assess",
  "/methodology", "/instrument", "/statute-to-predicate", "/accountability-loop", "/where-the-record-lives",
  // Regulation
  "/eu-ai-act", "/article-50", "/ai-act-timeline", "/gpai", "/checklist",
  "/regulation-tracker", "/regulators", "/crosswalk", "/ai-act-faq",
  // Solutions
  "/enterprise", "/insurers", "/government", "/industries", "/payg", "/integrations",
  // The product family (current products — never archive-bannered)
  "/products", "/gpai-evidence", "/cra-readiness", "/financial-axes",
  "/distribution-integrity", "/embed", "/white-label", "/cobolbridge",
  // Evidence
  "/honesty", "/refutation-ledger", "/firewall-charter", "/api-docs", "/status",
  "/system-card",
  // Academy
  "/academy", "/courses", "/training", "/verify-certificate", "/accreditation",
  // Company
  "/about", "/library", "/blog", "/trust-center", "/contact", "/disclaimers",
  // Current product surfaces reachable off-nav (not superseded, so not archived)
  "/os", "/faq",
]);

export interface Sector {
  id: string;
  title: string;
  blurb: string;
  /** Ordered match — first sector whose test() passes owns the route. */
  test: (path: string, title: string) => boolean;
}

const rx = (re: RegExp) => (p: string, t: string) => re.test(p) || re.test(t.toLowerCase());

/** The 8 content sectors (front-end canon). Order matters — most specific first. */
export const SECTORS: Sector[] = [
  { id: "regulation", title: "EU AI Act & Regulation",
    blurb: "Article 5, Article 50, Annex III, DORA, NIS2, CRA, GDPR crosswalks, and the government/regulator surfaces — the statute this instrument measures against.",
    test: rx(/ai-act|article-?50|annex|art-?5|\bgdpr\b|\bdora\b|\bnis2?\b|\bcra\b|digital-omnibus|penalt|conformity|high-risk|gpai|regulat|classifier|checklist|\blaw\b|govern(ment|-)|landscape|fedramp|rfc-0024|soai-pdca|enforce/) },
  { id: "regions", title: "Regions & Jurisdictions",
    blurb: "How AI governance is measured across jurisdictions — EU, UK, US states, China (TC260), Canada, and more.",
    test: rx(/colorado|california|texas|canada|china|\buk-|\beu-|tc260|jurisdiction|country|nation|state-|aida|us-state|australia|region|global-ai-safety/) },
  { id: "academy", title: "Academy & Training",
    blurb: "Council Academy — training and course completion. Attests training, not conformity: COAI issues no certificates of conformity.",
    test: rx(/academy|certif|course|training|exam|ceasai|\blearn\b|curriculum|lesson|module|\bjobs?\b|career/) },
  { id: "tech", title: "Layer-0, MCP & Verification",
    blurb: "Compliance MCPs, C2PA / Article-50 watermarking, Ed25519 signature verification, the agent (A2A) API, drift and provenance.",
    test: rx(/\bmcps?\b|layer-?0|c2pa|watermark|signature|\bverify\b|\bapi\b|distribution|sigstore|attest|did-|ed25519|oscal|\bagents?\b|registry|drift|provenance|\bledger\b|architecture|cobol|integrat|webhook|vulnerabilit|\bscan\b|cyber|deepfake|instrument|systemcard|technolog|\bdocs?\b|ontolog|\bmodels?\b|transparency|\bvoice\b/) },
  { id: "axes", title: "GSPC Axes & Benchmarks",
    blurb: "The living GSPC board — the flagship. Counts come from GET /api/gspc. Every number recomputable from its rows; UNMEASURED reported, never hidden.",
    test: rx(/gspc|benchmark|\barena\b|\bboard\b|leaderboard|provbench|govbench|\baxis\b|\baxes\b|scorecard|\bmeasured?\b|evidence|anchors|gap-map|\bassess/) },
  { id: "governance", title: "Governance & Frameworks",
    blurb: "NIST AI RMF, ISO/IEC 42001, OSCAL, readiness, PDCA, sector playbooks — the frameworks crosswalked to the measured axes.",
    test: rx(/\bnist\b|iso-?42001|\boscal\b|framework|readiness|crosswalk|governance|risk-|policy|maturity|standard|complian|\bpdca\b|playbook|sector|industry-|how-it-works|\bhow\b|knowledge-base|maps?\b|relevance/) },
  { id: "product", title: "Product, OS & Demo",
    blurb: "Council OS, the arena, the globe, the watchdog map, live demos — the interactive product surfaces.",
    test: rx(/\bos\b|\bdemo\b|globe|watchdog|command|dashboard|council|network|\bpoc\b|\bcity\b|\bspace\b|\btour\b|twin|hive|galaxy|world|temple|commons|open-media|graph|minds|opengridworks|real-world|protect|personal-protection|\bei3\b|badges|authorit|\bvoice\b/) },
  { id: "company", title: "Company, About & Legal",
    blurb: "Charter, careers, privacy, terms, contact, press, comparisons — who we are and the rules we run on. No public prices.",
    test: rx(/about|charter|pricing|\bpayg\b|privacy|terms|cookie|legal|contact|company|licens|accreditation|disclaimer|\bsla\b|\bdpa\b|data-processing|advisory|partner|case-stud|compare|comparison|competitor|\bvs\b|our-difference|usp|press|traction|founding|early-access|ecosystem|\bhelp\b|support|\bbrief\b|battlecard|resources|\broi\b|service|recommendation|accessibilit|integrations|assurance/) },
];

const FALLBACK_SECTOR = SECTORS.find((s) => s.id === "governance")!;

// Canonical replacements — an archived page's current primary home, so the banner can point the
// reader (and answer engines) forward. Only high-confidence 1:1 supersessions; when a page has no
// single current equivalent it simply has no replacement link (the sector link still applies).
export const REPLACEMENTS: Record<string, { path: string; label: string }> = {
  "/industry-solutions": { path: "/industries", label: "Industries" },
  "/sector-atlas": { path: "/industries", label: "Industries" },
  "/sectors": { path: "/industries", label: "Industries" },
  "/industry-playbooks": { path: "/industries", label: "Industries" },
  "/about-credential": { path: "/academy", label: "Council Academy" },
  "/credential-training": { path: "/academy", label: "Council Academy" },
  "/certification": { path: "/academy", label: "Council Academy" },
  "/certificate-verification": { path: "/gspc-verify", label: "Verify a card" },
  "/leaderboard": { path: "/gspc-arena", label: "the arena" },
  "/eu-ai-act-explained": { path: "/eu-ai-act", label: "the EU AI Act guide" },
  "/ai-act-summary": { path: "/eu-ai-act", label: "the EU AI Act guide" },
  "/act-summary": { path: "/eu-ai-act", label: "the EU AI Act guide" },
  "/how-it-works": { path: "/methodology", label: "Methodology" },
  "/roi-calculator": { path: "/?lobby=measured&task=pricing-overview", label: "How the free rail works" },
  "/compare": { path: "/about", label: "About" },
  "/our-difference": { path: "/about", label: "About" },
  // Added by the site-alignment pass 2026-08-20 — each of these had a current
  // equivalent in the new six-group nav but no forward link.
  "/pricing": { path: "/?lobby=measured&task=pricing-overview", label: "How the free rail works" },
  "/global-ai-regulation": { path: "/regulation-tracker", label: "the regulation tracker" },
  "/global-regulations": { path: "/regulation-tracker", label: "the regulation tracker" },
  "/training-hub": { path: "/academy", label: "Council Academy" },
  "/assessment": { path: "/assess", label: "a signed assessment" },
  "/eu-ai-act-checklist": { path: "/checklist", label: "the readiness checklist" },
  "/foundation-models": { path: "/gpai", label: "GPAI model duties" },
  "/eu-ai-act-timeline": { path: "/ai-act-timeline", label: "the AI Act timeline" },
  "/certification/exam": { path: "/academy", label: "Council Academy" },
  "/ceasai-training": { path: "/academy", label: "Council Academy" },
  "/scoreboard": { path: "/gspc-scoreboard", label: "the GSPC board" },
};

/** The current primary page that supersedes an archived one, if any. */
export function replacementFor(path: string): { path: string; label: string } | null {
  return REPLACEMENTS[path.replace(/\/$/, "")] ?? null;
}

export function classify(path: string, title = ""): Sector {
  return SECTORS.find((s) => s.test(path, title)) ?? FALLBACK_SECTOR;
}

// The manifest titles are derived from component names (e.g. "EUAIAct Compliance"). Fix the
// acronyms generically so the archive reads cleanly without a hand-maintained title map.
const ACRONYMS: [RegExp, string][] = [
  [/\bEUAIAct\b/g, "EU AI Act"], [/\bAIAct\b/g, "AI Act"], [/\bEUAct\b/g, "EU Act"],
  [/\bGspc\b/g, "GSPC"], [/\bCsoai\b/gi, "CSOAI"], [/\bMcps?\b/g, "MCP"], [/\bNist\b/g, "NIST"],
  [/\bIso\b/g, "ISO"], [/\bApi\b/g, "API"], [/\bFaq\b/g, "FAQ"], [/\bPdca\b/g, "PDCA"],
  [/\bOscal\b/g, "OSCAL"], [/\bDora\b/g, "DORA"], [/\bNis2?\b/g, "NIS2"], [/\bCra\b/g, "CRA"],
  [/\bGdpr\b/g, "GDPR"], [/\bTc260\b/g, "TC260"], [/\bC2pa\b/gi, "C2PA"], [/\bRoi\b/g, "ROI"],
  [/\bAi\b/g, "AI"], [/\bUs\b/g, "US"], [/\bUk\b/g, "UK"], [/\bEu\b/g, "EU"], [/\bOs\b/g, "OS"],
  [/\bJsp\b/g, "JSP"], [/\bA2a\b/gi, "A2A"], [/\bDpa\b/g, "DPA"], [/\bSla\b/g, "SLA"],
  [/\bVs\b/g, "vs"],
];
// Killed display strings (mirror scripts/brand-gate.mjs RULES). Manifest titles are derived from
// stale component names (SovereignTour → "Sovereign Tour", AboutCEASAI → "About CEASAI"), so the
// archive must SCRUB them before display or the Library page ships a forbidden brand string and
// the deploy gate blocks. The pages' own rendered copy is already de-branded; only these derived
// titles are stale. Removing the killed word yields a clean label ("Sovereign Tour" → "Tour").
// NB "ceasai" is matched WITHOUT a trailing word boundary: manifest titles derived from
// CamelCase component names concatenate it ("CEASAITraining"), which \bceasai\b missed —
// that title shipped verbatim on /library (qa-sweep 2026-08-19).
const FORBIDDEN_DISPLAY =
  /\b(?:sovereign|byzantine|bft|owem|sigil)\b|\bceasai|33[\s-]?agent|fault[\s-]?toleran(?:t|ce)|crown[\s-]?jewels?|goldmines?|black\s+swans?/gi;
/** True if a path/title carries a killed brand ANYWHERE (non-anchored, non-stateful). A page whose
 *  URL itself contains a killed brand (e.g. /about-ceasai) must never surface in the archive — the
 *  path renders as visible text and would trip the deploy gate. */
export const hasForbiddenBrand = (s: string): boolean =>
  new RegExp(FORBIDDEN_DISPLAY.source, "i").test(s);
export function prettifyTitle(t: string): string {
  let out = t;
  for (const [re, s] of ACRONYMS) out = out.replace(re, s);
  out = out.replace(FORBIDDEN_DISPLAY, "");
  return out.replace(/\s+/g, " ").trim();
}

export interface LibraryItem extends RouteEntry { sector: string }

// Not surfaced in the Library: (a) app/dev/internal routes, (b) dev-preview homepages, and
// (c) KILLED mission-era pages + internal codenames. (c) is deliberate: the honesty de-brand
// removed prosperity-fund / maternal-covenant / sov3 / codename pages from the narrative — the
// archive keeps the record for SEO, but the public Library must not resurface retracted claims.
const NOT_LIBRARIED =
  /^\/(404|login|signup|register|admin|dashboard|api-keys|bulk-import|settings|me\b|my-|ab-testing|widget|egg|hatch|enter|onboard|welcome|start|analytics|outreach|marketing|reports?|brief|public|all|region-settings|regional-analytics|government-dashboard|government-portal|old-home|landing|legacy|home-v[0-9]|stripe|prosperity|maternal-covenant|covenant|sov3|sov-town|sovereign|gods-eye|horus|dragonfly|four-wings|opengridworks|certification|certificate|ceasai|get-certified|pricing|plans|payg|billing|roi)/;

/** Every non-primary, surfaced route, classified — the archive contents. */
export function libraryItems(): LibraryItem[] {
  return ROUTE_MANIFEST
    // A redirect is not a page — never list it in the Library (legacy /sov3-* rows
    // were rendering their internal-codename titles as archive links).
    .filter((r) => r.comp !== "Redirect")
    .filter((r) => !PRIMARY_PATHS.has(r.path) && !NOT_LIBRARIED.test(r.path) && !hasForbiddenBrand(r.path) && !/\.[a-z]+$/.test(r.path))
    .filter((r) => !/certification exam|view pricing|paid plans|get certified/i.test(`${r.title} ${r.path}`))
    .map((r) => ({ ...r, title: prettifyTitle(r.title), sector: classify(r.path, r.title).id }));
}

export function itemsBySector(): Record<string, LibraryItem[]> {
  const out: Record<string, LibraryItem[]> = {};
  for (const s of SECTORS) out[s.id] = [];
  for (const it of libraryItems()) (out[it.sector] ||= []).push(it);
  return out;
}

/** True when a page should show the "reference / archive" banner. */
export function isLibraried(path: string): boolean {
  const p = path.replace(/\/$/, "") || "/";
  return !PRIMARY_PATHS.has(p) && !p.startsWith("/library") && !NOT_LIBRARIED.test(p) && !hasForbiddenBrand(p) && !/\.[a-z]+$/.test(p);
}
