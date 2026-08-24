/**
 * East-West canon — one signed measurement, mapped across regimes.
 *
 * Mapping is not a determination. Determination stays with authorities, always.
 * Scores are never sold. Regulators consume streams free forever.
 * Public grammar: 13 measured of 14. Product: verified measurement credential.
 */

import { CARD_KIND, SCHEMA_URL, hashBody } from "../lib/eastWestCrypto";

export const EAST_WEST_PITCH =
  "One signed measurement. Every regime it touches, mapped. Verify any of it without asking us.";

export const DETERMINATION_BANNER =
  "Cross-jurisdiction measurement ≠ compliance determination — determination stays with authorities, always.";

export const GRAMMAR = {
  product: "verified measurement credential",
  mapping: "mapped",
  count: "13 measured of 14",
  never: ["certification", "certified", "compliant", "forecast", "predict", "growing fast", "trusted by"] as const,
  scores: "never sold — no money in either direction with anything ranked",
  regulators: "signed streams FREE forever — no account, no procurement, no fee",
  commerce: "lawful commerce = data by query + tooling licenses only",
} as const;

export const OWNER_BLOCKS = {
  pricing: "OWNER-BLOCKED — pricing ruling unpublished. Packs are data; tooling is a license; scores are £0 forever.",
  payment: "OWNER-BLOCKED — x402/MPP rail not activated. Fallback is specified, not live.",
  did: "OWNER-BLOCKED — did.json id-mismatch (P0-1). Issuer is not claimed as externally resolved on this card.",
  domains: "OWNER-BLOCKED — cibola.dev / getcibola.com purchase pending. Schema URLs use councilof.ai.",
  trademark: "OWNER-BLOCKED — UKIPO filing not yet confirmed.",
  sale: "OWNER-BLOCKED — no pack sale. Ledger fetch count is 0 until a stranger-checkable row exists.",
  press: "K3 drafts only. Owner sends, one-to-one. No send has been logged.",
} as const;

export const MEASURED_AXES = [
  "governance",
  "safety",
  "provenance",
  "continuity",
  "conformance",
  "openness",
  "machinery-conformity",
  "care",
  "cross-reality",
  "detector-interop",
  "art5-safeguard",
  "swarm",
  "affect",
] as const;

export const JAIL_AXIS = "jail" as const;

export type RegimeId = "eu" | "uk" | "illinois" | "china";
export type MappingStatus = "mapped" | "open" | "unmeasured-on-this-credential";
export type SourceTier =
  | "primary-text"
  | "regulator-guidance"
  | "published-standard"
  | "whitespace-note";

export type CrosswalkCell = {
  id: string;
  regime: RegimeId;
  axis: string;
  provision: string;
  citation: string;
  sourceUrl: string;
  sourceTier: SourceTier;
  mapping: MappingStatus;
  effective?: string;
  note: string;
};

export const METHODOLOGY = {
  id: "east-west-method-v1",
  inclusion:
    "A cell is included only when a named provision or published principle exists in primary text, regulator guidance, or a published standard. We do not invent statutory hooks.",
  sourceTiers: [
    "primary text (statute, regulation, published bill text)",
    "regulator guidance (DRCF, AI Office, AG portals)",
    "published standard (GB/T clauses as published)",
    "whitespace note (honest absence — never papered)",
  ],
  labeling: "Every cell is labeled mapped | open | unmeasured-on-this-credential. Never compliant, never certified.",
  banner: DETERMINATION_BANNER,
  versioning:
    "v1 is frozen. A regime change (implementing act, GB/T revision, guidance, portal resolution) lands as a dated v-next. Silent edits are forbidden.",
};

export const EU_ROWS: CrosswalkCell[] = [
  {
    id: "eu-art9",
    regime: "eu",
    axis: "governance,safety,care,affect",
    provision: "Art. 9 — risk-management system",
    citation: "Regulation (EU) 2024/1689 Art. 9",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Scenario measurement of risk-management behaviour on frozen banks. Not a determination that Art. 9 is satisfied.",
  },
  {
    id: "eu-art10",
    regime: "eu",
    axis: "provenance,openness",
    provision: "Art. 10 — data and data governance",
    citation: "Regulation (EU) 2024/1689 Art. 10",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Mapped to provenance and openness measurements. Mapped, never compliant.",
  },
  {
    id: "eu-art11",
    regime: "eu",
    axis: "conformance",
    provision: "Art. 11 — technical documentation",
    citation: "Regulation (EU) 2024/1689 Art. 11",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "A measurement card is documentation of measured behaviour, not Annex IV completeness.",
  },
  {
    id: "eu-art12",
    regime: "eu",
    axis: "provenance,continuity",
    provision: "Art. 12 — record-keeping",
    citation: "Regulation (EU) 2024/1689 Art. 12",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Hash-chained cards are records of a run. They are not an automatically complete logs duty.",
  },
  {
    id: "eu-art13",
    regime: "eu",
    axis: "provenance,detector-interop",
    provision: "Art. 13 — transparency to deployers",
    citation: "Regulation (EU) 2024/1689 Art. 13",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Mapped. Not a deployer-instructions determination.",
  },
  {
    id: "eu-art14",
    regime: "eu",
    axis: "care,cross-reality",
    provision: "Art. 14 — human oversight",
    citation: "Regulation (EU) 2024/1689 Art. 14",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Authority-to-act banks measure whether the system asks, proceeds, or refuses. Oversight determination stays with authorities.",
  },
  {
    id: "eu-art15",
    regime: "eu",
    axis: "safety,continuity,swarm",
    provision: "Art. 15 — accuracy, robustness, cybersecurity",
    citation: "Regulation (EU) 2024/1689 Art. 15",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Scenario measurement on frozen splits. Not a robustness certificate.",
  },
  {
    id: "eu-art50",
    regime: "eu",
    axis: "provenance,detector-interop,affect",
    provision: "Art. 50 — transparency obligations",
    citation: "Regulation (EU) 2024/1689 Art. 50",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    effective: "2026-12-02",
    note: "Art. 50(2) grace runs to 2 Dec 2026. Mapping is not a marking-duty determination.",
  },
  {
    id: "eu-art53",
    regime: "eu",
    axis: "governance,openness",
    provision: "Art. 53 — GPAI model obligations",
    citation: "Regulation (EU) 2024/1689 Art. 53",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Mapped to governance and openness. Not a GPAI Code of Practice conformity mark.",
  },
  {
    id: "eu-art55",
    regime: "eu",
    axis: "safety,swarm,jail",
    provision: "Art. 55 — GPAI models with systemic risk",
    citation: "Regulation (EU) 2024/1689 Art. 55",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Jail remains unmeasured on this credential (13 measured of 14). Art. 55 mapping does not fill that cell.",
  },
  {
    id: "eu-art73",
    regime: "eu",
    axis: "continuity,care",
    provision: "Art. 73 — reporting of serious incidents",
    citation: "Regulation (EU) 2024/1689 Art. 73",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Art. 73(7) implementing acts pending — open door for signed machine-readable cross-border intake. We propose a format. We do not determine incidents.",
  },
];

export const UK_ROWS: CrosswalkCell[] = [
  {
    id: "uk-safety",
    regime: "uk",
    axis: "safety,continuity,swarm",
    provision: "Principle — safety, security and robustness",
    citation: "UK pro-innovation AI white paper (DSIT), principle 1",
    sourceUrl: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    sourceTier: "regulator-guidance",
    mapping: "mapped",
    note: "Principle row, not a statute. No invented statutory hook.",
  },
  {
    id: "uk-transparency",
    regime: "uk",
    axis: "provenance,detector-interop,openness",
    provision: "Principle — appropriate transparency and explainability",
    citation: "UK pro-innovation AI white paper (DSIT), principle 2",
    sourceUrl: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    sourceTier: "regulator-guidance",
    mapping: "mapped",
    note: "Principle row. Mapped, never compliant.",
  },
  {
    id: "uk-fairness",
    regime: "uk",
    axis: "care,affect,art5-safeguard",
    provision: "Principle — fairness",
    citation: "UK pro-innovation AI white paper (DSIT), principle 3",
    sourceUrl: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    sourceTier: "regulator-guidance",
    mapping: "mapped",
    note: "Principle row. Fairness determination stays with authorities.",
  },
  {
    id: "uk-accountability",
    regime: "uk",
    axis: "governance,conformance",
    provision: "Principle — accountability and governance",
    citation: "UK pro-innovation AI white paper (DSIT), principle 4",
    sourceUrl: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    sourceTier: "regulator-guidance",
    mapping: "mapped",
    note: "Principle row.",
  },
  {
    id: "uk-contest",
    regime: "uk",
    axis: "care,cross-reality",
    provision: "Principle — contestability and redress",
    citation: "UK pro-innovation AI white paper (DSIT), principle 5",
    sourceUrl: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    sourceTier: "regulator-guidance",
    mapping: "mapped",
    note: "The /challenge door is a measured-subject redress route for our cards, not a statutory appeals channel.",
  },
  {
    id: "uk-drcf",
    regime: "uk",
    axis: "governance",
    provision: "DRCF members — Ofcom, ICO, CMA, FCA",
    citation: "Digital Regulation Cooperation Forum — member regulators",
    sourceUrl: "https://www.drcf.org.uk/",
    sourceTier: "regulator-guidance",
    mapping: "mapped",
    note: "Regulator-row. Free-forever signed streams offered to each desk. No product pitch in the stream itself.",
  },
];

export const ILLINOIS_ROWS: CrosswalkCell[] = [
  {
    id: "il-disclose",
    regime: "illinois",
    axis: "provenance,openness,detector-interop",
    provision: "Disclosure statements",
    citation: "Illinois SB 315 — disclosure statements (from 1 Jan 2027)",
    sourceUrl: "https://www.ilga.gov/",
    sourceTier: "primary-text",
    mapping: "mapped",
    effective: "2027-01-01",
    note: "What a signed card can evidence: a dated, hash-pinned disclosure of measured behaviour. Not a determination that a statement satisfies the bill.",
  },
  {
    id: "il-audit",
    regime: "illinois",
    axis: "governance,conformance",
    provision: "Annual third-party audits",
    citation: "Illinois SB 315 — annual third-party audits (from 1 Jan 2028)",
    sourceUrl: "https://www.ilga.gov/",
    sourceTier: "primary-text",
    mapping: "mapped",
    effective: "2028-01-01",
    note: "A verified measurement credential can be an audit input. We are not the auditor of record and do not sell a score to the ranked subject.",
  },
  {
    id: "il-incident",
    regime: "illinois",
    axis: "continuity,care,safety",
    provision: "72h / 24h incident reports",
    citation: "Illinois SB 315 — incident reporting clocks",
    sourceUrl: "https://www.ilga.gov/",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Awareness timestamps on signed cards are evidence of when we measured. Incident determination stays with authorities.",
  },
  {
    id: "il-whistle",
    regime: "illinois",
    axis: "governance,care",
    provision: "Whistleblower-channel logs",
    citation: "Illinois SB 315 — whistleblower-channel logs",
    sourceUrl: "https://www.ilga.gov/",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "The /challenge door logs a signed receipt. It is not a statutory whistleblower channel.",
  },
];

export const CHINA_ROWS: CrosswalkCell[] = [
  {
    id: "cn-whitespace",
    regime: "china",
    axis: "all",
    provision: "Whitespace — no public verifiable artifacts at the gates",
    citation: "Published GB/T and CAC rules exist; the gates publish no public verifiable artifacts",
    sourceUrl: "https://www.tc260.org.cn/",
    sourceTier: "whitespace-note",
    mapping: "open",
    note: "GB/T gates publish no public verifiable artifacts. We measure against published clauses. We never claim certification against them.",
  },
  {
    id: "cn-gbt-risk",
    regime: "china",
    axis: "governance,safety,care",
    provision: "GB/T 42755-2023 — AI risk-management capability assessment (published clauses)",
    citation: "GB/T 42755-2023 (published standard clauses)",
    sourceUrl: "https://www.tc260.org.cn/",
    sourceTier: "published-standard",
    mapping: "mapped",
    note: "Measured against published clauses only. Never certified against GB/T. Never a China CCC or CAC licence claim.",
  },
  {
    id: "cn-genai",
    regime: "china",
    axis: "provenance,detector-interop,art5-safeguard,affect",
    provision: "CAC Interim Measures for Generative AI Services (2023) — published duties",
    citation: "CAC GenAI Interim Measures, 2023 (published)",
    sourceUrl: "https://www.cac.gov.cn/",
    sourceTier: "primary-text",
    mapping: "mapped",
    note: "Published duties mapped to provenance and safeguard axes. Determination stays with Chinese authorities.",
  },
];

export const US_HONESTY = {
  id: "us-federal-gap",
  heading: "No federal US AI-measurement statute",
  sufficiency: "OPEN",
  note: "There is no federal statute that this crosswalk can over-claim. Illinois SB 315 is a dated regime row. Texas TRAIGA and California SB 942 sit as dated sub-rows. Sufficiency of any US portal is marked OPEN until observed.",
  subRows: [
    {
      id: "us-traiga",
      name: "Texas TRAIGA",
      clock: "2026-09-01",
      citation: "Tex. Bus. & Com. Code § 552 (HB 149) — portal watch 1 Sep 2026",
      note: "§ 552.102 sufficiency OPEN. On the statutory date we publish whether the AG posts a TRAIGA-specific mechanism or keeps a generic portal.",
    },
    {
      id: "us-sb942",
      name: "California SB 942",
      citation: "California AI Transparency Act (SB 942)",
      note: "Dated sub-row. Not a federal stand-in.",
    },
    {
      id: "us-illinois",
      name: "Illinois SB 315",
      clock: "2028-01-01",
      citation: "Illinois SB 315 — audits from 1 Jan 2028",
      note: "The Illinois table is the regime row. This sub-row exists so the US gap is not papered by a state bill.",
    },
  ],
};

export const CROSSWALK_BODY = {
  kind: "csoai.east-west-crosswalk/0.1",
  version: "v1",
  frozenAt: "2026-08-24",
  issuer: "CSOAI Ltd (UK Companies House 16939677)",
  banner: DETERMINATION_BANNER,
  methodologyId: METHODOLOGY.id,
  schema: SCHEMA_URL,
  regimes: ["eu", "uk", "illinois", "china"] as RegimeId[],
  usHonesty: US_HONESTY,
  rows: [...EU_ROWS, ...UK_ROWS, ...ILLINOIS_ROWS, ...CHINA_ROWS],
  grammar: GRAMMAR.count,
  jail: "UNMEASURED on this credential — 13 measured of 14",
  supersession: [] as { version: string; date: string; reason: string; replaces: string }[],
};

export const CLOCKS = [
  { id: "traiga", date: "2026-09-01", label: "Texas TRAIGA portal observation", href: "/east-west/desks/us" },
  { id: "drcf", date: "2026-09-02", label: "DRCF Phase 2 filing window", href: "/east-west/desks/uk" },
  { id: "insurer", date: "2026-09-30", label: "Insurer pack format before meetings", href: "/east-west/packs" },
  { id: "art50", date: "2026-12-02", label: "EU Art. 50(2) grace", href: "/east-west/desks/eu" },
  { id: "il-audit", date: "2028-01-01", label: "Illinois SB 315 annual audits", href: "/east-west/desks/illinois" },
] as const;

export const CARD_BODY = {
  kind: CARD_KIND,
  grammar: GRAMMAR.product,
  id: "cbc_ew_v1_001",
  issuedAt: "2026-08-24T00:00:00.000Z",
  schema: SCHEMA_URL,
  issuer: {
    name: "CSOAI Ltd",
    companiesHouse: "16939677",
    did: "did:web:councilof.ai",
    didNote: OWNER_BLOCKS.did,
  },
  subject: {
    name: "Council of AI public GSPC board snapshot",
    kind: "measurement-instrument-snapshot",
    note: "Self-measurement of the published board snapshot. Not an endorsement of any third-party system. Not a certification.",
  },
  measured: GRAMMAR.count,
  axes: [
    ...MEASURED_AXES.map((axis) => ({
      axis,
      status: "MEASURED" as const,
      mapping: GRAMMAR.mapping,
    })),
    {
      axis: JAIL_AXIS,
      status: "UNMEASURED" as const,
      mapping: "unmeasured-on-this-credential" as const,
      note: "Jail stays UNMEASURED on this credential. A smaller-fleet jail run exists on GET /api/gspc with UNTESTED separation and is not folded in.",
    },
  ],
  regimes: ["eu", "uk", "illinois", "china"] as RegimeId[],
  crosswalk: {
    version: "v1",
    hash: "", // filled after freeze
    banner: DETERMINATION_BANNER,
  },
  environment: {
    method: "Deterministic grading on frozen GSPC banks for the 13 measured axes. Jail not run for this credential.",
    date: "2026-08-24",
    nonEndorsement: "This credential does not endorse the measured subject and is not a compliance determination.",
  },
  prevHead: null as string | null,
};

export type PackFormat = "multinational" | "insurer" | "law-firm";

export const PACK_NOT = [
  "Not a compliance determination",
  "Not a certification",
  "Not legal advice",
  "Not an endorsement of the measured system",
] as const;

export const PACKS: {
  id: PackFormat;
  title: string;
  audience: string;
  summary: string;
  contents: string[];
}[] = [
  {
    id: "multinational",
    title: "Multinational evidence pack",
    audience: "EU + US + UK + China operators",
    summary:
      "The missing object: one system's measured behaviour across regimes, structured per regime with verification instructions. Zero artifacts existed. This is the first sample.",
    contents: [
      "Signed (hash-chained) cross-border card",
      "Crosswalk v1 (hash-pinned)",
      "Method notes",
      "Environment disclosure",
      "Per-regime verify instructions",
      "verify-pack script",
    ],
  },
  {
    id: "insurer",
    title: "Insurer evidence pack",
    audience: "Underwriters",
    summary:
      "Continuous signed telemetry + crosswalk rows shaped to underwriting questions — evidence cadence versus quarterly human-attested PDFs.",
    contents: [
      "Cross-border card",
      "Cadence note (this sample is a single frozen run, not a live stream)",
      "Underwriting-shaped rows (mapped, never a risk score for sale)",
      "Determination-stays-with-authorities banner",
    ],
  },
  {
    id: "law-firm",
    title: "Law-firm exhibit pack",
    audience: "Counsel",
    summary:
      "Exhibit-grade bundle: primary-text citations, frozen hashes, chain-of-custody render. Explicitly never a legal opinion.",
    contents: [
      "Primary-text citation table",
      "Frozen hashes",
      "Chain-of-custody render",
      "Not legal advice — on every page",
    ],
  },
];

export const DESKS = [
  {
    id: "eu" as const,
    name: "EU desk",
    authority: "Commission AI Office + national market-surveillance authorities",
    href: "/east-west/desks/eu",
    atlas: "/regulators",
    stream: "free forever — no account, no fee",
    verifyMinutes: 10,
  },
  {
    id: "uk" as const,
    name: "UK desk",
    authority: "DRCF — Ofcom, ICO, CMA, FCA",
    href: "/east-west/desks/uk",
    atlas: "/regulators",
    stream: "free forever — no account, no fee",
    verifyMinutes: 10,
  },
  {
    id: "illinois" as const,
    name: "Illinois desk",
    authority: "Illinois AG research desk (SB 315)",
    href: "/east-west/desks/illinois",
    atlas: "/regulators",
    stream: "free forever — no account, no fee",
    verifyMinutes: 10,
  },
  {
    id: "china" as const,
    name: "China desk",
    authority: "CAC / TC260 — published clauses only",
    href: "/east-west/desks/china",
    atlas: "/regulators",
    stream: "free forever — no account, no fee",
    verifyMinutes: 10,
  },
];

export const LEDGER_EVENT_TYPES = [
  "verify-events",
  "citations-adoption",
  "challenge-resolution",
  "corrections",
  "watch-flips",
  "evidence-pack-fetch",
] as const;

export const PRICING_DOCTRINE = {
  status: "OWNER-BLOCKED",
  line: OWNER_BLOCKS.pricing,
  packs: "data products — per-query bands + flat pack fees, once a ruling is published",
  tooling: "annual licenses for pack-builder / crosswalk engine; we always sign; the trust root never white-labels",
  scores: "£0 forever",
  regulators: "£0 forever",
  ranked: "no money in either direction",
  x402: OWNER_BLOCKS.payment,
};

export const PRESS_DRAFTS = [
  {
    id: "announcement",
    title: "First cross-border measurement card",
    claim: EAST_WEST_PITCH,
    status: "draft — not sent",
  },
  {
    id: "transformer",
    outlet: "Transformer",
    beat: "promise-tracking",
    status: "draft — owner sends, one-to-one",
  },
  {
    id: "import-ai",
    outlet: "Import AI",
    beat: "signed cards on RFC 9943 substrate",
    status: "draft — owner sends, one-to-one",
  },
  {
    id: "artificial-lawyer",
    outlet: "Artificial Lawyer",
    beat: "EU AI Act + Art. 50(2)",
    status: "draft — owner sends, one-to-one",
  },
  {
    id: "lawfare",
    outlet: "Lawfare",
    status: "draft — owner sends, one-to-one",
  },
  {
    id: "verge",
    outlet: "The Verge",
    status: "draft — owner sends, one-to-one",
  },
  {
    id: "semafor",
    outlet: "Semafor",
    beat: "independence vs unsigned bilaterals",
    status: "draft — owner sends, one-to-one",
  },
];

export const COMMERCE_FIREWALL = [
  "Scores and rankings are never sold. No money in either direction with anything ranked.",
  "Regulators consume signed streams free forever — no account, no procurement, no fee.",
  "Lawful commerce is data by query (x402 / MPP) and tooling licenses only.",
  "We always sign. The trust root never white-labels.",
  "Mapping is not a determination. Determination stays with authorities.",
  "No traction claim without a published ledger row. Published count is 0.",
] as const;

export const BUYER_SCREEN = [
  { id: "class", ask: "Who is the buyer?", pass: "multinational operator, insurer, or law firm", fail: "regulator (free forever) or ranked entity (no money either way)" },
  { id: "object", ask: "What is being bought?", pass: "a hash-linked evidence pack (data) or a pack-builder license (tooling)", fail: "a score, a ranking, a certification, or a determination" },
  { id: "verify", ask: "Can a stranger verify without us?", pass: "yes — offline script + frozen hashes", fail: "trust-us PDF, unsigned attestation" },
  { id: "sign", ask: "Who signs?", pass: "CSOAI signs; licensee may brand the pack, never the trust root", fail: "white-labelled issuer" },
  { id: "price", ask: "Is a published owner ruling live?", pass: "OWNER-BLOCKED until a ruling is on /payg", fail: "invented numbers" },
] as const;

export const LICENSE_TERMS = {
  status: "OWNER-BLOCKED — template only, not an executable license until the owner ruling is published",
  licenseeMay: [
    "Brand the pack-builder UI under the licensee's name",
    "Deliver packs to the licensee's screened clients",
    "Quote mapped cells with the determination banner intact",
  ],
  licenseeMayNot: [
    "Issue or re-sign as if they were the trust root",
    "Strip the determination-stays-with-authorities banner",
    "Sell scores, rankings, or certifications",
    "Charge a regulator for a stream we give free forever",
    "Claim traction, certification, or compliance determinations",
  ],
  weAlways: "CSOAI signs. The trust root never white-labels.",
};

export const ONE_PAGERS = [
  {
    id: "multinational",
    audience: "Multinational counsel",
    close: "Verify any of it without asking us.",
    points: [
      "One signed measurement of one system, mapped across EU, UK, Illinois, China.",
      "Zero artifacts existed that proved one system's measured behaviour across regimes. This pack is the first sample.",
      "Every number on this page resolves to a signed artifact. Mapping is not a determination.",
    ],
  },
  {
    id: "insurer",
    audience: "Insurer underwriter",
    close: "Verify any of it without asking us.",
    points: [
      "Evidence cadence: signed telemetry versus quarterly human-attested PDFs.",
      "Underwriting-shaped rows. Mapped, never a risk score for sale.",
      "Clock: pack format before 30 Sep 2026 meetings. Pricing unpublished until the owner ruling.",
    ],
  },
  {
    id: "law-firm",
    audience: "Law-firm partner",
    close: "Verify any of it without asking us.",
    points: [
      "Exhibit-grade bundle: primary-text citations, frozen hashes, chain-of-custody render.",
      "Explicitly never a legal opinion. Determination stays with authorities.",
      "White-label the pack-builder; we still sign.",
    ],
  },
] as const;

export const X402_FALLBACK = {
  status: "OWNER-BLOCKED",
  primary: "x402 per-query data rail for screened commercial buyers — not live.",
  fallback: "MPP (machine-payable) path specified if x402 stalls — not live.",
  demo: "GET /api/east-west/pay/demo returns the doctrine and a 402-shaped refusal with no amount invented.",
};

export const CLAIMS = [
  { id: "count", text: GRAMMAR.count, artifact: "GET /api/gspc + this credential's axes[]" },
  { id: "regimes", text: "four regimes mapped", artifact: "crosswalk v1 rows" },
  { id: "ledger", text: "Value Ledger rows: 0 published", artifact: "GET /api/east-west/ledger" },
  { id: "unsigned", text: "card signature: UNSIGNED", artifact: "card.signature.status" },
  { id: "jail", text: "jail UNMEASURED on this credential", artifact: "card.axes[jail].status" },
] as const;

export const UNSIGNED_NOTE =
  "UNSIGNED — hash trail only. Board-attestation key is not bound on this card. Not a Council attestation. Not a certification.";

export async function freezeEastWest() {
  const crosswalkHash = await hashBody(CROSSWALK_BODY);
  const cardBody = {
    ...CARD_BODY,
    crosswalk: { ...CARD_BODY.crosswalk, hash: crosswalkHash },
  };
  const contentHash = await hashBody(cardBody);
  const card = {
    ...cardBody,
    contentHash,
    signature: { status: "UNSIGNED" as const, note: UNSIGNED_NOTE },
  };
  return {
    crosswalkHash,
    crosswalk: { ...CROSSWALK_BODY, hash: crosswalkHash },
    card,
    vectors: {
      valid: card,
      tampered: { ...card, measured: "14 measured of 14" },
      wrongCrosswalkHash: {
        ...card,
        crosswalk: { ...card.crosswalk, hash: "0".repeat(64) },
      },
    },
  };
}

export type FrozenEastWest = Awaited<ReturnType<typeof freezeEastWest>>;

export function publishedSurface() {
  return {
    flagship: "/east-west",
    verify: "/east-west/verify",
    gspcVerify: "/gspc-verify",
    challenge: "/challenge",
    packs: "/east-west/packs",
    desks: "/east-west/desks",
    ledger: "/east-west/ledger",
    pricing: "/east-west/pricing",
    buyers: "/east-west/buyers",
    license: "/east-west/license",
    briefs: "/east-west/briefs",
    pay: "/east-west/pay",
    schema: SCHEMA_URL,
    boardApi: "/api/east-west",
    grammar: GRAMMAR.count,
    signatureStatus: "UNSIGNED",
    publishedLedgerRows: 0,
  };
}
