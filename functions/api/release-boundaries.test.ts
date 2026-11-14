import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { objectOrNull, objectArrayOrNull, readObjectResponse, stringArrayOrNull } from '../_lib/jsonShape';
import { verifyPaddleSignature } from '../_lib/paddleSignature';
import { onRequestPost, canonicalEntitlement } from './paddle-webhook';
import { onRequestGet as regulator } from './regulator-findings';
import { onRequestGet as cross } from './cross';
import { onRequestGet as cards } from './cards';
const secret = 'fixture-only-webhook-secret-not-a-real-credential';
const time = 1_800_000_000;
const signedHeader = (body: string, timestamp = time, key = secret) => `ts=${timestamp};h1=${createHmac('sha256',key).update(`${timestamp}:${body}`).digest('hex')}`;
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });
describe('JSON boundary guards', () => {
  it.each([null, [], 4, 'text', true])('rejects non-record %s', v => expect(objectOrNull(v)).toBeNull());
  it('rejects mixed records', () => expect(objectArrayOrNull([{},null])).toBeNull());
  it('rejects mixed strings', () => expect(stringArrayOrNull(['x',1])).toBeNull());
  it('preserves empty valid collections', () => expect(stringArrayOrNull([])).toEqual([]));
  it('rejects HTML status 200', async () => expect(await readObjectResponse(new Response('<html>Loading</html>',{headers:{'content-type':'text/html'}}))).toBeNull());
  it('rejects malformed JSON', async () => expect(await readObjectResponse(new Response('{bad',{headers:{'content-type':'application/json'}}))).toBeNull());
});
describe('Paddle documented timestamp/HMAC contract', () => {
  it('verifies timestamp and exact body', async () => expect(await verifyPaddleSignature(secret,'{"a":1}',signedHeader('{"a":1}'),time)).toBe(true));
  it('rejects changed body', async () => expect(await verifyPaddleSignature(secret,'{"a":2}',signedHeader('{"a":1}'),time)).toBe(false));
  it('rejects expired signatures', async () => expect(await verifyPaddleSignature(secret,'{}',signedHeader('{}',time-6),time)).toBe(false));
  it('rejects future signatures', async () => expect(await verifyPaddleSignature(secret,'{}',signedHeader('{}',time+6),time)).toBe(false));
  it('rejects duplicate timestamps', async () => expect(await verifyPaddleSignature(secret,'{}',signedHeader('{}')+`;ts=${time}`,time)).toBe(false));
  it('rejects the old invented hmac header', async () => expect(await verifyPaddleSignature(secret,'{}','hmac:'+'a'.repeat(64),time)).toBe(false));
  it('accepts rotation h1 values', async () => expect(await verifyPaddleSignature(secret,'{}',signedHeader('{}')+';h1='+'0'.repeat(64),time)).toBe(true));
  it('preserves nested data and string spaces in canonical payload', () => { expect(JSON.parse(canonicalEntitlement({subject:{id:'a b'},nested:{v:1}}))).toEqual({subject:{id:'a b'},nested:{v:1}}); });
  it('different nested subjects cannot collide by omitted keys', () => expect(canonicalEntitlement({subject:{id:'a'}})).not.toBe(canonicalEntitlement({subject:{id:'b'}})));
});
const price='pri_'+'p'.repeat(26),customer='ctm_'+'c'.repeat(26),transaction='txn_'+'t'.repeat(26);
const event = () => ({event_type:'transaction.completed',data:{id:transaction,status:'completed',customer_id:customer,items:[{quantity:1,price:{id:price,product_id:'pro_fixture'}}]}});
function store(){const map=new Map<string,string>();return {map,get:vi.fn(async(k:string)=>map.get(k)??null),put:vi.fn(async(k:string,v:string)=>{map.set(k,v);})};}
async function submit(data:unknown,kv:unknown,extra:Record<string,unknown>={}){
 vi.spyOn(Date,'now').mockReturnValue(time*1000);
 const raw=JSON.stringify(data);
 return onRequestPost({request:new Request('https://example.invalid/api/paddle-webhook',{method:'POST',body:raw,headers:{'paddle-signature':signedHeader(raw)}}),env:{PADDLE_WEBHOOK_SECRET:secret,PADDLE_PRICE_ID:price,LEADS:kv,...extra}} as Parameters<typeof onRequestPost>[0]);
}
describe('actual Paddle handler, fixture signatures and fixture store',()=>{
 it('stores and reads back a valid event without a production signature',async()=>{const kv=store(),r=await submit(event(),kv);expect(r.status).toBe(201);const body=await r.json();expect(body.signed).toBe(false);expect(kv.map.size).toBe(1);});
 it('does not grant with no store',async()=>{const r=await submit(event(),undefined);expect(r.status).toBe(503);expect((await r.json()).granted).toBe(false);});
 it('does not grant unconfigured price',async()=>expect((await submit(event(),store(),{PADDLE_PRICE_ID:undefined})).status).toBe(503));
 it('does not grant an unrelated product',async()=>expect((await submit(event(),store(),{PADDLE_PRODUCT_ID:'pro_other'})).status).toBe(422));
 it('rejects zero quantity',async()=>{const e=event();e.data.items[0].quantity=0;expect((await submit(e,store())).status).toBe(422);});
 it('rejects missing customer identity',async()=>{const e=event();e.data.customer_id='';expect((await submit(e,store())).status).toBe(400);});
 it('preserves a stored entitlement on retry',async()=>{const kv=store();await submit(event(),kv);const r=await submit(event(),kv);expect((await r.json()).idempotent).toBe(true);expect(kv.put).toHaveBeenCalledTimes(1);});
 it('does not overwrite incompatible history',async()=>{const kv=store();kv.map.set(`entitlement:paddle:${transaction}`,'{}');expect((await submit(event(),kv)).status).toBe(409);expect(kv.put).not.toHaveBeenCalled();});
 it('does not report success when readback is missing',async()=>{const kv={get:async()=>null,put:async()=>{}};const r=await submit(event(),kv);expect(r.status).toBe(503);expect((await r.json()).granted).toBeNull();});
 it('reports write failure without success',async()=>{const kv={get:async()=>null,put:async()=>{throw new Error('fixture failure')}};expect((await submit(event(),kv)).status).toBe(503);});
});
describe('regulatory evidence is not a compliance score',()=>{
 const serve=(rate:unknown)=>vi.stubGlobal('fetch',vi.fn(async()=>Response.json({axes:[{axis:'safety',status:'MEASURED',accuracy:rate,n:30}],penalty_tiers_eu_ai_act:{x:35000000}})));
 it.each([0,0.5,1,null,'1'])('does not derive legal verdict at accuracy %s',async rate=>{serve(rate);const r=await regulator({request:new Request('https://example.invalid/api/regulator-findings')});const b=await r.json();expect(b.findings.every((f:{grade:string;penalty_exposure:unknown})=>f.grade==='NOT_ASSESSED'&&f.penalty_exposure===null)).toBe(true);});
 it('exposes article evidence requirements rather than worst-score verdicts',async()=>{serve(1);const b=await (await regulator({request:new Request('https://example.invalid/api/regulator-findings?by=article')})).json();expect(b.articles).toHaveLength(10);expect(b.articles.every((a:{grade:string})=>a.grade==='NOT_ASSESSED')).toBe(true);});
 it('keeps missing sources unavailable, not zero',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response('Loading',{headers:{'content-type':'text/html'}})));const b=await (await regulator({request:new Request('https://example.invalid/api/regulator-findings')})).json();expect(b.source_state).toBe('UNAVAILABLE_OR_INVALID');expect(b.findings.every((f:{measured:unknown})=>f.measured===null)).toBe(true);});
 it('cross view does not calculate a legal gap or claim verification',async()=>{serve(1);const b=await (await cross({request:new Request('https://example.invalid/api/cross'),env:{}} as Parameters<typeof cross>[0])).json();expect(b.rows[0].divergence).toBeNull();expect(b.rows[0].regulation.applicability).toBe('NOT_ASSESSED');expect(b.rows[0].measured_ai.signatures_verified_here).toBe(false);});
 it('card-source failure is not an empty measured inventory',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>Response.json([])));const b=await (await cards({request:new Request('https://example.invalid/api/cards')} as Parameters<typeof cards>[0])).json();expect(b.cards.count).toBeNull();expect(b.cards.signed).toBeNull();});
});
