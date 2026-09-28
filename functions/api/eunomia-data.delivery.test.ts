import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {createHash,webcrypto} from 'node:crypto';
const h=vi.hoisted(()=>({pay:vi.fn(),offer:vi.fn(),sources:vi.fn(),mode:'ok'}));
vi.mock('./_x402',()=>({verifyX402Payment:(...a:any[])=>h.pay(...a),x402Accepts:()=>[{}],buildPaymentRequiredV2:(x:unknown)=>x,declareBazaarHttpGet:(x:unknown)=>x,paymentRequiredResponseSigned:(x:unknown)=>{h.offer();return new Response(JSON.stringify(x),{status:402});},hasPaymentHeader:(r:Request)=>r.headers.has('x-payment'),CSOAI_LID:'test only'}));
vi.mock('./_x402_config',()=>({railMode:()=>({mode:'synthetic'})}));
import {onRequestGet,onRequestPost,onRequestOptions} from './eunomia-data';
import {canonicalBytes} from '../_lib/cardSign';
import {FEED_SOURCES,SOURCE_CAP,readFeedSource,sourceShapeIssue,safeFeedJson} from './_eunomia_delivery';
const ORIGIN='https://councilof.ai';const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const source=()=>({'/signals/_index.json':{schema:'csoai.signals',as_of:'2026-09-20T00:00:00Z',signals:[{axis:'fixture'}]},'/api/fines':{schema:'csoai.enforcement-corpus/0.1',as_of:'2026-08-24',signature_absent:'fixture'},'/root.json':{as_of:'2026-09-22T00:00:00Z',card_count:1,merkle_root:'a'.repeat(64)},'/signed/card_index.json':{cards:[{id:'synthetic'}]}} as Record<string,any>);
let data:Record<string,any>;
const call=(query:string,headers:Record<string,string>={},method='GET')=>(onRequestGet as any)({request:new Request(ORIGIN+'/api/eunomia-data'+query,{headers,method}),env:{},params:{}}) as Promise<Response>;
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);data=source();h.pay.mockReset().mockImplementation(async(r:Request)=>r.headers.has('x-payment')?{ok:true,settlement:{transaction:'synthetic'},paymentResponse:'test-only'}:{ok:false,reason:'no payment'});h.offer.mockClear();h.sources.mockReset().mockImplementation(async(u:string)=>new Response(JSON.stringify(data[new URL(u).pathname]),{headers:{'content-type':'application/json'}}));vi.stubGlobal('fetch',h.sources);});
afterEach(()=>vi.unstubAllGlobals());
describe('manifest and delivery',()=>{
 it('free manifest never settles or signs even with presented payment',async()=>{const r=await call('?manifest=1',{'x-payment':'synthetic'});const b:any=await r.json();expect(r.status).toBe(200);expect(b.free).toBe(true);expect(b.settlement_attempted).toBe(false);expect(b.coverage.required_blocks.length).toBe(4);expect(b).not.toHaveProperty('blocks');expect(h.pay).not.toHaveBeenCalled();expect(h.offer).not.toHaveBeenCalled();});
 it('manifest priority over paid query',async()=>{expect((await call('?manifest=1&feed=1',{'x-payment':'x'})).status).toBe(200);expect(h.pay).not.toHaveBeenCalled();});
 it('manifest retains per-source original dates and unknown dates',async()=>{const b:any=await (await call('?manifest=1')).json();expect(b.sources.find((x:any)=>x.name==='first_fine_watch').as_of).toBe('2026-08-24');expect(b.sources.find((x:any)=>x.name==='card_index').as_of).toBeNull();expect(b.freshness.max_age_hours).toBeNull();});
 it('identical data makes identical manifest',async()=>{expect(await (await call('?manifest=1')).text()).toBe(await (await call('?manifest=1')).text());});
 it('pin mismatch blocks before payment/signing',async()=>{const r=await call('?feed=1',{'x-payment':'x','x-csoai-expected-feed-sha256':'0'.repeat(64)});expect(r.status).toBe(409);expect(h.pay).not.toHaveBeenCalled();expect(h.offer).not.toHaveBeenCalled();expect((await r.json() as any).settled).toBe(false);});
 for(const bad of ['','ABC','A'.repeat(64),'0'.repeat(63),'0'.repeat(65),'not-a-hash'])it('malformed pin rejected before source reads: '+bad.length,async()=>{expect((await call('?feed=1',{'x-payment':'x','x-csoai-expected-feed-sha256':bad})).status).toBe(400);expect(h.sources).not.toHaveBeenCalled();expect(h.pay).not.toHaveBeenCalled();});
 it('matching pin keeps exact original blocks and recorded target',async()=>{const manifest:any=await (await call('?manifest=1')).json();const r=await call('?feed=1&note=one',{'x-payment':'x','x-csoai-expected-feed-sha256':manifest.evidence.blocks_sha256});const raw=new Uint8Array(await r.arrayBuffer());const b=JSON.parse(new TextDecoder().decode(raw));expect(r.status).toBe(200);expect(hash(raw)).toBe(r.headers.get('x-csoai-payload-sha256'));expect(hash(canonicalBytes(b.blocks))).toBe(manifest.evidence.blocks_sha256);expect(b.delivery_manifest).toEqual(manifest);expect(b.request_record.target_sha256).toBe(hash(new TextEncoder().encode('GET\n'+ORIGIN+'/api/eunomia-data?feed=1&note=one')));expect(b.request_record.signed).toBe(false);expect(h.pay).toHaveBeenCalledOnce();expect(r.headers.get('access-control-expose-headers')).toContain('x-payment-response');});
 it('source change after manifest produces409, not payment',async()=>{const m:any=await (await call('?manifest=1')).json();data['/signals/_index.json'].signals.push({axis:'changed'});expect((await call('?feed=1',{'x-payment':'x','x-csoai-expected-feed-sha256':m.evidence.blocks_sha256})).status).toBe(409);expect(h.pay).not.toHaveBeenCalled();});
 it('format-only change changes raw source hash, not data pin',async()=>{const m:any=await (await call('?manifest=1')).json();h.sources.mockImplementation(async(u:string)=>new Response(JSON.stringify(data[new URL(u).pathname],null,4)));const n:any=await (await call('?manifest=1')).json();expect(n.evidence.blocks_sha256).toBe(m.evidence.blocks_sha256);expect(n.sources[0].response_sha256).not.toBe(m.sources[0].response_sha256);});
 it('legacy paid client gets data and added manifest without a pin',async()=>{const r=await call('?feed=1',{'x-payment':'x'});expect(r.status).toBe(200);expect((await r.json() as any).delivery_manifest.schema).toBe('csoai.eunomia-feed-manifest/1.0');});
 it('free preview gains a usable manifest',async()=>{const b:any=await (await call('')).json();expect(b.kind).toBe('preview');expect(b.delivery_manifest).toBeTruthy();expect(h.pay).not.toHaveBeenCalled();});
 it('unpaid offer does not claim every source is signed',async()=>{
  const r=await call('?feed=1');
  const b:any=await r.json();
  expect(r.status).toBe(402);
  expect(b.description).toContain('any published signatures');
  expect(b.description).not.toContain('A signed JSON feed');
 });
 it('bare feed still gives402',async()=>{const r=await call('?feed=1');expect(r.status).toBe(402);expect((await r.json() as any).csoai.free_manifest).toBe(ORIGIN+'/api/eunomia-data?manifest=1');});
 it('post alias preserves method in request record',async()=>{expect(onRequestPost).toBe(onRequestGet);const b:any=await (await call('?feed=1',{'x-payment':'x'},'POST')).json();expect(b.request_record.method).toBe('POST');});
 it('legacy x402 query remains a paid selector',async()=>{expect((await call('?x402=1',{'x-payment':'x'})).status).toBe(200);});
 it('browser preflight has no source/payment work',async()=>{const r=await (onRequestOptions as any)({});expect(r.status).toBe(204);expect(r.headers.get('access-control-allow-headers')).toContain('x-csoai-expected-feed-sha256');expect(h.sources).not.toHaveBeenCalled();expect(h.pay).not.toHaveBeenCalled();});
});
describe('Pages-local source transport',()=>{
 it('production apex falls back to the same Pages project when ASSETS is absent',async()=>{
  h.sources.mockImplementation(async(u:string)=>{
   const x=new URL(u);
   expect(x.origin).toBe('https://councilof-ai.pages.dev');
   const response=new Response(JSON.stringify(data[x.pathname]),{headers:{'content-type':'application/json'}});
   Object.defineProperty(response,'url',{value:u});
   return response;
  });
  const r=await call('?manifest=1');
  expect(r.status).toBe(200);
  const b:any=await r.json();
  expect(b.coverage.complete_assembly).toBe(true);
  expect(b.sources.every((x:any)=>x.url.startsWith(ORIGIN))).toBe(true);
  expect(b.sources.every((x:any)=>x.transport_url.startsWith('https://councilof-ai.pages.dev/'))).toBe(true);
  expect(h.sources).toHaveBeenCalledTimes(4);
 });
 it('reads static files through ASSETS and fines through the free function',async()=>{
  h.sources.mockRejectedValue(new Error('public self-fetch disabled'));
  const assets={fetch:vi.fn(async(r:Request)=>new Response(JSON.stringify(data[new URL(r.url).pathname]),{headers:{'content-type':'application/json'}}))};
  const r=await (onRequestGet as any)({request:new Request(ORIGIN+'/api/eunomia-data?manifest=1'),env:{ASSETS:assets},params:{}});
  expect(r.status).toBe(200);
  const b:any=await r.json();
  expect(b.coverage.complete_assembly).toBe(true);
  expect(b.sources.find((x:any)=>x.name==='first_fine_watch').url).toBe(ORIGIN+'/api/fines');
  expect(assets.fetch).toHaveBeenCalledTimes(3);
  expect(h.sources).not.toHaveBeenCalled();
 });
 it('preserves the fines signature when a signing key is bound',async()=>{
  const key=await webcrypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']);
  const der=await webcrypto.subtle.exportKey('pkcs8',key.privateKey);
  const assets={fetch:vi.fn(async(r:Request)=>new Response(JSON.stringify(data[new URL(r.url).pathname]),{headers:{'content-type':'application/json'}}))};
  const r=await (onRequestGet as any)({request:new Request(ORIGIN+'/api/eunomia-data?feed=1', {headers:{'x-payment':'synthetic'}}),env:{ASSETS:assets,BOARD_SIGN_KEY_PKCS8_B64:Buffer.from(der).toString('base64')},params:{}});
  expect(r.status).toBe(200);
  const b:any=await r.json();
  expect(b.blocks.first_fine_watch.signature.alg).toBe('Ed25519');
  expect(b.blocks.first_fine_watch.signature.sig).toMatch(/^[a-f0-9]{128}$/);
  expect(b.blocks.first_fine_watch.signature_absent).toBeUndefined();
  expect(b.delivery_manifest.sources.find((x:any)=>x.name==='first_fine_watch').response_sha256).toMatch(/^[a-f0-9]{64}$/);
 });
 it('signing-error object never appears as a signed fines stream',async()=>{
  data['/api/fines'].signature={error:'signing key present but unusable'};
  const r=await call('');
  const b:any=await r.json();
  expect(b.streams.first_fine_watch.signed).toBe(false);
  expect(b.streams.first_fine_watch.signature_verification).toBe('NOT_PERFORMED');
 });
 it('missing Pages asset fails before an unpaid 402',async()=>{
  const assets={fetch:vi.fn(async(r:Request)=>new URL(r.url).pathname==='/root.json'?new Response('down',{status:503}):new Response(JSON.stringify(data[new URL(r.url).pathname])))};
  const r=await (onRequestGet as any)({request:new Request(ORIGIN+'/api/eunomia-data?feed=1'),env:{ASSETS:assets},params:{}});
  expect(r.status).toBe(503);expect(h.pay).not.toHaveBeenCalled();expect(h.offer).not.toHaveBeenCalled();
 });
});
describe('read-before-settle failure controls',()=>{
 for(const name of Object.values(FEED_SOURCES))it('missing '+name+' blocks paid request',async()=>{h.sources.mockImplementation(async(u:string)=>new URL(u).pathname===name?new Response('down',{status:503}):new Response(JSON.stringify(data[new URL(u).pathname])));expect((await call('?feed=1',{'x-payment':'x'})).status).toBe(503);expect(h.pay).not.toHaveBeenCalled();expect(h.offer).not.toHaveBeenCalled();});
 it('all failures block instead of original200',async()=>{h.sources.mockImplementation(async()=>new Response('down',{status:503}));expect((await call('?feed=1',{'x-payment':'x'})).status).toBe(503);expect(h.pay).not.toHaveBeenCalled();});
 it('unavailable free manifest is503',async()=>{h.sources.mockRejectedValue(new Error('failure'));expect((await call('?manifest=1')).status).toBe(503);expect(h.pay).not.toHaveBeenCalled();});
 it('partial preview remains readable without fake complete manifest',async()=>{h.sources.mockImplementation(async()=>new Response('down',{status:503}));const b:any=await (await call('')).json();expect(b.delivery_manifest).toBeNull();expect(b.streams.root.as_of).toBeNull();});
 for(const bad of [null,[],{}, {error:'bad'}])it('invalid source shape does not settle: '+JSON.stringify(bad),async()=>{data['/signals/_index.json']=bad;expect((await call('?feed=1',{'x-payment':'x'})).status).toBe(503);expect(h.pay).not.toHaveBeenCalled();});
 it('HTML is not a source JSON',async()=>{h.sources.mockImplementation(async()=>new Response('<html>ok</html>'));expect((await call('?manifest=1')).status).toBe(503);});
 it('oversized source is bounded',async()=>{h.sources.mockImplementation(async()=>new Response(' '.repeat(SOURCE_CAP+1)));const r=await readFeedSource(ORIGIN+'/root.json','root');expect(r.ok).toBe(false);});
 it('invalid UTF8 is not silently substituted',async()=>{h.sources.mockImplementation(async()=>new Response(new Uint8Array([255,255])));expect((await readFeedSource(ORIGIN+'/root.json','root')).ok).toBe(false);});
 it('source transport rejects redirects',async()=>{await readFeedSource(ORIGIN+'/root.json','root');expect(h.sources.mock.calls[0][1].redirect).toBe('manual');expect(h.sources.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);});
 it('redirect response is not silently followed into a paid feed',async()=>{h.sources.mockImplementation(async(u:string)=>new URL(u).pathname===FEED_SOURCES.root?Response.redirect(ORIGIN+'/other',302):new Response(JSON.stringify(data[new URL(u).pathname])));const r=await call('?feed=1');expect(r.status).toBe(503);expect(h.pay).not.toHaveBeenCalled();expect(h.offer).not.toHaveBeenCalled();});
 it('source schema tests do not assert signature validity',()=>{expect(sourceShapeIssue('first_fine_watch',{schema:'csoai.enforcement',signature:{error:'no signature'}})).toBeNull();});
});

describe('canonical safety',()=>{
 it('nonfinite values cannot silently become null',()=>expect(safeFeedJson({v:Infinity})).toBe(false));
 it('prototype keys cannot disappear from the commitment',()=>expect(safeFeedJson(JSON.parse('{"__proto__":{"x":1}}'))).toBe(false));
 it('excessive nesting is rejected',()=>{let x:any={};for(let i=0;i<60;i++)x={x};expect(safeFeedJson(x)).toBe(false);});
 it('ordinary Unicode and numeric keys are supported',()=>expect(safeFeedJson({'é':'£','10':2,'2':1,x:[true,null]})).toBe(true));
});

describe('actual handler to independent offline checker',()=>{
 it('replays exact synthetic delivered bytes and detects altered request/body',async()=>{
  const {verifyFeed}=await import('../../scripts/verify_feed_delivery.mjs');
  const mr=await call('?manifest=1');const mraw=Buffer.from(await mr.arrayBuffer());const m=JSON.parse(mraw.toString());
  const response=await call('?feed=1',{'x-payment':'synthetic','x-csoai-expected-feed-sha256':m.evidence.blocks_sha256});const raw=Buffer.from(await response.arrayBuffer());
  const options={requestUrl:ORIGIN+'/api/eunomia-data?feed=1',method:'GET',payloadSha256:response.headers.get('x-csoai-payload-sha256')};
  const result=verifyFeed(mraw,raw,options);expect(result.state).toBe('FEED_CONTENT_MATCHES_RETAINED_MANIFEST');expect(result.payment_verified).toBe(false);expect(result.signatures_verified).toBe(false);
  expect(()=>verifyFeed(mraw,raw,{...options,requestUrl:options.requestUrl+'&changed=1'})).toThrow(/request record/);
  expect(()=>verifyFeed(mraw,Buffer.concat([raw,Buffer.from(' ')]),options)).toThrow(/response bytes/);
 });
});
