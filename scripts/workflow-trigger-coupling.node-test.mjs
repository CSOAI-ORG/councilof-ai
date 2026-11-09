import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertFollower, checkRepository, literalWorkflowPattern, producerName, workflowFilters } from './workflow-trigger-coupling.mjs';

const name = 'Build + deploy site (gated production branch)';
const pattern = literalWorkflowPattern(name);
const fixture = values => 'name: follower\non:\n  workflow_run:\n    workflows: ' + JSON.stringify(values) + '\n    types: [completed]\njobs:\n  check:\n    runs-on: ubuntu-latest\n';

test('literal plus is escaped for GitHub workflow filters, not for job equality', () => {
  assert.equal(pattern, 'Build \\+ deploy site (gated production branch)');
  assert.notEqual(pattern, name);
  assert.doesNotThrow(() => assertFollower(name, 'claims-e2e.yml', fixture([pattern])));
});
test('the previously deployed raw plus is rejected', () => {
  assert.throws(() => assertFollower(name, 'claims-e2e.yml', fixture([name])), /filters must be exactly/);
});
test('HF retains both producer sources and rejects a broadened wildcard', () => {
  assert.doesNotThrow(() => assertFollower(name, 'hf-gspc-surface-sync.yml', fixture(['public-root', pattern])));
  assert.throws(() => assertFollower(name, 'hf-gspc-surface-sync.yml', fixture(['public-root', 'Build*'])), /filters must be exactly/);
});
test('a producer rename, extra character or double escape does not pass', () => {
  for (const value of [pattern + 'x', pattern.replace('\\+', '\\\\+')]) {
    assert.throws(() => assertFollower(name, 'claims-e2e.yml', fixture([value])), /filters must be exactly/);
  }
  assert.throws(() => assertFollower(name + ' renamed', 'claims-e2e.yml', fixture([pattern])), /filters must be exactly/);
});
test('a comment or runtime condition cannot stand in for the actual trigger', () => {
  const deceptive = '# ' + JSON.stringify(pattern) + '\n' + fixture([name]) + '    if: github.event.workflow_run.name == ' + JSON.stringify(name) + '\n';
  assert.throws(() => assertFollower(name, 'claims-e2e.yml', deceptive), /filters must be exactly/);
});
test('multiline quoted YAML decodes exactly one literal escape', () => {
  const value = 'name: follower\non:\n  workflow_run:\n    workflows:\n      - "public-root"\n      - ' + JSON.stringify(pattern) + '\n    types: [completed]\n';
  assert.deepEqual(workflowFilters(value), ['public-root', pattern]);
  assert.doesNotThrow(() => assertFollower(name, 'hf-gspc-surface-sync.yml', value));
});
test('missing, duplicate and unsupported trigger syntax fails closed', () => {
  for (const value of [fixture([]), fixture([pattern, pattern]), 'name: no trigger\njobs:\n  workflow_run:\n    workflows: ["wrong"]\n', fixture([pattern]).replace('    workflows:', '    workflows: []\n    workflows:')]) {
    assert.throws(() => assertFollower(name, 'claims-e2e.yml', value));
  }
});
test('all glob metacharacters in a producer name are escaped', () => {
  assert.equal(literalWorkflowPattern('A*?+![x]'), 'A\\*\\?\\+\\!\\[x\\]');
  assert.equal(producerName('name: "Build + deploy"\non:\n'), 'Build + deploy');
});
test('all five real repository filters use the actual producer name', () => {
  assert.equal(checkRepository(), name);
});
