import {describe,it,expect} from 'vitest';import {onRequest} from './pricing-free';import {onRequest as current} from './pricing';
describe('retired free-rail URL',()=>{
 it.each(['GET','HEAD'])('takes %s directly to the existing canonical overview',async method=>{const r=await onRequest({request:new Request('https://councilof.ai/pricing-free?redirect=https://outside.invalid',{method})} as never);expect(r.status).toBe(308);expect(r.headers.get('location')).toBe(current().headers.get('location'));expect(r.headers.get('location')).toBe('/dashboard/?tab=measured&task=pricing-overview');expect(await r.text()).toBe('');});
 it('does not accept a mutation or start a paid request',async()=>{const r=await onRequest({request:new Request('https://councilof.ai/pricing-free',{method:'POST',body:'{}'})} as never);expect(r.status).toBe(405);expect(r.headers.get('location')).toBeNull();expect(r.headers.get('allow')).toBe('GET, HEAD');});
});
