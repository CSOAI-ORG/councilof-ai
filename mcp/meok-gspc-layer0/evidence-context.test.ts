// Keep the dependency-free suite in the existing required Vitest directory gate.
import { it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

it('public evidence reference boundary passes the offline conformance suite', () => {
  const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', fileURLToPath(new URL('./evidence-context.node-test.mjs', import.meta.url))],
    {encoding: 'utf8', timeout: 15000});
  expect(output).toMatch(/# fail 0/);
}, 20000);
