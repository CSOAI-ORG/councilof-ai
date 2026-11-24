/**
 * Council World executable *navigation*, not agent actions.
 * These destinations reuse the canonical Council OS tabs; they never trigger
 * runs, paid endpoints, admissions or human approvals.
 */
export type MissionId =
  | "ras" | "benchmarks" | "harness" | "verify" | "watchdog"
  | "watchdog-intake" | "human" | "academy" | "games"
  | "simulation" | "attestations" | "sovx" | "x402"
  | "connect" | "ontology" | "specialists";

export type Mission = {
  id: MissionId;
  label: string;
  route: string;
  desk: "measure" | "watchdog" | "academy" | "verify" | "revenue" | "press";
  dataKind: "PUBLISHED_RECORD" | "PRACTICE" | "INTAKE" | "READ_ONLY" | "HUMAN_GATED";
  promise: string;
  boundary: string;
  cues: RegExp[];
};

export const MISSIONS: readonly Mission[] = [
  {
    id: "ras", label: "RAS · scope a measurement", route: "/dashboard?tab=measured", desk: "revenue",
    dataKind: "INTAKE", promise: "Describe a system and examine the published request/screening route.",
    boundary: "Screening is not a completed measurement, attestation, approval or booked job.",
    cues: [/\bras\b|\battestation request\b|\brequest (?:a )?(?:measurement|assessment)\b/i, /\bget measured\b/i],
  },
  {
    id: "benchmarks", label: "GSPC · living benchmarks", route: "/dashboard?tab=results", desk: "measure",
    dataKind: "PUBLISHED_RECORD", promise: "Read model, axis, sample, separation, method and source-date fields from the living board.",
    boundary: "A published test is not current monitoring or proof of deployment safety.",
    cues: [/\bbenchmarks?\b|\bgspc\b|\baxes\b|\bmodel compar/i, /\bscore(?:s|board)?\b|\brankings?\b/i],
  },
  {
    id: "harness", label: "Harness · evaluate", route: "/dashboard?tab=harness", desk: "measure",
    dataKind: "READ_ONLY", promise: "Inspect the evaluation machinery, instruments and how reproducible runs are made.",
    boundary: "Opening an instrument does not schedule a model call or a new run.",
    cues: [/\bharness\b|\breproducib(?:le|ility)\b|\bnegative control\b/i, /\brun (?:an? )?(?:evaluation|benchmark)\b/i],
  },
  {
    id: "verify", label: "Verify · inspect a card", route: "/dashboard?tab=verify", desk: "verify",
    dataKind: "READ_ONLY", promise: "Inspect a signed-card verification flow with a source link.",
    boundary: "A displayed signature must actually be checked; the UI cannot vouch for a card without verification.",
    cues: [/\bverify\b|\bverification\b|\bed25519\b|\bdid:web\b/i, /\bsigned cards?\b|\bproof of (?:claim|record)\b/i],
  },
  {
    id: "watchdog", label: "Watchdog · public records", route: "/dashboard?tab=corrections", desk: "watchdog",
    dataKind: "PUBLISHED_RECORD", promise: "Inspect the dated public corrections and challenge records.",
    boundary: "An allegation or candidate incident is not a finding. This view does not expose private cases.",
    cues: [/\bpublic watchdog\b|\bcorrection(?:s)?\b|\bincident history\b/i, /\bpublic claims?\b|\bchallenge ledger\b/i],
  },
  {
    id: "watchdog-intake", label: "Watchdog · ask about reporting", route: "/dashboard?tab=staff", desk: "watchdog",
    dataKind: "INTAKE", promise: "Talk to the existing Watchdog AI desk about the published reporting route.",
    boundary: "The old incident form redirects. A chat is not a filed report, emergency response or human case acceptance.",
    cues: [/\breport (?:an? )?(?:AI |artificial intelligence )?(?:incident|harm|failure)\b|\bfile (?:a )?complaint\b/i],
  },
  {
    id: "human", label: "H.I.M. · human review", route: "/dashboard?tab=staff", desk: "watchdog",
    dataKind: "HUMAN_GATED", promise: "Inspect staff escalations, competency and the human-review console.",
    boundary: "An AI desk, proposed WG member or model quorum is not a newly authenticated human approver.",
    cues: [/\b(?:hitl|h\.?i\.?m\.?|human[- ]in[- ]the[- ]loop|human review|approval|approve|approving)\b/i, /\bworking groups?\b|\bwg charter\b|\bquorum\b/i],
  },
  {
    id: "academy", label: "Academy · learning", route: "/dashboard?tab=academy", desk: "academy",
    dataKind: "PRACTICE", promise: "Explore available learning material and practice evidence literacy.",
    boundary: "Lesson activity is not a professional credential or permission to approve production work.",
    cues: [/\bacademy\b|\bmooc\b|\btrain(?:ing)?\b|\bcourse\b/i, /\blearn\b|\bexam\b|\bcompetenc/i],
  },
  {
    id: "games", label: "Games · local practice", route: "/dashboard?tab=play", desk: "academy",
    dataKind: "PRACTICE", promise: "Explore the game's available practice routes and honest in-build labels.",
    boundary: "XP and fictional simulation scores never become GSPC results or a real-human qualification.",
    cues: [/\bgamif(?:y|ication)\b|\bgames?\b|\bxp\b|\bquest\b/i, /\bcoliseum\b|\bboss.?chair\b/i],
  },
  {
    id: "simulation", label: "SovSpace · rehearsal", route: "/dashboard?tab=space", desk: "academy",
    dataKind: "PRACTICE", promise: "Inspect existing local practice and the archived SovSpace replay.",
    boundary: "The merged Python world-rehearsal is a local candidate, not a production simulation endpoint.",
    cues: [/\bsimulati(?:on|ons|ng)\b|\bwhat[- ]if\b|\bscenario\b/i, /\bsovspace\b|\breplay\b|\bworld\b/i],
  },
  {
    id: "attestations", label: "Root · attestations", route: "/dashboard?tab=attestations", desk: "verify",
    dataKind: "READ_ONLY", promise: "Inspect root, witness state and date-stamped evidence lineage.",
    boundary: "Presence in a root does not by itself verify the source's identity or independent real-world effect.",
    cues: [/\battestations?\b|\bmerkle\b|\b(?:rekor|ots|sigstore)\b/i, /\bsigned roots?\b|\bwitness(?:es)?\b/i],
  },
  {
    id: "sovx", label: "SovX · wrapped assets", route: "/dashboard?tab=sovx", desk: "measure",
    dataKind: "READ_ONLY", promise: "Read wrapper and bridge observations and their verification paths.",
    boundary: "An asset listing or wrapper observation is not a rating, audit or financial recommendation.",
    cues: [/\bsovx\b|\bwrapped assets?\b|\bwrappers?\b/i],
  },
  {
    id: "x402", label: "x402 · payment rail", route: "/dashboard?tab=swift", desk: "revenue",
    dataKind: "READ_ONLY", promise: "Inspect the published SWIFT/XRPL/x402 read and payment-challenge contracts.",
    boundary: "Browsing never triggers a payment. A 402 challenge does not mean a transaction settled.",
    cues: [/\bx402\b|\bswift\b|\bpayment rail\b/i, /\bpay(?:ments)?\b|\bsettlements?\b/i],
  },
  {
    id: "connect", label: "Connect · MCP, A2A, AG-UI, A2UI", route: "/dashboard?tab=connect", desk: "verify",
    dataKind: "READ_ONLY", promise: "Use the existing client connection guides and typed interactive-UI contracts.",
    boundary: "Transport/renderer availability is not a qualified MEOK model runtime or permission to execute a tool.",
    cues: [/\b(?:a2ui|ag[- ]ui|a2a|mcp apps|plugin)\b/i, /\bconnect(?:or)?\b|\binstall\b|\btool calling\b/i],
  },
  {
    id: "ontology", label: "Ontology · evidence connections", route: "/dashboard?tab=fabric", desk: "measure",
    dataKind: "READ_ONLY", promise: "Inspect the connected capability graph and known gaps across supported protocols.",
    boundary: "A source node in a graph is not proof that a receiver was reached or accepts the relationship.",
    cues: [/\bontology\b|\bknowledge graph\b|\brelations?\b/i, /\bfabric\b|\bdependencies\b|\bconnected\b/i],
  },
  {
    id: "specialists", label: "GSPC · axis specialists", route: "/dashboard?tab=axis-specialists", desk: "measure",
    dataKind: "HUMAN_GATED", promise: "Inspect bounded specialist recommendations, negative controls and hold gates.",
    boundary: "An axis specialist may propose improvements; it cannot independently authorize adoption or sign a human decision.",
    cues: [/\baxis specialists?\b|\bmeok hive\b|\brecommendation-only\b/i],
  },
] as const;

export function missionForId(id: string | null | undefined): Mission | null {
  return MISSIONS.find((mission) => mission.id === id) ?? null;
}

/** Suggest a route from a sentence. Never invokes that route or executes an action. */
export function suggestMission(question: string): Mission | null {
  const q = question.trim().slice(0, 700);
  if (!q) return null;
  // Safety-critical precedence: reporting and approvals should not become simulated action.
  for (const id of ["watchdog-intake", "human", "ras"]) {
    const candidate = missionForId(id)!;
    if (candidate.cues.some((pattern) => pattern.test(q))) return candidate;
  }
  let candidate: Mission | null = null;
  let score = 0;
  for (const mission of MISSIONS) {
    const matched = mission.cues.filter((pattern) => pattern.test(q)).length;
    if (matched > score) { candidate = mission; score = matched; }
  }
  return candidate;
}

/** Resolve only fixed Council OS destinations, never an LLM-provided URL. */
export function missionHref(mission: Mission): string {
  if (!/^\/dashboard\?tab=[a-z-]+$/.test(mission.route)) throw new Error("UNSAFE_MISSION_ROUTE");
  return mission.route;
}
