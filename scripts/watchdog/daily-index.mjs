#!/usr/bin/env node
/**
 * Build a local, metadata-only daily index from the existing HEAD status snapshot.
 * This script performs no network requests, reads no incident records, and writes
 * nothing to GSPC, MEOK, Busabase, or a publication endpoint.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY_PATH = resolve(ROOT, "data/watchdog/source-registry.json");
const STATUS_PATH = resolve(ROOT, "watchdog-source-status.json");
const INDEX_SCHEMA = "csoai.watchdog.daily-incident-signal-index/0.1";
const SOURCE_REGISTRY_SCHEMA = "csoai.watchdog-source-registry/0.1";
const SOURCE_STATUS_SCHEMA = "csoai.watchdog-source-status/0.1";
const SOURCE_STATES = new Set([
  "REACHABLE", "REDIRECTED", "ACCESS_LIMITED", "NOT_FOUND",
  "METHOD_UNSUPPORTED", "UNAVAILABLE", "UNREACHABLE", "NOT_MONITORED",
]);
const REVIEW_STATES = [
  "awaiting_triage", "received", "acknowledged", "accepted",
  "decided", "appealed", "corrected", "closed",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireInputs(registry, status) {
  if (!isObject(registry) || registry.schema !== SOURCE_REGISTRY_SCHEMA ||
      typeof registry.version !== "string" || !Array.isArray(registry.sources) ||
      !isObject(registry.controls)) throw new Error("WATCHDOG_SOURCE_REGISTRY_INVALID");
  const safeControls = (controls) =>
    isObject(controls) &&
    controls.endpoint_checks_only === true &&
    controls.request_method === "HEAD" &&
    controls.fetch_incident_records === false &&
    controls.download_snapshots === false &&
    controls.store_report_text === false &&
    controls.store_personal_data === false &&
    controls.automatic_classification === false &&
    controls.automatic_assignment === false &&
    controls.automatic_action === false &&
    controls.writes_gspc === false &&
    controls.requires_human_review_before_ingestion === true;
  if (!safeControls(registry.controls)) throw new Error("WATCHDOG_SOURCE_REGISTRY_CONTROLS_INVALID");
  if (!isObject(status) || status.schema !== SOURCE_STATUS_SCHEMA ||
      status.registry_version !== registry.version ||
      status.monitoring_method !== "HEAD" ||
      status.collection_scope !== "SOURCE_PAGE_METADATA_ONLY" ||
      !safeControls(status.controls) ||
      !Number.isFinite(Date.parse(status.observed_at)) ||
      !Array.isArray(status.sources) || status.sources.length !== registry.sources.length ||
      "body" in status || "incident_records" in status || "reports" in status) {
    throw new Error("WATCHDOG_SOURCE_STATUS_INVALID");
  }
  const ids = new Set();
  const registryById = new Map();
  for (const source of registry.sources) {
    if (!isObject(source) || typeof source.id !== "string" || ids.has(source.id) ||
        typeof source.url !== "string" || typeof source.watch !== "boolean" ||
        source.ingestion_enabled === true) {
      throw new Error("WATCHDOG_SOURCE_ENTRY_INVALID");
    }
    ids.add(source.id);
    registryById.set(source.id, source);
  }
  const statusIds = new Set();
  for (const item of status.sources) {
    if (!isObject(item) || typeof item.id !== "string" || statusIds.has(item.id) ||
        !SOURCE_STATES.has(item.state) ||
        !(item.http_status === null || (Number.isInteger(item.http_status) &&
          item.http_status >= 100 && item.http_status <= 599)) ||
        !(item.error_code === null || (typeof item.error_code === "string" && item.error_code.length > 0))) {
      throw new Error("WATCHDOG_STATUS_ENTRY_INVALID");
    }
    statusIds.add(item.id);
    const source = registryById.get(item.id);
    if (!source) throw new Error("WATCHDOG_SOURCE_SET_MISMATCH");
    const notMonitored = source.watch === false;
    if (notMonitored) {
      if (item.state !== "NOT_MONITORED" || item.checked_at !== null ||
          item.http_status !== null || item.error_code !== null) {
        throw new Error("WATCHDOG_NOT_MONITORED_STATE_INVALID");
      }
    } else if (item.state === "NOT_MONITORED" || !Number.isFinite(Date.parse(item.checked_at))) {
      throw new Error("WATCHDOG_MONITORED_STATE_INVALID");
    }
    if (item.state === "UNREACHABLE") {
      if (item.http_status !== null || item.error_code === null) throw new Error("WATCHDOG_ERROR_STATE_INVALID");
    } else if (!notMonitored && (item.http_status === null || item.error_code !== null)) {
      throw new Error("WATCHDOG_HTTP_STATE_INVALID");
    }
  }
  if ([...ids].some((id) => !statusIds.has(id)) ||
      [...statusIds].some((id) => !ids.has(id))) throw new Error("WATCHDOG_SOURCE_SET_MISMATCH");
}

function availableCount(value) {
  return { status: "available", value };
}

function unavailableCount(reason) {
  return { status: "unavailable", value: null, reason };
}

function notInScopeCount(reason) {
  return { status: "not_in_scope", value: null, reason };
}

function notInScopeRate(reason) {
  return { status: "not_in_scope", numerator: null, denominator: null, value: null, reason };
}

function sourceEndpointState(state) {
  const mapped = {
    REACHABLE: "reachable",
    REDIRECTED: "redirected",
    ACCESS_LIMITED: "access_limited",
    NOT_FOUND: "not_found",
    METHOD_UNSUPPORTED: "method_unsupported",
    UNAVAILABLE: "unavailable",
    UNREACHABLE: "unreachable",
    NOT_MONITORED: "not_checked",
  };
  return mapped[state] || "unknown";
}

export function buildDailyIndex(registry, status) {
  requireInputs(registry, status);
  const byId = new Map(status.sources.map((item) => [item.id, item]));
  const sources = registry.sources;
  const monitored = sources.filter((source) => source.watch === true);
  const observedAt = status.observed_at;
  const date = observedAt.slice(0, 10);
  const dayStart = new Date(Date.UTC(
    new Date(observedAt).getUTCFullYear(),
    new Date(observedAt).getUTCMonth(),
    new Date(observedAt).getUTCDate(),
  )).toISOString();
  const reportSeed = JSON.stringify({
    schema: INDEX_SCHEMA,
    registry_version: registry.version,
    observed_at: observedAt,
    source_ids: sources.map((source) => source.id).sort(),
  });
  const digest = createHash("sha256").update(reportSeed).digest("hex").slice(0, 16);
  const notMeasured = "No incident-report intake or durable case workflow is enabled.";
  const processNotMeasured = "No accepted-roster or working-group task feed is connected to this index.";

  return {
    schema: INDEX_SCHEMA,
    report_id: `watchdog-daily-${date}-${digest}`,
    issued_at: observedAt,
    period: { start: dayStart, end: observedAt },
    scope: {
      source_registry_version: registry.version,
      source_ids: sources.map((source) => source.id),
      geographic_scope: [],
      language_scope: [],
      sector_scope: [],
      global_coverage_claim: false,
    },
    coverage: {
      in_scope_sources: availableCount(sources.length),
      monitored_sources: availableCount(monitored.length),
      source_monitoring_rate: {
        status: "available",
        numerator: monitored.length,
        denominator: sources.length,
        value: sources.length ? monitored.length / sources.length : 0,
      },
      not_monitored_source_ids: sources.filter((source) => !source.watch).map((source) => source.id),
      source_checks: sources.map((source) => {
        const item = byId.get(source.id);
        const notChecked = item.state === "NOT_MONITORED";
        return {
          source_id: source.id,
          source_ref: source.url,
          checked_at: notChecked ? null : item.checked_at,
          check_method: notChecked ? "not_checked" : "http_head",
          endpoint_state: sourceEndpointState(item.state),
          endpoint_http_status: notChecked ? null : item.http_status,
          error_code: notChecked ? null : item.error_code,
          source_updated_at: null,
          rights_state: "unknown",
        };
      }),
      known_gaps: [
        "This inventory checks seven named public source pages; it is not an incident census or a global completeness measure.",
        "HEAD availability does not confirm that source records are current, complete, accurate, or reusable.",
        "The controlled source-permission register is not joined to this runtime inventory; rights_state is therefore unknown here.",
        "Redirects and access restrictions are preserved as endpoint states; no response body is fetched.",
      ],
    },
    intake: {
      mode: "source_status_only",
      candidate_items: notInScopeCount(notMeasured),
      duplicate_items: notInScopeCount("No incident records are collected or compared for duplicates."),
      held_for_rights_or_privacy: notInScopeCount("No incident records are collected or held by this monitor."),
      out_of_scope_items: notInScopeCount("Incident records are outside this monitor's scope."),
    },
    human_review: {
      staffing_status: "not_staffed",
      items_by_state: Object.fromEntries(REVIEW_STATES.map((state) => [state, notInScopeCount(notMeasured)])),
      service_hours_ref: null,
    },
    working_group_process: {
      registry_ref: "https://github.com/CSOAI-ORG/councilof-ai/pull/3641",
      groups_in_scope: unavailableCount(processNotMeasured),
      adopted_charters: unavailableCount(processNotMeasured),
      accepted_chairs: unavailableCount(processNotMeasured),
      accepted_reviewers: unavailableCount(processNotMeasured),
      active_tasks: unavailableCount(processNotMeasured),
      independent_challenges: unavailableCount(processNotMeasured),
      unresolved_appeals: unavailableCount(processNotMeasured),
    },
    evidence_quality: {
      items_with_source_pointer: notInScopeCount(notMeasured),
      items_with_capture_time: notInScopeCount(notMeasured),
      items_with_rights_record: notInScopeCount(notMeasured),
      items_with_provenance: notInScopeCount(notMeasured),
      source_pointer_rate: notInScopeRate(notMeasured),
      capture_time_rate: notInScopeRate(notMeasured),
      rights_record_rate: notInScopeRate(notMeasured),
      provenance_rate: notInScopeRate(notMeasured),
    },
    gspc_link: {
      relationship: "link_only",
      board_ref: "https://councilof.ai/api/gspc",
      axis_scores_written: false,
      incident_counts_are_axis_scores: false,
    },
    privacy: {
      public_report_text_included: false,
      direct_identifiers_included: false,
      small_cell_suppression_applied: false,
    },
    limitations: [
      "This is a draft metadata-only source-availability index, not an incident report feed, safety verdict, certification, or global incident census.",
      "No incident records, report text, attachments, reporter data, or personal data are queried or stored.",
      "All intake and case-review measures are not in scope; do not interpret them as zero incidents.",
      "No small-cell suppression pass is run because this source-status index contains no incident counts.",
      "Rights state is unknown in this index until the controlled source-permission register is connected and reviewed.",
      "No MEOK referral receiver or accepted reviewer roster is connected; this index does not route cases.",
      "GSPC is linked only. This generator performs no GSPC, MEOK, Busabase, or publication writes.",
    ],
    review: { status: "draft", reviewer_ref: null, decision_ref: null },
  };
}

function argumentsFor(argv) {
  const options = { registry: REGISTRY_PATH, status: STATUS_PATH, out: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!["--registry", "--status", "--out"].includes(flag)) {
      throw new Error(`UNKNOWN_ARGUMENT:${flag}`);
    }
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) {
      throw new Error(`ARGUMENT_VALUE_REQUIRED:${flag}`);
    }
    options[flag.slice(2)] = resolve(process.cwd(), argv[++i]);
  }
  return options;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const options = argumentsFor(process.argv.slice(2));
    const output = JSON.stringify(buildDailyIndex(readJson(options.registry), readJson(options.status)), null, 2) + "\n";
    if (options.out) writeFileSync(options.out, output, { flag: "w" });
    else process.stdout.write(output);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "WATCHDOG_INDEX_BUILD_FAILED");
    process.exitCode = 1;
  }
}
