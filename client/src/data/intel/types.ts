/**
 * CSOAI Layer-0 Compliance Intelligence OS — data contracts.
 *
 * Every object here is a Layer-0-addressable node: regulations, obligations, entities
 * (companies), their AI/robotics systems, deadlines, and risk signals all share a
 * canonical id + attestable provenance so the map cockpit, the MCP fleet, and the
 * crawler speak one graph. See _findings/CSOAI_LAYER0_COMPLIANCE_INTELLIGENCE_OS.
 *
 * POSTURE: help-first. `RiskSignal` is a defensible INDICATOR, never a "non-compliant
 * verdict" — see `RiskBand`. Do not surface named verdicts publicly without legal review.
 */

/** Layer-0 provenance — when/where a node was ingested + (optionally) its signed attestation. */
export interface Layer0Ref {
  /** canonical Layer-0 id, e.g. "reg:eu-ai-act:art-50" or "ent:gb:deepmind". */
  id: string;
  /** ISO-8601 timestamp the fact was ingested/verified. */
  ingestedAt?: string;
  /** source URL the fact was crawled/derived from. */
  source?: string;
  /** Ed25519 attestation id, when this node has been signed by the CSOAI attestation API. */
  attestation?: string;
}

/** A single discrete obligation inside a framework/instrument (the atomic compliance unit). */
export interface Obligation {
  /** stable slug, e.g. "eu-ai-act-art-50-transparency". */
  slug: string;
  /** framework slug this obligation belongs to (joins to data/frameworks.ts). */
  frameworkSlug: string;
  title: string;
  /** what the obligation actually requires, plainly. */
  summary: string;
  /** the article/section citation, e.g. "Art. 50". */
  cite?: string;
  /** who it bites: provider | deployer | importer | distributor | gpai | any. */
  appliesTo?: Array<'provider' | 'deployer' | 'importer' | 'distributor' | 'gpai' | 'any'>;
  /** risk tier / scope gate, e.g. "high-risk", "GPAI", "all". */
  scope?: string;
  layer0?: Layer0Ref;
}

/** A point on the global compliance clock. Parsed from framework `effective` dates + obligations. */
export interface DeadlineEvent {
  /** ISO date (YYYY-MM-DD) the obligation bites. */
  date: string;
  /** framework slug. */
  frameworkSlug: string;
  /** human label, e.g. "EU AI Act — GPAI obligations". */
  label: string;
  /** jurisdictions affected (ISO alpha-3, or "GLOBAL"). */
  jurisdictions: string[];
  binding: boolean;
  /** days from "now" — negative = already in force. Computed at query time. */
  daysOut?: number;
}

/** An AI or robotics system operated by an entity (the thing regulations attach to). */
export interface AISystem {
  name: string;
  /** "llm" | "vision" | "robotics" | "biometric" | "recommender" | "autonomous" | "other". */
  kind: string;
  /** EU-AI-Act-style risk tier if known: "prohibited" | "high" | "limited" | "minimal" | "gpai". */
  riskTier?: string;
  description?: string;
}

/** A defensible risk INDICATOR — never a verdict. */
export type RiskBand = 'in-scope' | 'monitoring' | 'unknown' | 'attested';

/** Risk signal for an entity × obligation: indicator + why, with the deadline that drives it. */
export interface RiskSignal {
  obligationSlug: string;
  band: RiskBand;
  /** 0-100 indicator of deadline pressure × scope confidence — NOT a compliance percentage. */
  pressure: number;
  /** plain-language basis we can defend if challenged. */
  rationale: string;
  deadline?: DeadlineEvent;
}

/** A company/organisation in the entity registry. */
export interface Entity {
  /** stable slug, e.g. "gb-deepmind". */
  slug: string;
  name: string;
  /** ISO alpha-3 of primary jurisdiction (joins to the map). */
  jurisdiction: string;
  /** optional sub-national region (e.g. "US-CO") for admin-1 drill-down. */
  region?: string;
  /** lon/lat for map markers (city-level when known). */
  geo?: { lon: number; lat: number };
  sector?: string;
  /** rough headcount band for applicability (size gates some obligations). */
  sizeBand?: 'micro' | 'sme' | 'mid' | 'large' | 'enterprise';
  systems?: AISystem[];
  /** framework slugs this entity is plausibly in scope of (derived). */
  inScope?: string[];
  /** help-first signals — derived, not asserted as verdicts. */
  signals?: RiskSignal[];
  layer0?: Layer0Ref;
}

/** A delta emitted by the daily crawler when the graph changes (powers alerts). */
export interface RegulationDelta {
  at: string;
  kind: 'new-instrument' | 'amendment' | 'enforcement' | 'guidance' | 'deadline-change';
  frameworkSlug?: string;
  jurisdictions: string[];
  summary: string;
  source: string;
}
