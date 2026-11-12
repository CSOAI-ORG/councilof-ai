import { expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

test('EAT A2A metadata classification runs all offline controls', () => {
  const fixture = fileURLToPath(new URL('./auto-eat/test_a2a_card_probe.py', import.meta.url));
  const result = spawnSync('python3', ['-B', fixture], {
    cwd: dirname(fixture), encoding: 'utf8', timeout: 20_000,
  });
  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  const lines = result.stdout.split('\n').filter(line => line.startsWith('A2A_PROBE_TEST_RESULT '));
  expect(lines).toHaveLength(1);
  const actual = JSON.parse(lines[0].slice('A2A_PROBE_TEST_RESULT '.length));
  expect(actual).toEqual({ tests: 41, failures: 0, errors: 0, skipped: 0,
    expected_failures: 0, unexpected_successes: 0, live_network_requests: 0 });
}, 25_000);
