import {describe,it,expect,vi,afterEach} from 'vitest';
import {onRequestGet} from './evidence-bundle';
afterEach(()=>vi.unstubAllGlobals());
describe('unavailable evidence corpus is not an empty deliverable',()=>{
 it('returns a qualified preview when source is unavailable',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('fixture offline')}));const r=await onRequestGet({request:new Request('https://example.invalid/api/evidence-bundle?obligation=article-50'),env:{}} as never);const b=await r.json();expect(r.status).toBe(200);expect(b.relevant_signed_cards).toBeNull();expect(b.corpus.state).toBe('UNAVAILABLE_OR_INVALID');});
 it('does not contact a facilitator when a payment is presented for unreadable evidence',async()=>{const reads=vi.fn(async()=>new Response('missing',{status:404}));vi.stubGlobal('fetch',reads);const r=await onRequestGet({request:new Request('https://example.invalid/api/evidence-bundle?obligation=article-50&bundle=1',{headers:{'x-payment':'fixture-not-a-payment'}}),env:{}} as never);const b=await r.json();expect(r.status).toBe(503);expect(b.settlement_attempted).toBe(false);expect(reads).toHaveBeenCalledTimes(1);expect(String(reads.mock.calls[0][0])).toContain('/cards-bundle.json');});
});
