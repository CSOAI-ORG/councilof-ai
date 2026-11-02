#!/usr/bin/env node
/**
 * Read-only availability check for public AI incident and threat sources.
 * HEAD only: no report pages, record APIs, feeds, attachments, or snapshots are fetched.
 * Output is source-page reachability metadata, never incident evidence or a GSPC measurement.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import registry from "../../data/watchdog/source-registry.json" with { type: "json" };

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ID = /^[a-z0-9][a-z0-9-]*$/;
const STATES = new Set(["REACHABLE", "REDIRECTED", "ACCESS_LIMITED", "NOT_FOUND", "METHOD_UNSUPPORTED", "UNAVAILABLE", "UNREACHABLE", "NOT_MONITORED"]);
const CONTROLS = Object.freeze({
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
  requires_human_review_before_ingestion: true
});

function isHttps(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.search && !parsed.hash;
  } catch {
    return false;
  }
}

export function validRegistry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      value.schema !== "csoai.watchdog-source-registry/0.1" ||
      typeof value.version !== "string" || !Array.isArray(value.sources) || value.sources.length < 1) return false;
  const controls = value.controls;
  if (!controls || Object.entries(CONTROLS).some(([key, expected]) => controls[key] !== expected)) return false;
  const ids = new Set();
  for (const source of value.sources) {
    if (!source || typeof source !== "object" || !ID.test(source.id) || ids.has(source.id) ||
        typeof source.publisher !== "string" || !source.publisher.trim() ||
        typeof source.title !== "string" || !source.title.trim() ||
        typeof source.source_role !== "string" || !source.source_role.trim() ||
        !isHttps(source.url) || !isHttps(source.rights_url) ||
        typeof source.watch !== "boolean" ||
        typeof source.coverage_note !== "string" || !source.coverage_note.trim() ||
        typeof source.reuse_note !== "string" || !source.reuse_note.trim() ||
        typeof source.ingestion_gate !== "string" || !source.ingestion_gate.trim()) return false;
    ids.add(source.id);
  }
  return value.sources.every((source) => source.ingestion_enabled !== true);
}

export function stateForHttp(status) {
  if (status >= 200 && status < 300) return "REACHABLE";
  if (status >= 300 && status < 400) return "REDIRECTED";
  if (status === 401 || status === 403 || status === 429) return "ACCESS_LIMITED";
  if (status === 404 || status === 410) return "NOT_FOUND";
  if (status === 405) return "METHOD_UNSUPPORTED";
  return "UNAVAILABLE";
}

export async function checkSource(source, fetchImpl = fetch, checkedAt = new Date().toISOString()) {
  if (!source.watch) {
    return { id: source.id, state: "NOT_MONITORED", http_status: null, checked_at: null, error_code: null };
  }
  try {
    const response = await fetchImpl(source.url, {
      method: "HEAD",
      redirect: "manual",
      headers: { "user-agent": "csoai-watchdog-source-status/0.1 (+https://councilof.ai)" },
      signal: AbortSignal.timeout(10000)
    });
    if (response.body && typeof response.body.cancel === "function") await response.body.cancel().catch(() => {});
    return {
      id: source.id,
      state: stateForHttp(response.status),
      http_status: response.status,
      checked_at: checkedAt,
      error_code: null
    };
  } catch (error) {
    return {
      id: source.id,
      state: "UNREACHABLE",
      http_status: null,
      checked_at: checkedAt,
      error_code: error instanceof Error ? error.name : "UNKNOWN_ERROR"
    };
  }
}

export async function createStatus({
  sourceRegistry = registry,
  fetchImpl = fetch,
  observedAt = new Date().toISOString()
} = {}) {
  if (!validRegistry(sourceRegistry)) throw new Error("WATCHDOG_SOURCE_REGISTRY_INVALID");
  const results = await Promise.all(sourceRegistry.sources.map((source) => checkSource(source, fetchImpl, observedAt)));
  const counts = Object.fromEntries([...STATES].map((state) => [state, results.filter((item) => item.state === state).length]));
  return {
    schema: "csoai.watchdog-source-status/0.1",
    registry_version: sourceRegistry.version,
    observed_at: observedAt,
    monitoring_method: "HEAD",
    collection_scope: "SOURCE_PAGE_METADATA_ONLY",
    summary: {
      registered_sources: sourceRegistry.sources.length,
      monitored_sources: sourceRegistry.sources.filter((source) => source.watch).length,
      reachable_source_pages: counts.REACHABLE,
      redirected_source_pages: counts.REDIRECTED,
      access_limited_source_pages: counts.ACCESS_LIMITED,
      non_reachable_or_unchecked_source_pages: results.filter((item) => item.state !== "REACHABLE" && item.state !== "NOT_MONITORED").length,
      not_monitored_sources: counts.NOT_MONITORED
    },
    controls: { ...CONTROLS },
    sources: results
  };
}

function outputPath(args) {
  const index = args.indexOf("--out");
  if (index === -1) return resolve(ROOT, "watchdog-source-status.json");
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error("WATCHDOG_OUTPUT_PATH_REQUIRED");
  return resolve(process.cwd(), args[index + 1]);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const status = await createStatus();
  const destination = outputPath(process.argv.slice(2));
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify(status, null, 2) + "\n");
  console.log(
    "Watchdog source status: " + status.summary.reachable_source_pages + " direct 2xx, " +
    status.summary.redirected_source_pages + " redirected, of " + status.summary.monitored_sources +
    " monitored pages; HEAD metadata only; incident records fetched: no."
  );
}
