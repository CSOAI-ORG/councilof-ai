/**
 * Competitor database — EAT playbook seed rows (2026-08-24).
 * Generated from COMPETITOR-DATABASE-2026-08-24.md. ClaimGuard-gated claims only.
 */
import raw from "./competitorDatabase.json";

export type PlayerClass = "COMPETITOR" | "ADJACENT" | "INTEROP" | "DISTRIBUTION" | "ANTI-PATTERN";

export type CompetitorRecord = {
  name: string;
  slug: string;
  player_class: PlayerClass;
  axis_chain: {
    axes: string[];
    domains: string[];
    economy_layers: string[];
  };
  financials: {
    funding: string;
    valuation: string;
    revenue: string;
    source: string;
    date: string;
  };
  business_model: string;
  products: string[];
  software_features: string[];
  code_open_source: { repos: string[]; license: string };
  signing_state: string;
  absorbability: {
    acquired: boolean;
    by: string;
    independence_status: string;
  };
  public_artifacts_we_can_measure: string[];
  eat_play: {
    public_artifact: string;
    estate_tool: string;
    unsigned_to_signed_play: string;
  };
  license_risk: string;
  relations: { gv2_status: string; notes: string };
  effect_tag: string;
};

export type CompetitorDatabase = {
  schema: string;
  generatedAt: string;
  doctrine: string;
  recordCount: number;
  classCounts: Record<string, number>;
  records: CompetitorRecord[];
};

export const COMPETITOR_DB = raw as CompetitorDatabase;

export const COMPETITOR_RECORDS = COMPETITOR_DB.records;

export const GV2_NEVER_PARTNER = COMPETITOR_RECORDS.filter(
  (r) => r.relations?.gv2_status === "NEVER-PARTNER",
);

export const UNSIGNED_COUNT = COMPETITOR_RECORDS.filter((r) =>
  /unsigned/i.test(r.signing_state),
).length;

export function competitorBySlug(slug: string) {
  return COMPETITOR_RECORDS.find((r) => r.slug === slug);
}

export function competitorsByAxis(axis: string) {
  return COMPETITOR_RECORDS.filter((r) => r.axis_chain?.axes?.includes(axis));
}

export function competitorsByDomain(domain: string) {
  return COMPETITOR_RECORDS.filter((r) => r.axis_chain?.domains?.includes(domain));
}

export const MEASURED_AXES = [
  "governance",
  "safety",
  "provenance",
  "continuity",
  "conformance",
  "openness",
  "machinery",
  "care",
  "cross-reality",
  "detector-interop",
  "art5-safeguard",
  "swarm",
  "affect",
  "jail",
] as const;

export const EXPANSION_DOMAINS = [
  "bank",
  "bond",
  "equity",
  "insurance",
  "cross-border",
  "operational",
  "relative",
  "impact",
] as const;

export const ECONOMY_LAYERS = [
  "agent-payments",
  "data",
  "labor",
  "insurance",
  "marketplace",
] as const;

export const EAT_RULES = [
  "Public artifacts only — no ToS violations (feeds/ANTI-PATTERNS)",
  "Licence-sweep before any code/dataset reuse",
  "Measurement-not-accusation — cite facts, never disparage",
  "Corrections register applies symmetrically to competitor rows",
  "GV.2: Vals AI is NEVER-PARTNER; no echo without signed re-measurement",
  "JL.5: every status names source + date or says undisclosed",
  "INTEROP/DISTRIBUTION classes use complement grammar only",
  "EAT play never sells a score — lawful lanes only",
] as const;
