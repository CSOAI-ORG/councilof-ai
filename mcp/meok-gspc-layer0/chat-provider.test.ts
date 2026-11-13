// Keep the dependency-free chat suites in the existing required Vitest directory gate.
import { it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

it('chat provider bounds and coordinator routing pass the offline conformance suites', () => {
  const suites = ['./chat-provider.node-test.mjs', './chat-routing.node-test.mjs']
    .map(path => fileURLToPath(new URL(path, import.meta.url)));
  const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...suites],
    { encoding: 'utf8', timeout: 15000 });
  expect(output).toMatch(/# fail 0/);
}, 20000);
