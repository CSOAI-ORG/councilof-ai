import { test, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const example = fileURLToPath(new URL('../docs/research/bis-wp1374-merkle/', import.meta.url));

test('portable BIS Merkle example passes the pinned Python profile and input controls', () => {
  const result = spawnSync('python3', [
    '-m', 'unittest', 'discover', '-s', example, '-p', 'test_*.py', '-v',
  ], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  // Keep individual Python controls visible in the mandatory hosted test log.
  if (result.stderr) process.stdout.write(result.stderr);
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe('');
});
