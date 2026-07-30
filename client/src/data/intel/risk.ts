/**
 * Help-First Risk Engine — turns the deadline radar + entity scope into DEFENSIBLE
 * INDICATORS, never verdicts.
 *
 * POSTURE (read before changing anything here):
 *   - Outputs are `RiskSignal`s: a `band` ('in-scope' | 'monitoring' | 'unknown' |
 *     'attested') + a `pressure` score + a defensible `rationale`. None of these is a
 *     "non-compliant" verdict or an accusation. We never assert a company is breaking
 *     the law.
 *   - `pressure` (0-100) measures DEADLINE PRESSURE × SCOPE CONFIDENCE. It is explicitly
 *     NOT a "% compliant", NOT a probability of breach, NOT a fine estimate. It answers
 *     one help-first question only: "who most needs help soonest?" — so outreach and the
 *     regulator/B2G landscape view can be prioritised.
 *   - Every `rationale` is a scope + deadline FACT that would survive a company
 *     challenging it (e.g. "EU-headquartered GPAI provider → in scope of EU AI Act
 *     Art. 50 transparency, effective 2 Aug 2026, 44 days out" — a statement about scope
 *     and a calendar date, not a claim about their conduct).
 *
 * Pure + dependency-free: every function takes its data as parameters. We import only the
 * shared TYPES and the deadline-radar HELPERS — NOT the entities data file — so this layer
 * stays decoupled from whoever populates the entity registry.
 */
import type { Entity, RiskSignal, RiskBand, DeadlineEvent } from './types';
import { deadlinesForJurisdiction } from './deadlines';

/**
 * Scope-confidence multiplier (0..1) derived from the entity's declared systems.
 * Higher when the entity operates systems in the riskier EU-AI-Act-style tiers, because a
 * binding obligation is more confidently in scope of, say, a high-risk system than of a
 * minimal one. This weights *confidence that the scope applies*, not severity of conduct.
 */
function scopeConfidence(entity: Entity): number {
  const tiers = (entity.systems ?? [])
    .map((s) => (s.riskTier ?? '').toLowerCase());
  if (tiers.includes('prohibited')) return 1.0;
  if (tiers.includes('high')) return 0.9;
  if (tiers.includes('gpai')) return 0.8;
  if (tiers.includes('limited')) return 0.6;
  if (tiers.includes('minimal')) return 0.45;
  // No declared systems → we still flag scope, but with lower confidence.
  return 0.5;
}

/**
 * Deadline-proximity factor (0..1). A binding deadline that is imminent or already in
 * force scores near 1; one that is years out scores low; a non-binding milestone or no
 * deadline at all scores lowest. `daysOut` is the radar's signed distance (negative = in
 * force). Already-in-force binding deadlines stay at the top because the help is overdue.
 */
function proximityFactor(deadline: DeadlineEvent | undefined): number {
  if (!deadline) return 0.1; // monitoring-only: no dated obligation drives urgency
  const days = deadline.daysOut ?? 0;
  if (!deadline.binding) return 0.2; // voluntary/standard: informational, not a cliff
  if (days <= 0) return 1.0; // already in force → help is overdue
  if (days <= 30) return 0.95;
  if (days <= 90) return 0.85;
  if (days <= 180) return 0.7;
  if (days <= 365) return 0.5;
  if (days <= 730) return 0.3;
  return 0.2;
}

/**
 * Pick the nearest relevant deadline for a framework from a pre-computed, jurisdiction-
 * scoped radar list. Prefers the soonest FUTURE (or in-force) binding milestone; falls
 * back to the soonest milestone of any kind for that framework.
 */
function nearestForFramework(
  frameworkSlug: string,
  radar: DeadlineEvent[],
): DeadlineEvent | undefined {
  const forFw = radar.filter((d) => d.frameworkSlug === frameworkSlug);
  if (forFw.length === 0) return undefined;
  // radar is sorted ascending by daysOut. Prefer the first not-yet-past binding one,
  // else the first binding one (most recently in force), else the first of any kind.
  const futureBinding = forFw.find((d) => d.binding && (d.daysOut ?? 0) >= 0);
  if (futureBinding) return futureBinding;
  const anyBinding = forFw.find((d) => d.binding);
  if (anyBinding) return anyBinding;
  return forFw[0];
}

/** Resolve the help-first band for an entity × framework given its nearest deadline. */
function bandFor(entity: Entity, deadline: DeadlineEvent | undefined): RiskBand {
  if (entity.layer0?.attestation) return 'attested';
  if (deadline?.binding) return 'in-scope';
  if (deadline && !deadline.binding) return 'monitoring';
  return 'unknown';
}

/** Round to one decimal, clamp 0..100 — keeps `pressure` a tidy indicator. */
function clampPressure(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

/** Compose a defensible, fact-only rationale string for one signal. */
function rationaleFor(
  entity: Entity,
  frameworkSlug: string,
  band: RiskBand,
  deadline: DeadlineEvent | undefined,
): string {
  const who = entity.sector ? `${entity.sector} entity` : 'entity';
  const where = entity.jurisdiction;
  if (band === 'attested') {
    return `${who} in ${where} holds a Layer-0 attestation (${entity.layer0?.attestation}) for ${frameworkSlug} — monitoring for changes only.`;
  }
  if (band === 'in-scope' && deadline) {
    const days = deadline.daysOut ?? 0;
    const when =
      days < 0
        ? `in force since ${deadline.date} (${Math.abs(days)} days ago)`
        : days === 0
          ? `in force today (${deadline.date})`
          : `effective ${deadline.date}, ${days} days out`;
    return `${who} in ${where} → in scope of ${deadline.label} (binding), ${when}. Scope + deadline fact, not a compliance finding.`;
  }
  if (band === 'monitoring' && deadline) {
    return `${who} in ${where} → ${deadline.label} applies as a voluntary/standard reference (non-binding). Tracking for guidance, no dated obligation.`;
  }
  return `${who} in ${where} → plausibly within the ${frameworkSlug} landscape; no binding dated obligation resolved yet. Listed for monitoring, not flagged.`;
}

/**
 * Build the help-first risk signals for one entity — one signal per framework slug in
 * `entity.inScope`. Each signal is a defensible indicator: a band, a `pressure` score
 * (deadline proximity × scope confidence, 0-100), a fact-only rationale, and the deadline
 * that drives it. Pure: the deadline radar is computed internally from the entity's own
 * jurisdiction via `deadlinesForJurisdiction`, so callers pass nothing but the entity.
 *
 * pressure = proximityFactor(nearestDeadline) × scopeConfidence(entity) × 100
 */
export function signalsForEntity(entity: Entity, from: Date = new Date()): RiskSignal[] {
  const frameworks = entity.inScope ?? [];
  if (frameworks.length === 0) return [];
  const radar = deadlinesForJurisdiction(entity.jurisdiction, from);
  const confidence = scopeConfidence(entity);

  return frameworks.map((frameworkSlug): RiskSignal => {
    const deadline = nearestForFramework(frameworkSlug, radar);
    const band = bandFor(entity, deadline);
    // Attested entities are de-prioritised for outreach: they've already engaged.
    const proximity = band === 'attested' ? 0.05 : proximityFactor(deadline);
    const pressure = clampPressure(proximity * confidence * 100);
    return {
      obligationSlug: frameworkSlug,
      band,
      pressure,
      rationale: rationaleFor(entity, frameworkSlug, band, deadline),
      deadline,
    };
  });
}

/**
 * Rank entities by their single highest-pressure signal — the help-first OUTREACH queue:
 * who most needs help soonest. Returns each entity with its top signal and that signal's
 * pressure as `score`, sorted high → low. Entities with no signals are dropped.
 */
export function prioritise(
  entities: Entity[],
  from: Date = new Date(),
): Array<{ entity: Entity; topSignal: RiskSignal; score: number }> {
  const ranked: Array<{ entity: Entity; topSignal: RiskSignal; score: number }> = [];
  for (const entity of entities) {
    const signals = signalsForEntity(entity, from);
    if (signals.length === 0) continue;
    const topSignal = signals.reduce((a, b) => (b.pressure > a.pressure ? b : a));
    ranked.push({ entity, topSignal, score: topSignal.pressure });
  }
  return ranked.sort((a, b) => b.score - a.score);
}

/** Pressure bucket labels for the aggregate histogram (no entity-level detail). */
const PRESSURE_BUCKETS = ['0-20', '21-40', '41-60', '61-80', '81-100'] as const;
type PressureBucket = (typeof PRESSURE_BUCKETS)[number];

function bucketOf(pressure: number): PressureBucket {
  if (pressure <= 20) return '0-20';
  if (pressure <= 40) return '21-40';
  if (pressure <= 60) return '41-60';
  if (pressure <= 80) return '61-80';
  return '81-100';
}

/** Aggregate landscape result for the regulator / B2G view — deliberately name-free. */
export interface CohortRisk {
  jurisdiction: string;
  /** how many entities in this jurisdiction were considered. */
  entityCount: number;
  /** count of in-scope signals per framework slug (the scope landscape). */
  inScopeByFramework: Record<string, number>;
  /** soonest relevant deadline anywhere in the cohort, or null. */
  nearestDeadline: DeadlineEvent | null;
  /** distribution of top-signal pressure across the cohort (no names). */
  pressureHistogram: Record<PressureBucket, number>;
}

/**
 * AGGREGATE landscape stats for the regulator / B2G "intelligence" product. This is the
 * aggregate-intelligence view: it answers "how does this jurisdiction's AI landscape sit
 * against the compliance clock?" WITHOUT naming any entity. The return contains counts and
 * a histogram only — no entity slugs, names, or per-entity signals leak out.
 *
 * @param iso3 ISO alpha-3 jurisdiction to aggregate over (entities are filtered to it).
 */
export function cohortRisk(
  entities: Entity[],
  iso3: string,
  from: Date = new Date(),
): CohortRisk {
  const cohort = entities.filter((e) => e.jurisdiction === iso3);

  const inScopeByFramework: Record<string, number> = {};
  const pressureHistogram: Record<PressureBucket, number> = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
  };
  let nearestDeadline: DeadlineEvent | null = null;

  for (const entity of cohort) {
    const signals = signalsForEntity(entity, from);
    if (signals.length === 0) continue;

    // top-signal pressure feeds the histogram (one vote per entity)
    const top = signals.reduce((a, b) => (b.pressure > a.pressure ? b : a));
    pressureHistogram[bucketOf(top.pressure)] += 1;

    for (const s of signals) {
      if (s.band === 'in-scope') {
        inScopeByFramework[s.obligationSlug] =
          (inScopeByFramework[s.obligationSlug] ?? 0) + 1;
      }
      // track the soonest deadline across the cohort (future preferred, else most recent)
      const d = s.deadline;
      if (d) {
        if (
          !nearestDeadline ||
          isCloser(d, nearestDeadline)
        ) {
          nearestDeadline = d;
        }
      }
    }
  }

  return {
    jurisdiction: iso3,
    entityCount: cohort.length,
    inScopeByFramework,
    nearestDeadline,
    pressureHistogram,
  };
}

/**
 * "Closer to now" comparison for two deadlines: prefer the smaller non-negative `daysOut`
 * (soonest upcoming/today); if both are in force (negative), prefer the most recent.
 */
function isCloser(candidate: DeadlineEvent, current: DeadlineEvent): boolean {
  const c = candidate.daysOut ?? Number.POSITIVE_INFINITY;
  const cur = current.daysOut ?? Number.POSITIVE_INFINITY;
  if (c >= 0 && cur >= 0) return c < cur; // both upcoming → soonest wins
  if (c >= 0 && cur < 0) return true; // upcoming beats already-in-force
  if (c < 0 && cur >= 0) return false;
  return c > cur; // both in force → most recent (closest to 0) wins
}
