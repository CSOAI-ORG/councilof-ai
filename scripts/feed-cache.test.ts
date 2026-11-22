import { expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('the card feed index and Cache API contracts pass their offline native suites', () => {
  const fixture = fileURLToPath(new URL('./feed-cache.node-test.mjs', import.meta.url));
  const producer = fileURLToPath(new URL('./card-feed-index.node-test.mjs', import.meta.url));
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-reporter=tap', fixture, producer], {
    encoding: 'utf8', timeout: 30_000,
  });
  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  expect(result.stdout).toMatch(/# tests 27\b/);
  expect(result.stdout).toMatch(/# fail 0\b/);
  expect(result.stdout).toMatch(/# skipped 0\b/);
}, 35_000);
