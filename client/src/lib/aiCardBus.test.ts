import { describe, it, expect, beforeEach } from 'vitest';
import { emitCard, promoteCard, getCards } from './aiCardBus';

// The card pipeline is the "OS watches itself" guarantee — guard it with a
// real unit test (node env; localStorage absence is handled by the module).
describe('aiCardBus', () => {
  beforeEach(() => {
    // drain the bus between tests
    getCards().forEach((c) => promoteCard(c.id, 'drain')); // no-op semantics, keeps shape
  });

  it('emits a C-space card for an AI call', () => {
    const card = emitCard({ kind: 'dock-ask', summary: 'what does Article 50 require?', latencyMs: 500, source: 'live' });
    expect(card.space).toBe('C');
    expect(card.id).toMatch(/^ac-/);
    expect(getCards()[0].id).toBe(card.id);
    expect(getCards()[0].summary).toContain('Article 50');
  });

  it('promotes a C card to a J card with evidence (signed outcome)', () => {
    const card = emitCard({ kind: 'council-verdict', summary: 'triage AI permitted with conditions', source: 'live' });
    promoteCard(card.id, 'sov-time ledger · cspace-verdict');
    const j = getCards().find((c) => c.id === card.id);
    expect(j?.space).toBe('J');
    expect(j?.evidence).toBe('sov-time ledger · cspace-verdict');
  });

  it('caps the stream at 50 cards', () => {
    for (let i = 0; i < 60; i++) emitCard({ kind: 'kb-lookup', summary: 'q' + i, source: 'local-sim' });
    expect(getCards().length).toBeLessThanOrEqual(50);
  });
});
