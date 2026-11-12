import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCardFeedIndex } from './card-feed-index.mjs';

const project = join(dirname(fileURLToPath(import.meta.url)), '..');
const sha = n => String(n).repeat(64);

function corpus() {
  const root = { as_of: '2026-11-12T00:00:00Z', card_count: 4, card_sha256: [sha(2), sha(1), sha(3), sha(4)] };
  const cards = {};
  for (const n of [1, 2, 3, 4, 5]) cards[sha(n)] = { card: {
    sha256: sha(n), surface: 'alpha', subject: `Card ${n}`, as_of: root.as_of,
    payload: { never_project: 'fixture-not-a-secret' },
  }, proof: [] };
  cards[sha(1)].card.product = { tier: 'proof' };
  cards[sha(2)].card.product = { tier: 'free' };
  cards[sha(2)].proof = ['published inclusion sibling'];
  cards[sha(4)].card.surface = null;
  delete cards[sha(4)].card.subject;
  cards[sha(4)].card.as_of = null;
  return { root, cards };
}

function withRepo(fn) {
  const repo = mkdtempSync(join(tmpdir(), 'card-feed-index-'));
  try {
    mkdirSync(join(repo, 'scripts'), { recursive: true });
    mkdirSync(join(repo, 'public/cards'), { recursive: true });
    for (const name of ['generate-cards-bundle.mjs', 'card-feed-index.mjs', 'producers-check.mjs']) {
      copyFileSync(join(project, 'scripts', name), join(repo, 'scripts', name));
    }
    const data = corpus();
    writeFileSync(join(repo, 'public/root.json'), JSON.stringify(data.root) + '\n');
    for (const [hash, card] of Object.entries(data.cards)) {
      writeFileSync(join(repo, 'public/cards', hash.slice(0, 16) + '.json'), JSON.stringify(card) + '\n');
    }
    return fn(repo, data);
  } finally { rmSync(repo, { recursive: true, force: true }); }
}

function command(repo, executable, args, expected = 0) {
  const result = spawnSync(executable, args, { cwd: repo, encoding: 'utf8', timeout: 10_000 });
  assert.ifError(result.error);
  assert.equal(result.status, expected, `${executable} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result;
}
const producer = (repo, args = [], expected = 0) => command(repo, process.execPath, ['scripts/generate-cards-bundle.mjs', ...args], expected);

test('projection preserves root order and the healthy published tier heuristic, excluding payloads and history', () => {
  const { root, cards } = corpus();
  const before = JSON.stringify({ root, cards });
  const result = buildCardFeedIndex(root, cards);
  assert.deepEqual(result, {
    schema: 'csoai.card-feed-index/1',
    root_digest: createHash('sha256').update(JSON.stringify(root)).digest('hex'),
    root_card_count: 4, tier_basis: 'published-metadata',
    entries: [
      { sha256: sha(2), surface: 'alpha', subject: 'Card 2', as_of: root.as_of, tier: 'proof' },
      { sha256: sha(1), surface: 'alpha', subject: 'Card 1', as_of: root.as_of, tier: 'proof' },
      { sha256: sha(3), surface: 'alpha', subject: 'Card 3', as_of: root.as_of, tier: 'free' },
      { sha256: sha(4), surface: 'unknown', subject: '', as_of: '', tier: 'free' },
    ],
  });
  assert.equal(JSON.stringify({ root, cards }), before);
  assert.equal(JSON.stringify(buildCardFeedIndex(root, cards)), JSON.stringify(result));
  assert.ok(!JSON.stringify(result).includes('fixture-not-a-secret'));
});

test('projection rejects invalid roots and missing or mismatched current wrappers', () => {
  for (const edit of [
    d => { d.root.card_count++; }, d => { d.root.card_sha256 = []; },
    d => { d.root.card_sha256[1] = d.root.card_sha256[0]; },
    d => { d.root.card_sha256[0] = 'not-sha256'; },
    d => { delete d.cards[sha(2)]; }, d => { d.cards[sha(2)].card.sha256 = sha(5); },
    d => { d.cards[sha(2)].card = null; },
  ]) {
    const data = corpus();
    edit(data);
    assert.throws(() => buildCardFeedIndex(data.root, data.cards), /card feed:/);
  }
});

test('unexpected metadata types fail instead of silently coercing public content', () => {
  for (const field of ['surface', 'subject', 'as_of']) {
    const { root, cards } = corpus();
    cards[sha(1)].card[field] = { invalid: true };
    assert.throws(() => buildCardFeedIndex(root, cards), new RegExp(`non-string ${field}`));
  }
});

test('the existing default producer writes the full bundle plus a deterministic root-only index', () => withRepo((repo, data) => {
  producer(repo);
  const bundle = JSON.parse(readFileSync(join(repo, 'public/cards-bundle.json')));
  const first = readFileSync(join(repo, 'public/card-feed-index.json'));
  assert.equal(bundle.schema, 'csoai.cards-bundle/0.1');
  assert.equal(bundle.card_count, 5);
  assert.equal(bundle.root_card_count, 4);
  assert.deepEqual(bundle.cards, data.cards);
  assert.deepEqual(JSON.parse(first), buildCardFeedIndex(data.root, data.cards));
  producer(repo);
  assert.deepEqual(readFileSync(join(repo, 'public/card-feed-index.json')), first);
}));

test('index-only generation preserves the full bundle and read-only checks detect stale or missing bytes', () => withRepo(repo => {
  const bundlePath = join(repo, 'public/cards-bundle.json');
  const indexPath = join(repo, 'public/card-feed-index.json');
  writeFileSync(bundlePath, 'full-bundle sentinel\n');
  producer(repo, ['--feed-index-only']);
  const original = readFileSync(indexPath);
  producer(repo, ['--check-feed-index']);
  assert.deepEqual(readFileSync(indexPath), original);
  writeFileSync(indexPath, 'stale-index sentinel\n');
  producer(repo, ['--check-feed-index'], 1);
  assert.equal(readFileSync(indexPath, 'utf8'), 'stale-index sentinel\n');
  rmSync(indexPath);
  producer(repo, ['--check-feed-index'], 1);
  assert.equal(existsSync(indexPath), false);
  assert.equal(readFileSync(bundlePath, 'utf8'), 'full-bundle sentinel\n');
}));

test('incomplete or unreadable source fails before either generated output changes', () => withRepo(repo => {
  const bundlePath = join(repo, 'public/cards-bundle.json');
  const indexPath = join(repo, 'public/card-feed-index.json');
  writeFileSync(bundlePath, 'old-bundle\n');
  writeFileSync(indexPath, 'old-index\n');
  rmSync(join(repo, 'public/cards', sha(2).slice(0, 16) + '.json'));
  producer(repo, [], 1);
  writeFileSync(join(repo, 'public/root.json'), '{');
  producer(repo, [], 1);
  assert.equal(readFileSync(bundlePath, 'utf8'), 'old-bundle\n');
  assert.equal(readFileSync(indexPath, 'utf8'), 'old-index\n');
}));

test('the committed-output gate catches a stale committed index even after the build repairs its working bytes', () => withRepo(repo => {
  const manifest = JSON.parse(readFileSync(join(project, 'docs/operations/PRODUCERS.json')));
  const entry = manifest.producers.find(item => item.id === 'card-feed-index');
  assert.equal(entry.mode, 'delegate-to-check-committed');
  assert.deepEqual(entry.outputs, ['public/card-feed-index.json']);
  mkdirSync(join(repo, 'docs/operations'), { recursive: true });
  writeFileSync(join(repo, 'docs/operations/PRODUCERS.json'), JSON.stringify({ producers: [entry] }));
  producer(repo);
  command(repo, 'git', ['init', '-q']);
  mkdirSync(join(repo, '.empty-hooks'));
  command(repo, 'git', ['config', 'core.hooksPath', join(repo, '.empty-hooks')]);
  command(repo, 'git', ['config', 'user.name', 'Feed fixture']);
  command(repo, 'git', ['config', 'user.email', 'feed-fixture@example.invalid']);
  command(repo, 'git', ['add', '--', 'scripts', 'docs', 'public']);
  command(repo, 'git', ['commit', '-qm', 'fresh fixture']);
  command(repo, process.execPath, ['scripts/producers-check.mjs']);
  const indexPath = join(repo, 'public/card-feed-index.json');
  const expected = readFileSync(indexPath);
  const stale = JSON.parse(expected);
  stale.entries[0].subject = 'stale committed subject';
  writeFileSync(indexPath, JSON.stringify(stale) + '\n');
  command(repo, 'git', ['add', '--', 'public/card-feed-index.json']);
  command(repo, 'git', ['commit', '-qm', 'stale fixture']);
  producer(repo);
  producer(repo, ['--check-feed-index']); // A plain post-build check cannot catch this defect.
  const gate = command(repo, process.execPath, ['scripts/producers-check.mjs'], 1);
  assert.match(gate.stdout + gate.stderr, /card-feed-index/);
  assert.deepEqual(readFileSync(indexPath), expected); // Gate restores the build's bytes.
}));
