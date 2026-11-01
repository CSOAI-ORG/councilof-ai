import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildTree, loadCharterMap, validateCharterMap } from './axis-specialists.mjs';
import { loadSlots } from './build-axis-reports.mjs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const registry = read('../council-os/axis-specialists/registry.json');
const snapshot = read('../council-os/axis-specialists/board-2026-10-28.snapshot.json');
const mcpTools = read('../functions/mcp/gspc-tools.json');
const axes = snapshot.axes.map(row => row.axis);
describe('all-axis charter integration', () => {
  it('connects exactly the source axes without changing their measurement or authority', async () => {
    const tree = buildTree({ registry, snapshot, sourceSlots: await loadSlots(), mcpTools });
    expect(tree.get('index.json').coverage).toMatchObject({
      specialists: axes.length,
      charter_connections: axes.length,
      review_connections: axes.length,
    });
    for (const row of snapshot.axes) {
      const audit = tree.get(`${row.axis}.json`);
      expect(audit.source.axis_row).toEqual(row);
      expect(audit.charter.articles.length).toBeGreaterThan(0);
      expect(audit.review).toMatchObject({ state: 'NOT_SUBMITTED', execution_authority: false, challenge_url: '/api/hitl/challenge', competency_url: `/api/hitl/modules/${row.axis}` });
      expect(audit.human_gate).toMatchObject({ decision: 'HOLD', receipt: null, may_apply: false });
    }
    for (const [name, expected] of tree) expect(read(`../public/axis-specialists/${name}`)).toEqual(expected);
  });
  it.each(['bytes', 'version', 'missing-axis', 'duplicate-axis', 'unknown-article', 'duplicate-article', 'compliance-claim'])(
    'refuses %s in the charter mapping', mode => {
      const context = structuredClone(loadCharterMap());
      if (mode === 'bytes') context.digest = '0'.repeat(64);
      if (mode === 'version') context.charter.version = '9.0.0';
      if (mode === 'missing-axis') context.mapping.axes.pop();
      if (mode === 'duplicate-axis') context.mapping.axes[1].axis = context.mapping.axes[0].axis;
      if (mode === 'unknown-article') context.mapping.axes[0].articles.push(999);
      if (mode === 'duplicate-article') context.mapping.axes[0].articles.push(context.mapping.axes[0].articles[0]);
      if (mode === 'compliance-claim') context.mapping.mapping_kind = 'CERTIFIED';
      expect(validateCharterMap(context, axes).length).toBeGreaterThan(0);
      expect(() => buildTree({ registry, snapshot, sourceSlots: snapshot.axes, mcpTools, charterContext: context })).toThrow();
    });
});
