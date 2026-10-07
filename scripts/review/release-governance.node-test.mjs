import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const gates = readFileSync(new URL('../../.github/workflows/pr-gates.yml', import.meta.url), 'utf8');
const sweeper = readFileSync(new URL('../../.github/workflows/bot-checks-sweeper.yml', import.meta.url), 'utf8');
const guards = ['card-verifier-parity', 'wallet-credentials', 'third-party-identifiers', 'stamped-bytes', 'hold-guard'];

// Execute actual workflow bodies rather than a second gate implementation.
function pythonBlock(source, after) {
  const start = source.indexOf("python3 - <<'PY'", source.indexOf(after));
  assert.ok(start >= 0, `missing Python body after ${after}`);
  const lines = source.slice(start).split('\n').slice(1);
  const end = lines.findIndex(line => line.trim() === 'PY');
  assert.ok(end >= 0, 'missing heredoc terminator');
  const indent = lines[end].match(/^\s*/)[0].length;
  return lines.slice(0, end).map(line => line.slice(indent)).join('\n');
}
const guardBody = pythonBlock(gates, 'Require successful mandatory guards');
const allGreen = () => Object.fromEntries(guards.map(name => [name, { result: 'success' }]));
function runGuard(results, event = 'pull_request') {
  const result = spawnSync('python3', ['-c', guardBody], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GUARD_RESULTS: typeof results === 'string' ? results : JSON.stringify(results), GUARD_EVENT: event },
  });
  assert.ifError(result.error);
  return result;
}
function assertWiring(source) {
  const job = source.slice(source.indexOf('\n  gates:\n'));
  assert.match(job, /needs: \[card-verifier-parity, wallet-credentials, third-party-identifiers, stamped-bytes, hold-guard\]/);
  assert.match(job, /if: \$\{\{ always\(\) \}\}/);
  const guard = job.indexOf('Require successful mandatory guards');
  const scope = job.indexOf('Scope - does this PR touch a gated path?');
  assert.ok(guard > 0 && scope > guard, 'guards must precede scope and expensive work');
  assert.doesNotMatch(job.slice(0, scope), /continue-on-error|steps\.scope/);
  assert.match(job, /GUARD_RESULTS: \$\{\{ toJSON\(needs\) \}\}/);
  assert.match(job, /GUARD_EVENT: \$\{\{ github\.event_name \}\}/);
}
test('required gates waits for every independent guard and runs after a failed dependency', () => assertWiring(gates));
test('wiring controls reject removal of always, a dependency or guard-before-scope ordering', () => {
  assert.throws(() => assertWiring(gates.replace('if: ${{ always() }}', 'if: success()')));
  assert.throws(() => assertWiring(gates.replace('stamped-bytes, hold-guard]', 'stamped-bytes]')));
  assert.throws(() => assertWiring(gates.replace('Require successful mandatory guards', 'removed guard')));
});
test('all successful PR guards pass', () => {
  const result = runGuard(allGreen());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Mandatory PR guards passed/);
});
for (const name of guards) {
  for (const state of ['failure', 'cancelled', 'skipped', 'neutral', 'missing']) {
    test(`PR gates rejects ${name}=${state}, including out-of-site-scope PRs`, () => {
      const results = allGreen();
      if (state === 'missing') delete results[name]; else results[name].result = state;
      const result = runGuard(results);
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, new RegExp(`${name}=${state}`));
    });
  }
}
test('manual diagnostics cannot publish successful required gates, even with green predecessors', () => {
  const results = allGreen();
  for (const state of ['success', 'skipped', 'failure']) {
    results['hold-guard'].result = state;
    const result = runGuard(results, 'workflow_dispatch');
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /required PR approval is not established/);
    assert.doesNotMatch(result.stdout, /Mandatory PR guards passed/);
  }
});
test('unsupported event, malformed data and absent hold result fail closed', () => {
  for (const event of ['', 'push', 'pull_request_target']) assert.equal(runGuard(allGreen(), event).status, 1);
  assert.equal(runGuard('{').status, 1);
  assert.equal(runGuard('null').status, 1);
  const results = allGreen(); delete results['hold-guard'];
  assert.equal(runGuard(results, 'workflow_dispatch').status, 1);
});
function runSweeper(dispatchReturn, comments = '') {
  const fixture = `
fixture_calls = []
def fake_run(args, **kwargs):
    fixture_calls.append(args)
    rc, stdout = 0, ''
    if args[1:3] == ['pr', 'list']:
        stdout = json.dumps([{'number': 123, 'headRefName': 'fixture/branch', 'headRefOid': '123456789abcdef', 'isCrossRepository': False}])
    elif args[1] == 'api':
        stdout = json.dumps({'check_runs': []})
    elif args[1:3] == ['workflow', 'run']:
        rc = ${dispatchReturn}
    elif args[1:3] == ['pr', 'view']:
        stdout = ${JSON.stringify(comments)}
    return subprocess.CompletedProcess(args, rc, stdout, '')
subprocess.run = fake_run
`;
  const script = pythonBlock(sweeper, 'Find check-less open PRs').replace('import json, os, subprocess', 'import json, os, subprocess\n' + fixture)
    + '\nprint("FIXTURE_CALLS=" + json.dumps(fixture_calls))\n';
  const result = spawnSync('python3', ['-c', script], {
    encoding: 'utf8', timeout: 10000, env: { ...process.env, REPO: 'fixture/repo' },
  });
  assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.split('\n').find(line => line.startsWith('FIXTURE_CALLS=')).slice('FIXTURE_CALLS='.length));
}
for (const dispatchReturn of [0, 1]) {
  test(`sweeper dispatch exit ${dispatchReturn} banks protected owner action without any merge`, () => {
    const calls = runSweeper(dispatchReturn);
    assert.ok(!calls.some(args => args.includes('merge') || args.includes('--admin')));
    const comment = calls.find(args => args[1] === 'pr' && args[2] === 'comment');
    assert.ok(comment, 'operator action is retained');
    const body = comment[comment.indexOf('--body') + 1];
    assert.match(body, /latest PR\/test-merge commit/);
    assert.match(body, /required review/);
    assert.match(body, /Never use admin bypass/);
    assert.doesNotMatch(body, /--admin|merge with admin|admin merge is/);
    if (dispatchReturn === 0) assert.match(body, /workflow_dispatch run does not satisfy required PR checks/);
    else assert.match(body, /dispatch.*did not complete/);
  });
}
test('new protected guidance corrects an old marker once, then remains idempotent', () => {
  assert.equal(runSweeper(0, 'bot-checks-sweeper: operator action required.').filter(args => args[2] === 'comment').length, 1);
  assert.equal(runSweeper(0, 'bot-checks-sweeper: protected operator action v2.').filter(args => args[2] === 'comment').length, 0);
});

const structureWorkflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
const structureBody = structureWorkflow.match(/run: \|\n([\s\S]*)$/)[1].split('\n').map(line => line.slice(10)).join('\n');
for (const present of [[], ['README.md'], ['LICENSE'], ['README.md', 'LICENSE']]) {
  test(`required build structure check with ${present.join(', ') || 'neither file'}`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'release-structure-test-'));
    try {
      for (const file of present) writeFileSync(join(dir, file), 'fixture\n');
      const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', structureBody], { cwd: dir, encoding: 'utf8', timeout: 2000 });
      assert.ifError(result.error);
      assert.equal(result.status, present.length === 2 ? 0 : 1, result.stdout + result.stderr);
      if (present.length !== 2) assert.doesNotMatch(result.stdout, /CI check passed/);
    } finally { rmSync(dir, { recursive: true }); }
  });
}
