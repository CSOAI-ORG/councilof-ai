/**
 * AXIS-BOOTSTRAP-EAT canon — per-axis unsigned→signed loop (2026-08-24).
 * Internal strategy folded to public grammar. Measurement ≠ certification.
 */

export const BOOTSTRAP_LOOP = [
  {
    step: 1,
    id: "find",
    title: "Find the unsigned wild",
    body: "Public benchmarks, vendor claims, regulator records, leaderboard rows — anything asserted without a stranger-verifiable artifact.",
  },
  {
    step: 2,
    id: "measure",
    title: "Measure without asking",
    body: "Arena probes, corpus EAT, public-artifact verification — licence-sweep first. Never intrusion; never scrape against terms.",
  },
  {
    step: 3,
    id: "sign",
    title: "Sign the finding",
    body: "One 3KB card via the sign pod. Keys never leave the pod. Cards state what was measured — never compliance or investment relevance.",
  },
  {
    step: 4,
    id: "sim-live",
    title: "Cross-reference sim↔live",
    body: "Simulation variants vs live measurements — the delta is itself a measurement. Scenario measurement, never forecast.",
  },
  {
    step: 5,
    id: "publish",
    title: "Publish gated",
    body: "Board, ledger, and feeds through ClaimGuard. No public claim without claim-vs-signed-artifact pass.",
  },
  {
    step: 6,
    id: "index",
    title: "Feed the index",
    body: "SOV Signal ingests the row by accretion of signed measurements — never prediction.",
  },
] as const;

export const GRAMMAR_BOX = {
  count: "N measured of M — board renders 13 measured of 14 today; numbers move only when a signed card lands.",
  jail: "JAIL stays UNTESTED until earned — never implied, never rounded into headlines.",
  sim: "Scenario measurement, never forecast or prediction.",
  honesty: "Honest zeros, UNPUBLISHED, and LANE-REPORTED render as labelled.",
  determination: "Measurement ≠ certification. Determination stays with authorities.",
} as const;

export type AxisBootstrapRow = {
  id: string;
  name: string;
  bench: string;
  status: "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "below floor";
  n: string;
  surface: string;
  firstRowGate: string;
  effect: string;
};

export const MEASURED_AXIS_ROWS: AxisBootstrapRow[] = [
  { id: "governance", name: "Governance", bench: "GovBench", status: "MEASURED", n: "n=237", surface: "/api/gspc · /arena · /gspc-verify", firstRowGate: "Stranger verify; Wilson interval with n", effect: "citation" },
  { id: "safety", name: "Safety", bench: "DefBench", status: "below floor", n: "n=14", surface: "/api/gspc · DefBench room", firstRowGate: "Paired bank frozen; n below floor until pipeline lands", effect: "citation → dependency" },
  { id: "provenance", name: "Provenance", bench: "ProvBench", status: "UNMEASURED", n: "n=16 v3", surface: "/api/gspc · /gspc-verify", firstRowGate: "16-manipulation battery frozen + stranger replay", effect: "citation" },
  { id: "continuity", name: "Continuity / PQC", bench: "PQCBench", status: "UNMEASURED", n: "n=33", surface: "/api/gspc", firstRowGate: "Bank frozen; own estate exposure signed first", effect: "citation" },
  { id: "conformance", name: "Conformance", bench: "MCPBench", status: "below floor", n: "n=11", surface: "/mcp · /api/gspc", firstRowGate: "Frozen vectors re-signed; stranger runs conformance suite", effect: "adoption + citation" },
  { id: "openness", name: "Openness", bench: "OSSBench", status: "UNMEASURED", n: "n=16", surface: "/api/gspc", firstRowGate: "Three wild claims → signed delta cards", effect: "citation" },
  { id: "machinery", name: "Machinery", bench: "MachBench", status: "DRAFT", n: "n=16", surface: "/api/regulation · /api/gspc", firstRowGate: "EN 18286 field map frozen; one DoC → signed card", effect: "citation → adoption" },
  { id: "care", name: "Care", bench: "CareBench", status: "DRAFT", n: "200 items", surface: "/arena Care room", firstRowGate: "200-item bank OTS-anchored; dual-judge disclosed", effect: "citation → dependency" },
  { id: "cross-reality", name: "Cross-reality", bench: "XRAIV", status: "UNMEASURED", n: "n=16", surface: "/arena XR room", firstRowGate: "CONFIRM-tier format public; arena chain verified", effect: "adoption + citation" },
  { id: "detector-interop", name: "Detector interop", bench: "DetBench", status: "SPEC", n: "n=0", surface: "/api/gspc (SPEC)", firstRowGate: "Interop matrix spec frozen — honest n=0 until first row", effect: "citation" },
  { id: "art5-safeguard", name: "Art. 5 safeguard", bench: "Art5Bench", status: "UNMEASURED", n: "—", surface: "/api/gspc", firstRowGate: "Frozen bank + stranger replay", effect: "citation" },
  { id: "swarm", name: "Swarm", bench: "SwarmBench", status: "UNMEASURED", n: "—", surface: "/arena", firstRowGate: "Multi-agent bank frozen", effect: "citation" },
  { id: "affect", name: "Affect", bench: "AffectBench", status: "UNMEASURED", n: "—", surface: "/api/gspc", firstRowGate: "Preference bank frozen; no LMArena echo without re-measure", effect: "citation" },
  { id: "jail", name: "Jail", bench: "JailBench", status: "UNMEASURED", n: "UNTESTED", surface: "Not on East-West credential", firstRowGate: "Own first-row gate — never rendered measured until earned", effect: "citation" },
];

export const HONEST_REGISTER: { claim: string; register: string; flip: string }[] = [
  { claim: "Signed 3KB cards verify without us", register: "LIVE", flip: "— (Stage 43 stranger verify)" },
  { claim: "Board renders 13 measured of 14, jail UNTESTED", register: "LIVE", flip: "— (/api/gspc grammar fixed)" },
  { claim: "MCP measure/verify/jail-probe/enter-arena", register: "LIVE", flip: "— (Stage 43 handshake)" },
  { claim: "Regulation deadline API", register: "LIVE", flip: "— (/api/regulation)" },
  { claim: "Corrections register (65+ entries)", register: "LIVE", flip: "— (/api/corrections)" },
  { claim: "DID trust root resolves for strangers", register: "GATED", flip: "P0-1 / EXE 001 — did.json id-mismatch" },
  { claim: "OTS time anchors", register: "LANE-REPORTED", flip: "EXE 007/008 stranger-verified anchor" },
  { claim: "Per-axis signed cards at scale", register: "LANE-REAL", flip: "Identity purge + each §2 first-row gate" },
  { claim: "8 signed financial registers", register: "LANE-REPORTED", flip: "/api/registers must serve rows" },
  { claim: "East-West cross-jurisdiction pack", register: "PACKAGED", flip: "/east-west live; UNSIGNED hash trail" },
  { claim: "Competitor EAT database (52 players)", register: "LIVE", flip: "— (this page + /api/competitors/eat)" },
  { claim: "SOV Signal public index", register: "THEORY", flip: "Methodology card + public endpoint (IY.5)" },
];

export const DOMAIN_PAGES = [
  { id: "cross-border", title: "Cross-border", surface: "/east-west", note: "EASTWEST-100 packaged — one signed measurement, four regimes mapped." },
  { id: "bank", title: "Bank", surface: "/engine-axis", note: "COBOL↔A2A bridge LANE-REPORTED; open-banking feeds THEORY." },
  { id: "insurance", title: "Insurance", surface: "/insurers", note: "Underwriting packs OWNER-BLOCKED pricing; Sep 30 clock." },
] as const;
