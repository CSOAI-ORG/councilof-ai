import { describe, expect, it } from 'vitest';
import { buildLedger } from './distribution-ledger';
import platforms from '../../public/interop/platforms-registered.json';

const canonical = 'https://www.x402scan.com/server/9b8bcb34-6c9f-45d6-b881-9a6afe7bf6b5';
const resource = 'https://councilof.ai/api/evidence-bundle?obligation=article-50&bundle=1';

describe('dated external registration feeds the existing ledger', () => {
  it('deduplicates the catalog row and preserves the scoped resource', () => {
    const rows = buildLedger().filter(x => x.platform === 'x402scan');
    expect(rows).toHaveLength(1);
    expect(rows[0].canonical_url).toBe(canonical);
    expect(rows[0].resource).toBe(resource);
    expect(rows[0].state).toBe('live');
  });
  it('uses the recorded per-entry readback time, not the old whole-file date', () => {
    const row = buildLedger().find(x => x.platform === 'x402scan');
    expect(row?.checked_at).toBe('2026-09-28T15:35:28.984Z');
    expect(platforms.as_of).toBe('20260914T073000Z');
  });
  it('classifies the marketplace explicitly, not as a broadcast channel', () => {
    expect(buildLedger().find(x => x.platform === 'x402scan')?.category).toBe('marketplace');
  });
  it('preserves limitations instead of treating duplicate rows as sales', () => {
    const row = buildLedger().find(x => x.platform === 'x402scan');
    expect(row?.proof_note).toContain('Net-new listing count unknown');
    expect(row?.proof_note).toContain('not two products');
    expect(row?.proof_note).toContain('No payment');
  });
});
