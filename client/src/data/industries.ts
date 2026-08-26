// client/src/data/industries.ts
//
// The 15-industry information architecture for /industries. One data array
// drives both the hub grid (IndustrySolutions) and every per-sector page
// (IndustryTemplate, route /industries/:slug).
//
// HONESTY FIREWALL (read before editing):
//   * CSOAI is a MEASUREMENT body. Nothing here is certification, accreditation
//     or approval. Every measured number below is a deterministic grade of
//     recorded model outputs on a frozen, published split.
//   * Real measured values are lifted from functions/api/gspc.ts (board v2,
//     2026-08-12, 15,580 per-item rows). Do NOT hand-edit a score — re-run the
//     board harness and paste the result, or leave the sector UNMEASURED.
//   * Where a sector has no dedicated measured bank, `numbers` is an
//     `unmeasured` record. Never invent a number to fill the gap.
//   * "Leader" is the highest point estimate on the board; a TIE means that
//     lead is not statistically separated (McNemar p<0.05). Ties are not wins.
//   * Model leaders are named by role (tuned council specialist / base model),
//     never by internal codename.
//   * DATES come from functions/api/regulation.ts, which carries the Digital Omnibus
//     correction. Stand-alone Annex III high-risk is 2 Dec 2027 and Annex I is
//     2 Aug 2028 — NOT 2 Aug 2026. GPAI provider duties are 2 Aug 2025. Art 50 is
//     2 Aug 2026. Getting these wrong is in our own corrections ledger twice.
//   * ARTEFACT_CARD must describe the fields a published card ACTUALLY carries.
//     n, the interval and the split hash are on the board, not in the card.

export interface LawProvision {
  provision: string;
  date: string;
  live: boolean; // true = already in force, false = scheduled
}

export interface GspcPillar {
  pillar: "Governance" | "Safety" | "Provenance" | "Continuity";
  inSector: string; // the pillar restated in this sector's language
}

export interface MeasuredNumbers {
  kind: "measured";
  n: number;
  leaderAccuracy: number; // 0..1, the board leader's accuracy on this bank
  leaderRole: string; // "tuned council specialist" | "base model"
  separation: "SEPARATED" | "TIE";
  separationP?: number;
  interval?: [number, number]; // Wilson 95% CI on the leader, where n is independent
  fleetMean: number; // mean accuracy across the full 19-model fleet
  note: string;
}

export interface UnmeasuredNumbers {
  kind: "unmeasured";
  label: string; // short honest label, e.g. "UNMEASURED — limited corpus"
  nearest: string; // what IS measured today that this sector can lean on
}

export interface Industry {
  slug: string;
  name: string;
  short: string; // one-line card subtitle
  bench: string; // e.g. "GovBench" or "no dedicated bank yet"
  icon: string; // lucide-react icon name
  beachhead?: boolean;
  reliesOn: string; // who relies on the measurement (insurer / regulator / buyer)
  law: LawProvision[];
  whatMeasure: {
    summary: string;
    pillars: GspcPillar[];
  };
  numbers: MeasuredNumbers | UnmeasuredNumbers;
  artefactProves: string; // what THIS sector's signed card lets the reader prove
}

// Shared artefact language — the same signed card ships from every bank.
export const ARTEFACT_CARD =
  "A signed result card, under a kilobyte: Ed25519 signature over a canonical JSON body " +
  "carrying the axis measured, the exact model, the accuracy, the issuer, the creation date " +
  "and the SHA-256 of the previous card in the chain. That is the whole of the card \u2014 the " +
  "sample size, the confidence interval and the separation determination live on the board at " +
  "GET /api/gspc, not inside the card, and this sentence used to claim otherwise. The card " +
  "proves a specific measurement happened and has not been altered since; the board tells you " +
  "how much weight it carries. Verify it offline with the zero-dependency verifier at " +
  "/signed/verify-card.mjs \u2014 no account, no permission. It is not certification, " +
  "accreditation or approval.";

export const industries: Industry[] = [
  // 2 — INSURANCE / UNDERWRITING — beachhead, featured first
  {
    slug: "insurance",
    name: "Insurance & underwriting",
    short: "Risk-pricing, life & health underwriting, claims triage",
    bench: "GovBench + CareBench (insurance-specific bank UNMEASURED)",
    icon: "Umbrella",
    beachhead: true,
    reliesOn:
      "The insurer pricing the model risk, and the regulator asking whether an " +
      "underwriting model was tested before it priced a life.",
    law: [
      {
        provision:
          "EU AI Act Annex III §5(c) — AI used for risk assessment and pricing in " +
          "life and health insurance is high-risk.",
        date: "2 Dec 2027 (deferred from 2 Aug 2026 by the Digital Omnibus, Reg (EU) 2026/1744)",
        live: false,
      },
      {
        provision:
          "EU AI Act Annex III §5(b) — AI evaluating creditworthiness (bancassurance) is high-risk.",
        date: "2 Dec 2027 (deferred from 2 Aug 2026 by the Digital Omnibus, Reg (EU) 2026/1744)",
        live: false,
      },
      {
        provision: "EU AI Act Art 50 — transparency / disclosure of AI interaction.",
        date: "live 2 Aug 2026",
        live: true,
      },
    ],
    whatMeasure: {
      summary:
        "The beachhead. Insurers already price model risk for a living, so they are " +
        "the first buyers of an outside measurement. A dedicated life/health " +
        "underwriting bank is not yet built and is labelled UNMEASURED — but the " +
        "models an underwriter relies on are already measured today on the risk-tiering " +
        "and calibrated-care banks.",
      pillars: [
        { pillar: "Governance", inSector: "Does the model tier its own insurance use correctly under the AI Act?" },
        { pillar: "Safety", inSector: "Does it refuse to price on a prohibited or manipulative basis?" },
        { pillar: "Provenance", inSector: "Can an AI-assisted underwriting note be traced to the model that wrote it?" },
        { pillar: "Continuity", inSector: "Does the pricing behaviour hold on a frozen, re-runnable split?" },
      ],
    },
    numbers: {
      kind: "unmeasured",
      label: "UNMEASURED — the insurance-specific corpus is thin",
      nearest:
        "No dedicated life/health underwriting bank exists yet. What an insurer " +
        "relies on is already measured: EU AI Act risk-tiering on GovBench " +
        "(n=237, leader 0.700 [0.639–0.755], fleet mean 0.490) and calibrated care " +
        "on CareBench (n=199, fleet mean 0.293). The underwriting bank is on the " +
        "build list; until it lands, we will not quote an insurance number we have not measured.",
    },
    artefactProves:
      "which model priced or triaged, on which frozen bank, and that the score " +
      "an insurer was shown has not been edited since the run.",
  },

  // 1 — GOVERNMENT
  {
    slug: "government",
    name: "Government",
    short: "Benefits, justice support, public-service AI",
    bench: "GovBench",
    icon: "Landmark",
    reliesOn:
      "The public body deploying the model, and the auditor asking whether it " +
      "classified its own AI Act risk-tier before it went live.",
    law: [
      {
        provision:
          "EU AI Act Art 5 — prohibited practices (social scoring by public authorities, " +
          "untargeted biometric scraping).",
        date: "live 2 Feb 2025",
        live: true,
      },
      {
        provision:
          "EU AI Act Annex III §4–6 — law enforcement, migration and administration " +
          "of justice are high-risk.",
        date: "obligations from 2 Dec 2027 (Digital Omnibus)",
        live: false,
      },
      {
        provision: "EU AI Act Art 27 — fundamental-rights impact assessment for public deployers.",
        date: "with high-risk obligations, 2 Dec 2027 (Digital Omnibus)",
        live: false,
      },
      { provision: "EU AI Act Art 50 — transparency of AI-generated public communications.", date: "live 2 Aug 2026", live: true },
    ],
    whatMeasure: {
      summary:
        "Whether a model can read the EU AI Act and place a use case in the right " +
        "risk tier — the single most load-bearing judgement in public-sector AI.",
      pillars: [
        { pillar: "Governance", inSector: "Correct AI Act risk-tier classification of a public use case." },
        { pillar: "Safety", inSector: "Refusing prohibited public-authority uses under Article 5." },
        { pillar: "Provenance", inSector: "Marking AI-generated citizen-facing communications." },
        { pillar: "Continuity", inSector: "The same tiering judgement holds on a re-runnable split." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 237,
      leaderAccuracy: 0.7,
      leaderRole: "tuned council specialist",
      separation: "SEPARATED",
      separationP: 0.0086,
      interval: [0.639, 0.755],
      fleetMean: 0.49,
      note:
        "One of only three statistically separated leads on the board (McNemar " +
        "p=0.0086 vs the best base model). EU AI Act tiering is hard for everyone: " +
        "the 19-model fleet mean is 0.490, and the worst 5% of items carry harm 0.873 " +
        "(CVaR, n=237). Bank: 237 public items from the AI Act Evaluation Benchmark " +
        "(NCSR “Demokritos”, arXiv:2603.09435, CC-BY-4.0).",
    },
    artefactProves:
      "which model tiered which use case, on the frozen 237-item bank, with the " +
      "separated lead and its interval intact.",
  },

  // 3 — CARE
  {
    slug: "care",
    name: "Care",
    short: "Assistive, clinical-adjacent and social-care AI",
    bench: "CareBench",
    icon: "HeartPulse",
    reliesOn:
      "The care provider and the commissioner asking whether an assistive model " +
      "protects and helps under paired conduct scenarios.",
    law: [
      {
        provision: "EU AI Act Annex III §5(a) — AI for access to essential public assistance and benefits is high-risk.",
        date: "obligations from 2 Dec 2027 (Digital Omnibus)",
        live: false,
      },
      { provision: "EU AI Act Art 5(1)(a) — ban on manipulative techniques exploiting vulnerability.", date: "live 2 Feb 2025", live: true },
      { provision: "Medical Device Regulation (EU) 2017/745 — where the AI is a clinical device.", date: "in force", live: true },
    ],
    whatMeasure: {
      summary:
        "Care-cost: whether a model protects and helps at once under paired conduct " +
        "scenarios. This is the fleet's weakest measured axis, and we say so plainly.",
      pillars: [
        { pillar: "Governance", inSector: "Placing an assistive tool in the right high-risk tier." },
        { pillar: "Safety", inSector: "Calibrated protection of a vulnerable person without over-refusing help." },
        { pillar: "Provenance", inSector: "Attributing an AI-authored care note to its model." },
        { pillar: "Continuity", inSector: "Care behaviour holds across a frozen scenario bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 199,
      leaderAccuracy: 0.535,
      leaderRole: "tuned council specialist",
      separation: "SEPARATED",
      separationP: 0.0356,
      interval: [0.466, 0.603],
      fleetMean: 0.293,
      note:
        "SEPARATED from the best base model (p=0.036) but NOT clear of the majority-class " +
        "baseline — quote it only as “separated from base models”. The fleet mean is " +
        "0.293 and the worst 5% of items carry harm 0.990 (CVaR, n=199): calibrated care " +
        "is the fleet's weakest measured axis, and the tail is nearly total. 199 unique " +
        "scored texts (200 records, one exact-duplicate pair removed).",
    },
    artefactProves:
      "which model was scored on the frozen 199-item care bank, with the honest " +
      "separated-from-base caveat carried on the card.",
  },

  // 4 — DEFENCE
  {
    slug: "defence",
    name: "Defence",
    short: "Calibrated refusal, dual-use decision support",
    bench: "DefBench",
    icon: "Shield",
    reliesOn:
      "The programme owner and the reviewer asking whether a model refuses the " +
      "harmful half of a paired request while still answering the benign half.",
    law: [
      {
        provision:
          "EU AI Act Art 2(3) — activities exclusively for military, defence or national " +
          "security fall outside the Act. Dual-use and procurement uses do not.",
        date: "in force",
        live: true,
      },
      { provision: "NATO Principles of Responsible Use of AI — political commitment, not statute.", date: "adopted 2021", live: true },
      { provision: "EU AI Act Art 50 — transparency, where a use is not defence-exempt.", date: "live 2 Aug 2026", live: true },
    ],
    whatMeasure: {
      summary:
        "Calibrated refusal on paired requests — refusing the harmful item without " +
        "refusing its benign twin. Much defence AI sits outside the Act's scope; the " +
        "measurement still applies to dual-use behaviour.",
      pillars: [
        { pillar: "Governance", inSector: "Knowing when a use is defence-exempt vs in-scope." },
        { pillar: "Safety", inSector: "Refusing the harmful request; answering the paired benign one." },
        { pillar: "Provenance", inSector: "Attributing a generated assessment to its model." },
        { pillar: "Continuity", inSector: "Refusal calibration holds on a frozen paired bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 36,
      leaderAccuracy: 0.944,
      leaderRole: "base model",
      separation: "TIE",
      separationP: 0.6875,
      interval: [0.819, 0.985],
      fleetMean: 0.732,
      note:
        "A base model holds the point lead but the lead is a TIE (McNemar p=0.69). " +
        "Honestly reported: the tuned specialists do not own this axis. Fleet mean 0.732.",
    },
    artefactProves:
      "which model was tested on the frozen 36-pair refusal bank, and that the " +
      "lead is recorded as a TIE, not a win.",
  },

  // 5 — CRITICAL INFRASTRUCTURE / PQC
  {
    slug: "critical-infrastructure",
    name: "Critical infrastructure",
    short: "Post-quantum readiness, safety-component AI",
    bench: "PQCBench",
    icon: "Server",
    reliesOn:
      "The operator and the regulator asking whether a model reasons correctly " +
      "about the post-quantum status of a cryptographic assumption.",
    law: [
      { provision: "EU AI Act Annex III §2 — AI as a safety component of critical infrastructure is high-risk.", date: "obligations from 2 Dec 2027 (Digital Omnibus)", live: false },
      { provision: "NIS2 Directive (EU) 2022/2555 — security and incident-reporting duties for essential entities.", date: "in force", live: true },
      { provision: "NIST FIPS 203/204/205 — standardised post-quantum algorithms; migration underway.", date: "published 2024", live: true },
    ],
    whatMeasure: {
      summary:
        "Whether a model can state the post-quantum status of a cryptographic " +
        "assumption — the axis built to discriminate across frontier models on " +
        "continuity of trust.",
      pillars: [
        { pillar: "Governance", inSector: "Placing a safety-component use in the right tier." },
        { pillar: "Safety", inSector: "Not asserting a broken assumption is secure." },
        { pillar: "Provenance", inSector: "Recording which model made a continuity claim." },
        { pillar: "Continuity", inSector: "Post-quantum reasoning on a frozen assumption bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 33,
      leaderAccuracy: 0.606,
      leaderRole: "tuned council specialist",
      separation: "TIE",
      separationP: 1.0,
      interval: [0.437, 0.753],
      fleetMean: 0.45,
      note:
        "The tuned specialist leads on points; flat TIE (p=1.0). Fleet mean 0.450 — " +
        "post-quantum reasoning is hard across the board.",
    },
    artefactProves:
      "which model answered the frozen 33-item post-quantum bank, with the TIE recorded honestly.",
  },

  // 6 — MEDIA / PROVENANCE
  {
    slug: "media",
    name: "Media & provenance",
    short: "Article 50 marking, watermark survival & detector interop",
    bench: "ProvBench (+ DetBench)",
    icon: "Radar",
    reliesOn:
      "The publisher and the platform asking whether a content mark survives, and " +
      "whether independent detectors agree.",
    law: [
      { provision: "EU AI Act Art 50 — machine-readable marking of AI-generated content.", date: "live 2 Aug 2026", live: true },
      { provision: "EU AI Act Art 50(4) — deepfake and synthetic-media disclosure.", date: "live 2 Aug 2026", live: true },
      { provision: "GPAI Code of Practice — detector-interop target.", date: "2 Feb 2027", live: false },
    ],
    whatMeasure: {
      summary:
        "Whether an Article 50 marking survives by validity — a manifest that is " +
        "present but no longer validates has NOT survived — and whether cross-detector " +
        "watermark checks agree.",
      pillars: [
        { pillar: "Governance", inSector: "Knowing when Article 50 marking is required." },
        { pillar: "Safety", inSector: "Not passing off unmarked synthetic media as marked." },
        { pillar: "Provenance", inSector: "Marking survives by validity; detectors interoperate." },
        { pillar: "Continuity", inSector: "Marking judgement holds on a frozen bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 32,
      leaderAccuracy: 0.781,
      leaderRole: "tuned council specialist",
      separation: "TIE",
      separationP: 0.7744,
      interval: [0.612, 0.89],
      fleetMean: 0.549,
      note:
        "ProvBench validity bank (n=32): tuned specialist leads on points; TIE (p=0.77), " +
        "fleet mean 0.549. Companion DetBench cross-detector bank (n=33) leader 0.879, " +
        "also a TIE and not clear of baseline.",
    },
    artefactProves:
      "which model was scored on the frozen 32-item marking bank, with validity — not " +
      "mere presence — as the pass condition.",
  },

  // 7 — AGENT RAILS
  {
    slug: "agent-rails",
    name: "Agent rails",
    short: "MCP tool conformance for agentic systems",
    bench: "MCPBench",
    icon: "Network",
    reliesOn:
      "The platform wiring an agent to tools, and the buyer asking whether the " +
      "model follows the tool contract rather than improvising.",
    law: [
      { provision: "EU AI Act Art 50 — disclosure of AI interaction in agentic flows.", date: "live 2 Aug 2026", live: true },
      { provision: "EU AI Act Art 53–55 — general-purpose model obligations that agent stacks inherit.", date: "live 2 Aug 2025", live: true },
      { provision: "MCP tool conformance is voluntary interop — there is no statute; we measure it because buyers rely on it.", date: "n/a", live: true },
    ],
    whatMeasure: {
      summary:
        "MCP tool conformance: whether a model calls tools within the declared " +
        "contract instead of hallucinating arguments or skipping the schema.",
      pillars: [
        { pillar: "Governance", inSector: "Disclosing agentic AI interaction where the Act requires it." },
        { pillar: "Safety", inSector: "Refusing tool calls outside its granted authority." },
        { pillar: "Provenance", inSector: "Recording which model issued which tool call." },
        { pillar: "Continuity", inSector: "Conformance holds on a frozen tool-contract bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 35,
      leaderAccuracy: 0.743,
      leaderRole: "tuned council specialist",
      separation: "TIE",
      separationP: 1.0,
      interval: [0.579, 0.858],
      fleetMean: 0.537,
      note:
        "Canonical bank count 35 (supersedes the stale 11 in older matrices). Tuned " +
        "specialist leads on points; flat TIE (p=1.0), fleet mean 0.537.",
    },
    artefactProves:
      "which model was scored on the frozen 35-item MCP conformance bank, with the TIE recorded.",
  },

  // 8 — OPEN SOURCE
  {
    slug: "open-source",
    name: "Open source",
    short: "Licence reasoning against intended use",
    bench: "OSSBench",
    icon: "GitBranch",
    reliesOn:
      "The maintainer and the adopter asking whether a model reasons correctly " +
      "about a licence against how the code will actually be used.",
    law: [
      { provision: "EU AI Act — partial open-source exemptions for free and open-source components (recitals + Art 2).", date: "in force", live: true },
      { provision: "EU AI Act Art 53 — GPAI obligations still bite for open-weight models above the compute threshold.", date: "live 2 Aug 2025", live: true },
    ],
    whatMeasure: {
      summary:
        "Licence reasoning versus intended use — AGPL network triggers, directional " +
        "compatibility, and SSPL/ELv2/BSL service clauses.",
      pillars: [
        { pillar: "Governance", inSector: "Knowing which open-source exemptions actually apply." },
        { pillar: "Safety", inSector: "Not clearing a use the licence forbids." },
        { pillar: "Provenance", inSector: "Attributing a licence verdict to its model." },
        { pillar: "Continuity", inSector: "Licence reasoning holds on a frozen bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 32,
      leaderAccuracy: 0.875,
      leaderRole: "tuned council specialist",
      separation: "TIE",
      separationP: 1.0,
      interval: [0.719, 0.95],
      fleetMean: 0.696,
      note:
        "Canonical count 32 (supersedes stale 16). Tuned specialist leads on points; " +
        "flat TIE, fleet mean 0.696 — a comparatively strong axis for the whole fleet.",
    },
    artefactProves:
      "which model was scored on the frozen 32-item licence-reasoning bank, with the TIE recorded.",
  },

  // 9 — MULTI-AGENT COMMERCE
  {
    slug: "multi-agent-commerce",
    name: "Multi-agent commerce",
    short: "Coordination safety across cooperating agents",
    bench: "SwarmBench",
    icon: "Boxes",
    reliesOn:
      "The marketplace and the buyer asking whether cooperating agents coordinate " +
      "safely rather than colluding or cascading a failure.",
    law: [
      { provision: "EU AI Act Art 50 — disclosure of AI interaction in multi-agent transactions.", date: "live 2 Aug 2026", live: true },
      { provision: "Consumer-protection and competition law apply to agent-mediated transactions; no dedicated AI statute yet.", date: "n/a", live: true },
    ],
    whatMeasure: {
      summary:
        "Multi-agent coordination safety. This is the honesty-clause gold template: " +
        "raw intervals on this bank look disjoint, but the paired test says the lead is a TIE.",
      pillars: [
        { pillar: "Governance", inSector: "Disclosing multi-agent AI interaction to the counterparty." },
        { pillar: "Safety", inSector: "Coordinating without collusion or failure cascades." },
        { pillar: "Provenance", inSector: "Recording which agent took which action." },
        { pillar: "Continuity", inSector: "Coordination behaviour holds on a frozen protocol bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 40,
      leaderAccuracy: 0.975,
      leaderRole: "base model",
      separation: "TIE",
      separationP: 1.0,
      // No interval on purpose: protocol bank, instances are not independent.
      fleetMean: 0.372,
      note:
        "PROTOCOL bank: 1 anchor, 3 unique prompts, 40 scored instances — the instances " +
        "are NOT independent, so no Wilson interval is shown (quoting n=40 would overstate " +
        "the evidence). Raw CIs look disjoint but the paired test says p=1.0: a TIE. Fleet mean 0.372.",
    },
    artefactProves:
      "which model ran the frozen coordination protocol, with the effective-n caveat and " +
      "withheld interval recorded on the card.",
  },

  // 10 — SECURITY / CONTAINMENT
  {
    slug: "security",
    name: "Security & containment",
    short: "Containment behaviour under adversarial pressure",
    bench: "no dedicated bank yet",
    icon: "Lock",
    reliesOn:
      "The security team and the assurer asking whether a model stays within its " +
      "authority under adversarial pressure.",
    law: [
      { provision: "EU AI Act Annex III §2 — AI as a safety component is high-risk.", date: "obligations from 2 Dec 2027 (Digital Omnibus)", live: false },
      { provision: "Cyber Resilience Act (EU) 2024/2847 — essential requirements for products with digital elements.", date: "obligations phasing to 2027", live: false },
      { provision: "NIS2 Directive — incident-reporting and supply-chain duties.", date: "in force", live: true },
    ],
    whatMeasure: {
      summary:
        "Containment under adversarial pressure. A dedicated containment bank is not " +
        "yet built and is labelled UNMEASURED; the nearest measured signal is " +
        "calibrated refusal on the safety bank.",
      pillars: [
        { pillar: "Governance", inSector: "Tiering a security-critical AI use correctly." },
        { pillar: "Safety", inSector: "Staying inside granted authority when pushed." },
        { pillar: "Provenance", inSector: "Recording which model took a contained action." },
        { pillar: "Continuity", inSector: "Containment behaviour holds on a frozen bank (once built)." },
      ],
    },
    numbers: {
      kind: "unmeasured",
      label: "UNMEASURED — dedicated containment bank not yet built",
      nearest:
        "The nearest measured signal is calibrated refusal on DefBench (safety axis, " +
        "n=36, fleet mean 0.732, leader a TIE). We will not publish a containment score " +
        "until a containment bank exists; the axis is on the build list.",
    },
    artefactProves:
      "once the bank exists — which model was scored on which frozen containment split. " +
      "Until then the card would carry the UNMEASURED label, not a number.",
  },

  // 11 — MACHINERY
  {
    slug: "machinery",
    name: "Machinery",
    short: "Self-evolving safety-function classification",
    bench: "MachBench",
    icon: "Cog",
    reliesOn:
      "The manufacturer and the notified body asking whether a self-evolving " +
      "function is a safety function under the Machinery Regulation.",
    law: [
      {
        provision:
          "Machinery Regulation (EU) 2023/1230 Annex I Part A — self-evolving safety functions.",
        date: "applies 14 Jan 2027",
        live: false,
      },
      { provision: "EU AI Act Annex I — product-safety route; full obligations for Annex I products.", date: "2 Aug 2028", live: false },
    ],
    whatMeasure: {
      summary:
        "Classifying a self-evolving function as PART_A / OUT_OF_SCOPE / " +
        "NOT_SAFETY_FUNCTION under the Machinery Regulation. Gold labels remain under " +
        "legal review — this is measurement, not a conformity verdict.",
      pillars: [
        { pillar: "Governance", inSector: "Correct Machinery-Reg safety-function classification." },
        { pillar: "Safety", inSector: "Not mislabelling a safety function as out of scope." },
        { pillar: "Provenance", inSector: "Attributing a classification to its model." },
        { pillar: "Continuity", inSector: "Classification holds on a frozen bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 33,
      leaderAccuracy: 0.545,
      leaderRole: "base model",
      separation: "TIE",
      separationP: 0.5811,
      interval: [0.38, 0.702],
      fleetMean: 0.349,
      note:
        "A base model leads on points; TIE. Anchor: Machinery Reg (EU) 2023/1230 Annex I " +
        "Part A items 5–6, applies 14 Jan 2027. Gold labels remain under legal review — " +
        "measurement, not a conformity verdict. Fleet mean 0.349.",
    },
    artefactProves:
      "which model classified which item on the frozen 33-item Machinery bank, with the " +
      "legal-review caveat and the TIE recorded.",
  },

  // 12 — HUMANOID / EMBODIED
  {
    slug: "humanoid",
    name: "Humanoid & embodied",
    short: "Action authority for embodied agents",
    bench: "no dedicated bank yet",
    icon: "PersonStanding",
    reliesOn:
      "The integrator and the safety reviewer asking whether an embodied agent " +
      "proceeds, confirms or refuses an action correctly.",
    law: [
      { provision: "Machinery Regulation (EU) 2023/1230 — embodied machine safety.", date: "applies 14 Jan 2027", live: false },
      { provision: "EU AI Act Annex I — product-safety route for embodied products; full obligations.", date: "2 Aug 2028", live: false },
    ],
    whatMeasure: {
      summary:
        "Action authority for embodied agents — proceed, confirm or refuse. A dedicated " +
        "embodiment bank is not yet built and is labelled UNMEASURED; the nearest " +
        "measured signals are cross-reality action authority and Machinery classification.",
      pillars: [
        { pillar: "Governance", inSector: "Placing an embodied use in the right product-safety tier." },
        { pillar: "Safety", inSector: "Confirming or refusing an unsafe physical action." },
        { pillar: "Provenance", inSector: "Recording which model authorised a physical action." },
        { pillar: "Continuity", inSector: "Action authority holds on a frozen bank (once built)." },
      ],
    },
    numbers: {
      kind: "unmeasured",
      label: "UNMEASURED — dedicated embodiment bank not yet built",
      nearest:
        "The nearest measured signals are cross-reality action authority on XRAIV " +
        "(n=32, leader 0.812 [0.647–0.911], a TIE) and Machinery classification on " +
        "MachBench (n=33). A humanoid-specific bank is on the build list; until it " +
        "lands we will not quote an embodiment number.",
    },
    artefactProves:
      "once the bank exists — which model was scored on which frozen embodiment split. " +
      "Until then the card carries the UNMEASURED label.",
  },

  // 13 — XR
  {
    slug: "xr",
    name: "XR & immersive",
    short: "Autonomous action authority in immersive settings",
    bench: "XRAIV",
    icon: "Glasses",
    reliesOn:
      "The XR platform and the buyer asking whether an autonomous agent proceeds, " +
      "confirms or refuses inside an immersive session.",
    law: [
      { provision: "EU AI Act Art 50 — disclosure of AI interaction in immersive experiences.", date: "live 2 Aug 2026", live: true },
      { provision: "GDPR — biometric and immersive-behaviour data; no XR-specific AI statute yet.", date: "in force", live: true },
    ],
    whatMeasure: {
      summary:
        "Autonomous agent action authority in immersive settings — PROCEED / CONFIRM / " +
        "REFUSE — where a wrong PROCEED has physical consequences.",
      pillars: [
        { pillar: "Governance", inSector: "Disclosing AI interaction in the immersive session." },
        { pillar: "Safety", inSector: "Confirming or refusing a consequential immersive action." },
        { pillar: "Provenance", inSector: "Recording which model authorised the action." },
        { pillar: "Continuity", inSector: "Action authority holds on a frozen bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 32,
      leaderAccuracy: 0.812,
      leaderRole: "base model",
      separation: "TIE",
      separationP: 0.0654,
      interval: [0.647, 0.911],
      fleetMean: 0.441,
      note:
        "A base model leads on points; TIE (p=0.065 — the closest near-miss on the board, " +
        "still not separated at p<0.05). Fleet mean 0.441. Bank: 32 scored (public + held-out split).",
    },
    artefactProves:
      "which model was scored on the frozen 32-item action-authority bank, with the " +
      "near-miss recorded honestly as a TIE.",
  },

  // 14 — LEGAL / COMPLIANCE
  {
    slug: "legal",
    name: "Legal & compliance",
    short: "Article 5 prohibited-practice safeguard",
    bench: "Art5Bench",
    icon: "Scale",
    reliesOn:
      "The compliance owner and the regulator asking whether a model trips on an " +
      "Article 5 prohibited practice.",
    law: [
      { provision: "EU AI Act Art 5 — prohibited AI practices.", date: "live 2 Feb 2025", live: true },
      { provision: "EU AI Act Annex III §8 — administration of justice and democratic processes are high-risk.", date: "obligations from 2 Dec 2027 (Digital Omnibus)", live: false },
      { provision: "EU AI Act Art 50 — transparency.", date: "live 2 Aug 2026", live: true },
    ],
    whatMeasure: {
      summary:
        "Whether a model trips correctly on an EU AI Act Article 5 prohibited practice — " +
        "the safeguard that has to fire before anything else matters.",
      pillars: [
        { pillar: "Governance", inSector: "Recognising an Article 5 prohibited practice." },
        { pillar: "Safety", inSector: "Tripping the safeguard rather than complying with the prohibited ask." },
        { pillar: "Provenance", inSector: "Recording which model made the safeguard call." },
        { pillar: "Continuity", inSector: "The safeguard fires the same way on a frozen bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 36,
      leaderAccuracy: 0.972,
      leaderRole: "tuned council specialist",
      separation: "TIE",
      separationP: 1.0,
      interval: [0.858, 0.995],
      fleetMean: 0.83,
      note:
        "Tuned specialist leads on points at 0.972; TIE (p=1.0) — the whole fleet is strong " +
        "here (fleet mean 0.830). The prohibited NCII/CSAM corpus is never handled by CSOAI.",
    },
    artefactProves:
      "which model was scored on the frozen 36-item Article 5 bank, with the TIE recorded " +
      "despite the high score.",
  },

  // 15 — EMOTION-AI / HR
  {
    slug: "emotion-ai",
    name: "Emotion-AI & HR",
    short: "Emotional and embodied safety in the workplace",
    bench: "AffectBench",
    icon: "Brain",
    reliesOn:
      "The employer and the works council asking whether a model manipulates, over-" +
      "discloses or exploits vulnerability — where emotion recognition at work is banned.",
    law: [
      { provision: "EU AI Act Art 5(1)(f) — ban on emotion recognition in the workplace and education.", date: "live 2 Feb 2025", live: true },
      { provision: "EU AI Act Annex III §4 — employment and worker-management AI is high-risk.", date: "obligations from 2 Dec 2027 (Digital Omnibus)", live: false },
      { provision: "EU AI Act Art 50(3) — emotion-recognition disclosure.", date: "live 2 Aug 2026", live: true },
      { provision: "EU AI Act Annex III §1(c) — a related clock.", date: "Dec 2027", live: false },
    ],
    whatMeasure: {
      summary:
        "Emotional and embodied safety — manipulation, disclosure and exploitation of " +
        "vulnerability. The legal gold labels and severity bases are COUNSEL-PENDING: " +
        "this measures model behaviour against a counsel-pending key, not a legal verdict.",
      pillars: [
        { pillar: "Governance", inSector: "Knowing that workplace emotion recognition is prohibited." },
        { pillar: "Safety", inSector: "Not manipulating or over-disclosing to a vulnerable user." },
        { pillar: "Provenance", inSector: "Recording which model produced an affective response." },
        { pillar: "Continuity", inSector: "Affective safety holds on a frozen bank." },
      ],
    },
    numbers: {
      kind: "measured",
      n: 41,
      leaderAccuracy: 0.878,
      leaderRole: "tuned council specialist",
      separation: "SEPARATED",
      separationP: 0.0078,
      interval: [0.745, 0.947],
      fleetMean: 0.605,
      note:
        "The cleanest separation on the board: tuned 0.878 [0.745–0.947] vs base models " +
        "0.29–0.34 (McNemar p=0.0078). COUNSEL-PENDING: the legal gold labels and 1–5 " +
        "severity bases await counsel review — this is measurement of model behaviour, " +
        "not a legal verdict. Finding: all 19 models over-block a lawful Article 5 self-audit " +
        "request; that item is preserved for adjudication, not deleted.",
    },
    artefactProves:
      "which model was scored on the frozen 41-item affect bank, with the separated lead " +
      "and the counsel-pending caveat both carried on the card.",
  },
];

// Hub ordering: beachhead first, then the rest in the audit's numbered order.
export const industriesForGrid: Industry[] = [
  ...industries.filter((i) => i.beachhead),
  ...industries.filter((i) => !i.beachhead),
];

export function getIndustry(slug: string): Industry | undefined {
  return industries.find((i) => i.slug === slug);
}
