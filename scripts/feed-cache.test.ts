import { expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('the card feed Cache API contract passes its offline native suite', () => {
  const fixture = fileURLToPath(new URL('./feed-cache.node-test.mjs', import.meta.url));
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-reporter=tap', fixture], {
    encoding: 'utf8', timeout: 20_000,
  });
  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  expect(result.stdout).toMatch(/# tests 15\b/);
  expect(result.stdout).toMatch(/# fail 0\b/);
  expect(result.stdout).toMatch(/# skipped 0\b/);
}, 25_000);
