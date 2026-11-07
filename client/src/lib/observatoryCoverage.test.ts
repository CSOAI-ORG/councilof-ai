import {describe,it,expect} from 'vitest';
import {parseCoverage} from './observatoryCoverage';
describe('coverage separates source counts from measurement',()=>{
 it('recounts distinct asset identities not same tickers',()=>expect(parseCoverage('stablecoin-supply',{schema:'csoai.stablecoin-universe-supply/0.1',rows:[{asset_id:'1',symbol:'USDV',state:'MEASURED'},{asset_id:'2',symbol:'USDV',state:'UNMEASURED'}]}).count).toBe(2));
 it('rejects duplicate registry IDs',()=>expect(()=>parseCoverage('stablecoin-index',{schema:'csoai.stablecoin-index.v1',assets:[{id:'1'},{id:'1'}]})).toThrow());
 it('does not default an unknown count to zero',()=>expect(parseCoverage('x402',{kind:'csoai.x402-catalog-trust-snapshot/0.1',counts:{total:null}}).count).toBeNull());
 it.each([-1,2.5,'100',NaN])('rejects invalid aggregate %s',total=>expect(parseCoverage('x402',{kind:'csoai.x402-catalog-trust-snapshot/0.1',counts:{total}}).count).toBeNull());
 it('rejects HTML-like or unrelated success payloads',()=>expect(()=>parseCoverage('api',{title:'Loading'})).toThrow());
 it('does not invent witness success',()=>expect(parseCoverage('layer0',{kind:'csoai.root-witness/v1'}).detail).toContain('NOT_RECORDED'));
 it('counts API paths without calling them',()=>expect(parseCoverage('api',{openapi:'3.1.0',paths:{'/one':{},'/two':{}}}).count).toBe(2));
 it('preserves unmeasured states',()=>expect(parseCoverage('stablecoin-supply',{schema:'csoai.stablecoin-universe-supply/0.1',rows:[{asset_id:'1',state:'UNMEASURED'}]}).detail).toBe('1 recorded UNMEASURED'));
});
