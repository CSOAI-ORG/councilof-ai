/** Public reader freshness only. No inventory, private identifiers or attestation inference. */
import { isObject, normalizeCoverage, workerView } from "./evidenceIndex";

/** Existing readJSON client deadline; this is a UI budget, not a service SLA. */
export const SOURCE_REFRESH_BUDGET_MS = 10000;
/** An explicit view policy, not a producer promise. No automatic polling is introduced. */
export const SOURCE_RECEIPT_STALE_AFTER_MS = 60000;

export type SourceKind = "coverage" | "worker";
export type SourceReadOutcome =
  | { ok: true; body: unknown }
  | { ok: false; error: string };

export type SourceRefreshState = {
  lastAttemptAt: string | null;
  lastSuccessfulRefreshAt: string | null;
  lastLatencyMs: number | null;
  connected: boolean | null;
  sourceState: "COMPLETE" | "LIVE" | "PARTIAL" | "STALE" | "OFFLINE" | "UNKNOWN";
  sourceEvidenceAt: string | null;
  sourceReadAt: string | null;
};

export function emptySourceRefresh(): SourceRefreshState {
  return {
    lastAttemptAt: null,
    lastSuccessfulRefreshAt: null,
    lastLatencyMs: null,
    connected: null,
    sourceState: "UNKNOWN",
    sourceEvidenceAt: null,
    sourceReadAt: null,
  };
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || value.endsWith("-00:00")) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Date.parse normalizes impossible dates such as 30 February; never mint a source date.
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1] ||
      hour > 23 || minute > 59 || second > 59 ||
      (match[7] !== "Z" && (Number(match[8]) > 23 || Number(match[9]) > 59))) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

/** A schema-valid endpoint refresh is distinct from the health source being live. */
export function applySourceRefresh(
  previous: SourceRefreshState,
  kind: SourceKind,
  outcome: SourceReadOutcome,
  finishedAt: string,
  elapsedMs: number,
): SourceRefreshState {
  const attempt = {
    ...previous,
    lastAttemptAt: timestamp(finishedAt),
    lastLatencyMs: Number.isFinite(elapsedMs) && elapsedMs >= 0 ? Math.round(elapsedMs) : null,
  };
  if (!outcome.ok) return { ...attempt, connected: false };
  try {
    if (kind === "coverage") {
      const coverage = normalizeCoverage(outcome.body);
      return {
        ...attempt,
        connected: true,
        lastSuccessfulRefreshAt: timestamp(finishedAt),
        // Completeness describes this coverage response; it does not establish live source evidence.
        sourceState: coverage.complete ? "COMPLETE" : "PARTIAL",
        // /api/coverage publishes no envelope evidence date. Do not parse prose or use the read clock.
        sourceEvidenceAt: null,
        sourceReadAt: null,
      };
    }
    workerView(outcome.body);
    const doc = isObject(outcome.body) ? outcome.body : {};
    const worker = isObject(doc.worker) ? doc.worker : {};
    const sourceState = doc.stale === true || doc.status === "STALE"
      ? "STALE"
      : doc.status === "LIVE" ? "LIVE" : doc.status === "OFFLINE" ? "OFFLINE" : "UNKNOWN";
    return {
      ...attempt,
      connected: true,
      lastSuccessfulRefreshAt: timestamp(finishedAt),
      sourceState,
      sourceEvidenceAt: timestamp(worker.updated_at),
      sourceReadAt: timestamp(doc.read_at),
    };
  } catch {
    // Retain the prior source dates; a malformed response cannot refresh their provenance.
    return { ...attempt, connected: false };
  }
}

export function sourceRefreshView(state: SourceRefreshState, now = Date.now()) {
  const elapsed = state.lastSuccessfulRefreshAt ? now - Date.parse(state.lastSuccessfulRefreshAt) : NaN;
  const ageMs = Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : null;
  const freshness = state.connected === false
    ? state.lastSuccessfulRefreshAt ? "retained, not live" : "unavailable"
    : state.sourceState === "STALE" || (ageMs !== null && ageMs > SOURCE_RECEIPT_STALE_AFTER_MS)
      ? "stale"
      : state.sourceState === "OFFLINE" ? "disconnected"
        : ageMs === null ? "unknown" : "within view freshness window";
  return {
    transport: state.connected === null ? "not loaded" : state.connected ? "connected" : "disconnected",
    sourceState: state.sourceState,
    freshness,
    ageMs,
    budgetMs: SOURCE_REFRESH_BUDGET_MS,
    overBudget: state.lastLatencyMs === null ? null : state.lastLatencyMs > SOURCE_REFRESH_BUDGET_MS,
    lastAttemptAt: state.lastAttemptAt,
    lastSuccessfulRefreshAt: state.lastSuccessfulRefreshAt,
    lastLatencyMs: state.lastLatencyMs,
    sourceEvidenceAt: state.sourceEvidenceAt,
    sourceReadAt: state.sourceReadAt,
    attestation: "Not verified by this view",
    currentRun: "Not established by these readers",
  };
}
