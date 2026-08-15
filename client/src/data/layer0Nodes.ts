/**
 * THE LAYER-0 NODE MAP — every anchor source, with the status it has actually earned.
 *
 * STATUS DISCIPLINE (from the node registry audit, 2026-07-29):
 *   LIVE       proven by a real HTTP 200 fetch, on the date given. Never by configuration.
 *   UNKNOWN    a watcher polls it and could not read it — reported honestly, not hidden.
 *   CANDIDATE  named in the N-sites plan, no fetch yet. A granted domain with no fetch is
 *              still CANDIDATE.
 *
 * The registry below now holds 26 nodes (17 LIVE, 2 UNKNOWN, 7 CANDIDATE) — it grew
 * past the original audited 15 from SOV_NODES_ALL_PROMOTED_2026-07-29 (the corrected
 * count: the headline once said 18; the probe records supported 15, and one node had been
 * written from memory with no probe behind it). Counts come from artifacts, never recall —
 * /layer0 computes its summary from this file at render time; if any sentence anywhere
 * disagrees with this file, the file wins.
 *
 * Coordinates are the operating institution's seat — where the authority sits, not where a CDN
 * edge answered.
 */

export type NodeStatus = "LIVE" | "UNKNOWN" | "CANDIDATE";
export type Persona = "compliance" | "regulator" | "developer" | "researcher" | "everyone";

export interface Layer0Node {
  id: string;
  name: string;
  org: string;
  lng: number;
  lat: number;
  cls: "LAW" | "REGULATOR" | "COMPANY" | "GOV" | "HEALTH" | "SCHOLARLY" | "SAFETY" | "STANDARD" | "INTL";
  status: NodeStatus;
  /** date of the proving fetch (LIVE) or last poll attempt (UNKNOWN). Absent for CANDIDATE. */
  verified?: string;
  /** What the Council assistant does at this node — the greenfield, in one sentence a visitor can check. */
  does: string;
  /** Where a visitor can see the result. */
  href: string;
  personas: Persona[];
}

export const LAYER0_NODES: Layer0Node[] = [
  // ── LAW ──────────────────────────────────────────────────────────────────────
  { id: "uk-legislation", name: "legislation.gov.uk", org: "The National Archives, London",
    lng: -0.104, lat: 51.494, cls: "LAW", status: "LIVE", verified: "2026-07-29",
    does: "Anchors UK statute as byte-stable XML; every drift is a signed event against the frozen normaliser.",
    href: "/layer0", personas: ["compliance", "regulator", "everyone"] },
  { id: "eur-lex", name: "EUR-Lex — EU AI Act", org: "Publications Office, Luxembourg",
    lng: 6.13, lat: 49.61, cls: "LAW", status: "LIVE", verified: "2026-07-29",
    does: "Holds Regulation 2024/1689 — the text the console's 417 frozen provisions are cut from.",
    href: "/eu-ai-act", personas: ["compliance", "regulator", "everyone"] },
  { id: "eur-lex-art50", name: "EUR-Lex Article 50 watcher", org: "Publications Office, Luxembourg",
    lng: 6.14, lat: 49.60, cls: "LAW", status: "UNKNOWN", verified: "2026-07-29",
    does: "Polls Article 50 for drift. Current state UNKNOWN — the extractor no longer matches the page and says so rather than reporting 'unchanged'.",
    href: "/ai-transparency", personas: ["regulator", "developer"] },
  { id: "us-fedreg", name: "US Federal Register", org: "Office of the Federal Register, Washington DC",
    lng: -77.028, lat: 38.893, cls: "LAW", status: "LIVE", verified: "2026-07-29",
    does: "Watches AI rulemaking in a fixed window; a new rule is the drift event, hashed order-stable.",
    href: "/feed", personas: ["compliance", "regulator"] },

  // ── COMPANY / GOV ────────────────────────────────────────────────────────────
  { id: "sec-edgar", name: "SEC EDGAR", org: "US Securities and Exchange Commission, Washington DC",
    lng: -77.021, lat: 38.899, cls: "COMPANY", status: "LIVE", verified: "2026-07-29",
    does: "10,414 registered companies fetched live (CIK + ticker + name) — the entity corpus the crosswalk scores against.",
    href: "/landscape", personas: ["compliance", "developer", "everyone"] },
  { id: "gov-uk", name: "GOV.UK Content API", org: "Government Digital Service, London",
    lng: -0.128, lat: 51.503, cls: "GOV", status: "LIVE", verified: "2026-07-29",
    does: "UK government guidance as structured content — the DSIT/RTAU assurance ecosystem anchor.",
    href: "/frameworks/uk-ai-bill", personas: ["compliance", "regulator"] },
  { id: "eurostat", name: "Eurostat", org: "European Commission, Luxembourg",
    lng: 6.11, lat: 49.63, cls: "GOV", status: "LIVE", verified: "2026-07-29",
    does: "EU statistical baselines for the market-size claims we refuse to make without a source.",
    href: "/benchmarks", personas: ["researcher"] },

  // ── REGULATOR / SAFETY ───────────────────────────────────────────────────────
  { id: "epa-echo", name: "EPA ECHO", org: "US Environmental Protection Agency, Washington DC",
    lng: -77.037, lat: 38.894, cls: "REGULATOR", status: "LIVE", verified: "2026-07-29",
    does: "The template for enforcement-data transparency — what a public compliance ledger looks like at federal scale.",
    href: "/radar", personas: ["regulator"] },
  { id: "nist-nvd", name: "NIST NVD CVE API", org: "NIST, Gaithersburg MD",
    lng: -77.214, lat: 39.140, cls: "SAFETY", status: "LIVE", verified: "2026-07-29",
    does: "Live CVE feed — the vulnerability side of the CRA obligations the OSS scanner measures.",
    href: "/layer0", personas: ["developer"] },
  { id: "cisa-kev", name: "CISA KEV catalog", org: "CISA, Arlington VA",
    lng: -77.086, lat: 38.880, cls: "SAFETY", status: "LIVE", verified: "2026-07-29",
    does: "Known-exploited vulnerabilities — the ground truth the 11 Sep 2026 CRA reporting clock runs against.",
    href: "/layer0", personas: ["developer", "regulator"] },

  // ── HEALTH / RESEARCH ────────────────────────────────────────────────────────
  { id: "openfda", name: "openFDA", org: "US FDA, Silver Spring MD",
    lng: -77.026, lat: 39.036, cls: "HEALTH", status: "LIVE", verified: "2026-07-29",
    does: "Regulated-product data for the medical persona of the Annex III classifier.",
    href: "/compliance/eu-ai-act", personas: ["compliance", "researcher"] },
  { id: "clinicaltrials", name: "ClinicalTrials.gov v2", org: "NIH/NLM, Bethesda MD",
    lng: -77.098, lat: 39.000, cls: "HEALTH", status: "LIVE", verified: "2026-07-29",
    does: "Trial registry — the pattern for what a public, queryable register of high-risk AI systems could be.",
    href: "/radar", personas: ["regulator", "researcher"] },
  { id: "pubmed", name: "PubMed E-utilities", org: "NCBI, Bethesda MD",
    lng: -77.100, lat: 38.998, cls: "SCHOLARLY", status: "LIVE", verified: "2026-07-29",
    does: "Literature anchor for every clinical claim in the training corpus.",
    href: "/docs", personas: ["researcher"] },
  { id: "chembl", name: "EBI ChEMBL", org: "EMBL-EBI, Hinxton",
    lng: 0.187, lat: 52.079, cls: "HEALTH", status: "LIVE", verified: "2026-07-29",
    does: "Curated bioactivity data — the model of expert-gated registry admission the node registry copies.",
    href: "/docs", personas: ["researcher"] },
  { id: "who-gho", name: "WHO GHO OData", org: "World Health Organization, Geneva",
    lng: 6.134, lat: 46.233, cls: "INTL", status: "LIVE", verified: "2026-07-29",
    does: "International health indicators — the INTL class proof that the node contract crosses jurisdictions.",
    href: "/global-ai-safety-initiative", personas: ["regulator", "everyone"] },

  // ── SCHOLARLY ────────────────────────────────────────────────────────────────
  { id: "crossref", name: "Crossref", org: "Crossref, Oxford",
    lng: -1.258, lat: 51.752, cls: "SCHOLARLY", status: "LIVE", verified: "2026-07-29",
    does: "DOI resolution — how every published claim on this site will carry a resolvable identifier.",
    href: "/provenance-finding", personas: ["researcher"] },
  { id: "arxiv", name: "arXiv", org: "Cornell University, Ithaca NY",
    lng: -76.483, lat: 42.447, cls: "SCHOLARLY", status: "LIVE", verified: "2026-07-29",
    does: "Where ProvBench publishes — and where 2606.31498 already named the governance gap we measure. They read specs; we measure conduct.",
    href: "/provenance-finding", personas: ["researcher", "everyone"] },

  // ── STANDARDS / WATCHERS ─────────────────────────────────────────────────────
  { id: "rfc-editor", name: "RFC 9964 (ML-DSA COSE)", org: "RFC Editor, Los Angeles",
    lng: -118.44, lat: 34.07, cls: "STANDARD", status: "LIVE", verified: "2026-07-29",
    does: "The watcher set's control: an RFC never changes, so drift here means our reader broke, not the IETF.",
    href: "/benchmarks", personas: ["developer"] },
  { id: "c2pa-spec", name: "C2PA specification", org: "C2PA / Linux Foundation, San Francisco",
    lng: -122.42, lat: 37.77, cls: "STANDARD", status: "UNKNOWN", verified: "2026-07-29",
    does: "Spec watcher. Currently UNKNOWN — the raw path 404s, reported as unreadable rather than 'unchanged'. The measurement against it: 0 of 20 assets survived.",
    href: "/provenance-finding", personas: ["developer", "regulator", "everyone"] },

  // ── CANDIDATES (the N-sites plan — no fetch yet, and the map says so) ────────
  { id: "us-govinfo", name: "US GovInfo (USLM)", org: "US GPO, Washington DC",
    lng: -77.009, lat: 38.888, cls: "LAW", status: "CANDIDATE",
    does: "Next in the N-sites order: US Code as bulk USLM XML — the largest single coverage gain.",
    href: "/layer0", personas: ["regulator"] },
  { id: "ecfr", name: "eCFR", org: "US GPO, Washington DC",
    lng: -77.012, lat: 38.885, cls: "LAW", status: "CANDIDATE",
    does: "Daily-updated federal regulations; queued behind GovInfo.",
    href: "/layer0", personas: ["regulator"] },
  { id: "canada-justice", name: "Canada Justice Laws", org: "Department of Justice, Ottawa",
    lng: -75.699, lat: 45.421, cls: "LAW", status: "CANDIDATE",
    does: "Consolidated acts as XML on GitHub — byte-stable by construction.",
    href: "/frameworks/canada-ai-act", personas: ["compliance"] },
  { id: "japan-egov", name: "Japan e-Gov API v2", org: "Digital Agency, Tokyo",
    lng: 139.75, lat: 35.67, cls: "LAW", status: "CANDIDATE",
    does: "Keyless statute API with point-in-time retrieval — render_at(T) for Japanese law.",
    href: "/layer0", personas: ["compliance"] },
  { id: "fedlex", name: "Fedlex (Akoma Ntoso)", org: "Swiss Federal Chancellery, Bern",
    lng: 7.44, lat: 46.95, cls: "LAW", status: "CANDIDATE",
    does: "Swiss law in AKN since 2022 — the cleanest structured-statute source in Europe.",
    href: "/layer0", personas: ["compliance"] },
  { id: "mitre-attack", name: "MITRE ATT&CK", org: "MITRE, McLean VA",
    lng: -77.20, lat: 38.92, cls: "SAFETY", status: "CANDIDATE",
    does: "STIX bundle from GitHub (not TAXII) — the adversary-technique anchor for the safety axis.",
    href: "/layer0", personas: ["developer"] },
  { id: "uk-atrs", name: "UK ATRS register", org: "DSIT, London",
    lng: -0.132, lat: 51.500, cls: "GOV", status: "CANDIDATE",
    does: "The UK's living register of deployed public-sector AI — the closest thing to our registry already run by a state.",
    href: "/frameworks/uk-ai-bill", personas: ["regulator", "everyone"] },
];

export const STATUS_COLOR: Record<NodeStatus, string> = {
  LIVE: "#34d399",      // emerald — earned by fetch
  UNKNOWN: "#fbbf24",   // amber — polled and unreadable, said out loud
  CANDIDATE: "#64748b", // slate — named, not yet earned
};

export const COUNTS = {
  live: LAYER0_NODES.filter((n) => n.status === "LIVE").length,
  unknown: LAYER0_NODES.filter((n) => n.status === "UNKNOWN").length,
  candidate: LAYER0_NODES.filter((n) => n.status === "CANDIDATE").length,
};

/** Tour order per persona — the greenfield story each end user actually cares about. */
export const PERSONA_TOURS: Record<Persona, { title: string; stops: string[] }> = {
  compliance: {
    title: "The compliance officer — from statute to signed report",
    stops: ["eur-lex", "uk-legislation", "sec-edgar", "openfda", "gov-uk", "japan-egov"] },
  regulator: {
    title: "The regulator — watching the watchers",
    stops: ["eur-lex-art50", "us-fedreg", "clinicaltrials", "epa-echo", "uk-atrs", "who-gho"] },
  developer: {
    title: "The developer — signatures, CVEs and the C2PA finding",
    stops: ["c2pa-spec", "rfc-editor", "nist-nvd", "cisa-kev", "mitre-attack"] },
  researcher: {
    title: "The researcher — every claim with a resolvable source",
    stops: ["arxiv", "crossref", "pubmed", "chembl", "eurostat"] },
  everyone: {
    title: "The whole estate in six stops",
    stops: ["eur-lex", "sec-edgar", "c2pa-spec", "arxiv", "who-gho", "uk-atrs"] },
};
