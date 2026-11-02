import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { auditSpecialist, buildTree, sha256 } from './axis-specialists.mjs';

const registry = JSON.parse(readFileSync(new URL('../council-os/axis-specialists/registry.json', import.meta.url), 'utf8'));
const snapshot = JSON.parse(readFileSync(new URL('../council-os/axis-specialists/board-2026-11-01.snapshot.json', import.meta.url), 'utf8'));
const mcpTools = JSON.parse(readFileSync(new URL('../functions/mcp/gspc-tools.json', import.meta.url), 'utf8'));
const spec = registry.specialists.find((item) => item.axis === 'governance');
const row = snapshot.axes.find((item) => item.axis === 'governance');
const audit = (changes = {}) => auditSpecialist(spec, { ...row, ...changes }, registry);
const check = (value, id) => value.checks.find((item) => item.id === id);

describe('axis specialist evidence boundaries', () => {
  it('reports well-formed URL and digest references as declarations, not verification', () => {
    const value = audit();
    expect(check(value, 'FROZEN_BANK').state).toBe('DECLARED');
    expect(check(value, 'ROW_LINEAGE').state).toBe('DECLARED');
    expect(value.summary.declared).toBe(2);
    expect(value.summary.passed + value.summary.declared + value.summary.findings).toBe(value.summary.checks);
  });

  it.each(['not-a-url', 'javascript:alert(1)', 'https://u:p@example.test/bank', ' https://example.test/bank', '', null])('rejects invalid bank reference %s', (dataset_url) => {
    expect(check(audit({ dataset_url }), 'FROZEN_BANK').state).toBe('FINDING');
  });

  it.each(['not-a-digest', '0'.repeat(63), 'g'.repeat(64), '', null])('rejects invalid row digest %s', (peritem_file_sha256) => {
    const value = audit({ peritem_file_sha256 });
    expect(check(value, 'ROW_LINEAGE').state).toBe('FINDING');
    expect(value.summary.audit_state).toBe('IMPROVEMENT_REQUIRED');
  });

  it('does not imply source verification from an arbitrary syntactically valid digest', () => {
    const value = audit({ peritem_file_sha256: 'a'.repeat(64) });
    expect(check(value, 'ROW_LINEAGE').state).toBe('DECLARED');
    expect(check(value, 'ROW_LINEAGE').detail).toContain('not re-hashed');
  });

  it('surfaces fabricated-score findings ahead of an unmeasured-gap label', () => {
    const gap = snapshot.axes.find((item) => item.kind === 'declared-slot');
    const gapSpec = registry.specialists.find((item) => item.axis === gap.axis);
    const value = auditSpecialist(gapSpec, { ...gap, accuracy: 0.99 }, registry);
    expect(check(value, 'NO_FABRICATED_SCORE').state).toBe('FINDING');
    expect(value.summary.audit_state).toBe('IMPROVEMENT_REQUIRED');
    expect(auditSpecialist(gapSpec, gap, registry).summary.audit_state).toBe('MEASUREMENT_GAP_VISIBLE');
  });

  it('retains closed authority gates, source rows and content-bound derived outputs', () => {
    const files = buildTree({ registry, snapshot, mcpTools, sourceSlots: snapshot.axes });
    for (const spec of registry.specialists) {
      const value = files.get(`${spec.axis}.json`);
      const { audit_sha256, ...body } = value;
      expect(audit_sha256).toBe(sha256(body));
      expect(value.source.axis_row).toEqual(snapshot.axes.find((item) => item.axis === spec.axis));
      expect(value.human_gate).toMatchObject({ decision: 'HOLD', may_apply: false, receipt: null });
      expect(value.improvement_proposals.every((item) => item.state === 'PROPOSED_NOT_APPLIED')).toBe(true);
      expect(value.negative_controls.every((item) => item.state === 'SPECIFIED_NOT_RUN')).toBe(true);
    }
    const bundle = files.get('bundle.json');
    const { bundle_sha256, ...body } = bundle;
    expect(bundle_sha256).toBe(sha256(body));
    expect(files.get('index.json').bundle_sha256).toBe(bundle_sha256);
  });
});
