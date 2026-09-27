import {describe, it, expect} from 'vitest';
import {toCard, type ManifestResource} from './servicesCatalogue';
const resource = {url: 'https://councilof.ai/api/proof'};
describe('A service listing does not invent missing commercial facts', () => {
  it.each([undefined, null, '25000', 25000])('does not claim free service when details are absent and amount is %s', amount => {
    const card = toCard({...resource, amount}, 'model-measurement');
    expect(card.freeForever).toBe(false);
    expect(card.measures).not.toMatch(/free/i);
    expect(card.measures).toMatch(/not supplied/i);
  });
  it('treats whitespace-only descriptions as missing rather than free', () => {
    expect(toCard({...resource, note: '  ', paid_for: ' '}, 'model-measurement').measures).toMatch(/not supplied/i);
  });
  it('ignores malformed descriptive values without crashing or promoting them', () => {
    const bad = {...resource, note: false, paid_for: {value: 'assembly'}} as unknown as ManifestResource;
    expect(() => toCard(bad, 'model-measurement')).not.toThrow();
    expect(toCard(bad, 'model-measurement').measures).toMatch(/not supplied/i);
  });
  it('retains the declared purpose when valid', () => {
    expect(toCard({...resource, paid_for: ' assembly '}, 'model-measurement').measures).toBe('Paid for assembly.');
  });
  it.each([0, '0'])('keeps an explicitly declared free resource unchanged: %s', amount => {
    const card = toCard({...resource, amount}, 'model-measurement');
    expect(card.freeForever).toBe(true);
    expect(card.measures).toBe('Free forever.');
    expect(card.payLine).toBe('Free forever — it settles and charges nothing.');
  });
  it('uses a valid source note without replacing it with promotional copy', () => {
    expect(toCard({...resource, note: 'Historical evidence; new work not established.', paid_for: 'assembly'}, 'model-measurement').measures).toBe('Historical evidence; new work not established.');
  });
});
