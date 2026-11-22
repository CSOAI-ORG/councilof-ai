import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Required gate coverage for the recovered bridge', () => {
  it('scopes bridge changes into the required suite and actually collects their tests', () => {
    const workflow = readFileSync(new URL('../../.github/workflows/pr-gates.yml', import.meta.url), 'utf8');
    const scopeLine = workflow.split('\n').find(line => line.trim().startsWith('gated=$('))!;
    const expression = scopeLine.match(/grep -E '([^']+)'/)?.[1];
    expect(expression).toBeDefined();
    const scope = new RegExp(expression!);
    for (const file of ['server.mjs', 'core.mjs', 'core.test.ts', 'gate-wiring.test.ts']) {
      expect(scope.test(`mcp/meok-gspc-layer0/${file}`), file).toBe(true);
    }
    expect(scope.test('functions/api/research-plan.ts')).toBe(true);
    expect(scope.test('mcp/unrelated-source/notes.md')).toBe(false);
    const targets = workflow.match(/run: npx vitest run ([^\n]+)/)?.[1].trim().split(/\s+/);
    expect(targets).toContain('mcp/meok-gspc-layer0');
  });
});
