import { expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('EAT A2A metadata classification runs all offline controls', () => {
  // Bind this source-qualified repair to its executed inputs. A later deliberate
  // source revision must qualify and update its receipt, not silently inherit it.
  const pins: Record<string, string> = {
    'probe.py': 'aa795ddc8f77b6b6062370a4b97bf0d1beaf7c9e5999e962d6f385d3d24492ee',
    'a2a_card_probe.py': '94b6ba413b1b90ed7c18e76fa5e54e09b37c02fb51a4567f62d1598d0eb3d4d9',
    'test_a2a_card_probe.py': '52c7e1a3938639b4a0099685a37a37d0d5263f0c7cfd9c637f48a40b82ac55b6',
  };
  for (const [name, digest] of Object.entries(pins)) {
    const bytes = readFileSync(new URL(`./auto-eat/${name}`, import.meta.url));
    expect(createHash('sha256').update(bytes).digest('hex'), name).toBe(digest);
  }
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
