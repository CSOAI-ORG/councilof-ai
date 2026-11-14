import { describe, expect, it } from 'vitest';
import { buildLedger, platformCategory, sourceObservationTime } from './distribution-ledger';
describe('per-entry observation provenance', () => {
  it('preserves an explicit source timestamp verbatim', () => {
    expect(sourceObservationTime({ checked_at: '2026-09-28T15:35:28.984Z' }, 'old')).toBe('2026-09-28T15:35:28.984Z');
  });
  it('does not replace explicit unknown dates with a ledger date', () => {
    for (const checked_at of [null, undefined, '', ' ', false, 42, {}]) {
      expect(sourceObservationTime({ checked_at }, 'old')).toBeNull();
    }
  });
  it('retains the historic fallback only when the entry has no date field', () => {
    expect(sourceObservationTime({}, '20260914T073000Z')).toBe('20260914T073000Z');
    expect(sourceObservationTime({}, null)).toBeNull();
  });
  it('accepts only the known destination categories', () => {
    expect(platformCategory('marketplace')).toBe('marketplace');
    expect(platformCategory('registry')).toBe('registry');
    for (const value of [undefined, null, 'unknown', 1]) expect(platformCategory(value)).toBe('channel');
  });
  it('does not re-date the older platform records when adding one observation', () => {
    for (const row of buildLedger().filter(x => x.source_file === 'public/interop/platforms-registered.json' && x.platform !== 'x402scan')) {
      expect(row.checked_at).toBe('20260914T073000Z');
    }
  });
});
