#!/usr/bin/env node
// workflow_run.workflows uses glob filters, even for a literal producer name.
// https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onworkflow_runworkflows
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const FOLLOWERS = ['post-deploy-verify.yml', 'claims-e2e.yml', 'sov-stack-e2e.yml', 'hf-gspc-surface-sync.yml', 'gspc-spray.yml'];
export function literalWorkflowPattern(name) {
  return [...name].map(char => '\\*?+![]'.includes(char) ? '\\' + char : char).join('');
}
function visible(line) { return line.trim() && !line.trimStart().startsWith('#'); }
function block(lines, key, indent) {
  const prefix = ' '.repeat(indent) + key + ':';
  const indices = lines.flatMap((line, i) => line === prefix ? [i] : []);
  if (indices.length !== 1) throw new Error('Expected one block: ' + key);
  const start = indices[0] + 1;
  let end = start;
  while (end < lines.length && (!visible(lines[end]) || lines[end].search(/\S/) > indent)) end++;
  return lines.slice(start, end);
}
function quotedScalar(text) {
  const value = text.trim();
  if (value.startsWith('"')) {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'string') return parsed;
  } else if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'");
  }
  throw new Error('Workflow filters must use a quoted literal');
}
export function workflowFilters(text) {
  // Deliberately accept the repository's two simple YAML list forms, not arbitrary
  // YAML. Unsupported/ambiguous syntax fails closed rather than falling back to grep.
  const run = block(block(text.split(/\r?\n/), 'on', 0), 'workflow_run', 2);
  const entries = run.flatMap((line, i) => line.startsWith('    workflows:') ? [i] : []);
  if (entries.length !== 1) throw new Error('Expected one workflow filter list');
  const index = entries[0];
  const inline = run[index].slice('    workflows:'.length).trim();
  if (inline) {
    const values = JSON.parse(inline);
    if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) throw new Error('Invalid workflow list');
    return values;
  }
  const values = [];
  for (const line of run.slice(index + 1)) {
    if (!visible(line)) continue;
    if (line.search(/\S/) <= 4) break;
    if (!line.startsWith('      - ')) throw new Error('Unsupported workflow list syntax');
    values.push(quotedScalar(line.slice(8)));
  }
  if (!values.length) throw new Error('Empty workflow list');
  return values;
}
export function producerName(text) {
  const names = text.split(/\r?\n/).filter(line => line.startsWith('name:'));
  if (names.length !== 1) throw new Error('Expected one producer name');
  const value = names[0].slice(5).trim();
  if (/^["']/.test(value)) return quotedScalar(value);
  if (!value || value.includes('#')) throw new Error('Ambiguous producer name');
  return value;
}
export function assertFollower(producer, follower, text) {
  const expected = [literalWorkflowPattern(producer)];
  if (follower === 'hf-gspc-surface-sync.yml') expected.push('public-root');
  const actual = workflowFilters(text);
  if (JSON.stringify([...actual].sort()) !== JSON.stringify(expected.sort())) {
    throw new Error(follower + ': filters must be exactly ' + JSON.stringify(expected) + '; got ' + JSON.stringify(actual));
  }
}
export function checkRepository(root = '.') {
  const directory = resolve(root, '.github/workflows');
  const name = producerName(readFileSync(resolve(directory, 'deploy.yml'), 'utf8'));
  for (const follower of FOLLOWERS) assertFollower(name, follower, readFileSync(resolve(directory, follower), 'utf8'));
  return name;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log('trigger-coupling OK: 5 literal workflow filters for ' + checkRepository()); }
  catch (error) { console.error('::error::' + error.message); process.exitCode = 1; }
}
