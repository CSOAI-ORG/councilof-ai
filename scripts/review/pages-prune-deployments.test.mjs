// Tests for the Pages deployment prune tool. node:test, no network, no credential.
//
// The fake Cloudflare below follows Cloudflare's published API schema (cloudflare/api-schemas,
// openapi.json at f2dc82a2, read 13 Oct 2026): pages_project, pages_deployment and
// pages_api-response-collection, plus the `env`, `page` and `per_page` query parameters.
// It is NOT a recording of this account's responses. The first dry run on master is the
// comparison with the real API; until then these tests prove the tool's logic, not the API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  planPrune, prune, neverDelete, listProductionDeployments, renderSummary, optionsFromEnv, deleteAllowedHere, parseTime,
  PruneError, PER_PAGE, DELETE_SPACING_MS, MAX_FAILURES,
} from './pages-prune-deployments.mjs';

const ACCOUNT = 'a'.repeat(32);
const TOKEN = 'fixture-token-never-printed';
const PLAIN_VALUE = 'fixture-plain-value-never-printed';
const COMMIT_MESSAGE = 'fixture commit message never printed';
const ROOT = '/client/v4/accounts/' + ACCOUNT + '/pages/projects/councilof-ai';
const MASTER_DISPATCH = { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/master', GITHUB_REPOSITORY: 'CSOAI-ORG/councilof-ai' };

// Minutes after a fixed instant, written the way Cloudflare writes them (microseconds, Z).
const at = (minutes) => new Date(Date.UTC(2026, 9, 1) + minutes * 60_000).toISOString().replace('.000Z', '.000456Z');

let serial = 0;
/** One deployment row with every field the schema marks required. */
function deployment(minutes, over = {}) {
  serial++;
  const short = serial.toString(16).padStart(8, '0');
  const { status = 'success', stage = 'deploy', ...rest } = over;
  return {
    id: short + '-0000-4000-8000-' + short.padStart(12, '0'),
    short_id: short,
    project_id: 'f'.repeat(8) + '-1111-4111-8111-' + 'f'.repeat(12),
    project_name: 'councilof-ai',
    environment: 'production',
    url: 'https://' + short + '.councilof-ai.pages.dev',
    created_on: at(minutes),
    modified_on: at(minutes + 1),
    latest_stage: { name: stage, status, started_on: at(minutes), ended_on: at(minutes + 1) },
    stages: [{ name: 'queued', status: 'success', started_on: at(minutes), ended_on: at(minutes) }, { name: stage, status, started_on: at(minutes), ended_on: at(minutes + 1) }],
    deployment_trigger: { type: 'ad_hoc', metadata: { branch: 'master', commit_hash: '0'.repeat(40), commit_message: COMMIT_MESSAGE, commit_dirty: true } },
    build_config: { build_command: null, destination_dir: null, root_dir: null },
    source: null,
    env_vars: { BOARD_SIGN_KEY_PKCS8_B64: { type: 'secret_text', value: '' }, FLAG: { type: 'plain_text', value: PLAIN_VALUE } },
    aliases: null,
    is_skipped: false,
    ...rest,
  };
}
const projectFor = (canonical, over = {}) => ({ id: 'p', name: 'councilof-ai', production_branch: 'master', canonical_deployment: canonical, latest_deployment: canonical, ...over });
/** `count` superseded deployments, oldest first, then one current deployment. */
function estate(count) {
  const old = Array.from({ length: count }, (_, i) => deployment(i));
  const current = deployment(count + 10);
  return { old, current, all: [...old, current] };
}

/** An in-memory stand-in for the three endpoints. Records every call it receives. */
function cloudflare(rows, options = {}) {
  const state = { rows: [...rows], calls: [], deleted: [], projectReads: 0 };
  const newestFirst = () => [...state.rows].sort((a, b) => parseTime(b.created_on) - parseTime(a.created_on));
  const canonical = () => options.canonical ?? newestFirst().find((d) => d.environment === 'production');
  const ok = (result, extra = {}) => Response.json({ success: true, errors: [], messages: [], result, ...extra });
  const fail = (status, code, message) => Response.json({ success: false, errors: [{ code, message }], messages: [], result: null }, { status });
  const fetcher = async (url, init) => {
    const u = new URL(url);
    state.calls.push({ method: init.method, path: u.pathname, search: u.search });
    assert.equal(u.origin, 'https://api.cloudflare.com');
    assert.equal(init.headers.authorization, 'Bearer ' + TOKEN);
    assert.equal(init.redirect, 'error');
    if (init.method === 'GET' && u.pathname === ROOT) {
      state.projectReads++;
      const moved = state.projectReads > 1 && options.canonicalOnSecondRead;
      return ok(projectFor(moved || canonical(), options.project));
    }
    if (init.method === 'GET' && u.pathname === ROOT + '/deployments') {
      const page = Number(u.searchParams.get('page'));
      const perPage = Number(u.searchParams.get('per_page'));
      if (options.failPage === page) return fail(500, 10000, 'upstream fault');
      const env = u.searchParams.get('env');
      const matching = newestFirst().filter((d) => options.ignoreEnvFilter || d.environment === env);
      const slice = options.ignorePage ? matching.slice(0, perPage) : matching.slice((page - 1) * perPage, page * perPage);
      const info = { page, per_page: perPage, count: slice.length, total_count: options.reportedTotal ?? matching.length, total_pages: Math.ceil(matching.length / perPage) };
      if (options.resultInfo === 'none') return ok(slice);
      if (options.resultInfo === 'count-only') return ok(slice, { result_info: { page, per_page: perPage, count: slice.length, total_count: info.total_count } });
      return ok(slice, { result_info: info });
    }
    if (init.method === 'DELETE' && u.pathname.startsWith(ROOT + '/deployments/')) {
      const id = u.pathname.slice((ROOT + '/deployments/').length);
      if (options.deleteThrows) throw new Error('socket closed carrying ' + TOKEN);
      const planned = options.deleteFails?.[id] ?? options.deleteFailsAll;
      if (planned) return fail(planned.status, planned.code, planned.message);
      state.rows = state.rows.filter((d) => d.id !== id);
      state.deleted.push(id);
      return ok(null);
    }
    return fail(404, 7003, 'No route for the URI');
  };
  const run = (extra = {}) => prune({ accountId: ACCOUNT, token: TOKEN, fetcher, sleep: async (ms) => { state.slept = (state.slept ?? 0) + ms; }, ...extra });
  const deletes = () => state.calls.filter((c) => c.method === 'DELETE');
  return { state, fetcher, run, deletes };
}
const rejectsWith = (promise, code) => assert.rejects(promise, (e) => e instanceof PruneError && e.code === code && e.exitCode === 2);
const refusesWith = (fn, code) => assert.throws(fn, (e) => e instanceof PruneError && e.code === code);

// ── What is kept and what is superseded (pure) ──────────────────────────────────────────────

test('the current production deployment is kept; only older ones are superseded', () => {
  const { old, current, all } = estate(3);
  const plan = planPrune({ project: projectFor(current), deployments: all });
  assert.equal(plan.keep.current_production.id, current.short_id);
  assert.equal(plan.keep.same_deployment, true);
  assert.deepEqual(plan.keep.not_older_than_kept, [], 'the kept deployment is listed once, under its own heading');
  assert.equal(plan.superseded_count, 3);
  assert.deepEqual(plan._selectedIds, [old[2].id, old[1].id, old[0].id], 'newest first');
  assert.ok(!plan._selectedIds.includes(current.id));
});

test('anything newer than the current production deployment is kept, whatever its state', () => {
  const { current, all } = estate(2);
  const building = deployment(500, { status: 'active', stage: 'build' });
  const failed = deployment(400, { status: 'failure' });
  const plan = planPrune({ project: projectFor(current), deployments: [...all, building, failed] });
  assert.equal(plan.superseded_count, 2);
  assert.deepEqual(plan.keep.not_older_than_kept.map((r) => r.id).sort(), [building.short_id, failed.short_id].sort());
  assert.ok(!plan._selectedIds.includes(building.id) && !plan._selectedIds.includes(failed.id));
});

test('the newest successful deployment is kept when the current one is a newer failure', () => {
  const older = deployment(1);
  const good = deployment(100);
  const between = deployment(150, { status: 'failure' });
  const brokenCurrent = deployment(200, { status: 'failure' });
  const plan = planPrune({ project: projectFor(brokenCurrent), deployments: [older, good, between, brokenCurrent] });
  assert.equal(plan.keep.current_production.id, brokenCurrent.short_id);
  assert.equal(plan.keep.newest_successful.id, good.short_id);
  assert.equal(plan.keep.same_deployment, false);
  assert.deepEqual(plan.keep.not_older_than_kept.map((r) => r.id), [between.short_id], 'neither kept deployment is listed twice');
  assert.deepEqual(plan._selectedIds, [older.id], 'nothing at or after the newest success is touched');
});

test('after a dashboard rollback the older current deployment sets the line; newer ones stay', () => {
  const ancient = deployment(1);
  const rolledBackTo = deployment(100);
  const newer = deployment(200);
  const newest = deployment(300);
  const plan = planPrune({ project: projectFor(rolledBackTo), deployments: [ancient, rolledBackTo, newer, newest] });
  assert.equal(plan.keep.current_production.id, rolledBackTo.short_id);
  assert.equal(plan.keep.newest_successful.id, newest.short_id);
  assert.deepEqual(plan._selectedIds, [ancient.id]);
});

test('a deployment an alias points at is kept', () => {
  const { old, current, all } = estate(3);
  old[1].aliases = ['https://master.councilof-ai.pages.dev'];
  const plan = planPrune({ project: projectFor(current), deployments: all });
  assert.deepEqual(plan.keep.has_alias.map((r) => r.id), [old[1].short_id]);
  assert.deepEqual(plan._selectedIds, [old[2].id, old[0].id]);
});

test('a deployment created at the same instant as the kept one is not superseded', () => {
  const { current, all } = estate(1);
  const twin = deployment(0, { created_on: current.created_on });
  const plan = planPrune({ project: projectFor(current), deployments: [...all, twin] });
  assert.ok(!plan._selectedIds.includes(twin.id));
});

test('max_delete caps one run and the rest is counted, not hidden', () => {
  const { old, current, all } = estate(7);
  const plan = planPrune({ project: projectFor(current), deployments: all, maxDelete: 3 });
  assert.equal(plan.superseded_count, 7);
  assert.equal(plan.selected_count, 3);
  assert.equal(plan.left_for_later_runs, 4);
  assert.deepEqual(plan._selectedIds, [old[6].id, old[5].id, old[4].id]);
});

test('a timestamp with no zone is read as UTC, and junk is not a time', () => {
  assert.equal(parseTime('2026-10-01T00:00:00.000456'), parseTime('2026-10-01T00:00:00.000456Z'));
  assert.equal(parseTime('2026-10-01T01:00:00+01:00'), parseTime('2026-10-01T00:00:00Z'));
  for (const junk of [undefined, null, 5, '', 'yesterday', '2026-10-01']) assert.ok(Number.isNaN(parseTime(junk)));
});

test('the plan is refused, never guessed, when anything is not as expected', () => {
  const fresh = () => estate(2);
  let e = fresh();
  refusesWith(() => planPrune({ project: projectFor(e.current, { name: 'csoai-site' }), deployments: e.all }), 'PRUNE_WRONG_PROJECT');
  refusesWith(() => planPrune({ project: projectFor(e.current, { production_branch: 'main' }), deployments: e.all }), 'PRUNE_PRODUCTION_BRANCH_DRIFT');
  refusesWith(() => planPrune({ project: projectFor(null), deployments: e.all }), 'PRUNE_NO_CURRENT_PRODUCTION_DEPLOYMENT');
  refusesWith(() => planPrune({ project: projectFor({ ...e.current, environment: 'preview' }), deployments: e.all }), 'PRUNE_CURRENT_DEPLOYMENT_NOT_PRODUCTION');
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: e.old }), 'PRUNE_CURRENT_DEPLOYMENT_NOT_IN_LISTING');
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: [] }), 'PRUNE_EMPTY_LISTING');
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: [...e.all, deployment(1, { environment: 'preview' })] }), 'PRUNE_UNEXPECTED_ENVIRONMENT');
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: [...e.all, deployment(1, { project_name: 'csoai-site' })] }), 'PRUNE_WRONG_PROJECT');
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: [...e.all, deployment(1, { id: '../../../secrets' })] }), 'PRUNE_UNEXPECTED_DEPLOYMENT_SHAPE');
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: [...e.all, deployment(1, { id: 'abcdef12?force=true' })] }), 'PRUNE_UNEXPECTED_DEPLOYMENT_SHAPE');
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: [...e.all, deployment(1, { created_on: undefined })] }), 'PRUNE_UNEXPECTED_DEPLOYMENT_SHAPE');
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: [...e.all, deployment(1, { aliases: 'https://x.pages.dev' })] }), 'PRUNE_UNEXPECTED_DEPLOYMENT_SHAPE');
  for (const bad of [0, -1, 1001, 2.5, '5', NaN]) refusesWith(() => planPrune({ project: projectFor(e.current), deployments: e.all, maxDelete: bad }), 'PRUNE_BAD_MAX_DELETE');
  e = fresh();
  for (const d of e.all) d.latest_stage.status = 'failure';
  refusesWith(() => planPrune({ project: projectFor(e.current), deployments: e.all }), 'PRUNE_NO_SUCCESSFUL_DEPLOYMENT');
});

// ── The dry run ─────────────────────────────────────────────────────────────────────────────

test('a dry run reads a page of 25 and a second page, sends GET only and deletes nothing', async () => {
  const { current, all } = estate(27); // 28 production deployments: 25 + 3
  const preview = deployment(999, { environment: 'preview', aliases: ['https://production.councilof-ai.pages.dev'] });
  const cf = cloudflare([...all, preview]);
  const { exitCode, report } = await cf.run();
  assert.equal(exitCode, 0);
  assert.equal(report.mode, 'dry-run');
  assert.equal(report.production_deployments_listed, 28);
  assert.equal(report.listing_pages, 2);
  assert.equal(report.listing_matches_reported_total, true);
  assert.equal(report.superseded_count, 27);
  assert.equal(report.keep.current_production.id, current.short_id);
  assert.deepEqual(report.deleted, []);
  assert.deepEqual(cf.state.calls.map((c) => c.method + ' ' + c.path.slice(ROOT.length) + c.search), [
    'GET ',
    'GET /deployments?env=production&per_page=' + PER_PAGE + '&page=1',
    'GET /deployments?env=production&per_page=' + PER_PAGE + '&page=2',
  ]);
  assert.equal(cf.state.rows.length, 29, 'every deployment, the preview one included, is still there');
});

test('dry run is the default: only the boolean false asks for a delete', async () => {
  for (const dryRun of [undefined, true, 'false', 0, null, 'no']) {
    const cf = cloudflare(estate(3).all);
    const { report } = await cf.run({ dryRun, env: MASTER_DISPATCH, confirmKeep: 'anything' });
    assert.equal(report.mode, 'dry-run');
    assert.equal(cf.deletes().length, 0);
  }
});

test('the environment asks for a delete only with the exact word false', () => {
  for (const word of [undefined, '', 'true', 'False', 'FALSE', '0', 'no', ' false']) assert.equal(optionsFromEnv({ PRUNE_DRY_RUN: word }).dryRun, true);
  assert.equal(optionsFromEnv({ PRUNE_DRY_RUN: 'false' }).dryRun, false);
  assert.equal(optionsFromEnv({}).maxDelete, 200);
  assert.equal(optionsFromEnv({ PRUNE_MAX_DELETE: '' }).maxDelete, 200);
  assert.equal(optionsFromEnv({ PRUNE_MAX_DELETE: '7' }).maxDelete, 7);
  for (const bad of ['-1', '1e3', '12345', 'all', '5; rm -rf /']) refusesWith(() => optionsFromEnv({ PRUNE_MAX_DELETE: bad }), 'PRUNE_BAD_MAX_DELETE');
});

// ── The listing ─────────────────────────────────────────────────────────────────────────────

test('with no page count from Cloudflare the listing reads on until an empty page', async () => {
  const cf = cloudflare(estate(27).all, { resultInfo: 'none' });
  const listing = await listProductionDeployments({ accountId: ACCOUNT, token: TOKEN, fetcher: cf.fetcher });
  assert.equal(listing.deployments.length, 28);
  assert.equal(listing.pages, 3);
  assert.equal(listing.reported_total, null);
});

test('with a total but no page count the listing stops where the total says', async () => {
  const cf = cloudflare(estate(27).all, { resultInfo: 'count-only' });
  const listing = await listProductionDeployments({ accountId: ACCOUNT, token: TOKEN, fetcher: cf.fetcher });
  assert.equal(listing.deployments.length, 28);
  assert.equal(listing.pages, 2);
});

test('a page that cannot be read stops the run before any delete', async () => {
  const { current, all } = estate(30);
  const cf = cloudflare(all, { failPage: 2 });
  await rejectsWith(cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id }), 'CF_LIST_HTTP_500');
  assert.equal(cf.deletes().length, 0);
});

test('an API that ignores the page number is caught, not looped on', async () => {
  const cf = cloudflare(estate(60).all, { ignorePage: true, resultInfo: 'none' });
  await rejectsWith(cf.run(), 'CF_LIST_NOT_PAGINATING');
  assert.equal(cf.state.calls.length, 3, 'project, page 1, page 2');
});

test('a total that disagrees with the rows read is shown, not hidden', async () => {
  const cf = cloudflare(estate(3).all, { reportedTotal: 40 });
  const { report } = await cf.run();
  assert.equal(report.production_deployments_listed, 4);
  assert.equal(report.listing_reported_total, 40);
  assert.equal(report.listing_matches_reported_total, false);
  assert.match(renderSummary(report), /own total says 40\. The two differ/);
});

test('a preview deployment in the production listing stops everything', async () => {
  const { current, all } = estate(3);
  const cf = cloudflare([...all, deployment(1, { environment: 'preview' })], { ignoreEnvFilter: true });
  await rejectsWith(cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id }), 'PRUNE_UNEXPECTED_ENVIRONMENT');
  assert.equal(cf.deletes().length, 0);
});

test('a wrong account id or a missing token sends no request at all', async () => {
  const never = () => { throw new Error('the network must not be reached'); };
  for (const [accountId, token] of [['../x', TOKEN], [undefined, TOKEN], [ACCOUNT, undefined], [ACCOUNT, 'short']]) {
    await rejectsWith(prune({ accountId, token, fetcher: never }), 'CF_CREDENTIALS_REQUIRED');
  }
});

// ── Deleting ────────────────────────────────────────────────────────────────────────────────

test('a confirmed delete on a master dispatch removes the superseded ones and nothing else', async () => {
  const { old, current, all } = estate(4);
  const newerFailure = deployment(900, { status: 'failure' });
  const aliased = deployment(2, { aliases: ['https://old-alias.councilof-ai.pages.dev'] });
  const preview = deployment(3, { environment: 'preview' });
  const cf = cloudflare([...all, newerFailure, aliased, preview], { canonical: current });
  const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id.toUpperCase() + ' ' });
  assert.equal(exitCode, 0);
  assert.equal(report.mode, 'delete');
  assert.deepEqual(cf.state.deleted.sort(), old.map((d) => d.id).sort());
  assert.deepEqual(report.deleted.map((r) => r.id).sort(), old.map((d) => d.short_id).sort());
  assert.equal(report.not_attempted, 0);
  assert.equal(report.outcome_unknown, 0);
  for (const kept of [current, newerFailure, aliased, preview]) assert.ok(cf.state.rows.some((d) => d.id === kept.id), 'kept');
  for (const call of cf.deletes()) assert.equal(call.search, '', 'no force, no query at all');
  assert.equal(cf.state.slept, 4 * DELETE_SPACING_MS, 'one pause after each delete');
  assert.equal(cf.state.projectReads, 2, 'the project is read again just before deleting');
});

test('the full deployment id is accepted as the confirmation too', async () => {
  const { current, all } = estate(2);
  const cf = cloudflare(all);
  const { report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.id });
  assert.equal(report.deleted.length, 2);
});

test('a delete with no confirmation, or the wrong one, deletes nothing', async () => {
  const { old, all } = estate(3);
  for (const confirmKeep of ['', '   ', undefined, old[2].short_id, 'councilof-ai', 'yes']) {
    const cf = cloudflare(all);
    const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep });
    assert.equal(exitCode, 2);
    assert.equal(report.mode, 'refused');
    assert.equal(report.refusal, 'PRUNE_CONFIRM_KEEP_MISMATCH');
    assert.equal(cf.deletes().length, 0);
    assert.match(renderSummary(report), /REFUSED\. Nothing was deleted\./);
  }
});

test('a delete is refused anywhere but a workflow_dispatch of this repository on master', async () => {
  const { current, all } = estate(3);
  const elsewhere = [
    {},
    { ...MASTER_DISPATCH, GITHUB_ACTIONS: undefined },
    { ...MASTER_DISPATCH, GITHUB_REF: 'refs/heads/lane/some-branch' },
    { ...MASTER_DISPATCH, GITHUB_REF: 'refs/tags/master' },
    { ...MASTER_DISPATCH, GITHUB_EVENT_NAME: 'pull_request' },
    { ...MASTER_DISPATCH, GITHUB_EVENT_NAME: 'schedule' },
    { ...MASTER_DISPATCH, GITHUB_REPOSITORY: 'someone/fork' },
  ];
  for (const env of elsewhere) {
    assert.equal(deleteAllowedHere(env), false);
    const cf = cloudflare(all);
    const { exitCode, report } = await cf.run({ dryRun: false, env, confirmKeep: current.short_id });
    assert.equal(exitCode, 2);
    assert.equal(report.refusal, 'PRUNE_DELETE_ONLY_FROM_MASTER_DISPATCH');
    assert.equal(cf.deletes().length, 0);
  }
  assert.equal(deleteAllowedHere(MASTER_DISPATCH), true);
});

test('a failed delete is reported and the run exits non-zero', async () => {
  const { old, current, all } = estate(3);
  const cf = cloudflare(all, { deleteFails: { [old[1].id]: { status: 400, code: 8000034, message: 'Cannot delete\nthis | deployment' } } });
  const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id });
  assert.equal(exitCode, 1);
  assert.deepEqual(report.deleted.map((r) => r.id).sort(), [old[0].short_id, old[2].short_id].sort());
  assert.deepEqual(report.failed.map((r) => [r.id, r.http, r.code, r.message]), [[old[1].short_id, 400, 8000034, 'Cannot delete this | deployment']]);
  const summary = renderSummary(report);
  assert.match(summary, /Deleted: 2\. Failed: 1\. Not attempted: 0\./);
  assert.match(summary, /HTTP 400, code 8000034, Cannot delete this \/ deployment/);
});

test('a token that may not delete stops the run at the first refusal', async () => {
  for (const status of [401, 403, 429]) {
    const { current, all } = estate(6);
    const cf = cloudflare(all, { deleteFailsAll: { status, code: 10000, message: 'Authentication error' } });
    const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id });
    assert.equal(exitCode, 1);
    assert.equal(cf.deletes().length, 1);
    assert.equal(report.deleted.length, 0);
    assert.equal(report.not_attempted, 5);
    assert.ok(report.stopped_early);
    assert.equal(cf.state.rows.length, 7);
  }
});

test('repeated failures stop the run instead of hammering the API', async () => {
  const { current, all } = estate(12);
  const cf = cloudflare(all, { deleteFailsAll: { status: 500, code: 10000, message: 'fault' } });
  const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id });
  assert.equal(exitCode, 1);
  assert.equal(cf.deletes().length, MAX_FAILURES);
  assert.equal(report.not_attempted, 12 - MAX_FAILURES);
});

test('a network fault during a delete is recorded as a failure and never as a deletion', async () => {
  const { current, all } = estate(2);
  const cf = cloudflare(all, { deleteThrows: true });
  const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id });
  assert.equal(exitCode, 1);
  assert.equal(report.deleted.length, 0);
  assert.deepEqual(report.failed.map((r) => r.http), [0, 0]);
  assert.ok(!JSON.stringify(report).includes(TOKEN));
});

test('a fault between deletes reports what was really deleted and exits non-zero', async () => {
  const { old, current, all } = estate(3);
  const cf = cloudflare(all);
  const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id, sleep: async () => { throw new Error('timer fault'); } });
  assert.equal(exitCode, 1);
  assert.deepEqual(report.deleted.map((r) => r.id), [old[2].short_id]);
  assert.deepEqual(cf.state.deleted, [old[2].id]);
  assert.equal(report.not_attempted, 2);
  assert.equal(report.outcome_unknown, 0);
  assert.match(report.stopped_early, /unexpected error after 1 attempt/);
});

test('if production moves onto a deployment in the delete list, nothing is deleted', async () => {
  const { old, current, all } = estate(3);
  const cf = cloudflare(all, { canonical: current, canonicalOnSecondRead: old[1] });
  const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id });
  assert.equal(exitCode, 2);
  assert.equal(report.refusal, 'PRUNE_PRODUCTION_MOVED_INTO_DELETE_SET');
  assert.equal(cf.deletes().length, 0);
});

test('the two deployments that must never go are worked out from the raw answers', () => {
  const older = deployment(1);
  const good = deployment(100);
  const brokenCurrent = deployment(200, { status: 'failure' });
  assert.deepEqual([...neverDelete({ project: projectFor(brokenCurrent), deployments: [older, good, brokenCurrent] })].sort(), [good.id, brokenCurrent.id].sort());
  assert.deepEqual([...neverDelete({ project: null, deployments: null })], []);
});

test('a faulty plan cannot get the current or the newest successful deployment deleted', async () => {
  const older = deployment(1);
  const good = deployment(100);
  const brokenCurrent = deployment(200, { status: 'failure' });
  for (const victim of [brokenCurrent, good]) {
    const cf = cloudflare([older, good, brokenCurrent], { canonical: brokenCurrent });
    // A planner with a bug: it forgets the kept deployment and schedules it for deletion.
    const planner = (input) => {
      const plan = planPrune(input);
      return { ...plan, _protectedIds: plan._protectedIds.filter((id) => id !== victim.id), _selectedIds: [victim.id, ...plan._selectedIds], selected: [{ id: victim.short_id, created_on: 'x', stage: 'x' }, ...plan.selected] };
    };
    const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: brokenCurrent.short_id, planner });
    assert.equal(exitCode, 2);
    assert.equal(report.refusal, 'PRUNE_KEPT_DEPLOYMENT_IN_DELETE_LIST');
    assert.equal(cf.deletes().length, 0);
    assert.equal(cf.state.rows.length, 3);
    assert.match(renderSummary(report), /fault in the tool/);
  }
});

test('a new deploy landing during the run changes nothing: only the planned old ones go', async () => {
  const { old, current, all } = estate(3);
  const landed = deployment(5000);
  const cf = cloudflare(all, { canonical: current, canonicalOnSecondRead: landed });
  const { exitCode, report } = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id });
  assert.equal(exitCode, 0);
  assert.deepEqual(cf.state.deleted.sort(), old.map((d) => d.id).sort());
  assert.ok(cf.state.rows.some((d) => d.id === current.id), 'the deployment named in confirm_keep is still there');
  assert.equal(report.deleted.length, 3);
});

test('max_delete holds in a real delete run and a second run takes the rest', async () => {
  const { current, all } = estate(5);
  const cf = cloudflare(all);
  const first = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id, maxDelete: 2 });
  assert.equal(first.report.deleted.length, 2);
  assert.equal(first.report.left_for_later_runs, 3);
  const second = await cf.run({ dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id, maxDelete: 1000 });
  assert.equal(second.report.deleted.length, 3);
  const third = await cf.run();
  assert.equal(third.report.superseded_count, 0);
  assert.equal(third.report.production_deployments_listed, 1);
  assert.deepEqual(cf.state.rows.map((d) => d.id), [current.id]);
});

// ── What is printed ─────────────────────────────────────────────────────────────────────────

test('the report and the summary carry ids, dates and stage states, and nothing else from the API', async () => {
  const { current, all } = estate(3);
  for (const run of [{}, { dryRun: false, env: MASTER_DISPATCH, confirmKeep: current.short_id }]) {
    const cf = cloudflare(all.map((d) => ({ ...d })), { deleteFails: { [all[0].id]: { status: 400, code: 1, message: 'no' } } });
    const { report } = await cf.run(run);
    const printed = JSON.stringify(report) + renderSummary(report);
    for (const secret of [TOKEN, ACCOUNT, PLAIN_VALUE, COMMIT_MESSAGE, 'BOARD_SIGN_KEY', 'env_vars', 'pages.dev', '-0000-4000-8000-', 'api.cloudflare.com']) {
      assert.ok(!printed.includes(secret), 'must not print: ' + secret);
    }
    assert.ok(Object.keys(report).every((k) => !k.startsWith('_')), 'full ids stay inside the run');
  }
});

test('the dry-run summary says how to delete and names the id to confirm with', async () => {
  const { current, all } = estate(2);
  const { report } = await cloudflare(all).run();
  const summary = renderSummary(report);
  assert.match(summary, /^## Pages deployment prune: DRY RUN\. Nothing was deleted\./);
  assert.ok(summary.includes('Kept, current production deployment: `' + current.short_id + '`'));
  assert.ok(summary.includes('`confirm_keep` = `' + current.short_id + '`'));
  assert.match(summary, /Superseded \(created before 2026-10-01T00:12:00\.000Z\): 2\./);
  assert.match(summary, /### Would delete/);
  assert.match(summary, /Preview-environment deployments: not listed, not touched\./);
});

test('run from the command line with no credential it stops with exit 2 and reaches no network', () => {
  const script = fileURLToPath(new URL('./pages-prune-deployments.mjs', import.meta.url));
  const base = { PATH: process.env.PATH ?? '' };
  const a = spawnSync(process.execPath, [script], { env: { ...base, PRUNE_DRY_RUN: 'false' }, encoding: 'utf8', timeout: 20_000 });
  assert.equal(a.status, 2);
  assert.match(a.stderr, /"state":"PRUNE_STOPPED_BEFORE_ANY_DELETE","reason":"CF_CREDENTIALS_REQUIRED","deleted":0/);
  const b = spawnSync(process.execPath, [script], { env: { ...base, PRUNE_MAX_DELETE: 'all' }, encoding: 'utf8', timeout: 20_000 });
  assert.equal(b.status, 2);
  assert.match(b.stderr, /"reason":"PRUNE_BAD_MAX_DELETE"/);
});

// ── The workflow file ───────────────────────────────────────────────────────────────────────

const workflowsDir = new URL('../../.github/workflows/', import.meta.url);
const workflow = readFileSync(new URL('pages-prune-deployments.yml', workflowsDir), 'utf8');
const code = workflow.split('\n').filter((line) => !/^\s*#/.test(line)).join('\n'); // comments are not behaviour

test('the workflow starts by hand only', () => {
  const on = code.slice(code.indexOf('\non:\n'), code.indexOf('\nconcurrency:'));
  assert.match(on, /^\non:\n  workflow_dispatch:\n    inputs:/);
  assert.doesNotMatch(on, /^  (push|pull_request|pull_request_target|schedule|workflow_run|workflow_call|repository_dispatch):/m);
});

test('dry_run is a boolean that defaults to true', () => {
  assert.match(code, /      dry_run:\n        description: [^\n]+\n        type: boolean\n        default: true\n/);
});

test('it has its own queue and can never displace a deploy', () => {
  assert.match(code, /^concurrency: \{ group: pages-prune-deployments, cancel-in-progress: false \}$/m);
  assert.doesNotMatch(code, /site-deploy/);
});

test('the master check and the tests run before the only step that holds the token', () => {
  const master = code.indexOf('- name: Master only');
  const tests = code.indexOf('run: node --test scripts/review/pages-prune-deployments.test.mjs');
  const firstSecret = code.indexOf('secrets.');
  assert.ok(master > 0 && tests > master && firstSecret > tests);
  assert.match(code.slice(master, tests), /if \[ "\$GITHUB_REF" != "refs\/heads\/master" \]; then[\s\S]+exit 1/);
  assert.equal(code.split('- name: ').filter((step) => step.includes('secrets.')).length, 1);
  assert.doesNotMatch(code, /continue-on-error|\|\| true/);
});

test('inputs reach the script through the environment, never through shell text', () => {
  const uses = code.split('\n').filter((line) => line.includes('${{'));
  for (const line of uses) assert.match(line, /^          [A-Z_]+: '\$\{\{ (secrets|inputs)\.[A-Za-z_]+ \}\}'$/, line);
  assert.equal(uses.length, 5);
});

test('the job installs and downloads nothing, and asks for no extra permission', () => {
  assert.doesNotMatch(code, /\b(npm|npx|pip|pip3|curl|wget|wrangler|apt-get)\b/);
  assert.deepEqual(code.match(/uses: \S+/g), ['uses: actions/checkout@v4', 'uses: actions/setup-node@v4']);
  assert.match(code, /^permissions:\n  contents: read\n\njobs:/m);
  assert.doesNotMatch(code, /id-token|contents: write|pull-requests|actions: write/);
  assert.match(code, /persist-credentials: false/);
});

test('the script never forces a delete and writes nowhere but Cloudflare deployments', () => {
  const script = readFileSync(new URL('./pages-prune-deployments.mjs', import.meta.url), 'utf8');
  const live = script.split('\n').filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line)).join('\n');
  assert.doesNotMatch(live, /force/i);
  assert.deepEqual([...new Set(live.match(/method: '[A-Z]+'/g))].sort(), ["method: 'DELETE'", "method: 'GET'"]);
  assert.doesNotMatch(live, /from '(?!node:)/, 'Node built-ins only');
});

// ── The workflow this change removes ────────────────────────────────────────────────────────

test('the one-click board-key overwrite is gone and no workflow writes a Pages secret', () => {
  assert.equal(existsSync(new URL('board-key-setup.yml', workflowsDir)), false);
  const files = readdirSync(workflowsDir).filter((name) => /\.ya?ml$/.test(name));
  assert.ok(files.length > 10, 'the workflow directory was read');
  for (const name of files) {
    const text = readFileSync(new URL(name, workflowsDir), 'utf8');
    assert.doesNotMatch(text, /\bsecret\s+(put|bulk)\b/, name + ' writes a secret');
    assert.doesNotMatch(text, /board-key-setup/, name + ' still names the removed workflow');
  }
});
