#!/usr/bin/env node
/**
 * Prune superseded production deployments of the Cloudflare Pages project councilof-ai.
 *
 * WHY. Every production deploy leaves the one before it live at its own hash URL
 * (https://<8 hex>.councilof-ai.pages.dev). An old deployment keeps running the code and the
 * secrets it was built with. Changing a signing route on councilof.ai changes nothing there.
 *
 * DEFAULT. Dry run. It lists, prints what it would delete, and deletes nothing.
 *
 * TO DELETE, all of these must hold:
 *   - PRUNE_DRY_RUN is exactly "false";
 *   - PRUNE_CONFIRM_KEEP names the current production deployment, as a dry run printed it;
 *   - the process is a workflow_dispatch run of CSOAI-ORG/councilof-ai on refs/heads/master.
 *
 * NEVER DELETED, in either mode:
 *   - the current production deployment (the project's canonical_deployment);
 *   - the newest successful production deployment;
 *   - anything created at or after the older of those two;
 *   - anything with an alias pointing at it;
 *   - any preview-environment deployment (only env=production is listed, and each row is re-checked).
 * The delete call never carries `force`. Nothing here deploys, signs or changes a setting.
 * Cloudflare's own documentation says the API also refuses to delete the active production
 * deployment (Pages "Known issues", read 13 Oct 2026). That was not tested here; the rules above
 * do not rely on it.
 *
 * ONE CASE NOT COVERED. "Current production" here is what the project calls canonical_deployment.
 * If production was rolled back in the Cloudflare dashboard, that field has not been compared with
 * what the site serves. Deploy first, then prune. Rollback by dashboard is already ruled out by the
 * single-writer ruling; this note is for the day someone does it anyway.
 *
 * FAILS CLOSED. If the project, the branch, a row's shape or the listing is not what this file
 * expects, it stops before the first delete and exits 2.
 *
 * OUTPUT. Ids, dates and stage states only. No token, no account id, no variable, no response body.
 *
 * API shapes: Cloudflare's published schema (github.com/cloudflare/api-schemas, openapi.json at
 * f2dc82a2, read 13 Oct 2026): pages_project, pages_deployment, pages_api-response-collection.
 * They were NOT compared with this account's responses when this file was written. The first dry
 * run on master is that comparison.
 *
 * Exit codes: 0 done; 1 a delete failed or the run stopped early; 2 refused or could not read.
 * Node built-ins only. No dependency is installed in the job that holds the Cloudflare token.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT = 'councilof-ai';
export const PRODUCTION_BRANCH = 'master';
export const REPOSITORY = 'CSOAI-ORG/councilof-ai';
export const PER_PAGE = 25;
export const MAX_PAGES = 800; // 20,000 deployments. More than that stops the run; it is never guessed past.
export const MAX_DELETE_CEILING = 1000;
export const DEFAULT_MAX_DELETE = 200;
export const DELETE_SPACING_MS = 400; // at most 750 calls in five minutes; Cloudflare allows 1,200.
export const MAX_FAILURES = 5;
const API = 'https://api.cloudflare.com/client/v4';
const BODY_LIMIT = 8_000_000;

const object = (v) => (v !== null && typeof v === 'object' && !Array.isArray(v) ? v : null);
const accountIdOk = (v) => typeof v === 'string' && /^[a-f0-9]{32}$/i.test(v);
// A deployment id goes into a URL path. Hex and dashes only, so it can never add a path segment.
const deploymentIdOk = (v) => typeof v === 'string' && /^[a-f0-9][a-f0-9-]{7,63}$/i.test(v);

/** A refusal or an unreadable answer. `code` is safe to print; nothing else is attached. */
export class PruneError extends Error {
  constructor(code, exitCode = 2) {
    super(code);
    this.name = 'PruneError';
    this.code = code;
    this.exitCode = exitCode;
  }
}
const refuse = (code) => { throw new PruneError(code); };

/** Cloudflare timestamps are UTC. Some arrive without a zone; read those as UTC, never as local time. */
export function parseTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return NaN;
  const zoned = /(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : value + 'Z';
  return Date.parse(zoned);
}

const shortId = (d) => (typeof d.short_id === 'string' && /^[a-f0-9]{8}$/i.test(d.short_id) ? d.short_id : d.id.slice(0, 8)).toLowerCase();
const stageOf = (d) => {
  const s = object(d.latest_stage);
  const clean = (v) => (typeof v === 'string' && /^[a-z_]{1,20}$/.test(v) ? v : 'unknown');
  return clean(s?.name) + '/' + clean(s?.status);
};
const succeeded = (d) => object(d.latest_stage)?.name === 'deploy' && object(d.latest_stage)?.status === 'success';

/**
 * The deployments no run may ever delete: the one the project names as current, and the newest
 * successful one. Worked out from Cloudflare's raw answers, not from the plan, so a fault in the
 * plan cannot remove them from this set.
 */
export function neverDelete({ project, deployments }) {
  const ids = new Set();
  const current = object(object(project)?.canonical_deployment);
  if (typeof current?.id === 'string') ids.add(current.id);
  let newest = null;
  for (const d of Array.isArray(deployments) ? deployments : []) {
    if (!object(d) || !succeeded(d) || !Number.isFinite(parseTime(d.created_on))) continue;
    if (newest === null || parseTime(d.created_on) > parseTime(newest.created_on)) newest = d;
  }
  if (typeof newest?.id === 'string') ids.add(newest.id);
  return ids;
}
// Printed rows carry a re-formatted date, never the raw string the API sent.
const row = (d) => ({ id: shortId(d), created_on: new Date(parseTime(d.created_on)).toISOString(), stage: stageOf(d) });

/**
 * Decide what to keep and what is superseded. Pure: no network, no clock.
 * Throws PruneError when anything is not as expected, so a caller can never delete on a guess.
 */
export function planPrune({ project, deployments, maxDelete = DEFAULT_MAX_DELETE }) {
  const p = object(project);
  if (!p || p.name !== PROJECT) refuse('PRUNE_WRONG_PROJECT');
  if (p.production_branch !== PRODUCTION_BRANCH) refuse('PRUNE_PRODUCTION_BRANCH_DRIFT');
  const canonical = object(p.canonical_deployment);
  if (!canonical || !deploymentIdOk(canonical.id)) refuse('PRUNE_NO_CURRENT_PRODUCTION_DEPLOYMENT');
  if (canonical.environment !== 'production') refuse('PRUNE_CURRENT_DEPLOYMENT_NOT_PRODUCTION');
  if (!Number.isInteger(maxDelete) || maxDelete < 1 || maxDelete > MAX_DELETE_CEILING) refuse('PRUNE_BAD_MAX_DELETE');
  if (!Array.isArray(deployments) || deployments.length === 0) refuse('PRUNE_EMPTY_LISTING');

  const byId = new Map();
  for (const entry of deployments) {
    const d = object(entry);
    if (!d || !deploymentIdOk(d.id) || !Number.isFinite(parseTime(d.created_on))) refuse('PRUNE_UNEXPECTED_DEPLOYMENT_SHAPE');
    if (d.environment !== 'production') refuse('PRUNE_UNEXPECTED_ENVIRONMENT');
    if (d.project_name !== undefined && d.project_name !== PROJECT) refuse('PRUNE_WRONG_PROJECT');
    if (d.aliases !== undefined && d.aliases !== null && !Array.isArray(d.aliases)) refuse('PRUNE_UNEXPECTED_DEPLOYMENT_SHAPE');
    byId.set(d.id, d);
  }
  const all = [...byId.values()].sort((a, b) => parseTime(b.created_on) - parseTime(a.created_on));
  const current = byId.get(canonical.id);
  if (!current) refuse('PRUNE_CURRENT_DEPLOYMENT_NOT_IN_LISTING');
  const newestSuccess = all.find(succeeded);
  if (!newestSuccess) refuse('PRUNE_NO_SUCCESSFUL_DEPLOYMENT');

  // Only what is strictly older than BOTH kept deployments can be superseded.
  const cutoff = Math.min(parseTime(current.created_on), parseTime(newestSuccess.created_on));
  const keptNotOlder = [];
  const keptAliased = [];
  const superseded = [];
  for (const d of all) {
    if (d.id === current.id || d.id === newestSuccess.id) continue;
    if (parseTime(d.created_on) >= cutoff) keptNotOlder.push(d);
    else if (Array.isArray(d.aliases) && d.aliases.length > 0) keptAliased.push(d);
    else superseded.push(d);
  }
  const selected = superseded.slice(0, maxDelete); // newest first: the most recent old code goes first

  return {
    schema: 'csoai.pages-prune-plan/1',
    project: PROJECT,
    production_branch: PRODUCTION_BRANCH,
    production_deployments_listed: all.length,
    keep: {
      current_production: row(current),
      newest_successful: row(newestSuccess),
      same_deployment: current.id === newestSuccess.id,
      not_older_than_kept: keptNotOlder.map(row),
      has_alias: keptAliased.map(row),
    },
    superseded_before: new Date(cutoff).toISOString(),
    superseded_count: superseded.length,
    max_delete: maxDelete,
    selected_count: selected.length,
    left_for_later_runs: superseded.length - selected.length,
    selected: selected.map(row),
    // Full ids stay out of the printed report. The delete loop needs them.
    _selectedIds: selected.map((d) => d.id),
    _protectedIds: [current.id, newestSuccess.id, ...keptNotOlder.map((d) => d.id), ...keptAliased.map((d) => d.id)],
    _currentId: current.id,
  };
}

/** One bounded Cloudflare call. Returns status and parsed JSON (or null). Never returns raw text. */
async function call({ method, url, token, fetcher }) {
  let response;
  try {
    response = await fetcher(url, {
      method,
      headers: { authorization: 'Bearer ' + token, accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { status: 0, doc: null };
  }
  let doc = null;
  try {
    const reader = response.body?.getReader();
    if (reader) {
      const parts = [];
      let n = 0;
      try {
        while (true) {
          const r = await reader.read();
          if (r.done) break;
          n += r.value.length;
          if (n > BODY_LIMIT) { await reader.cancel(); return { status: response.status, doc: null, tooLarge: true }; }
          parts.push(r.value);
        }
      } finally {
        reader.releaseLock();
      }
      doc = object(JSON.parse(Buffer.concat(parts.map((x) => Buffer.from(x))).toString('utf8')));
    }
  } catch {
    doc = null;
  }
  return { status: response.status, doc };
}

function credentials({ accountId, token }) {
  if (!accountIdOk(accountId) || typeof token !== 'string' || token.length < 12) refuse('CF_CREDENTIALS_REQUIRED');
  return API + '/accounts/' + accountId + '/pages/projects/' + PROJECT;
}

export async function readProject({ accountId, token, fetcher = fetch }) {
  const base = credentials({ accountId, token });
  const r = await call({ method: 'GET', url: base, token, fetcher });
  if (r.status !== 200) refuse('CF_PROJECT_READ_HTTP_' + r.status);
  if (r.doc?.success !== true || !object(r.doc.result)) refuse('CF_PROJECT_READ_UNCONFIRMED');
  return r.doc.result;
}

/**
 * Every production-environment deployment, all pages.
 * A page that cannot be read stops the run. It is never skipped and the rest is never guessed.
 * Cloudflare's own total is returned beside the rows so a reader can compare the two.
 */
export async function listProductionDeployments({ accountId, token, fetcher = fetch, maxPages = MAX_PAGES }) {
  const base = credentials({ accountId, token });
  const seen = new Map();
  let reportedTotal = null;
  let pages = 0;
  for (let page = 1; ; page++) {
    if (page > maxPages) refuse('CF_LIST_PAGE_LIMIT');
    const r = await call({ method: 'GET', url: base + '/deployments?env=production&per_page=' + PER_PAGE + '&page=' + page, token, fetcher });
    if (r.status !== 200) refuse('CF_LIST_HTTP_' + r.status);
    if (r.doc?.success !== true || !Array.isArray(r.doc.result)) refuse('CF_LIST_UNCONFIRMED');
    pages = page;
    const rows = r.doc.result;
    if (rows.length === 0) break;
    let added = 0;
    for (const d of rows) {
      if (!object(d) || typeof d.id !== 'string') refuse('CF_LIST_UNCONFIRMED');
      if (!seen.has(d.id)) added++;
      seen.set(d.id, d);
    }
    // A full page of rows already seen means `page` is being ignored. Stop; do not loop.
    if (added === 0) refuse('CF_LIST_NOT_PAGINATING');
    const info = object(r.doc.result_info);
    const whole = (v) => (Number.isInteger(v) && v >= 0 ? v : null);
    const totalPages = whole(info?.total_pages);
    const totalCount = whole(info?.total_count);
    const perPage = whole(info?.per_page);
    if (page === 1) reportedTotal = totalCount;
    if (totalPages !== null && totalPages > 0) { if (page >= totalPages) break; continue; }
    if (totalCount !== null && perPage !== null && perPage > 0) { if (page * perPage >= totalCount) break; continue; }
    // No page count given: keep reading until an empty page. A short page is not trusted as the last.
  }
  return { deployments: [...seen.values()], pages, reported_total: reportedTotal };
}

/** One delete. No `force`. Returns a small, printable result. */
export async function deleteDeployment({ accountId, token, id, fetcher = fetch }) {
  const base = credentials({ accountId, token });
  if (!deploymentIdOk(id)) refuse('PRUNE_UNEXPECTED_DEPLOYMENT_SHAPE');
  const r = await call({ method: 'DELETE', url: base + '/deployments/' + id, token, fetcher });
  if (r.status === 200 && r.doc?.success === true) return { ok: true, status: 200 };
  const first = Array.isArray(r.doc?.errors) ? object(r.doc.errors[0]) : null;
  const code = Number.isInteger(first?.code) ? first.code : null;
  // Cloudflare's own words, cut short and reduced to plain characters. Never the response body.
  const message = typeof first?.message === 'string' ? first.message.replace(/[^\x20-\x7e]/g, ' ').slice(0, 160) : null;
  return { ok: false, status: r.status, code, message };
}

/** Delete mode is for one place only. This is a guard against a slip, not a security boundary. */
export function deleteAllowedHere(env) {
  return env?.GITHUB_ACTIONS === 'true'
    && env.GITHUB_EVENT_NAME === 'workflow_dispatch'
    && env.GITHUB_REF === 'refs/heads/' + PRODUCTION_BRANCH
    && env.GITHUB_REPOSITORY === REPOSITORY;
}

const printable = (plan) => Object.fromEntries(Object.entries(plan).filter(([k]) => !k.startsWith('_')));

/**
 * The whole run. Returns { exitCode, report }.
 * Every throw happens before the first delete. Once deleting starts, this function only returns,
 * so the report always says what was really deleted.
 */
export async function prune({
  accountId, token,
  dryRun = true, confirmKeep = '', maxDelete = DEFAULT_MAX_DELETE,
  env = {}, fetcher = fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  planner = planPrune, // replaced only by the tests, to prove the last check below holds without it
}) {
  const project = await readProject({ accountId, token, fetcher });
  const listing = await listProductionDeployments({ accountId, token, fetcher });
  const plan = planner({ project, deployments: listing.deployments, maxDelete });
  const never = neverDelete({ project, deployments: listing.deployments });
  const report = {
    ...printable(plan),
    listing_pages: listing.pages,
    listing_reported_total: listing.reported_total,
    listing_matches_reported_total: listing.reported_total === null ? null : listing.reported_total === plan.production_deployments_listed,
    mode: 'dry-run',
    deleted: [],
    failed: [],
    not_attempted: 0,
    outcome_unknown: 0,
    stopped_early: null,
    deployments_created: 0,
    settings_changed: 0,
  };
  if (dryRun !== false) return { exitCode: 0, report };

  // From here on the caller asked to delete. Each refusal below leaves everything in place.
  const refused = (code) => { report.mode = 'refused'; report.refusal = code; return { exitCode: 2, report }; };
  const named = typeof confirmKeep === 'string' ? confirmKeep.trim().toLowerCase() : '';
  if (!deleteAllowedHere(env)) return refused('PRUNE_DELETE_ONLY_FROM_MASTER_DISPATCH');
  if (named !== plan.keep.current_production.id && named !== plan._currentId.toLowerCase()) return refused('PRUNE_CONFIRM_KEEP_MISMATCH');

  // Last check, independent of the plan: a kept deployment must not be in the delete list.
  const protectedIds = new Set([...plan._protectedIds, ...never]);
  if (plan._selectedIds.some((id) => protectedIds.has(id))) return refused('PRUNE_KEPT_DEPLOYMENT_IN_DELETE_LIST');
  // Read the project once more. If production moved onto something we planned to delete, stop.
  const again = object((await readProject({ accountId, token, fetcher })).canonical_deployment);
  if (!again || !deploymentIdOk(again.id)) refuse('PRUNE_NO_CURRENT_PRODUCTION_DEPLOYMENT');
  protectedIds.add(again.id);
  if (plan._selectedIds.includes(again.id)) return refused('PRUNE_PRODUCTION_MOVED_INTO_DELETE_SET');

  report.mode = 'delete';
  let attempted = 0;
  try {
    for (const [i, id] of plan._selectedIds.entries()) {
      if (protectedIds.has(id)) { report.stopped_early = 'internal guard: a kept deployment was in the delete list'; break; }
      attempted++;
      const result = await deleteDeployment({ accountId, token, id, fetcher });
      const line = plan.selected[i];
      if (result.ok) {
        report.deleted.push(line);
      } else {
        report.failed.push({ ...line, http: result.status, code: result.code, message: result.message });
        if (result.status === 401 || result.status === 403) { report.stopped_early = 'the token may not delete (HTTP ' + result.status + ')'; break; }
        if (result.status === 429) { report.stopped_early = 'rate limited (HTTP 429)'; break; }
        if (report.failed.length >= MAX_FAILURES) { report.stopped_early = MAX_FAILURES + ' deletes failed'; break; }
      }
      await sleep(DELETE_SPACING_MS);
    }
  } catch {
    // If a delete was in flight, it is counted under outcome_unknown below, not as deleted.
    report.stopped_early = 'unexpected error after ' + attempted + ' attempt(s)';
  }
  report.not_attempted = plan._selectedIds.length - attempted;
  report.outcome_unknown = attempted - report.deleted.length - report.failed.length;
  const clean = report.failed.length === 0 && report.stopped_early === null;
  return { exitCode: clean ? 0 : 1, report };
}

/** Markdown for the run summary. Counts come from the listing just read; none is typed. */
export function renderSummary(report) {
  const k = report.keep;
  const title = { 'dry-run': 'DRY RUN. Nothing was deleted.', refused: 'REFUSED. Nothing was deleted.', delete: 'DELETE RUN.' }[report.mode];
  const out = ['## Pages deployment prune: ' + title, ''];
  if (report.refusal === 'PRUNE_CONFIRM_KEEP_MISMATCH') out.push('Delete was asked for, but `confirm_keep` did not name the current production deployment `' + k.current_production.id + '`.', '');
  if (report.refusal === 'PRUNE_DELETE_ONLY_FROM_MASTER_DISPATCH') out.push('Delete runs only as a workflow_dispatch of ' + REPOSITORY + ' on master.', '');
  if (report.refusal === 'PRUNE_PRODUCTION_MOVED_INTO_DELETE_SET') out.push('Production moved onto a deployment this run had planned to delete. Run a new dry run.', '');
  if (report.refusal === 'PRUNE_KEPT_DEPLOYMENT_IN_DELETE_LIST') out.push('A deployment that must be kept was in the delete list. This is a fault in the tool. Do not retry; read the plan below.', '');
  out.push(
    '- Project `' + report.project + '`, production branch `' + report.production_branch + '`.',
    '- Production deployments listed: ' + report.production_deployments_listed + ' (' + report.listing_pages + ' page(s)).'
      + (report.listing_reported_total === null ? ' Cloudflare gave no total to compare with.'
        : report.listing_matches_reported_total ? ' Cloudflare\'s own total agrees.'
          : ' Cloudflare\'s own total says ' + report.listing_reported_total + '. The two differ: read the counts here as what was listed, not as the whole.'),
    '- Kept, current production deployment: `' + k.current_production.id + '`, created ' + k.current_production.created_on + '.',
    '- Kept, newest successful production deployment: `' + k.newest_successful.id + '`' + (k.same_deployment ? ' (the same one).' : ', created ' + k.newest_successful.created_on + '.'),
    '- Kept because not older than those: ' + k.not_older_than_kept.length + '. Kept because an alias points at it: ' + k.has_alias.length + '.',
    '- Superseded (created before ' + report.superseded_before + '): ' + report.superseded_count + '.',
    '- Preview-environment deployments: not listed, not touched.',
  );
  if (report.mode === 'delete') {
    out.push('- Deleted: ' + report.deleted.length + '. Failed: ' + report.failed.length + '. Not attempted: ' + report.not_attempted + (report.outcome_unknown ? '. Outcome unknown: ' + report.outcome_unknown : '') + '. Left for later runs: ' + report.left_for_later_runs + '.');
    if (report.stopped_early) out.push('- Stopped early: ' + report.stopped_early + '.');
  } else {
    out.push('- A delete run now would remove ' + report.selected_count + ' (max_delete ' + report.max_delete + ') and leave ' + report.left_for_later_runs + ' for later runs.');
    if (report.mode === 'dry-run' && report.selected_count > 0) out.push('', 'To delete: dispatch again on master with `dry_run` unticked and `confirm_keep` = `' + k.current_production.id + '`.');
  }
  const table = (heading, rows, extra) => {
    if (!rows.length) return;
    out.push('', '### ' + heading, '', '| id | created | last stage |' + (extra ? ' result |' : ''), '|---|---|---|' + (extra ? '---|' : ''));
    for (const r of rows.slice(0, 1000)) out.push('| `' + r.id + '` | ' + r.created_on + ' | ' + r.stage + ' |' + (extra ? ' ' + extra(r) + ' |' : ''));
    if (rows.length > 1000) out.push('', 'and ' + (rows.length - 1000) + ' more; the full list is in the job log.');
  };
  if (report.mode === 'delete') {
    table('Deleted', report.deleted);
    table('Failed', report.failed, (r) => 'HTTP ' + r.http + (r.code ? ', code ' + r.code : '') + (r.message ? ', ' + r.message.replace(/\|/g, '/') : ''));
  } else {
    table('Would delete', report.selected);
  }
  table('Kept because not older than the kept deployment', k.not_older_than_kept);
  table('Kept because an alias points at it', k.has_alias);
  return out.join('\n') + '\n';
}

/** Read the run's options from the environment. Anything but the exact word "false" is a dry run. */
export function optionsFromEnv(env) {
  const rawMax = env.PRUNE_MAX_DELETE || String(DEFAULT_MAX_DELETE);
  if (!/^\d{1,4}$/.test(rawMax)) refuse('PRUNE_BAD_MAX_DELETE');
  return {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    token: env.CLOUDFLARE_API_TOKEN,
    dryRun: env.PRUNE_DRY_RUN !== 'false',
    confirmKeep: env.PRUNE_CONFIRM_KEEP ?? '',
    maxDelete: Number(rawMax),
    env,
  };
}

async function main() {
  const env = process.env;
  const stop = (error) => {
    // Print the code only. An unexpected error's message could carry a URL, so it is not printed.
    const code = error instanceof PruneError ? error.code : 'UNEXPECTED_FAILURE';
    console.error(JSON.stringify({ state: 'PRUNE_STOPPED_BEFORE_ANY_DELETE', reason: code, deleted: 0, deployments_created: 0, settings_changed: 0 }));
    if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, '## Pages deployment prune: STOPPED. Nothing was deleted.\n\nReason: `' + code + '`\n');
    process.exitCode = error instanceof PruneError ? error.exitCode : 2;
  };
  let result;
  try {
    result = await prune(optionsFromEnv(env));
  } catch (error) {
    // prune() throws only before its first delete, so "nothing was deleted" is true here.
    return stop(error);
  }
  // The record of what happened is printed first, so a fault in the summary cannot hide it.
  console.log(JSON.stringify(result.report));
  process.exitCode = result.exitCode;
  const summary = renderSummary(result.report);
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    // Reached only if printing failed after prune() returned. The JSON line above is the record.
    console.error(JSON.stringify({ state: 'PRUNE_REPORT_FAILED', reason: 'UNEXPECTED_FAILURE', note: 'read the JSON line printed before this one for what was deleted' }));
    process.exitCode = 2;
  });
}
