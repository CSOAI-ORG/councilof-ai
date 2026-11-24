/**
 * GET /api/research-commons — read-only CouncilOS/H.I.M. consumer of
 * the isolated EAT feed's daily source metadata.
 *
 * NEVER a source of GSPC measurements, an approved RAS job, a model-weight
 * intake, an independent scientific verdict, or a staff/recipient decision.
 * No dynamical URL or customer-controlled remote fetch.
 */
import { headFromGet } from "./_head";

type Obj = Record<string, unknown>;
export const FEED_SOURCE =
  "https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/auto-eat-feed/public/interop/auto-eat/research-commons.json";
const SCHEMA = "csoai.auto-eat.research-commons/0.1";
const OUTPUT_SCHEMA = "csoai.councilos-eat-research-commons/0.1";
const MAX_BODY = 80000;
const FRESH_MS = 48 * 3600 * 1000;
const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const DOI = /^10\.\d{4,9}\/[^\s<>]{1,220}$/i;
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=120",
};

const isObject = (x: unknown): x is Obj =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const cleanText = (s: unknown, max = 240): s is string =>
  typeof s === "string" && !!s.trim() && s.length <= max &&
  !/[<>\u0000-\u001f]/.test(s);

function timestampUTC(raw: unknown): number | null {
  if (!cleanText(raw, 40) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(raw))
    return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

export function validEATCommonsForTest(value: unknown): boolean {
  if (!isObject(value) || value.schema !== SCHEMA ||
      value.publication_state !== "RESEARCH_DISCOVERY_ONLY_UNSIGNED" ||
      value.catalog_scope !== "FIXED_ALLOWLIST_SOURCE_METADATA_ONLY" ||
      timestampUTC(value.observed_at) === null ||
      !SHA256.test(String(value.registry_sha256)) ||
      !Array.isArray(value.repositories) || value.repositories.length === 0 ||
      value.repositories.length > 18 ||
      !Array.isArray(value.crossref_topics) || value.crossref_topics.length !== 3 ||
      value.repositories_checked !== value.repositories.length ||
      value.repositories_observed !== value.repositories.filter((r) =>
        isObject(r) && r.status === "SOURCE_METADATA_OBSERVED").length ||
      value.repositories_uncheckable !== value.repositories.length - Number(value.repositories_observed) ||
      value.crossref_topics_checked !== value.crossref_topics.length ||
      value.crossref_topics_observed !== value.crossref_topics.filter((t) =>
        isObject(t) && t.status === "SOURCE_METADATA_OBSERVED").length ||
      value.paper_full_text_copied !== false ||
      value.third_party_code_copied !== false ||
      value.model_weights_copied !== false ||
      value.incident_records_copied !== false ||
      value.machine_training_from_sources_performed !== false ||
      value.gspc_measurement_or_board_written !== false ||
      value.human_authority_issued !== false ||
      value.external_executor_invoked !== false ||
      value.receiving_party_effect_verified !== false ||
      value.ras_paid_request_executed !== false) return false;
  const names = new Set<string>();
  for (const item of value.repositories) {
    if (!isObject(item) || !cleanText(item.repository) ||
        !REPO.test(item.repository) || item.repository.split("/").some((s) => s === "." || s === "..") ||
        names.has(item.repository) ||
        item.source !== "github_public_api" ||
        !cleanText(item.project_role, 90) ||
        !cleanText(item.candidate_experiment, 90) ||
        item.independent_verification !== "NOT_PERFORMED" ||
        item.human_review !== "UNASSIGNED" ||
        item.ras_measurement_permission !== "NOT_GRANTED" ||
        (item.status !== "SOURCE_METADATA_OBSERVED" && item.status !== "SOURCE_UNCHECKABLE")) return false;
    names.add(item.repository);
    if (item.status === "SOURCE_METADATA_OBSERVED") {
      if (!Number.isSafeInteger(item.repository_id) || Number(item.repository_id) <= 0 ||
          !SHA40.test(String(item.head_sha)) ||
          !SHA256.test(String(item.repository_metadata_canonical_sha256)) ||
          !SHA256.test(String(item.commit_metadata_canonical_sha256)) ||
          item.source_link !== "https://github.com/" + item.repository ||
          item.license_review !== "REQUIRED_FOR_CODE_DATA_MODEL_WEIGHTS_AND_DEPENDENCIES" ||
          !(item.license_spdx_source_declared === null ||
            cleanText(item.license_spdx_source_declared, 100)))
        return false;
    } else if (item.head_sha !== undefined || !cleanText(item.reason, 75)) return false;
  }
  let paperCount = 0;
  for (const topic of value.crossref_topics) {
    if (!isObject(topic) || !cleanText(topic.topic, 120) ||
        (topic.status !== "SOURCE_METADATA_OBSERVED" && topic.status !== "SOURCE_UNCHECKABLE") ||
        !Array.isArray(topic.papers) || topic.papers.length > 3 ||
        topic.recently_indexed_not_necessarily_newly_published !== true) return false;
    if (topic.status === "SOURCE_UNCHECKABLE" &&
        (topic.papers.length !== 0 || !cleanText(topic.reason, 75))) return false;
    if (topic.status === "SOURCE_METADATA_OBSERVED" &&
        (!SHA256.test(String(topic.source_response_canonical_sha256)) ||
         topic.candidate_selection !== "TWO_PART_TITLE_KEYWORD_HEURISTIC_REVIEW_REQUIRED"))
      return false;
    for (const p of topic.papers) {
      if (!isObject(p) || !cleanText(p.doi, 230) || !DOI.test(p.doi) ||
          !cleanText(p.title_metadata, 240) ||
          p.doi_url !== "https://doi.org/" + p.doi ||
          p.full_text_copied !== false ||
          p.full_text_rights !== "NOT_ESTABLISHED" ||
          p.reproducibility_status !== "NOT_TESTED" ||
          p.human_review !== "UNASSIGNED" ||
          p.title_relevance !== "HEURISTIC_KEYWORD_MATCH_NOT_SCIENTIFIC_JUDGEMENT")
        return false;
      paperCount++;
    }
  }
  return paperCount === value.crossref_candidate_metadata_rows;
}

export function freshnessForTest(observedAt: string, now = Date.now()): "FRESH" | "STALE" | "CLOCK_SKEW" {
  const time = timestampUTC(observedAt);
  if (time === null || !Number.isFinite(now)) return "CLOCK_SKEW";
  const delta = now - time;
  return delta < -5 * 60 * 1000 ? "CLOCK_SKEW" : delta > FRESH_MS ? "STALE" : "FRESH";
}

export function projectForTest(data: unknown, asOf: string, sourceSha256: string, now = Date.now()): Obj | null {
  if (!validEATCommonsForTest(data) || !SHA256.test(sourceSha256) || !isObject(data))
    return null;
  const freshness = freshnessForTest(String(data.observed_at), now);
  return {
    schema: OUTPUT_SCHEMA,
    state: freshness === "FRESH" ? "FREE_DISCOVERY_ONLY" : "HELD_SOURCE_" + freshness,
    source: {
      url: FEED_SOURCE,
      source_sha256: sourceSha256,
      observed_at: data.observed_at,
      read_at: asOf,
      freshness,
      branch_isolate: "auto-eat-feed",
      signature_verification: "NOT_PERFORMED",
      independent_source_verification: false,
    },
    coverage: {
      repositories_checked: data.repositories_checked,
      repositories_observed: data.repositories_observed,
      repositories_uncheckable: data.repositories_uncheckable,
      crossref_topics_checked: data.crossref_topics_checked,
      crossref_topics_observed: data.crossref_topics_observed,
      papers_shortlisted: data.crossref_candidate_metadata_rows,
      full_global_coverage: false,
    },
    repositories: (data.repositories as Obj[]).map((r) => ({
      repository: r.repository,
      observed_source_revision: r.status === "SOURCE_METADATA_OBSERVED" ? r.head_sha : null,
      source_declared_license: r.status === "SOURCE_METADATA_OBSERVED" ? r.license_spdx_source_declared : null,
      status: r.status,
      project_role: r.project_role,
      candidate_experiment: r.candidate_experiment,
      licence_review: "REQUIRED",
      human_reviewer_state: "UNASSIGNED",
      independent_validation: "NOT_PERFORMED",
    })),
    papers: (data.crossref_topics as Obj[]).map((t) => ({
      topic: t.topic,
      status: t.status,
      bibliographic_candidates: (t.papers as Obj[]).map((p) => ({
        doi: p.doi, title_metadata: p.title_metadata,
        published_parts_source_declared: p.crossref_published_date_parts,
        reproducibility: "NOT_TESTED",
      })),
    })),
    pathways: {
      read_measured_gspc_axes: "/api/research-plan",
      read_existing_watchdog_sources: "/api/watchdog-sources",
      read_public_gspc: "/api/gspc",
      request_attention: "EXISTING_RAS_HUMAN_SCOPED_INTAKE_ONLY_NOT_INVOKED",
      fee_for_this_read: 0,
      independent_human_approval_issued: false,
      model_or_tool_execution_performed: false,
      endorsement_or_certification: false,
      source_evidence_copies_redistributed: false,
    },
  };
}

function unavailable(reason: string, status = 503): Response {
  return Response.json({
    schema: OUTPUT_SCHEMA, state: "UNCHECKABLE", reason,
    source: FEED_SOURCE,
    repositories: [], papers: [],
    real_evaluation_performed: false, real_human_authority_issued: false,
  }, { status, headers: HEADERS });
}

export async function onRequestGet({ request }: { request: Request }): Promise<Response> {
  // Requests never influence the origin, pathname, source allowlist or target.
  if (new URL(request.url).searchParams.has("url"))
    return unavailable("DYNAMIC_FETCH_NOT_SUPPORTED", 400);
  let bytes: Uint8Array;
  let rawBuffer: ArrayBuffer;
  let body: unknown;
  try {
    const reply = await fetch(FEED_SOURCE, {
      redirect: "error",
      headers: { "accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!reply.ok) return unavailable("EAT_FEED_NOT_PUBLISHED_OR_UNAVAILABLE");
    const size = Number(reply.headers.get("content-length") || 0);
    if (!Number.isFinite(size) || size > MAX_BODY)
      return unavailable("EAT_FEED_OVERSIZE_OR_UNCHECKABLE");
    rawBuffer = await reply.arrayBuffer();
    bytes = new Uint8Array(rawBuffer);
    if (bytes.byteLength > MAX_BODY) return unavailable("EAT_FEED_OVERSIZE");
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return unavailable("EAT_FEED_UNREACHABLE_OR_INVALID");
  }
  if (!validEATCommonsForTest(body)) return unavailable("EAT_FEED_SCHEMA_OR_RIGHTS_BOUNDARY_INVALID");
  const digest = await crypto.subtle.digest("SHA-256", rawBuffer);
  const sourceSha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  const now = Date.now();
  const projection = projectForTest(body, new Date(now).toISOString(), sourceSha256, now);
  if (!projection) return unavailable("EAT_FEED_PROJECTION_FAILED");
  // Stale metadata is not advertised as current research. No previous-fresh fallback.
  if (projection.state !== "FREE_DISCOVERY_ONLY") {
    return Response.json({
      schema: OUTPUT_SCHEMA, state: projection.state,
      source: projection.source, coverage: projection.coverage,
      repositories: [], papers: [],
      real_evaluation_performed: false, real_human_authority_issued: false,
    }, { status: 503, headers: HEADERS });
  }
  return Response.json(projection, { status: 200, headers: HEADERS });
}

export const onRequestHead = headFromGet(onRequestGet);
