/**
 * GET /api/institutions — the dated institutions register, derived in-process from a
 * committed artifact. Contract style follows ./counters.ts.
 *
 * WHAT A ROW IS. public/interop/institutions-register.json (schema
 * csoai.institutions-register/0.1) holds dated, sourced observations of outside use or
 * engagement, transcribed from the external-use examples the estate published on
 * /traction/. A row is not adoption, not endorsement, not a measured institution count
 * and not a customer count. relationship_state is "none_on_record" for every row; the
 * column exists so the estate can record a relationship later without rewriting history.
 * A registered interest is not a customer.
 *
 * ── THE SAME TWO RULES /api/counters had to learn ─────────────────────────────
 * 1. NO SERVE-TIME TIMESTAMP. There is no new Date() in this file. as_of is read OUT
 *    OF the artifact and as_of_field names the exact key it came from, so a stranger
 *    can open the file and check. Two calls any interval apart return a byte-identical
 *    payload.
 * 2. NOTHING FETCHED TO SERVE. The register is imported from the committed artifact,
 *    the same bytes the edge serves under /interop/institutions-register.json. Nothing
 *    is fetched over the network to build this response.
 *
 * ── THE AGGREGATE RULE ────────────────────────────────────────────────────────
 * totals counts THIS ARTIFACT'S OWN ROWS by kind, each entry labelled catalogued
 * ("listed in a register; nothing was contacted and nothing was run" — the same kind
 * /api/counters uses). Rows are observations and are never added into a count of
 * customers, institutions or deployments. Catalogue-kind counts are visibility for the
 * register, not an institutional_use measurement: /api/footprint still publishes
 * institutional_use as UNMEASURED, and this endpoint does not change that.
 *
 * ── UNCHECKABLE, NEVER ZERO ───────────────────────────────────────────────────
 * A missing, malformed or schema-mismatched artifact answers status UNCHECKABLE with
 * null counts. Zero is published only when a valid artifact carries zero rows; a
 * broken artifact never degrades to zero, because zero would be a claim.
 */
import registerArtifact from "../../public/interop/institutions-register.json";
import { headFromGet } from "./_head";

export const ARTIFACT_PATH = "public/interop/institutions-register.json";
export const REGISTER_SCHEMA = "csoai.institutions-register/0.1";
export const RESPONSE_SCHEMA = "csoai.institutions/0.1";

export interface RegisterRow {
  actor: string;
  kind: string;
  date_or_since: string;
  date_provenance: string;
  what: string;
  claim_boundary: string;
  sources: string[];
  relationship_state: string;
  evidence_quality: { url: string; label: string }[];
}

export interface KindTotal {
  /** The kind string exactly as it appears on the artifact's rows. */
  kind: string;
  count: number | null;
  /** How the count was obtained — catalogued rows counted, never inferred. */
  kind_label: "catalogued";
  basis: string;
}

export interface Derived {
  status: "PUBLISHED" | "UNCHECKABLE";
  /** Why the artifact could not be read; null when PUBLISHED. */
  status_reason: string | null;
  /** The artifact's own schema field, echoed verbatim; null when unreadable. */
  artifact_schema: string | null;
  /** Read OUT OF the artifact; null when unreadable. */
  as_of: string | null;
  /** The artifact's rows passed through untouched; null when unreadable. */
  rows: RegisterRow[] | null;
  row_count: number | null;
  /** Counts of the artifact's own rows by kind; null when unreadable. */
  totals_by_kind: KindTotal[] | null;
}

/**
 * Pure derivation so the UNCHECKABLE path is testable without bundling tricks: the
 * handler calls this with the imported artifact; tests call it with broken inputs.
 */
export function deriveInstitutions(artifact: unknown): Derived {
  const unreadable = (reason: string): Derived => ({
    status: "UNCHECKABLE",
    status_reason: reason,
    artifact_schema: null,
    as_of: null,
    rows: null,
    row_count: null,
    totals_by_kind: null,
  });

  if (artifact == null || typeof artifact !== "object" || Array.isArray(artifact)) {
    return unreadable("the committed register artifact is missing or not a JSON object");
  }
  const record = artifact as Record<string, unknown>;
  if (typeof record.schema !== "string" || record.schema !== REGISTER_SCHEMA) {
    return unreadable(`the committed register artifact carries no ${REGISTER_SCHEMA} schema field`);
  }
  if (!Array.isArray(record.rows)) {
    return unreadable("the committed register artifact carries no rows array");
  }

  const rows = record.rows as RegisterRow[];
  const kinds = [...new Set(rows.map((row) => row.kind))].sort();
  const totals_by_kind: KindTotal[] = kinds.map((kind) => ({
    kind,
    count: rows.filter((row) => row.kind === kind).length,
    kind_label: "catalogued",
    basis: "count of this artifact's own rows carrying this kind",
  }));

  return {
    status: "PUBLISHED",
    status_reason: null,
    artifact_schema: record.schema,
    as_of: typeof record.as_of === "string" ? record.as_of : null,
    rows,
    row_count: rows.length,
    totals_by_kind,
  };
}

const derived = deriveInstitutions(registerArtifact);

export const onRequestGet: PagesFunction = async () => {
  const body = {
    schema: RESPONSE_SCHEMA,

    contract: {
      derivation:
        "Every row and every count below is derived from the committed artifact named in " +
        "source, in-process. Nothing is fetched to serve this response.",
      freshness:
        "There is no new Date() in this endpoint. as_of is read OUT OF the artifact and " +
        "as_of_field names the key it came from. Two calls any interval apart return a " +
        "byte-identical payload.",
      what_a_row_is:
        "A dated, sourced observation of outside use or engagement. Not adoption, not " +
        "endorsement, not a measured institution count and not a customer count.",
      aggregate_rule:
        "Rows are observations, never added into a count of customers. totals counts this " +
        "artifact's own rows by kind, labelled catalogued: listed in a register, nothing " +
        "was contacted and nothing was run. This endpoint does not measure " +
        "institutional_use; /api/footprint still publishes that stage as UNMEASURED.",
      relationship_rule:
        'relationship_state is "none_on_record" for every row: no customer, partner or ' +
        "contractual relationship is claimed, and a registered interest is not a customer.",
      uncheckable_rule:
        "UNCHECKABLE means the committed artifact is missing, malformed or lacks its schema " +
        "field. It never degrades to zero; zero is published only when a valid artifact " +
        "carries zero rows.",
      kinds_documented: {
        external_execution: "Outside operators ran estate-pinned or estate-published material.",
        outside_implementation: "Another party built runnable work from a published proposal.",
        independent_reproduction: "Another party reviewed reproduction work against their own material.",
        technical_citation: "Another author's technical document cites estate research.",
        listing: "An external catalogue or leaderboard lists estate artifacts.",
      },
    },

    source: ARTIFACT_PATH,
    artifact_schema: derived.artifact_schema,
    as_of: derived.as_of,
    as_of_field: "as_of",
    status: derived.status,
    status_reason: derived.status_reason,

    row_count: derived.row_count,
    rows: derived.rows,

    totals: {
      rule:
        "Counts of this artifact's own rows by kind. Catalogue counts only — never a count " +
        "of customers, institutions or deployments.",
      by_kind: derived.totals_by_kind,
    },

    note:
      "Measurement, not certification. No telemetry, no per-user data, no fabricated counts. " +
      "Transcribed from the estate's published /traction external-use examples; every row's " +
      "what is supported by its own sources.",
  };

  return new Response(JSON.stringify(body, null, 1), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Deterministic for a given deploy (no clock-following field), like /api/counters.
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
