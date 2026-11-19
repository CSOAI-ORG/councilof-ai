// GENERATED-SHAPED module over public/interop/verify-executions-latest.json (csoai.verify-executions/0.1).
// A Pages Function cannot import a JSON file by a path read at run time, so the committed artifact
// is bound here at bundle time — the same pattern as ./_regulatory_inventory.ts. The landing
// workflow (.github/workflows/loops-verify-count.yml) replaces the artifact's bytes in place;
// this import path does not move. The artifact is committed from day one with status
// "no buckets" and an empty days array, so the bundle always builds and the endpoint stays
// deployment-order safe: with no bucket landed, the derived row is UNPUBLISHED/UNMEASURED, not zero.
import artifactJson from "../../public/interop/verify-executions-latest.json";

export const VERIFY_EXECUTIONS_PATH = "public/interop/verify-executions-latest.json";
export const VERIFY_EXECUTIONS_SERVED_PATH = "/interop/verify-executions-latest.json";

export interface VerifyExecutionsDay {
  date: string;
  executions: number;
}

export interface VerifyExecutionsArtifact {
  schema?: string;
  as_of?: string;
  status?: string;
  days?: VerifyExecutionsDay[];
  stale_after_hours?: number;
  retention_days?: number;
  source_artifact?: string;
  note?: string;
}

export interface DerivedVerifyExecutions {
  /** True only when the artifact carries at least one well-formed day bucket. Never inferred
   *  from a zero, and never true for malformed bytes. */
  measured: boolean;
  /** Sum of the retained daily buckets, or null. Null is never replaced with 0. */
  total: number | null;
  /** Number of well-formed day entries behind total (0 when not measured). */
  day_count: number;
  /** Read OUT OF the artifact, or null. Never a serve-time clock value. */
  as_of: string | null;
  /** The artifact's own declared freshness limit in hours, or null when it declares none. */
  stale_after_hours: number | null;
  retention_days: number | null;
  status: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

/** Derive the publishable row from the artifact's bytes. Strict: any malformed day entry, a
 *  non-array days field or a missing as_of refuses the number entirely — corrupt bytes never
 *  become a plausible-looking count. An empty (or absent) days array is honest emptiness. */
export function deriveVerifyExecutions(
  artifact: VerifyExecutionsArtifact | null | undefined,
): DerivedVerifyExecutions {
  const empty: DerivedVerifyExecutions = {
    measured: false,
    total: null,
    day_count: 0,
    as_of: null,
    stale_after_hours: null,
    retention_days: null,
    status: null,
  };
  if (!artifact || typeof artifact !== "object") return empty;
  const status = typeof artifact.status === "string" ? artifact.status : null;
  const stale = isNum(artifact.stale_after_hours) ? artifact.stale_after_hours : null;
  const retention = isNum(artifact.retention_days) ? artifact.retention_days : null;
  const asOf = typeof artifact.as_of === "string" && DATE_RE.test(artifact.as_of.slice(0, 10)) && artifact.as_of.length >= 10
    ? artifact.as_of
    : null;
  if (!Array.isArray(artifact.days) || artifact.days.length === 0) {
    return { ...empty, as_of: asOf, stale_after_hours: stale, retention_days: retention, status };
  }
  const days: VerifyExecutionsDay[] = [];
  for (const entry of artifact.days) {
    if (!entry || typeof entry !== "object") return { ...empty, as_of: asOf, stale_after_hours: stale, retention_days: retention, status };
    const row = entry as unknown as Record<string, unknown>;
    const d = row.date;
    const n = row.executions;
    if (typeof d !== "string" || !DATE_RE.test(d) || !isNum(n)) {
      return { ...empty, as_of: asOf, stale_after_hours: stale, retention_days: retention, status };
    }
    days.push({ date: d, executions: n });
  }
  let total = 0;
  for (const day of days) total += day.executions;
  return {
    measured: true,
    total,
    day_count: days.length,
    as_of: asOf,
    stale_after_hours: stale,
    retention_days: retention,
    status,
  };
}

const artifact = artifactJson as VerifyExecutionsArtifact;
export default artifact;
