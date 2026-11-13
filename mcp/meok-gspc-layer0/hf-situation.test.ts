import { it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
it('bounded existing HF worker adapter passes offline conformance', () => {
  const path = fileURLToPath(new URL('./hf-situation.node-test.mjs', import.meta.url));
  const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', path], { encoding: 'utf8', timeout: 15000 });
  expect(output).toMatch(/# fail 0/);
}, 20000);
