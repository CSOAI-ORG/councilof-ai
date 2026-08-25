/**
 * AI-economy · human-labour · humanoid-labour indices.
 *
 * Declared UNMEASURED first — live public surfaces that name the gap honestly.
 * Contextual citations only. Never inputs to SHA-256 / Ed25519 deterministic grading.
 * Candidates for remaining financial-extension slots (see engine-axis candidacy).
 * Canon: docs/ESTATE_CROSSWALK.md · docs/EAT_PLAYBOOK.md · compass wf-5004bf4b
 */

export type IndexStatus = "UNMEASURED" | "REPORTED" | "MEASURED";

export type ContextCitation = {
  label: string;
  role: "calibration context" | "projection" | "org catalog" | "regulation adjacency";
  note: string;
  href?: string;
};

export type LabourEconomyIndex = {
  slug: "ai-economy" | "human-labour" | "humanoid-labour";
  title: string;
  shortTitle: string;
  status: IndexStatus;
  /** Financial-extension candidacy — does not overwrite existing slot owners. */
  candidacy: string;
  path: string;
  apiPath: string;
  oneLiner: string;
  whyUnmeasured: string;
  adjacentLive: { label: string; href: string; register: string }[];
  citations: ContextCitation[];
  firewall: string;
  nextGate: string;
};

export const LABOUR_ECONOMY_INDICES: LabourEconomyIndex[] = [
  {
    slug: "ai-economy",
    title: "AI Economy Index",
    shortTitle: "AI economy",
    status: "UNMEASURED",
    candidacy: "Slot 23 (agent-economy) companion layer — not a fused score",
    path: "/indices/ai-economy",
    apiPath: "/api/indices/ai-economy",
    oneLiner:
      "Named public surface for AI-economy exposure and org density — no scored economy index yet.",
    whyUnmeasured:
      "No frozen bank, no signed formula, no Ed25519 card set. Ecosystem org catalog and narrative globe are not an economy index.",
    adjacentLive: [
      { label: "Ecosystem / Distribution Hive", href: "/intel", register: "REPORTED org catalog" },
      { label: "GET /api/ecosystem", href: "/api/ecosystem", register: "LIVE JSON" },
      { label: "Agent economy axis (slot 23)", href: "/engine-axis", register: "PARTIAL" },
      { label: "SOV Signal", href: "/api/signal", register: "legs only · no fused score" },
    ],
    citations: [
      {
        label: "Anthropic Economic Index (external)",
        role: "calibration context",
        note: "Firewalled context — never a GSPC cell input.",
      },
      {
        label: "OECD AI exposure studies (external)",
        role: "calibration context",
        note: "Cite as REPORTED context when a method exists; not MEASURED.",
      },
      {
        label: "CSOAI ecosystem_index MCP",
        role: "org catalog",
        note: "Org rows ≠ economy score.",
        href: "/mcp",
      },
    ],
    firewall:
      "Do not invent TVL, ARR, or displacement % as MEASURED. Contextual layer beside cards only.",
    nextGate:
      "Publish INDEX-METHOD-0.1 with frozen inputs + n threshold; then REPORTED snapshots; MEASURED only after custody + counsel if securities-adjacent.",
  },
  {
    slug: "human-labour",
    title: "Human Labour Index",
    shortTitle: "Human labour",
    status: "UNMEASURED",
    candidacy: "Financial-extension candidate (open GAP adjacency to slots 24–25) · never overwrite bond MEASURED",
    path: "/indices/human-labour",
    apiPath: "/api/indices/human-labour",
    oneLiner:
      "Labour-market / wage / displacement index product — declared empty until a method ships.",
    whyUnmeasured:
      "Human baselines at /api/reported and in-lane human-vs-ai are calibration context, not a labour-market index.",
    adjacentLive: [
      { label: "GET /api/reported", href: "/api/reported", register: "REPORTED baselines" },
      { label: "GSPC board (in-lane human-vs-ai)", href: "/gspc-scoreboard", register: "in-lane · not board-quotable" },
      { label: "Engine Axis", href: "/engine-axis", register: "extension map" },
    ],
    citations: [
      {
        label: "AEI / ILO WP140 / WEF Future of Jobs (external)",
        role: "calibration context",
        note: "Contextual signal only — never inputs to deterministic attestation.",
      },
      {
        label: "HLE / GPQA human baselines",
        role: "calibration context",
        note: "Task baselines ≠ labour-market index.",
      },
    ],
    firewall:
      "Wage, displacement, and hours series stay outside SHA-256/Ed25519 grading until INDEX-METHOD + owner freeze.",
    nextGate:
      "INDEX-METHOD-0.1 for human labour; REPORTED CSV on HF; Wilson intervals only after frozen bank.",
  },
  {
    slug: "humanoid-labour",
    title: "Humanoid Labour Index",
    shortTitle: "Humanoid labour",
    status: "UNMEASURED",
    candidacy: "Machinery-conformity adjacency + financial-extension candidate · robotics RWA context",
    path: "/indices/humanoid-labour",
    apiPath: "/api/indices/humanoid-labour",
    oneLiner:
      "Humanoid / robotics labour index — POC and machinery axis exist; no labour index product.",
    whyUnmeasured:
      "Goldman/MS TAM scenarios are projections. /humanoids-poc and machinery-conformity are not a labour index.",
    adjacentLive: [
      { label: "Humanoids POC", href: "/humanoids-poc", register: "POC / DESIGN" },
      { label: "GSPC machinery-conformity", href: "/gspc-scoreboard", register: "MEASURED axis (systems)" },
      { label: "RWA attestation targets", href: "/competitors", register: "corpus · play class" },
    ],
    citations: [
      {
        label: "Bank TAM / robot density projections (external)",
        role: "projection",
        note: "Projections ≠ MEASURED.",
      },
      {
        label: "EU Machinery Reg 2023/1230 adjacency",
        role: "regulation adjacency",
        note: "Maps to machinery-conformity — not a labour score.",
        href: "/crosswalk",
      },
    ],
    firewall:
      "Robotics RWAs may cite machinery-conformity + this context layer; never fuse TAM into a signed grade.",
    nextGate:
      "MachBench labour method stub → REPORTED → MEASURED only with frozen tasks and separation tests.",
  },
];

export function getLabourEconomyIndex(slug: string): LabourEconomyIndex | undefined {
  return LABOUR_ECONOMY_INDICES.find((i) => i.slug === slug);
}

export const INDICES_FIREWALL =
  "Labour/economy indices may appear as clearly-labeled contextual layers beside cards — never as inputs to SHA-256/Ed25519 deterministic grading.";
