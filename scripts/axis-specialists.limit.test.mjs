import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildTree, sha256 } from './axis-specialists.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const registry = read('../council-os/axis-specialists/registry.json');
const snapshot = read('../council-os/axis-specialists/board-2026-11-02.snapshot.json');
const mcpTools = read('../functions/mcp/gspc-tools.json');

describe('axis specialist stated limit', () => {
  it('carries a current slot limit into its audit and index entry, and adds no key for a slot without one', () => {
    // The limit comes from the current board slot, never from the frozen snapshot row. The
    // snapshot rows stand in for the current slots here, as in the evidence test.
    const limit = 'What this score does not show, stated on the current board row (C-0000-0000-00).';
    const plain = snapshot.axes.map(({ limit: _none, ...row }) => row);
    const slots = plain.map((row) =>
      row.axis === 'claim-maintenance' ? { ...row, limit } : row.axis === 'governance' ? { ...row, limit: '' } : row);
    const before = buildTree({ registry, snapshot, mcpTools, sourceSlots: plain });
    const after = buildTree({ registry, snapshot, mcpTools, sourceSlots: slots });

    const audit = after.get('claim-maintenance.json');
    expect(audit.limit).toBe(limit);
    expect(audit.source.axis_row).toEqual(snapshot.axes.find((row) => row.axis === 'claim-maintenance'));
    const { audit_sha256, ...body } = audit;
    expect(audit_sha256).toBe(sha256(body));
    const entry = after.get('index.json').specialists.find((row) => row.axis === 'claim-maintenance');
    expect(entry.limit).toBe(limit);
    expect(entry.audit_sha256).toBe(audit_sha256);

    for (const axis of ['governance', 'safety']) {
      expect(Object.hasOwn(after.get(`${axis}.json`), 'limit')).toBe(false);
      expect(Object.hasOwn(after.get('index.json').specialists.find((row) => row.axis === axis), 'limit')).toBe(false);
    }
    for (const { axis } of plain.filter((row) => row.axis !== 'claim-maintenance')) {
      expect(JSON.stringify(after.get(`${axis}.json`), null, 2)).toBe(JSON.stringify(before.get(`${axis}.json`), null, 2));
    }
  });
});
