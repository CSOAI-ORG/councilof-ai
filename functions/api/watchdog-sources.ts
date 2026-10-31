// GET /api/watchdog-sources — source inventory plus last HEAD-only status snapshot.
// This endpoint never fetches incident records and never writes to GSPC or a review queue.
import { headFromGet } from "./_head";
import registry from "../../data/watchdog/source-registry.json";
import status from "../../watchdog-source-status.json";

type Obj = Record<string, unknown>;
const SCHEMA = "csoai.watchdog-source-coverage/0.1";
const STATUS_STATES = new Set([
  "REACHABLE", "REDIRECTED", "ACCESS_LIMITED", "NOT_FOUND",
  "METHOD_UNSUPPORTED", "UNAVAILABLE", "UNREACHABLE", "NOT_MONITORED",
]);
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300",
};
const isObject = (value: unknown): value is Obj =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isHttps = (value: unknown): value is string => {
  if (!isText(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.search && !parsed.hash;
  } catch {
    return false;
  }
};
const SAFE_CONTROLS = {
  endpoint_checks_only: true,
  request_method: "HEAD",
  fetch_incident_records: false,
  download_snapshots: false,
  store_report_text: false,
  store_personal_data: false,
  automatic_classification: false,
  automatic_assignment: false,
  automatic_action: false,
  writes_gspc: false,
  requires_human_review_before_ingestion: true,
};

export function validRegistryForTest(value: unknown): boolean {
  if (!isObject(value) || value.schema !== "csoai.watchdog-source-registry/0.1" ||
      !isText(value.version) || !Array.isArray(value.sources) || value.sources.length === 0 ||
      !isObject(value.controls)) return false;
  for (const [key, expected] of Object.entries(SAFE_CONTROLS)) {
    if (value.controls[key] !== expected) return false;
  }
  const ids = new Set<string>();
  for (const source of value.sources) {
    if (!isObject(source) || !isText(source.id) || !/^[a-z0-9][a-z0-9-]*$/.test(source.id) ||
        ids.has(source.id) || !isText(source.publisher) || !isText(source.title) ||
        !isText(source.source_role) || !isHttps(source.url) || !isHttps(source.rights_url) ||
        typeof source.watch !== "boolean" || !isText(source.coverage_note) ||
        !isText(source.reuse_note) || !isText(source.ingestion_gate) ||
        source.ingestion_enabled === true) return false;
    ids.add(source.id);
  }
  return true;
}

export function validStatusForTest(value: unknown, sourceRegistry: unknown = registry): boolean {
  if (!validRegistryForTest(sourceRegistry) || !isObject(value)) return false;
  const sourceList = (sourceRegistry as Obj).sources as Obj[];
  if (value.schema !== "csoai.watchdog-source-status/0.1" ||
      value.registry_version !== (sourceRegistry as Obj).version ||
      !isText(value.observed_at) || !Number.isFinite(Date.parse(value.observed_at)) ||
      value.monitoring_method !== "HEAD" ||
      value.collection_scope !== "SOURCE_PAGE_METADATA_ONLY" ||
      !isObject(value.summary) || !isObject(value.controls) ||
      !Array.isArray(value.sources) || value.sources.length !== sourceList.length ||
      "body" in value || "incident_records" in value || "reports" in value) return false;
  for (const [key, expected] of Object.entries(SAFE_CONTROLS)) {
    if (value.controls[key] !== expected) return false;
  }
  const byId = new Map<string, Obj>();
  for (const item of value.sources) {
    if (!isObject(item) || !isText(item.id) || byId.has(item.id) ||
        !STATUS_STATES.has(String(item.state)) ||
        !(item.http_status === null || (typeof item.http_status === "number" &&
          Number.isInteger(item.http_status) && item.http_status >= 100 && item.http_status <= 599)) ||
        !(item.checked_at === null || (isText(item.checked_at) && Number.isFinite(Date.parse(item.checked_at)))) ||
        !(item.error_code === null || isText(item.error_code))) return false;
    byId.set(item.id, item);
  }
  for (const source of sourceList) {
    const item = byId.get(String(source.id));
    if (!item || (source.watch === false && (item.state !== "NOT_MONITORED" || item.http_status !== null || item.checked_at !== null))) return false;
    if (source.watch === true) {
      if (item.state === "NOT_MONITORED" || item.checked_at === null) return false;
      if (item.state === "UNREACHABLE") {
        if (item.http_status !== null || item.error_code === null) return false;
      } else if (item.http_status === null || item.error_code !== null) {
        return false;
      }
      const code = item.http_status as number | null;
      const matches = item.state === "REACHABLE" ? code !== null && code >= 200 && code < 300
        : item.state === "REDIRECTED" ? code !== null && code >= 300 && code < 400
        : item.state === "ACCESS_LIMITED" ? code === 401 || code === 403 || code === 429
        : item.state === "NOT_FOUND" ? code === 404 || code === 410
        : item.state === "METHOD_UNSUPPORTED" ? code === 405
        : item.state === "UNAVAILABLE" ? code !== null && !(code >= 200 && code < 400) && code !== 401 && code !== 403 && code !== 404 && code !== 405 && code !== 410 && code !== 429
        : false;
      if (!matches) return false;
    }
  }
  const summary = value.summary;
  const monitored = value.sources as Obj[];
  const count = (state: string) => monitored.filter((item) => item.state === state).length;
  return summary.registered_sources === sourceList.length &&
    summary.monitored_sources === sourceList.filter((item) => item.watch === true).length &&
    summary.reachable_source_pages === count("REACHABLE") &&
    summary.redirected_source_pages === count("REDIRECTED") &&
    summary.access_limited_source_pages === count("ACCESS_LIMITED") &&
    summary.non_reachable_or_unchecked_source_pages === monitored.filter((item) => item.state !== "REACHABLE" && item.state !== "NOT_MONITORED").length &&
    summary.not_monitored_sources === count("NOT_MONITORED");
}

export function freshnessForTest(observedAt: string, now = Date.now()): "FRESH" | "STALE" | "UNMEASURED" | "CLOCK_SKEW" {
  const observed = Date.parse(observedAt);
  if (!Number.isFinite(observed)) return "UNMEASURED";
  const age = now - observed;
  if (age < -5 * 60 * 1000) return "CLOCK_SKEW";
  return age <= 36 * 60 * 60 * 1000 ? "FRESH" : "STALE";
}

export function coveragePayloadForTest(sourceRegistry: unknown, sourceStatus: unknown, now = Date.now()): Obj | null {
  if (!validRegistryForTest(sourceRegistry) || !validStatusForTest(sourceStatus, sourceRegistry)) return null;
  const statusSources = (sourceStatus as Obj).sources as Obj[];
  const statusById = new Map(statusSources.map((item) => [String(item.id), item]));
  return {
    schema: SCHEMA,
    state: "READY",
    observed_at: (sourceStatus as Obj).observed_at,
    freshness_state: freshnessForTest(String((sourceStatus as Obj).observed_at), now),
    summary: (sourceStatus as Obj).summary,
    scope: "Public source-page availability only. No incident report payloads are collected.",
    sources: ((sourceRegistry as Obj).sources as Obj[]).map((source) => {
      const observed = statusById.get(String(source.id))!;
      return {
        id: source.id,
        publisher: source.publisher,
        title: source.title,
        source_role: source.source_role,
        url: source.url,
        rights_url: source.rights_url,
        watch: source.watch,
        coverage_note: source.coverage_note,
        reuse_note: source.reuse_note,
        ingestion_gate: source.ingestion_gate,
        availability_state: observed.state,
        endpoint_http_status: observed.http_status,
        endpoint_checked_at: observed.checked_at,
      };
    }),
    controls: {
      source_page_metadata_only: true,
      incident_records_collected: false,
      report_text_collected: false,
      automatic_classification: false,
      automatic_assignment: false,
      automatic_action: false,
      writes_gspc: false,
      human_review_required_before_ingestion: true,
    },
  };
}

function unavailable(errors: string[]) {
  return new Response(JSON.stringify({
    schema: SCHEMA,
    state: "UNCHECKABLE",
    errors,
    observed_at: null,
    sources: [],
    controls: {
      incident_records_collected: false,
      automatic_action: false,
      writes_gspc: false,
    },
  }, null, 2), { status: 503, headers: HEADERS });
}

export async function onRequestGet(_context: { request: Request }) {
  const payload = coveragePayloadForTest(registry, status);
  if (!payload) return unavailable(["WATCHDOG_SOURCE_STATUS_INVALID"]);
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: HEADERS });
}

export const onRequestHead = headFromGet(onRequestGet);
