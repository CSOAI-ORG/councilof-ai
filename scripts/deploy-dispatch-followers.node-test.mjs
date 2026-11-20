// A deploy that another workflow dispatches must still be followed.
//
// deploy.yml has five followers that start from its `workflow_run` event (FOLLOWERS in
// workflow-trigger-coupling.mjs). GitHub creates a deploy run that GITHUB_TOKEN dispatches,
// because workflow_dispatch is the documented exception to its loop prevention, but it starts no
// workflow_run for that run. Measured on 20 Nov 2026 over the 199 deploys that completed from 8 to
// 20 Nov: GitHub started all five followers for each of the 196 push, scheduled and user-dispatched
// deploys, and none for the 3 that public-root-candidate-upgrade.yml dispatched with GITHUB_TOKEN.
// The last of those, run 44620921488 (19 Nov 21:39Z), put a new public root live with no
// post-deploy verification and no spray.
//
// So every workflow that dispatches deploy.yml does it through one shell block, byte-identical in
// each, that dispatches with SNAPSHOT_PR_TOKEN. That token dispatches as a user, so the deploy is
// followed through workflow_run like a push deploy. The block falls back to GITHUB_TOKEN only out
// loud, and the run then goes red. The followers are never dispatched directly: gspc-spray adds
// Zenodo on every event except workflow_run.
//
// This file pins that path with negative controls, and runs the block's own bytes against a fake
// `gh` that records which token each dispatch used.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { FOLLOWERS, checkRepository } from './workflow-trigger-coupling.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WORKFLOWS = join(ROOT, '.github', 'workflows');
// By name, so a detector that stopped matching cannot pass on an empty set.
const DISPATCHERS = ['drift-guard.yml', 'public-root-candidate-upgrade.yml'];
const BEGIN = '# >>> deploy-dispatch';
const END = '# <<< deploy-dispatch';
const TOKEN = 'DEPLOY_DISPATCH_TOKEN';
const BINDING = '${{ secrets.SNAPSHOT_PR_TOKEN }}';

const indentOf = line => line.search(/\S/);
const isCode = line => line.trim() !== '' && !line.trim().startsWith('#');
// A workflow starts another through the gh CLI, the REST dispatches endpoint or github-script's
// createWorkflowDispatch, and can name deploy.yml by file name, path or display name.
const DISPATCH = /\bgh\s+workflow\s+run\b|\/dispatches\b|createWorkflowDispatch|\bworkflow_id\s*:/;
const DEPLOY = /(^|[\s"'/=])deploy\.yml\b|Build \\*\+ deploy site/;
const dispatchesDeploy = line => isCode(line) && DISPATCH.test(line) && DEPLOY.test(line);

// The repository's step syntax and nothing looser: a `steps:` key, `- ` items, each item's keys
// two columns further in, scripts as `|` block scalars.
function parseSteps(lines) {
  const steps = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*steps:\s*$/.test(lines[i])) continue;
    const parent = indentOf(lines[i]);
    let item = -1;
    let j = i + 1;
    for (; j < lines.length; j++) {
      const line = lines[j];
      if (!isCode(line)) continue;
      const indent = indentOf(line);
      const listed = line.trim().startsWith('- ');
      if (indent < parent || (indent === parent && !listed)) break;
      if (item < 0) item = indent;
      if (indent < item) break;
      if (indent === item && listed) steps.push({ start: j, keyIndent: item + 2 });
    }
    const found = steps.filter(step => step.start > i && step.start < j);
    found.forEach((step, n) => { step.end = n + 1 < found.length ? found[n + 1].start : j; });
    i = j - 1;
  }
  return steps.map(step => ({ ...step, keys: stepKeys(lines, step) }));
}

function stepKeys(lines, step) {
  const keys = {};
  const k = step.keyIndent;
  for (let i = step.start; i < step.end; i++) {
    const line = lines[i];
    let body;
    if (i === step.start) body = line.slice(indentOf(line) + 2);
    else if (isCode(line) && indentOf(line) === k) body = line.slice(k);
    else continue;
    const match = body.match(/^([A-Za-z][\w-]*):(.*)$/);
    if (!match) continue;
    let end = i + 1;
    while (end < step.end && (!lines[end].trim() || indentOf(lines[end]) > k)) end++;
    keys[match[1]] = { line: i, value: match[2].trim(), from: i + 1, to: end };
  }
  return keys;
}

function script(lines, key) {
  if (!key || !/^[|>][-+]?$/.test(key.value)) return null;
  const body = lines.slice(key.from, key.to);
  const first = body.find(line => line.trim());
  if (!first) return '';
  const indent = indentOf(first);
  return body.map(line => line.slice(indent)).join('\n').replace(/\s+$/, '') + '\n';
}

function env(lines, key) {
  const entries = new Map();
  if (!key || key.value !== '') return entries;
  for (const line of lines.slice(key.from, key.to)) {
    const match = isCode(line) && line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (match) entries.set(match[1], match[2].trim());
  }
  return entries;
}

// Every line in a workflow that dispatches deploy.yml must sit inside a deploy-dispatch block in a
// bash `run:` script whose step binds the token exactly. Throws on the first breach.
export function checkWorkflow(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith(BEGIN)) continue;
    const indent = indentOf(lines[i]);
    let end = -1;
    for (let j = i + 1; j < lines.length && end < 0; j++) {
      if (lines[j].trim().startsWith(BEGIN)) throw new Error(`line ${j + 1}: a deploy-dispatch block opens inside another`);
      if (lines[j].trim() === END) end = j;
    }
    if (end < 0) throw new Error(`line ${i + 1}: deploy-dispatch block is never closed`);
    const body = lines.slice(i, end + 1);
    if (body.some(line => line.trim() && indentOf(line) < indent)) {
      throw new Error(`line ${i + 1}: deploy-dispatch block is indented less than its opening marker`);
    }
    blocks.push({ start: i, end, text: body.map(line => line.slice(indent)).join('\n') + '\n' });
    i = end;
  }
  const dispatches = lines.flatMap((line, i) => dispatchesDeploy(line) ? [i] : []);
  for (const i of dispatches) {
    if (!blocks.some(block => block.start < i && i < block.end)) {
      throw new Error(`line ${i + 1} dispatches deploy.yml outside the deploy-dispatch block: ${lines[i].trim()}`);
    }
  }
  const steps = parseSteps(lines);
  for (const block of blocks) {
    const step = steps.find(s => s.keys.run && s.keys.run.from <= block.start && block.end < s.keys.run.to);
    if (!step) throw new Error(`line ${block.start + 1}: deploy-dispatch block is not inside a step's run: script`);
    if (step.keys.shell && step.keys.shell.value !== 'bash') {
      throw new Error(`line ${block.start + 1}: deploy-dispatch block runs under shell ${step.keys.shell.value}, not bash`);
    }
    if (env(lines, step.keys.env).get(TOKEN) !== BINDING) {
      throw new Error(`line ${block.start + 1}: the step does not bind ${TOKEN}: ${BINDING} in its own env`);
    }
    block.id = step.keys.id?.value || '';
  }
  return { blocks, dispatches, steps, lines };
}

function scanRepository() {
  const found = new Map();
  for (const file of readdirSync(WORKFLOWS).filter(name => /\.ya?ml$/.test(name)).sort()) {
    const text = readFileSync(join(WORKFLOWS, file), 'utf8');
    const result = checkWorkflow(text);
    if (result.dispatches.length || result.blocks.length) found.set(file, result);
  }
  return found;
}

function withFakeGh(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'deploy-dispatch-'));
  try {
    mkdirSync(join(dir, 'bin'));
    writeFileSync(join(dir, 'bin', 'gh'), [
      '#!/usr/bin/env bash',
      'printf \'%s|%s\\n\' "${GH_TOKEN-}" "$*" >> "$FAKE_GH_LOG"',
      'for refused in ${FAKE_GH_REFUSE-}; do [ "$refused" = "${GH_TOKEN-}" ] && exit 1; done',
      'exit 0', '',
    ].join('\n'));
    chmodSync(join(dir, 'bin', 'gh'), 0o755);
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Run a script the way the dispatch steps do (bash, set -euo pipefail) with a fake gh on PATH.
function runBlock(text, { userToken, refuse = [] } = {}) {
  return withFakeGh(dir => {
    const log = join(dir, 'gh.log');
    const output = join(dir, 'github-output');
    writeFileSync(join(dir, 'block.sh'), text);
    writeFileSync(output, '');
    const vars = {
      PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
      GH_TOKEN: 'workflow-token',
      GITHUB_REPOSITORY: 'CSOAI-ORG/councilof-ai',
      GITHUB_OUTPUT: output,
      FAKE_GH_LOG: log,
      FAKE_GH_REFUSE: refuse.join(' '),
    };
    if (userToken !== undefined) vars[TOKEN] = userToken;
    const run = spawnSync('bash', ['-euo', 'pipefail', join(dir, 'block.sh')], { env: vars, encoding: 'utf8' });
    const calls = existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean).map(entry => {
      const at = entry.indexOf('|');
      return { token: entry.slice(0, at), args: entry.slice(at + 1) };
    }) : [];
    return { status: run.status, stdout: run.stdout, stderr: run.stderr, calls, output: readFileSync(output, 'utf8') };
  });
}

const DEPLOY_ARGS = 'workflow run deploy.yml --repo CSOAI-ORG/councilof-ai --ref master';
const realBlock = () => checkWorkflow(readFileSync(join(WORKFLOWS, DISPATCHERS[0]), 'utf8')).blocks[0].text;
const fixture = stepLines => ['name: fixture', 'on: workflow_dispatch', 'jobs:', '  heal:',
  '    runs-on: ubuntu-latest', '    steps:', ...stepLines, ''].join('\n');
const indented = (text, n) => text.replace(/\n$/, '').split('\n').map(line => line ? ' '.repeat(n) + line : line);
const blockStep = (envLines, extra = []) => fixture([
  '      - name: Self-heal',
  ...extra,
  '        env:',
  '          GH_TOKEN: ${{ github.token }}',
  ...envLines,
  '        run: |',
  '          set -euo pipefail',
  ...indented(realBlock(), 10),
]);

test('a GITHUB_TOKEN dispatch of deploy.yml in any written form is refused outside the block', () => {
  const legacy = fixture([
    '      - name: Self-heal on drift (redeploy canonical master)',
    '        env:',
    '          GH_TOKEN: ${{ github.token }}',
    '        run: |',
    '          gh workflow run deploy.yml --ref master',
  ]);
  assert.throws(() => checkWorkflow(legacy), /outside the deploy-dispatch block/);
  for (const line of [
    'gh workflow run deploy.yml --repo "$REPO" --ref master',
    'gh workflow run .github/workflows/deploy.yml --ref master',
    'gh workflow run "Build + deploy site (gated production branch)" --ref master',
    'gh api -X POST "repos/$REPO/actions/workflows/deploy.yml/dispatches" -f ref=master',
    "await github.rest.actions.createWorkflowDispatch({ owner, repo, workflow_id: 'deploy.yml', ref: 'master' });",
  ]) {
    const text = fixture(['      - name: dispatch', '        run: |', `          ${line}`]);
    assert.throws(() => checkWorkflow(text), /outside the deploy-dispatch block/, line);
  }
});

test('comments, run listings and other workflows are not deploy dispatches', () => {
  const text = fixture(['      - name: reads', '        run: |',
    '          # gh workflow run deploy.yml --ref master',
    '          gh run list --workflow deploy.yml --branch master --limit 20',
    '          gh workflow run csoai-site-deploy.yml --ref main',
    '          gh workflow run pr-gates.yml --ref "$BR"']);
  assert.deepEqual(checkWorkflow(text).dispatches, []);
});

test('the block is refused unless its own step binds the user token exactly, and runs it under bash', () => {
  assert.doesNotThrow(() => checkWorkflow(blockStep([`          ${TOKEN}: ${BINDING}`])));
  assert.throws(() => checkWorkflow(blockStep([])), /does not bind/);
  // A fallback inside the binding would hand the block GITHUB_TOKEN under the user token's name, and
  // the block would then report a user dispatch it never made.
  assert.throws(() => checkWorkflow(blockStep([`          ${TOKEN}: \${{ secrets.SNAPSHOT_PR_TOKEN || github.token }}`])), /does not bind/);
  assert.throws(() => checkWorkflow(blockStep([`          ${TOKEN}: ${BINDING}`], ['        shell: pwsh'])), /not bash/);
  const unclosed = fixture(['      - name: x', '        run: |', `          ${BEGIN}`, '          gh workflow run deploy.yml --ref master']);
  assert.throws(() => checkWorkflow(unclosed), /never closed/);
});

test('exactly the two known workflows dispatch deploy.yml, each through one block, byte-identical', () => {
  const found = scanRepository();
  assert.deepEqual([...found.keys()], DISPATCHERS);
  const texts = DISPATCHERS.map(file => {
    const { blocks, dispatches } = found.get(file);
    assert.equal(blocks.length, 1, file);
    assert.equal(dispatches.length, 2, `${file}: the user-token dispatch and the announced fallback`);
    return blocks[0].text;
  });
  assert.equal(texts[1], texts[0]);
});

test('a dispatching step that falls back to GITHUB_TOKEN turns its run red', () => {
  for (const file of DISPATCHERS) {
    const { blocks, steps, lines } = checkWorkflow(readFileSync(join(WORKFLOWS, file), 'utf8'));
    const id = blocks[0].id;
    assert.match(id, /^[a-z][\w-]*$/, `${file}: the dispatching step needs an id`);
    const red = steps.filter(step => (step.keys.if?.value || '').includes(`steps.${id}.outputs.followers == 'not-started'`)
      && /^exit 1$/m.test(script(lines, step.keys.run) || ''));
    assert.equal(red.length, 1, `${file}: one later step must fail the run when followers=not-started`);
    assert.ok(red[0].start > blocks[0].end, file);
  }
});

test('with the user token the block dispatches deploy.yml once, with that token', () => {
  const run = runBlock(realBlock(), { userToken: 'user-token' });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(run.calls, [{ token: 'user-token', args: DEPLOY_ARGS }]);
  assert.equal(run.output, '');
  assert.doesNotMatch(run.stdout, /::warning/);
  assert.match(run.stdout, /DEPLOY_DISPATCHED_AS_USER/);
});

test('without the user token, or when it is refused, the deploy is still dispatched and the gap is announced', () => {
  for (const [label, options, tokens] of [
    ['unset', {}, ['workflow-token']],
    ['empty, as Actions passes a missing secret', { userToken: '' }, ['workflow-token']],
    ['refused', { userToken: 'user-token', refuse: ['user-token'] }, ['user-token', 'workflow-token']],
  ]) {
    const run = runBlock(realBlock(), options);
    assert.equal(run.status, 0, `${label}: ${run.stderr}`);
    assert.deepEqual(run.calls, tokens.map(token => ({ token, args: DEPLOY_ARGS })), label);
    assert.equal(run.output, 'followers=not-started\n', label);
    const warning = run.stdout.split('\n').find(line => line.startsWith('::warning'));
    assert.ok(warning, label);
    for (const follower of FOLLOWERS) assert.ok(warning.includes(follower), `${label}: ${follower}`);
    assert.doesNotMatch(run.stdout, /DEPLOY_DISPATCHED_AS_USER/, label);
  }
});

test('a dispatch that fails with both tokens fails the step', () => {
  const run = runBlock(realBlock(), { userToken: 'user-token', refuse: ['user-token', 'workflow-token'] });
  assert.notEqual(run.status, 0);
  assert.equal(run.calls.length, 2);
});

test('the dispatched deploy is followed by workflow_run, so no workflow dispatches a follower', () => {
  assert.equal(checkRepository(ROOT), 'Build + deploy site (gated production branch)');
  for (const file of readdirSync(WORKFLOWS).filter(name => /\.ya?ml$/.test(name))) {
    readFileSync(join(WORKFLOWS, file), 'utf8').split(/\r?\n/).forEach((line, i) => {
      if (!isCode(line) || !DISPATCH.test(line)) return;
      for (const follower of FOLLOWERS) assert.ok(!line.includes(follower), `${file}:${i + 1} dispatches ${follower}`);
    });
  }
});

test('a follow-the-deploy spray stays off Zenodo, which a dispatched spray would not', () => {
  const lines = readFileSync(join(WORKFLOWS, 'gspc-spray.yml'), 'utf8').split(/\r?\n/);
  const step = parseSteps(lines).find(s => s.keys.name?.value === 'choose surfaces from the secrets that exist');
  assert.ok(step, 'gspc-spray.yml: the surface-choosing step');
  const text = script(lines, step.keys.run);
  const flags = event => withFakeGh(dir => {
    const output = join(dir, 'github-output');
    writeFileSync(join(dir, 'choose.sh'), text);
    writeFileSync(output, '');
    const run = spawnSync('bash', ['-e', join(dir, 'choose.sh')], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH, GITHUB_OUTPUT: output, EVENT: event, HAS_HF: 'true', HAS_KAGGLE: 'true',
        HAS_GITHUB: 'true', HAS_ZENODO: 'true', HAS_PYPI: 'true', HAS_NPM: 'false' },
    });
    assert.equal(run.status, 0, run.stderr);
    const line = readFileSync(output, 'utf8').split('\n').find(entry => entry.startsWith('flags='));
    assert.ok(line, event);
    return line.slice('flags='.length).trim().split(/\s+/);
  });
  const followed = flags('workflow_run');
  assert.ok(followed.includes('--hf'), 'the step chose surfaces at all');
  assert.ok(!followed.includes('--zenodo'), 'a workflow_run spray must not mint a Zenodo DOI');
  // Control: the same inputs on a dispatch do reach Zenodo, so the check above can fail.
  assert.ok(flags('workflow_dispatch').includes('--zenodo'));
});
