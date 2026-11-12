import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function run(args: string[]) {
  const result = spawnSync('python3', ['-B', ...args], {
    cwd: root, encoding: 'utf8', timeout: 25_000, maxBuffer: 1024 * 1024,
  });
  expect(result.error, `${result.error ?? ''}`).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  return result;
}

describe('public game concept pages', () => {
  it('runs the offline generation, metadata and negative controls', () => {
    const result = run(['scripts/badger/test_game_concept_pages.py']);
    expect(result.stderr).toContain('OK');
  }, 30_000);
  it('keeps all committed outputs byte-identical to the canonical generator', () => {
    run(['scripts/badger/csoai-fix-game-pages.py', '--check']);
  }, 30_000);
});
