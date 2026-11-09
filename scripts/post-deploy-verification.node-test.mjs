import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/post-deploy-verify.yml', import.meta.url), 'utf8');
const marker = '          script: |\n';
const script = workflow.slice(workflow.lastIndexOf(marker) + marker.length)
  .split('\n').map(line => line.replace(/^            /, '')).join('\n');
const execute = new (Object.getPrototypeOf(async function () {}).constructor)('core', 'process', script);

const complete = {
  DEPLOY_SHA: 'a'.repeat(40),
  DEPLOY_RUN_URL: 'https://github.com/CSOAI-ORG/councilof-ai/actions/runs/123',
  PROBE_OUTCOME: 'success', PROBE_PASS: '40', PROBE_FAIL: '0', PROBE_EXPECTED: '40',
  CONTENT_OUTCOME: 'success', CONTENT_PASS: '3', CONTENT_FAIL: '0', CONTENT_EXPECTED: '3',
  PROBE_REPORT: 'Endpoint report', CONTENT_REPORT: 'Content report',
};

async function run(changes = {}, summaryError = false) {
  const result = { failures: [], summary: '', writes: 0 };
  const core = {
    setFailed(message) { result.failures.push(message); },
    summary: {
      addRaw(body) { result.summary += body; return this; },
      async write() {
        result.writes++;
        if (summaryError) throw new Error('summary unavailable');
      },
    },
  };
  try { await execute(core, { env: { ...complete, ...changes } }); }
  catch (error) { result.error = error; }
  return result;
}

test('a complete zero-failure run records all 43 probes and the triggering deployment', async () => {
  const result = await run();
  assert.deepEqual(result.failures, []);
  assert.equal(result.error, undefined);
  assert.equal(result.writes, 1);
  assert.match(result.summary, /PASSED post-deploy verification/);
  assert.match(result.summary, /PROBE: 40 pass, 0 fail of 40/);
  assert.match(result.summary, /CONTENT: 3 pass, 0 fail of 3/);
  assert.ok(result.summary.includes(complete.DEPLOY_SHA));
  assert.ok(result.summary.includes(complete.DEPLOY_RUN_URL));
  assert.match(result.summary, /do not prove which commit the apex serves/);
});

test('the historical 30-pass, 10-failure result fails the verification job', async () => {
  const result = await run({ PROBE_PASS: '30', PROBE_FAIL: '10' });
  assert.equal(result.failures.length, 1);
  assert.match(result.summary, /FAILED/);
  assert.match(result.summary, /30 pass, 10 fail of 40/);
});

test('a failed content predicate cannot hide behind passing endpoint probes', async () => {
  const result = await run({ CONTENT_PASS: '2', CONTENT_FAIL: '1' });
  assert.equal(result.failures.length, 1);
});

test('missing outputs are UNCHECKABLE and fail instead of parsing to NaN', async () => {
  const changes = Object.fromEntries(Object.keys(complete).filter(key => /_(PASS|FAIL|EXPECTED)$/.test(key)).map(key => [key, '']));
  const result = await run(changes);
  assert.equal(result.failures.length, 1);
  assert.equal((result.summary.match(/UNCHECKABLE/g) || []).length, 2);
});

test('every count rejects malformed, negative, fractional, unsafe and partial numbers', async () => {
  for (const key of ['PROBE_PASS', 'PROBE_FAIL', 'PROBE_EXPECTED', 'CONTENT_PASS', 'CONTENT_FAIL', 'CONTENT_EXPECTED']) {
    for (const value of [undefined, '', '-1', '1.5', '0oops', 'NaN', ' 0', '0\n', '9007199254740992']) {
      const result = await run({ [key]: value });
      assert.equal(result.failures.length, 1, `${key}=${String(value)}`);
    }
  }
});

test('an incomplete or inflated probe population fails even with zero recorded failures', async () => {
  for (const PROBE_PASS of ['39', '41']) {
    assert.equal((await run({ PROBE_PASS })).failures.length, 1);
  }
});

test('an empty endpoint or content population is not a passing sample', async () => {
  for (const prefix of ['PROBE', 'CONTENT']) {
    assert.equal((await run({ [`${prefix}_PASS`]: '0', [`${prefix}_FAIL`]: '0', [`${prefix}_EXPECTED`]: '0' })).failures.length, 1);
  }
});

test('failed, skipped, cancelled and missing step outcomes cannot report a pass', async () => {
  for (const key of ['PROBE_OUTCOME', 'CONTENT_OUTCOME']) {
    for (const value of ['failure', 'skipped', 'cancelled', '']) {
      assert.equal((await run({ [key]: value })).failures.length, 1);
    }
  }
});

test('probe reports are data rather than interpolated JavaScript', async () => {
  const report = '`; throw new Error("injected"); // ${process.exit(0)}';
  const result = await run({ PROBE_REPORT: report });
  assert.deepEqual(result.failures, []);
  assert.equal(result.error, undefined);
  assert.ok(result.summary.includes(report));
});

test('a summary write error cannot erase an already-recorded verification failure', async () => {
  const result = await run({ PROBE_PASS: '30', PROBE_FAIL: '10' }, true);
  assert.equal(result.failures.length, 1);
  assert.match(result.error.message, /summary unavailable/);
});

test('the final check always runs, reads outputs through the environment, and has no PR write path', () => {
  assert.match(workflow, /name: Record and enforce live verification result\n        if: always\(\)/);
  assert.match(workflow, /PROBE_EXPECTED: \$\{\{ steps\.probe\.outputs\.expected \}\}/);
  assert.match(workflow, /CONTENT_EXPECTED: \$\{\{ steps\.content\.outputs\.expected \}\}/);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /workflow_run\.head_branch == 'master'/);
  assert.match(workflow, /workflow_run\.head_repository\.full_name == github\.repository/);
  assert.doesNotMatch(workflow, /createComment|pulls\.list|issues: write|pull-requests: write/);
  assert.doesNotMatch(script, /\$\{\{.*steps\./);
});

test('both probe stages export positive planned populations and completed counts', () => {
  assert.match(workflow, /EXPECTED=\$\(\( \$\{#HOST_ARRAY\[@\]\} \* \(\$\{#ENDPOINT_ARRAY\[@\]\} \+ 2 \* \$\{#CLIENT_ARRAY\[@\]\}\) \)\)/);
  assert.match(workflow, /echo "expected=\$EXPECTED" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /echo "expected=3" >> "\$GITHUB_OUTPUT"/);
  assert.equal((workflow.match(/echo "pass=\$PASS" >> "\$GITHUB_OUTPUT"/g) || []).length, 2);
});
