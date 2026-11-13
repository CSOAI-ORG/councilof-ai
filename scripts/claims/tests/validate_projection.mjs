// Reproduce the retained fixture through existing source, never a second derivation.
// Requires Node 24 native TypeScript stripping; CLAIM_REACTIONS_SOURCE is test-only.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const fixture = new URL('./fixtures/', import.meta.url);
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const source = process.env.CLAIM_REACTIONS_SOURCE || resolve(repoRoot, 'functions/_lib/claimReactions.ts');
const { deriveClaimReactions, reactionSummary } = await import(pathToFileURL(source));
const raw = await readFile(new URL('retained-events.jsonl', fixture));
const lines = raw.toString('utf8').trimEnd().split('\n');
const head = JSON.parse(await readFile(new URL('retained-head.json', fixture), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
assert.equal(sha(raw), head.feed.bytes_sha256);
assert.equal(lines.length, head.feed.n_lines);
let previous = null;
for (let index = 0; index < lines.length; index++) {
  const event = JSON.parse(lines[index]);
  assert.equal(event.seq, index);
  assert.equal(event.prev_sha256, previous);
  previous = sha(lines[index]);
}
assert.equal(previous, head.feed.head_line_sha256);
assert.equal(lines.length - 1, head.feed.head_seq);
const live = JSON.parse(await readFile(new URL('live-reactions.json', fixture), 'utf8'));
const derived = deriveClaimReactions(lines);
assert.deepEqual(derived, live.reactions);
assert.deepEqual(reactionSummary(derived), {
  n_events: live.n_events, by_state: live.by_state,
  n_counter_reaction_required: live.n_counter_reaction_required,
});
console.log(JSON.stringify({evidence_kind: 'RETAINED_SOURCE_PROJECTION_REPRODUCTION',
  n_events: derived.length, status: 'PASS',
  boundary: 'Reproduction does not independently authenticate the feed or signed head.'}));
