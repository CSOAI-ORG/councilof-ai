import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync(new URL('../../.github/workflows/verify-card.yml', import.meta.url), 'utf8');
const guard = workflow.match(/        run: \|\n((?:          [^\n]*\n)+)/)?.[1]
  .split('\n').map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n');
assert.ok(guard, 'The fixed-shell source guard must exist');

function runGuard(overrides = {}) {
  return spawnSync('bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', guard], {
    encoding: 'utf8',
    timeout: 2000,
    env: {
      PATH: process.env.PATH,
      CSOAI_WORKFLOW_REPOSITORY: 'CSOAI-ORG/councilof-ai',
      CSOAI_WORKFLOW_FILE_PATH: '.github/workflows/verify-card.yml',
      CSOAI_WORKFLOW_SHA: 'f'.repeat(40),
      ...overrides,
    },
  });
}

test('exact trusted source identity passes without output or child commands', () => {
  const result = runGuard();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
  assert.doesNotMatch(guard, /\$\{|\$\(|`|curl|wget|node|python/);
});

test('missing, foreign, malformed and injected source identities fail closed', () => {
  const cases = [
    { CSOAI_WORKFLOW_REPOSITORY: '' },
    { CSOAI_WORKFLOW_FILE_PATH: '' },
    { CSOAI_WORKFLOW_SHA: '' },
    { CSOAI_WORKFLOW_REPOSITORY: 'attacker/councilof-ai' },
    { CSOAI_WORKFLOW_REPOSITORY: 'CSOAI-ORG/councilof-ai-fork' },
    { CSOAI_WORKFLOW_FILE_PATH: '.github/workflows/other.yml' },
    { CSOAI_WORKFLOW_FILE_PATH: '../.github/workflows/verify-card.yml' },
    { CSOAI_WORKFLOW_SHA: 'main' },
    { CSOAI_WORKFLOW_SHA: 'a'.repeat(39) },
    { CSOAI_WORKFLOW_SHA: 'a'.repeat(41) },
    { CSOAI_WORKFLOW_SHA: 'g'.repeat(40) },
    { CSOAI_WORKFLOW_SHA: 'a'.repeat(40) + '\n' },
    { CSOAI_WORKFLOW_SHA: '$(printf INJECTION_EXECUTED)' },
    { CSOAI_WORKFLOW_REPOSITORY: '"; printf INJECTION_EXECUTED; #' },
  ];
  for (const inputs of cases) {
    const result = runGuard(inputs);
    assert.equal(result.status, 2, JSON.stringify(inputs));
    assert.equal(result.stderr, '');
    assert.match(result.stdout, /^::error::Trusted verifier source identity is unavailable or unexpected\./);
    assert.doesNotMatch(result.stdout, /INJECTION_EXECUTED|attacker|fork/);
    assert.equal(result.stdout.split('\n').length, 2, 'Emit exactly one fixed error line');
  }
});

test('guard precedes all checkout and only read contents permission is granted', () => {
  assert.ok(workflow.indexOf('Validate trusted verifier source identity') < workflow.indexOf('uses: actions/checkout@v4'));
  assert.match(workflow, /^permissions:\n  contents: read\n/m);
  assert.match(workflow, /timeout-minutes: 5/);
  assert.doesNotMatch(workflow, /id-token:|contents: write|secrets: inherit|workflow_dispatch:|schedule:|pull_request_target:/);
});

test('caller data and called-source verifier use separate paths and no persisted credentials', () => {
  const checkouts = workflow.split(/      - name: /).filter(step => step.includes('uses: actions/checkout@v4'));
  assert.equal(checkouts.length, 2);
  assert.match(checkouts[0], /path: caller\n/);
  assert.doesNotMatch(checkouts[0], /repository:|ref:|sparse-checkout:/);
  assert.match(checkouts[1], /repository: \$\{\{ job\.workflow_repository \}\}/);
  assert.match(checkouts[1], /ref: \$\{\{ job\.workflow_sha \}\}/);
  assert.match(checkouts[1], /path: \.csoai-verifier-source\n/);
  assert.match(checkouts[1], /sparse-checkout: \|\n            actions\/verify-card\n            packages\/gspc-card-verifier\n/);
  for (const step of checkouts) assert.match(step, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /github\.workflow_sha|github\.sha|ref: (?:main|master)|ref: \$\{\{ inputs\./);
});

test('inputs are environment data, and only the trusted runner executes in caller cwd', () => {
  assert.match(workflow, /uses: actions\/setup-node@v4\n        with:\n          node-version: '22'/);
  assert.match(workflow, /working-directory: caller/);
  assert.match(workflow, /CSOAI_ACTION_PATH: \$\{\{ github\.workspace \}\}\/\.csoai-verifier-source\/actions\/verify-card/);
  assert.match(workflow, /CSOAI_ARTIFACT: \$\{\{ inputs\.artifact \}\}/);
  assert.match(workflow, /CSOAI_FAIL_ON_MISMATCH: \$\{\{ inputs\.fail_on_mismatch \}\}/);
  assert.match(workflow, /run: node "\$CSOAI_ACTION_PATH\/run\.mjs"/);
  for (const line of workflow.split('\n').filter(line => /run:/.test(line))) {
    assert.doesNotMatch(line, /\$\{\{/);
  }
  assert.doesNotMatch(guard, /\$\{\{/);
  assert.doesNotMatch(workflow, /setup-python|from cryptography|import cryptography|pub\.verify|json\.dumps|::set-output|npm (?:ci|install)|pip install|uses: \.\/caller/);
});

test('all five composite outputs reach reusable-workflow outputs without verdict transformation', () => {
  for (const key of ['content_id', 'verdict', 'id', 'code', 'reason']) {
    assert.ok(workflow.includes(`value: \${{ jobs.verify.outputs.${key} }}`), `${key} workflow output`);
    assert.ok(workflow.includes(`${key}: \${{ steps.check.outputs.${key} }}`), `${key} job output`);
  }
  assert.match(workflow, /default: 'true'/);
  assert.doesNotMatch(workflow, /continue-on-error:|fail_on_mismatch.*==|content_id.*verified.*\|\|/);
});
