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
export const PRIMARY_PATHS = new Set<string>([
  "/", "/benchmarks", "/gspc-arena", "/gspc-verify", "/methodology", "/api-docs",
  "/article-50", "/ai-act-faq", "/academy", "/about", "/pricing", "/contact",
  "/blog", "/refutation-ledger", "/regulators", "/industries", "/os", "/system-card",
  "/trust-center", "/status", "/measure", "/faq", "/library",
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
    blurb: "The 13 measured axes and the board — the flagship. Every number recomputable from its rows; UNMEASURED reported, never hidden.",
    test: rx(/gspc|benchmark|\barena\b|\bboard\b|leaderboard|provbench|govbench|\baxis\b|\baxes\b|scorecard|\bmeasured?\b|evidence|anchors|gap-map|\bassess/) },
  { id: "governance", title: "Governance & Frameworks",
    blurb: "NIST AI RMF, ISO/IEC 42001, OSCAL, readiness, PDCA, sector playbooks — the frameworks crosswalked to the measured axes.",
    test: rx(/\bnist\b|iso-?42001|\boscal\b|framework|readiness|crosswalk|governance|risk-|policy|maturity|standard|complian|\bpdca\b|playbook|sector|industry-|how-it-works|\bhow\b|knowledge-base|maps?\b|relevance/) },
  { id: "product", title: "Product, OS & Demo",
    blurb: "Council OS, the arena, the globe, the watchdog map, live demos — the interactive product surfaces.",
    test: rx(/\bos\b|\bdemo\b|globe|watchdog|command|dashboard|council|network|\bpoc\b|\bcity\b|\bspace\b|\btour\b|twin|hive|galaxy|world|temple|commons|open-media|graph|minds|opengridworks|real-world|protect|personal-protection|\bei3\b|badges|authorit|\bvoice\b/) },
  { id: "company", title: "Company, About & Legal",
    blurb: "Charter, pricing, careers, privacy, terms, contact, press, comparisons — who we are and the rules we run on.",
    test: rx(/about|charter|pricing|\bpayg\b|privacy|terms|cookie|legal|contact|company|licens|accreditation|disclaimer|\bsla\b|\bdpa\b|data-processing|advisory|partner|case-stud|compare|comparison|competitor|\bvs\b|our-difference|usp|press|traction|founding|early-access|ecosystem|\bhelp\b|support|\bbrief\b|battlecard|resources|\broi\b|service|recommendation|accessibilit|integrations|assurance/) },
];

const FALLBACK_SECTOR = SECTORS.find((s) => s.id === "governance")!;

export function classify(path: string, title = ""): Sector {
  return SECTORS.find((s) => s.test(path, title)) ?? FALLBACK_SECTOR;
}

export interface LibraryItem extends RouteEntry { sector: string }

// Not surfaced in the Library: (a) app/dev/internal routes, (b) dev-preview homepages, and
// (c) KILLED mission-era pages + internal codenames. (c) is deliberate: the honesty de-brand
// removed prosperity-fund / maternal-covenant / sov3 / codename pages from the narrative — the
// archive keeps the record for SEO, but the public Library must not resurface retracted claims.
const NOT_LIBRARIED =
  /^\/(404|login|signup|register|admin|dashboard|api-keys|bulk-import|settings|me\b|my-|ab-testing|widget|egg|hatch|enter|onboard|welcome|start|analytics|outreach|marketing|reports?|brief|public|all|region-settings|regional-analytics|government-dashboard|government-portal|old-home|landing|legacy|home-v[0-9]|stripe|prosperity|maternal-covenant|covenant|sov3|sov-town|sovereign|gods-eye|horus|dragonfly|four-wings|opengridworks)/;

/** Every non-primary, surfaced route, classified — the archive contents. */
export function libraryItems(): LibraryItem[] {
  return ROUTE_MANIFEST
    .filter((r) => !PRIMARY_PATHS.has(r.path) && !NOT_LIBRARIED.test(r.path) && !/\.[a-z]+$/.test(r.path))
    .map((r) => ({ ...r, sector: classify(r.path, r.title).id }));
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
  return !PRIMARY_PATHS.has(p) && !p.startsWith("/library") && !NOT_LIBRARIED.test(p) && !/\.[a-z]+$/.test(p);
}
