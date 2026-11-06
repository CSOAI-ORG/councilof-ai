#!/usr/bin/env node
/**
 * Continuous GSPC source watch: confirmed source changes become UNSIGNED human-review requests.
 * No candidate is a measurement, legal interpretation, signed finding, model update, repair or
 * board promotion. Reuses the regulation watch's successful-fetch and two-observation policy.
 *
 * Run: node scripts/research/watch-sources.mjs [--init]
 * State: research-watch-state.json; review requests: research-review-requests/
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assessFingerprint, fetchOk, EMPTY_SHA256 } from "../reg-watch-policy.mjs";
import registry from "../../functions/api/_gspc_research_semantics.json" with { type: "json" };

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sha = (value) => createHash("sha256").update(value).digest("hex");

export function watchlist(sourceRegistry = registry) {
  const bySource = new Map();
  for (const axis of sourceRegistry.axes) {
    for (const sourceId of axis.source_ids) {
      const source = sourceRegistry.sources[sourceId];
      if (!source?.watch) continue;
      const current = bySource.get(sourceId) ?? { id: sourceId, ...source, axes: [] };
      if (!current.axes.includes(axis.axis)) current.axes.push(axis.axis);
      bySource.set(sourceId, current);
    }
  }
  return [...bySource.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export async function fingerprint(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: { "user-agent": "csoai-gspc-research-watch/0.1 (+https://councilof.ai)" },
    redirect: "follow",
  });
  const lastModified = response.headers.get("last-modified") || "";
  const etag = response.headers.get("etag") || "";
  let body = await response.text();
  const rawSha = sha(body);
  if (!fetchOk({ status: response.status, bodyLength: body.length, bodySha256: rawSha })) {
    throw new Error(`FETCH_FAILED (HTTP ${response.status}, ${body.length} bytes${rawSha === EMPTY_SHA256 ? ", empty-body hash" : ""})`);
  }
  body = body
    .replace(/name="__?[A-Za-z]*token"[^>]*>/gi, "")
    .replace(/nonce="[^"]*"/gi, "")
    .replace(/\s+/g, " ");
  if (!body.trim() || sha(body) === EMPTY_SHA256) throw new Error("FETCH_FAILED (body empty after normalisation)");
  return { method: lastModified || etag ? "headers+body" : "body", last_modified: lastModified, etag, body_sha256: sha(body) };
}

export function reviewRequest({ axis, source, previous, current, assessment, observedAt }) {
  return {
    schema: "csoai.research-review-request/0.1",
    classification: "RESEARCH_REVIEW_REQUEST",
    state: "AWAITING_HUMAN_REVIEW",
    request: "ASSESS_SOURCE_IMPACT_AND_DECIDE_WHETHER_TO_REMEASURE",
    axis,
    source: { id: source.id, publisher: source.publisher, title: source.title, url: source.url },
    observed_at: observedAt,
    previous: { body_sha256: previous.body_sha256, last_modified: previous.last_modified ?? null, checked: previous.checked ?? null },
    current: { body_sha256: current.body_sha256, last_modified: current.last_modified ?? null },
    detection_basis: assessment.basis,
    confirmations: assessment.confirmations,
    measurement_state: "UNMEASURED",
    signed: false,
    signature: null,
    automatic_submission: false,
    writes_board: false,
    model_training: false,
    automatic_fixing: false,
    automatic_signing: false,
    automatic_promotion: false,
    limitations: [
      "A confirmed source fingerprint change is not an interpretation of what changed or a legal conclusion.",
      "This unsigned request is not a measurement, finding, attestation or evidence of compliance.",
      "A person must inspect the source, map affected semantics and authorise any versioned re-measurement.",
    ],
  };
}

export async function runWatch({
  now = new Date().toISOString(),
  fetchImpl = fetch,
  stateFile = resolve(ROOT, "research-watch-state.json"),
  requestsDir = resolve(ROOT, "research-review-requests"),
  init = false,
  sourceRegistry = registry,
  log = console.log,
} = {}) {
  const state = existsSync(stateFile)
    ? JSON.parse(readFileSync(stateFile, "utf8"))
    : { schema: "csoai.gspc-research-watch-state/0.1", sources: {} };
  state.schema = "csoai.gspc-research-watch-state/0.1";
  state.sources ??= {};
  const candidates = [];
  let failed = 0;
  let unconfirmed = 0;

  for (const source of watchlist(sourceRegistry)) {
    try {
      const current = await fingerprint(source.url, fetchImpl);
      const previous = state.sources[source.id];
      if (!previous || init) {
        state.sources[source.id] = { ...current, first_seen: previous?.first_seen ?? now, checked: now };
        log(`${source.id}: baseline recorded`);
        continue;
      }
      const assessment = assessFingerprint(previous, current, now);
      if (assessment.changed) {
        for (const axis of source.axes) {
          candidates.push(reviewRequest({ axis, source, previous, current, assessment, observedAt: now }));
        }
        log(`${source.id}: CHANGED; ${source.axes.length} unsigned review request(s)`);
      } else {
        if (assessment.state === "UNCONFIRMED") unconfirmed++;
        if (assessment.state === "FETCH_FAILED") failed++;
        log(`${source.id}: ${assessment.state}`);
      }
      state.sources[source.id] = assessment.next;
    } catch (error) {
      failed++;
      if (state.sources[source.id]) state.sources[source.id].last_error = `${now}: ${error.message}`;
      log(`${source.id}: FETCH_FAILED; no candidate`);
    }
  }

  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state, null, 2) + "\n");
  const written = [];
  if (candidates.length) {
    mkdirSync(requestsDir, { recursive: true });
    for (const candidate of candidates) {
      const filename = `${now.slice(0, 10)}-${candidate.source.id}-${candidate.axis}-${candidate.current.body_sha256.slice(0, 12)}.json`;
      const path = resolve(requestsDir, filename);
      writeFileSync(path, JSON.stringify(candidate, null, 2) + "\n");
      written.push(path);
    }
  }
  return { candidates, written, failed, unconfirmed, state };
}


// Opportunity source metadata is separate from measured-axis semantics. It never
// creates a case, canonical evidence event, human decision, score or board cell.
export const OPPORTUNITY_HOURLY_IDS = Object.freeze(["R07", "R08", "R09", "R13"]);
const OPPORTUNITY_SCHEMA = "csoai.opportunity-registry/0.1";
const OPPORTUNITY_FIELDS = ["schema", "scope", "scheduler", "last_capture", "routes"];
const ROUTE_FIELDS = ["route_id", "name", "kind", "catalogued_on", "source_urls", "declared_read_interval_hours", "related_evidence", "observations"];
const OBS_FIELDS = ["source_url", "state", "attempted_at", "last_success_at", "http_status", "content_sha256", "baseline_sha256", "pending_sha256", "pending_since", "reason", "workflow_run_url", "artifact_url"];
const OBS_STATES = new Set(["CATALOGUED", "FIRST_CAPTURE", "UNCHANGED", "UNCONFIRMED", "CHANGED", "UNCHECKABLE", "UNREACHABLE"]);
const OBS_REASONS = new Set(["NOT_READ", "FIRST_SUCCESS", "SAME_BODY", "CHANGE_NEEDS_CONFIRMATION", "CONFIRMED_BODY_CHANGE", "HTTP_STATUS", "REDIRECT_NOT_FOLLOWED", "EMPTY_BODY", "BODY_LIMIT", "CHALLENGE_PAGE", "FETCH_OR_TIMEOUT"]);
const DIGEST = /^[0-9a-f]{64}$/;
const UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)$/;
const RUN_URL = /^https:\/\/github\.com\/CSOAI-ORG\/councilof-ai\/actions\/runs\/[1-9][0-9]*$/;
// Reviewed publisher hosts only. URLs cannot add another network destination.
const SOURCE_HOSTS = new Set(["milanix.vercel.app", "www.ietf.org", "wiki.ietf.org", "www.nist.gov", "aiverifyfoundation.sg", "www.ukri.org", "apply-for-innovation-funding.service.gov.uk", "www.npl.co.uk", "npl.tfaforms.net", "questions-statements.parliament.uk", "www.turing.ac.uk", "assuranceplatform.azurewebsites.net", "github.com", "langfuse.com", "opentelemetry.io", "www.coalitionforsecureai.org", "ai.finos.org", "mlcommons.org", "openssf.org", "www.sigstore.dev", "owaspai.org", "www.owasp.community", "thealliance.ai", "help.thealliance.ai", "ai.ieee-ies.org", "www.csiro.au", "ico.org.uk", "www.fca.org.uk", "eic.ec.europa.eu", "research-and-innovation.ec.europa.eu", "research.aiodp.eu", "digital-strategy.ec.europa.eu", "futurium.ec.europa.eu", "tefhealth.eu", "www.nvidia.com", "aws.amazon.com", "cloud.google.com", "learn.microsoft.com"]);
const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const exact = (v, keys) => object(v) && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
const instant = (v) => typeof v === "string" && UTC.test(v) && Number.isFinite(Date.parse(v));
const nullableTime = (v) => v === null || instant(v);
const nullableDigest = (v) => v === null || typeof v === "string" && DIGEST.test(v);
const textField = (v, max = 300) => typeof v === "string" && v.length > 0 && v.length <= max && !/[\u0000-\u001f<>]/.test(v);

export function opportunitySourceUrl(value) {
  if (typeof value !== "string" || value.length > 1600) throw new Error("SOURCE_URL_REJECTED");
  let u;
  try { u = new URL(value); } catch { throw new Error("SOURCE_URL_REJECTED"); }
  if (u.protocol !== "https:" || u.username || u.password || u.port || u.hash ||
      !SOURCE_HOSTS.has(u.hostname) || /(?:token|api[_-]?key|password|secret|auth)=/i.test(u.search)) {
    throw new Error("SOURCE_URL_REJECTED");
  }
  return u.href;
}

export function validateOpportunityRegistry(value, asOf = null) {
  const fail = () => { throw new Error("OPPORTUNITY_REGISTRY_INVALID"); };
  if (!exact(value, OPPORTUNITY_FIELDS) || value.schema !== OPPORTUNITY_SCHEMA || !textField(value.scope, 1000) ||
      !Array.isArray(value.routes) || value.routes.length !== 29) fail();
  const scheduler = value.scheduler;
  if (!exact(scheduler, ["path", "daily_cron_utc", "hourly_integration_cron_utc", "integration_route_ids", "boundary"]) ||
      scheduler.path !== ".github/workflows/reg-watch.yml" || scheduler.daily_cron_utc !== "45 6 * * *" ||
      scheduler.hourly_integration_cron_utc !== "45 0-5,7-23 * * *" || !textField(scheduler.boundary, 1000) ||
      JSON.stringify(scheduler.integration_route_ids) !== JSON.stringify(OPPORTUNITY_HOURLY_IDS)) fail();
  const seen = new Set();
  for (const r of value.routes) {
    if (!exact(r, ROUTE_FIELDS) || !/^R(?:0[1-9]|1[0-9]|2[0-9])$/.test(r.route_id) || seen.has(r.route_id) ||
        !textField(r.name) || !textField(r.kind) || !/^\d{4}-\d\d-\d\d$/.test(r.catalogued_on) ||
        r.declared_read_interval_hours !== (OPPORTUNITY_HOURLY_IDS.includes(r.route_id) ? 1 : 24) ||
        !Array.isArray(r.source_urls) || r.source_urls.length < 1 || r.source_urls.length > 4 ||
        new Set(r.source_urls).size !== r.source_urls.length || !Array.isArray(r.observations) ||
        r.observations.length !== r.source_urls.length || !Array.isArray(r.related_evidence) || r.related_evidence.length > 4) fail();
    seen.add(r.route_id);
    for (const url of r.source_urls) if (opportunitySourceUrl(url) !== url) fail();
    for (const e of r.related_evidence) {
      if (!exact(e, ["axis", "url", "observed_at", "scope"]) || !/^[a-z-]+$/.test(e.axis) || !instant(e.observed_at) ||
          !/^https:\/\/github\.com\/CSOAI-ORG\/councilof-ai\/blob\/[0-9a-f]{40}\/public\/interop\/[a-zA-Z0-9_./-]+\.json$/.test(e.url) ||
          !textField(e.scope, 1000)) fail();
    }
    const urls = new Set();
    for (const o of r.observations) {
      if (!exact(o, OBS_FIELDS) || !r.source_urls.includes(o.source_url) || urls.has(o.source_url) ||
          !OBS_STATES.has(o.state) || !OBS_REASONS.has(o.reason) || !nullableTime(o.attempted_at) || !nullableTime(o.last_success_at) ||
          !nullableTime(o.pending_since) || !nullableDigest(o.content_sha256) || !nullableDigest(o.baseline_sha256) || !nullableDigest(o.pending_sha256) ||
          !(o.http_status === null || Number.isInteger(o.http_status) && o.http_status >= 100 && o.http_status <= 599) ||
          !(o.workflow_run_url === null || RUN_URL.test(o.workflow_run_url)) ||
          o.artifact_url !== (o.workflow_run_url === null ? null : o.workflow_run_url + "#artifacts")) fail();
      if ((o.last_success_at === null) !== (o.content_sha256 === null) || (o.last_success_at === null) !== (o.baseline_sha256 === null) ||
          (o.pending_since === null) !== (o.pending_sha256 === null) || o.last_success_at && (!o.attempted_at || Date.parse(o.last_success_at) > Date.parse(o.attempted_at)) ||
          o.pending_since && (!o.last_success_at || Date.parse(o.pending_since) > Date.parse(o.last_success_at)) ||
          o.state === "CATALOGUED" && (o.attempted_at !== null || o.reason !== "NOT_READ") ||
          o.state !== "CATALOGUED" && o.attempted_at === null ||
          ["FIRST_CAPTURE", "UNCHANGED", "UNCONFIRMED", "CHANGED"].includes(o.state) && (o.last_success_at !== o.attempted_at || o.http_status !== 200) ||
          asOf && o.attempted_at && Date.parse(o.attempted_at) > Date.parse(asOf)) fail();
      urls.add(o.source_url);
    }
  }
  if (value.last_capture !== null) {
    const c = value.last_capture;
    if (!exact(c, ["started_at", "completed_at", "scope", "method_sha256", "executor", "workflow_run_url", "artifact_url", "route_count", "source_count", "successful", "uncheckable", "unreachable"]) ||
        !instant(c.started_at) || !instant(c.completed_at) || Date.parse(c.started_at) > Date.parse(c.completed_at) ||
        !["all", "integrations"].includes(c.scope) || !DIGEST.test(c.method_sha256) || !["GITHUB_ACTIONS", "LOCAL_READONLY_TRIAL"].includes(c.executor) ||
        !(c.workflow_run_url === null || RUN_URL.test(c.workflow_run_url)) || c.artifact_url !== (c.workflow_run_url === null ? null : c.workflow_run_url + "#artifacts") ||
        c.executor === "GITHUB_ACTIONS" && c.workflow_run_url === null || c.executor === "LOCAL_READONLY_TRIAL" && c.workflow_run_url !== null ||
        c.route_count !== (c.scope === "all" ? 29 : 4) || ![c.source_count, c.successful, c.uncheckable, c.unreachable].every((n) => Number.isInteger(n) && n >= 0) ||
        c.source_count !== c.successful + c.uncheckable + c.unreachable || asOf && Date.parse(c.completed_at) > Date.parse(asOf)) fail();
  }
  if (value.last_capture !== null) {
    const c = value.last_capture;
    const selected = value.routes.filter(r => c.scope === "all" || OPPORTUNITY_HOURLY_IDS.includes(r.route_id));
    const sources = new Map(selected.flatMap(r => r.observations.map(o => [o.source_url, o])));
    if (c.source_count !== sources.size || [...sources.values()].some(o => !o.attempted_at || Date.parse(o.attempted_at) < Date.parse(c.started_at) || Date.parse(o.attempted_at) > Date.parse(c.completed_at) || o.workflow_run_url !== c.workflow_run_url) ||
        c.uncheckable !== [...sources.values()].filter(o => o.state === "UNCHECKABLE").length || c.unreachable !== [...sources.values()].filter(o => o.state === "UNREACHABLE").length) fail();
  }
  return value;
}

export function mergeOpportunityBaseline(current, previous) {
  validateOpportunityRegistry(current); validateOpportunityRegistry(previous);
  const metadata = (v) => JSON.stringify({ schema: v.schema, scope: v.scope, scheduler: v.scheduler, routes: v.routes.map(({ observations, ...r }) => r) });
  if (metadata(current) !== metadata(previous)) throw new Error("PENDING_CATALOGUE_METADATA_DIFFERS");
  return structuredClone(previous);
}

export function selectOpportunityRoutes(value, scope) {
  validateOpportunityRegistry(value);
  if (!["all", "integrations"].includes(scope)) throw new Error("OPPORTUNITY_SCOPE_INVALID");
  return value.routes.filter((r) => scope === "all" || OPPORTUNITY_HOURLY_IDS.includes(r.route_id));
}

export async function fetchOpportunitySource(url, { fetchImpl = fetch, timeoutMs = 12000, maxBytes = 1000000 } = {}) {
  opportunitySourceUrl(url); // Refuse before the network call.
  const controller = new AbortController();
  let reader, status = null;
  let rejectDeadline;
  const deadline = new Promise((_, reject) => { rejectDeadline = reject; });
  const timer = setTimeout(() => { controller.abort(); rejectDeadline(new Error("FETCH_OR_TIMEOUT")); }, timeoutMs);
  try {
    const response = await Promise.race([fetchImpl(url, { redirect: "manual", signal: controller.signal, credentials: "omit", headers: { "user-agent": "csoai-opportunity-source-watch/0.1 (+https://councilof.ai)", accept: "text/html,application/json,text/plain;q=0.9" } }), deadline]);
    status = response.status;
    if (status >= 300 && status < 400) return { ok: false, status, reason: "REDIRECT_NOT_FOLLOWED" };
    if (status !== 200) return { ok: false, status, reason: "HTTP_STATUS" };
    if (!response.body) return { ok: false, status, reason: "EMPTY_BODY" };
    reader = response.body.getReader();
    const hash = createHash("sha256");
    let bytes = 0, preview = "";
    for (;;) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) return { ok: false, status, reason: "BODY_LIMIT" };
      hash.update(part.value);
      if (preview.length < 12000) preview += new TextDecoder().decode(part.value).slice(0, 12000 - preview.length);
    }
    if (!bytes) return { ok: false, status, reason: "EMPTY_BODY" };
    if (/<title[^>]*>\s*(?:just a moment|attention required|access denied)|cf-chl-|g-recaptcha|hcaptcha/i.test(preview)) return { ok: false, status, reason: "CHALLENGE_PAGE" };
    return { ok: true, status, reason: "SUCCESS", bytes, body_sha256: hash.digest("hex") };
  } catch { return { ok: false, status, reason: "FETCH_OR_TIMEOUT" }; }
  finally { clearTimeout(timer); controller.abort(); if (reader) await reader.cancel().catch(() => {}); }
}

export function opportunityObservation(previous, result, observedAt, workflowRunUrl = null) {
  if (!instant(observedAt) || workflowRunUrl !== null && !RUN_URL.test(workflowRunUrl)) throw new Error("OBSERVATION_CONTEXT_INVALID");
  const next = { ...previous, attempted_at: observedAt, http_status: result.status, workflow_run_url: workflowRunUrl, artifact_url: workflowRunUrl === null ? null : workflowRunUrl + "#artifacts" };
  if (!result.ok) return { ...next, state: result.status === null ? "UNREACHABLE" : "UNCHECKABLE", reason: result.reason };
  const current = { body_sha256: result.body_sha256 };
  let state = "FIRST_CAPTURE", reason = "FIRST_SUCCESS", baseline = result.body_sha256, pending = null, since = null;
  if (previous.baseline_sha256 !== null) {
    const assessed = assessFingerprint({ body_sha256: previous.baseline_sha256, pending_token: previous.pending_sha256 ?? undefined, pending_basis: previous.pending_sha256 ? "body" : undefined, pending_first_seen: previous.pending_since ?? undefined }, current, observedAt);
    state = assessed.state; reason = state === "UNCHANGED" ? "SAME_BODY" : state === "CHANGED" ? "CONFIRMED_BODY_CHANGE" : "CHANGE_NEEDS_CONFIRMATION";
    baseline = assessed.next.body_sha256;
    pending = assessed.next.pending_token ?? null; since = assessed.next.pending_first_seen ?? null;
  }
  return { ...next, state, reason, last_success_at: observedAt, content_sha256: result.body_sha256, baseline_sha256: baseline, pending_sha256: pending, pending_since: since };
}

export async function runOpportunityWatch(value, { scope = "all", fetchImpl = fetch, clock = () => new Date().toISOString(), workflowRunUrl = null, timeoutMs = 12000, maxBytes = 1000000 } = {}) {
  const started = clock(); validateOpportunityRegistry(value, started);
  const output = structuredClone(value), selected = selectOpportunityRoutes(output, scope);
  const urls = [...new Set(selected.flatMap((r) => r.source_urls))];
  let successful = 0, unreachable = 0;
  // Serial, bounded public reads: do not burst third-party sites or retain bodies.
  for (const url of urls) {
    const result = await fetchOpportunitySource(url, { fetchImpl, timeoutMs, maxBytes });
    if (result.ok) successful++;
    else if (result.status === null) unreachable++;
    const observedAt = clock();
    for (const r of selected) for (let i = 0; i < r.observations.length; i++) {
      if (r.observations[i].source_url === url) r.observations[i] = opportunityObservation(r.observations[i], result, observedAt, workflowRunUrl);
    }
  }
  output.last_capture = { started_at: started, completed_at: clock(), scope, method_sha256: sha(readFileSync(fileURLToPath(import.meta.url))), executor: workflowRunUrl === null ? "LOCAL_READONLY_TRIAL" : "GITHUB_ACTIONS", workflow_run_url: workflowRunUrl, artifact_url: workflowRunUrl === null ? null : workflowRunUrl + "#artifacts", route_count: selected.length, source_count: urls.length, successful, uncheckable: urls.length - successful - unreachable, unreachable };
  validateOpportunityRegistry(output, output.last_capture.completed_at);
  return output;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  if (process.argv.includes("--opportunities")) {
    const arg = (key, fallback) => { const at = process.argv.indexOf(key); return at < 0 ? fallback : process.argv[at + 1]; };
    const input = arg("--opportunity-file", resolve(ROOT, "public/interop/opportunity-registry.json"));
    const output = arg("--out", input);
    const value = JSON.parse(readFileSync(input, "utf8"));
    const result = await runOpportunityWatch(value, { scope: arg("--scope", "all"), workflowRunUrl: arg("--workflow-run-url", null) });
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result.last_capture));
  } else {
    const result = await runWatch({ init: process.argv.includes("--init") });
    console.log(`GSPC research watch: ${result.candidates.length} review request(s), ${result.failed} failed, ${result.unconfirmed} unconfirmed.`);
    if (result.candidates.length) process.exitCode = 2;
  }
}
