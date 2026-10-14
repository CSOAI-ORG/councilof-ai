import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { execFileSync } from 'node:child_process';
const {routes:ROUTES,seams:FROZEN_SEAMS}=JSON.parse(fs.readFileSync('scripts/fixtures/paid_delivery_seams.json','utf8'));
const BASE='10046fd8b60d75be66bd1f9dbf54155cca26dec3';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const original=p=>execFileSync('git',['-c','protocol.allow=never','show',BASE+':'+p],{encoding:'utf8',maxBuffer:1024*1024});
const current=p=>fs.readFileSync(p,'utf8');
const realCrypto=crypto.webcrypto;
const denyFetch=async()=>{throw Error('unmocked network disabled');};
globalThis.fetch=denyFetch;
const cx=vm.createContext({Response,Request,Headers,URL,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,crypto:realCrypto,fetch:denyFetch,console,setTimeout,clearTimeout,performance});
async function moduleFrom(source,imports={}){
 const mod=new vm.SourceTextModule(stripTypeScriptTypes(source,{mode:'transform'}),{context:cx});
 await mod.link(async spec=>{
  if(!(spec in imports))throw Error('unmocked import '+spec);
  const values=imports[spec];if(values instanceof vm.Module)return values;
  return new vm.SyntheticModule(Object.keys(values),function(){for(const k of Object.keys(values))this.setExport(k,values[k]);},{context:cx});
 });
 await mod.evaluate();return mod;
}
const helperModule=await moduleFrom(current('functions/api/_x402_delivery_record.ts'));
const h=helperModule.namespace,STATE='x-csoai-delivery-record-state',passed=[];
const cardSignModule=await moduleFrom(current('functions/_lib/cardSign.ts'));
const feedSerializer=await moduleFrom(current('functions/api/_eunomia_delivery.ts'),{'../_lib/cardSign':cardSignModule});
async function test(name,fn){await fn();passed.push(name);console.log('PASS '+name);}
await test('all modified TypeScript parses with built-in transformer',async()=>{
 const paths=new Set([...Object.keys(FROZEN_SEAMS),'functions/api/_x402_delivery_record.ts','functions/mcp/_paid.ts']);
 assert.equal(paths.size,16);
 for(const p of paths)assert.equal(typeof stripTypeScriptTypes(current(p),{mode:'transform'}),'string',p);
});
class Kv{
 constructor(){this.map=new Map();this.puts=0;this.gets=0;}
 async get(k){this.gets++;return this.map.get(k)??null;}
 async put(k,v){this.puts++;this.map.set(k,v);}
}
const options=kv=>({kv,transaction:'tx-fixture',resource:'https://example.test/paid',confirmedPaid:true,successfulOutput:true});
function response(body=' \n{"café":"雪","signature":"unchanged"}\n',status=200){
 return new Response(body,{status,headers:{'content-type':'application/json; charset=utf-8','x-payment-response':'opaque-settlement-echo','x-csoai-card-sha256':'artifact-digest','access-control-expose-headers':'X-Artifact'}});
}
async function bytes(res){return Buffer.from(await res.arrayBuffer());}
async function verifyRow(kv,res,expected,opts){
 const actual=await bytes(res);assert.deepEqual(actual,expected);
 const row=JSON.parse(kv.map.get(h.deliveryTxKey(opts.transaction)));
 assert.equal(row.response_sha256,digest(actual));assert.equal(row.response_bytes,actual.length);
 assert.equal(row.transaction,opts.transaction);assert.equal(row.resource,opts.resource);assert.equal(row.signed,false);
 assert.equal(row.content_type,res.headers.get('content-type')||'');return row;
}
await test('UTF8 full body and artifact/payment headers preserved',async()=>{
 const kv=new Kv(),input=response(),expected=Buffer.from(await input.clone().arrayBuffer());
 const out=await h.recordPaidResponse(input,options(kv));await verifyRow(kv,out,expected,options(kv));
 assert.equal(kv.puts,1);assert.equal(out.headers.get(STATE),'WRITTEN');
 assert.equal(out.headers.get('x-payment-response'),'opaque-settlement-echo');
 assert.equal(out.headers.get('x-csoai-card-sha256'),'artifact-digest');
 assert.match(out.headers.get('access-control-expose-headers'),/X-Artifact/);
});
await test('binary bytes and absent content type are not fabricated',async()=>{
 const kv=new Kv(),expected=Buffer.from([0,255,128,10,32]);
 await verifyRow(kv,await h.recordPaidResponse(new Response(expected),options(kv)),expected,options(kv));
});
await test('free quotation and failed-output gates create no row',async()=>{
 for(const override of [{confirmedPaid:false},{successfulOutput:false}]){
  const kv=new Kv(),input=response(),out=await h.recordPaidResponse(input,{...options(kv),...override});
  assert.equal(out,input);assert.equal(kv.gets,0);assert.equal(kv.puts,0);
 }
});
await test('HTTP errors and empty responses create no success row',async()=>{
 for(const input of [response('refused',402),response('failed',500),new Response(null,{status:204})]){
  const kv=new Kv(),out=await h.recordPaidResponse(input,options(kv));assert.equal(out,input);assert.equal(kv.puts,0);
 }
});
await test('missing transaction and missing store have distinct states',async()=>{
 for(const [opts,state] of [[{...options(new Kv()),transaction:null},'UNRECORDED_NO_TRANSACTION'],[options(undefined),'UNRECORDED_NO_STORE']]){
  const out=await h.recordPaidResponse(response(),opts);assert.equal(out.headers.get(STATE),state);assert.match(await out.text(),/café/);
 }
});
for(const value of [123,{transaction:'not a token'}]){
 await test('common helper rejects non-string transaction '+typeof value,async()=>{
  const kv=new Kv(),input=response('unchanged paid body',201),out=await h.recordPaidResponse(input,{...options(kv),transaction:value});
  assert.equal(out.status,201);assert.equal(await out.text(),'unchanged paid body');assert.equal(out.headers.get('x-payment-response'),'opaque-settlement-echo');
  assert.equal(out.headers.get(STATE),'UNRECORDED_NO_TRANSACTION');assert.equal(kv.gets,0);assert.equal(kv.puts,0);
 });
}
await test('throwing KV get preserves output and reports ERROR',async()=>{
 const kv=new Kv();kv.get=async()=>{throw Error('get failed');};
 const out=await h.recordPaidResponse(response('exact paid output',201),options(kv));
 assert.equal(out.status,201);assert.equal(out.headers.get(STATE),'ERROR');assert.equal(await out.text(),'exact paid output');
 assert.equal(out.headers.get('x-payment-response'),'opaque-settlement-echo');
});
await test('throwing KV put preserves output and reports ERROR',async()=>{
 const kv=new Kv();kv.put=async()=>{throw Error('put failed');};
 const out=await h.recordPaidResponse(response('paid'),options(kv));assert.equal(out.headers.get(STATE),'ERROR');assert.equal(await out.text(),'paid');
});
await test('invalid transaction cannot overwrite and preserves output',async()=>{
 const kv=new Kv(),out=await h.recordPaidResponse(response('paid'),{...options(kv),transaction:'bad tx'});
 assert.equal(out.headers.get(STATE),'ERROR');assert.equal(kv.puts,0);assert.equal(await out.text(),'paid');
});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function bounded(promise){
 let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('offline storage deadline watchdog exceeded')),1000);})]);}
 finally{clearTimeout(timer);}
}
await test('never-settling get returns prepared body and attempts no put',async()=>{
 const kv=new Kv();kv.get=()=>{kv.gets++;return new Promise(()=>{});};
 const out=await bounded(h.recordPaidResponse(response('paid body',201),options(kv)));
 assert.equal(out.status,201);assert.equal(await out.text(),'paid body');assert.equal(out.headers.get(STATE),'ERROR');
 assert.equal(out.headers.get('x-payment-response'),'opaque-settlement-echo');assert.equal(kv.gets,1);assert.equal(kv.puts,0);
});
await test('late get cannot start a put after deadline',async()=>{
 const kv=new Kv();let finished;
 const done=new Promise(resolve=>{finished=resolve;});
 kv.get=async()=>{kv.gets++;await delay(h.DELIVERY_STORE_DEADLINE_MS+80);finished();return null;};
 const out=await bounded(h.recordPaidResponse(response('paid'),options(kv)));
 assert.equal(out.headers.get(STATE),'ERROR');assert.equal(await out.text(),'paid');await bounded(done);await delay(10);
 assert.equal(kv.gets,1);assert.equal(kv.puts,0);assert.equal(kv.map.size,0);
});
await test('never-settling put returns UNKNOWN without retry',async()=>{
 const kv=new Kv();kv.put=()=>{kv.puts++;return new Promise(()=>{});};
 const out=await bounded(h.recordPaidResponse(response('paid',201),options(kv)));
 assert.equal(out.status,201);assert.equal(await out.text(),'paid');assert.equal(out.headers.get(STATE),'UNKNOWN');
 assert.equal(out.headers.get('x-payment-response'),'opaque-settlement-echo');assert.equal(kv.gets,1);assert.equal(kv.puts,1);
});
await test('timed-out put may commit later and reconcile by read only',async()=>{
 const kv=new Kv();let finished;const done=new Promise(resolve=>{finished=resolve;});
 kv.put=async(k,v)=>{kv.puts++;await delay(h.DELIVERY_STORE_DEADLINE_MS+80);kv.map.set(k,v);finished();};
 const out=await bounded(h.recordPaidResponse(response('exact paid body'),options(kv)));
 assert.equal(out.headers.get(STATE),'UNKNOWN');assert.equal(await out.text(),'exact paid body');assert.equal(kv.puts,1);
 await bounded(done);const row=await bounded(h.readDeliveryByTransaction(kv,'tx-fixture'));
 assert.equal(row.response_sha256,digest(Buffer.from('exact paid body')));assert.equal(row.signed,false);assert.equal(kv.puts,1);
});
await test('late put rejection is observed without retry or unhandled rejection',async()=>{
 const kv=new Kv();let finished;const done=new Promise(resolve=>{finished=resolve;});
 kv.put=async()=>{kv.puts++;await delay(h.DELIVERY_STORE_DEADLINE_MS+80);finished();throw Error('late storage rejection');};
 const out=await bounded(h.recordPaidResponse(response('paid'),options(kv)));
 assert.equal(out.headers.get(STATE),'UNKNOWN');assert.equal(await out.text(),'paid');await bounded(done);await delay(10);assert.equal(kv.puts,1);
});
await test('get and put share one total storage deadline',async()=>{
 const kv=new Kv();let finished;const done=new Promise(resolve=>{finished=resolve;});
 kv.get=async()=>{kv.gets++;await delay(h.DELIVERY_STORE_DEADLINE_MS*.8);return null;};
 kv.put=async(k,v)=>{kv.puts++;await delay(h.DELIVERY_STORE_DEADLINE_MS*.8);kv.map.set(k,v);finished();};
 const start=performance.now(),out=await bounded(h.recordPaidResponse(response('paid'),options(kv)));
 assert.ok(performance.now()-start<h.DELIVERY_STORE_DEADLINE_MS+100,'one budget, not a fresh budget for put');
 assert.equal(out.headers.get(STATE),'UNKNOWN');assert.equal(await out.text(),'paid');await bounded(done);assert.equal(kv.gets,1);assert.equal(kv.puts,1);
});
await test('storage deadline ignores a backward wall-clock jump',async()=>{
 const kv=new Kv();let wall=Date.now(),finished;const done=new Promise(resolve=>{finished=resolve;});
 cx.Date=class extends Date{static now(){wall-=1000;return wall;}};
 kv.get=async()=>{kv.gets++;await delay(h.DELIVERY_STORE_DEADLINE_MS*.8);return null;};
 kv.put=async(k,v)=>{kv.puts++;await delay(h.DELIVERY_STORE_DEADLINE_MS*.8);kv.map.set(k,v);finished();};
 try{const out=await bounded(h.recordPaidResponse(response('paid'),options(kv)));assert.equal(out.headers.get(STATE),'UNKNOWN');assert.equal(await out.text(),'paid');await bounded(done);assert.equal(kv.puts,1);}
 finally{cx.Date=Date;}
});
for(const shift of [false,true]){
 await test('one anchored timer with aliased Workers clocks '+(shift?'shifted':'stable'),async()=>{
  const kv=new Kv();let wall=10000,timers=0;const oldPerformance=cx.performance,oldDate=cx.Date,oldSetTimeout=cx.setTimeout;
  cx.Date=class extends Date{static now(){return wall;}};cx.performance={now:()=>wall};
  cx.setTimeout=(fn,ms)=>{timers++;return setTimeout(fn,ms);};
  kv.get=async()=>{kv.gets++;await delay(h.DELIVERY_STORE_DEADLINE_MS*.8);if(shift)wall-=1000;return null;};
  kv.put=()=>{kv.puts++;return new Promise(()=>{});};
  try{
   const out=await bounded(h.recordPaidResponse(response('paid'),options(kv)));
   assert.equal(out.headers.get(STATE),'UNKNOWN');assert.equal(await out.text(),'paid');assert.equal(timers,1);assert.equal(kv.gets,1);assert.equal(kv.puts,1);
  }finally{cx.performance=oldPerformance;cx.Date=oldDate;cx.setTimeout=oldSetTimeout;}
 });
}
await test('never-settling reconciliation read remains unverified and bounded',async()=>{
 const kv=new Kv();kv.get=()=>{kv.gets++;return new Promise(()=>{});};
 assert.equal(await bounded(h.readDeliveryByTransaction(kv,'tx-fixture')),null);assert.equal(kv.gets,1);assert.equal(kv.puts,0);
});
await test('hash failure preserves prepared output',async()=>{
 cx.crypto={subtle:{digest:async()=>{throw Error('hash unavailable');}}};
 try{const kv=new Kv(),out=await h.recordPaidResponse(response('paid'),options(kv));assert.equal(out.headers.get(STATE),'ERROR');assert.equal(await out.text(),'paid');assert.equal(kv.puts,0);}
 finally{cx.crypto=realCrypto;}
});
await test('identical replay preserves original row and timestamp',async()=>{
 const kv=new Kv(),body=Buffer.from('paid');
 const first=h.buildDeliveryRecord({transaction:'tx-fixture',resource:options(kv).resource,response_sha256:digest(body),response_bytes:body.length,content_type:'application/json; charset=utf-8',delivered_at:'2020-01-01T00:00:00Z'});
 const raw=JSON.stringify(first);kv.map.set(h.deliveryTxKey('tx-fixture'),raw);
 const out=await h.recordPaidResponse(response(body),options(kv));assert.equal(out.headers.get(STATE),'ALREADY_RECORDED');
 assert.equal(kv.puts,0);assert.equal(kv.map.get(h.deliveryTxKey('tx-fixture')),raw);
});
await test('different delivery refuses overwrite',async()=>{
 const kv=new Kv();await h.recordPaidResponse(response('first'),options(kv));const raw=kv.map.get(h.deliveryTxKey('tx-fixture'));
 const out=await h.recordPaidResponse(response('second'),options(kv));assert.equal(out.headers.get(STATE),'CONFLICT');
 assert.equal(await out.text(),'second');assert.equal(kv.puts,1);assert.equal(kv.map.get(h.deliveryTxKey('tx-fixture')),raw);
});
await test('malformed or falsely signed rows conflict and read as null',async()=>{
 const good=h.buildDeliveryRecord({transaction:'tx-fixture',resource:'https://example.test/paid',response_sha256:digest(Buffer.from('paid')),response_bytes:4,content_type:'application/json; charset=utf-8'});
 for(const raw of ['{','null',JSON.stringify({schema:good.schema,transaction:good.transaction}),JSON.stringify({...good,signed:true})]){
  const kv=new Kv();kv.map.set(h.deliveryTxKey('tx-fixture'),raw);
  const out=await h.recordPaidResponse(response('paid'),options(kv));assert.equal(out.headers.get(STATE),'CONFLICT');assert.equal(kv.puts,0);
  assert.equal(await h.readDeliveryByTransaction(kv,'tx-fixture'),null);
 }
});
await test('reader returns unsigned complete metadata or null',async()=>{
 const kv=new Kv();await h.recordPaidResponse(response('paid'),options(kv));assert.equal((await h.readDeliveryByTransaction(kv,'tx-fixture')).signed,false);
 assert.equal(await h.readDeliveryByTransaction(undefined,'tx-fixture'),null);assert.equal(await h.readDeliveryByTransaction(kv,'unknown'),null);
 assert.equal(await h.readDeliveryByTransaction(kv,'bad tx'),null);
});
await test('interleaved get-then-put explicitly remains non-atomic',async()=>{
 let gets=0,release;const gate=new Promise(r=>release=r),kv=new Kv();
 kv.get=async()=>{if(++gets===2)release();await gate;return null;};
 await Promise.all([h.recordPaidResponse(response('A'),options(kv)),h.recordPaidResponse(response('B'),options(kv))]);
 assert.equal(kv.puts,2);
});
await test('paid-not-delivered preserves failure and settlement echo',async()=>{
 const out=h.markPaidUndeliveredResponse(response('unchanged failure'),true,'reported-settlement');
 assert.equal(await out.text(),'unchanged failure');assert.equal(out.headers.get(STATE),'NOT_DELIVERED');
 assert.equal(out.headers.get('x-csoai-delivery-state'),'PAID_NOT_DELIVERED');assert.equal(out.headers.get('x-payment-response'),'reported-settlement');
});

function matchingParen(s,start){
 let depth=0,quote=null;
 for(let i=start;i<s.length;i++){
  const c=s[i],n=s[i+1];
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
  if(c==='"'||c==="'"||c.charCodeAt(0)===96){quote=c;continue;}
  if(c==='/'&&n==='/'){i=s.indexOf('\n',i+2);continue;}
  if(c==='/'&&n==='*'){i=s.indexOf('*/',i+2)+1;continue;}
  if(c==='(')depth++;if(c===')'&&--depth===0)return i;
 }
 throw Error('unclosed response expression');
}
function paidExpression(source){
 const start=source.indexOf('return recordPaidResponse(');assert.ok(start>=0);
 const end=matchingParen(source,source.indexOf('(',start));return source.slice(start+7,end+1);
}
class FixedDate extends Date{
 constructor(...args){super(...(args.length?args:['2026-10-14T00:00:00Z']));}
 static now(){return Date.parse('2026-10-14T00:00:00Z');}
}
function scope(kv,route){
 const leaf={sha256:'b'.repeat(64),sig_ed25519:'unchanged-signature',did:'did:fixture',bytes:17,unsigned_reason:null};
 const card={schema:'fixture-card',payload:{unicode:'café 雪',spacing:' \n '},sig_ed25519:'unchanged-signature'};
 const origin='https://example.test',resourceUrl=origin+route;
 const json=(body,status=200,extra={})=>new Response(JSON.stringify(body,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*',...extra}});
 return {Response,Headers,URL,crypto:realCrypto,Date:FixedDate,json,rasJson:json,feedJson:feedSerializer.namespace.feedJson,recordPaidResponse:h.recordPaidResponse,
  env:{REVENUE_KV:kv},resourceUrl,origin,leaf,card,payload:card.payload,attestation:card,body:{oscal:'unchanged'},cards:[card],
  payment:{ok:true,mode:'x402',transaction:'tx-fixture',settlement:{transaction:'tx-fixture'},paymentResponse:'opaque-echo'},paymentResponseHeader:'opaque-echo',deliveryRecordState:'WRITTEN',
  preview:{obligation:{id:'fixture'}},ob:{existing_pack:'/pack'},subject:'fixture-subject',
  KIND:'fixture-art50',ART50_SCOPE:{methods:['metadata']},law:{law:'fixture'},m:{detail:{unicode:'雪'}},fitted:{level:0},
  PAYLOAD_CAP_BYTES:3072,LEAF_TRIM_LEVELS:[0],invoiceHandoff:()=>({state:'quotation-only'}),
  CSOAI_LID:'fixture',SCHEMA:'fixture-schema',DOCTRINE:'measurement, not certification',capsule:{capsule_id:'fixture'},reads:{source:'fixture'},
  spec:{schema:'fixture-ras'},c:{payload:{unicode:'café'},evidence:{digest:'fixture'}},receipt:card,
  entry:{id:'fixture',title:'fixture',population:'fixture'},head:{state:'READ'},reading:{rows:[{unicode:'雪'}],rows_unit:'rows'},
  deliverableManifest:{sha256:'fixture'},manifest:{evidence:{blocks_sha256:'c'.repeat(64)}},
  root:{as_of:'fixture-time',merkle_root:'a'.repeat(64),card_count:1},items:[{proof:['unchanged']}],
  index:{as_of:'fixture-time'},sinceRaw:'',selected:[],allDiffs:[],idx:{ok:true},state:{ok:true,body:{}},leaves:{},
  batch:{window:{from:'a',to:'b'},items:[]},batch_sha256:'c'.repeat(64),manifest_card:card,sources:{fixture:true},
  text:JSON.stringify(card),signed:{text:JSON.stringify(card,null,2)+'\n',sha256:leaf.sha256,signed:true},
  PACK_SCHEMA:'fixture-pack',door:{symbol:'FIX'},counts:{readable:1},unmeasuredPairs:[],pack_sha256:'d'.repeat(64),
  feedBody:{schema:'fixture-feed',blocks:{card},unicode:'café 雪'},result:{state:'DELTA_READ',delta:10}
 };
}
async function emit(expr,globals){
 return vm.runInNewContext(stripTypeScriptTypes('(async()=>('+expr+'))()',{mode:'strip'}),globals,{timeout:1000});
}
for(const route of ROUTES.filter(r=>!r.documented_zero_amount)){
 await test('exact successful source-emission seam '+route.path,async()=>{
  const p=route.implementation,old=original(p),fresh=current(p),expr=FROZEN_SEAMS[p];
  assert.ok(old.includes(expr),'frozen response expression must come from actual original implementation');
  const originalEntry=original(route.entrypoint);
  assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(originalEntry)+'\0').update(originalEntry).digest('hex'),route.entrypoint_blob);
  if(route.entrypoint!==p)assert.equal(current(route.entrypoint),originalEntry,'alias forwarding must remain unchanged');
  const kv=new Kv(),globals=scope(kv,route.path);
  if(p.endsWith('/evidence-bundle.ts'))globals.cards={one:globals.card};
  if(p.endsWith('/feeds/provider-diff.ts')){
   const marker='const prepared = ',start=fresh.indexOf(marker);assert.ok(start>=0);
   globals.prepared=await emit(fresh.slice(start+marker.length,matchingParen(fresh,fresh.indexOf('(',start))+1),globals);
  }
  const baseline=await emit(expr,globals),expected=await bytes(baseline),out=await emit(paidExpression(fresh),globals);
  await verifyRow(kv,out,expected,{...options(kv),resource:globals.resourceUrl});
  assert.equal(kv.puts,1);assert.equal(out.status,baseline.status);assert.equal(out.headers.get(STATE),'WRITTEN');
  for(const [key,value] of baseline.headers)assert.equal(out.headers.get(key),value,key+' must be preserved');
 });
}
await test('Article50 invoice emission stays unchanged and creates no paid row',async()=>{
 const p='functions/api/art50/marking-evidence.ts',kv=new Kv(),globals=scope(kv,'/api/art50/marking-evidence');
 globals.payment={mode:'invoice-gbp',reference:'fixture-reference'};globals.paymentResponseHeader=undefined;
 const expected=await bytes(await emit(FROZEN_SEAMS[p],globals)),out=await emit(paidExpression(current(p)),globals);
 assert.deepEqual(await bytes(out),expected);assert.equal(kv.puts,0);assert.equal(out.headers.get(STATE),null);
});
await test('Article50 non-string transaction preserves output without a row',async()=>{
 const p='functions/api/art50/marking-evidence.ts',kv=new Kv(),globals=scope(kv,'/api/art50/marking-evidence');
 globals.payment.transaction={invalid:'not a settlement token'};
 const expected=await bytes(await emit(FROZEN_SEAMS[p],globals)),out=await emit(paidExpression(current(p)),globals);
 assert.deepEqual(await bytes(out),expected);assert.equal(kv.puts,0);assert.equal(out.headers.get(STATE),'UNRECORDED_NO_TRANSACTION');
});
for(const route of ROUTES.filter(r=>r.documented_zero_amount)){
 await test('free entrypoint byte-identical '+route.path,async()=>assert.equal(current(route.entrypoint),original(route.entrypoint)));
}

const headModule=await moduleFrom(current('functions/api/_head.ts'));
let paymentAllowed=true,settlements=0;
const x402={
 verifyX402Payment:async req=>{
  if(paymentAllowed&&req.headers.has('x-payment')){settlements++;return{ok:true,settlement:{transaction:'tx-fixture'},paymentResponse:'opaque-echo'};}
  return{ok:false,reason:'unpaid or refused'};
 },
 x402Accepts:()=>[{}],declareBazaarHttpGet:x=>x,buildPaymentRequiredV2:x=>x,
 paymentRequiredResponseSigned:async body=>new Response(JSON.stringify(body),{status:402}),
 hasPaymentHeader:req=>req.headers.has('x-payment'),CSOAI_LID:'fixture'
};
const imports={
 '../_x402_delivery_record':helperModule,'./_x402_delivery_record':helperModule,
 '../_head':headModule,'./_head':headModule,
 '../_x402':x402,'./_x402':x402,'../wrapper':{WRAPPER_LID:'fixture'},
 '../_x402_config':{railMode:()=> 'fixture'},'./_x402_config':{railMode:()=> 'fixture'},
 '../_x402_descriptions':{WRAPPER_CHANGES_DESCRIPTION:'fixture'},
 './_x402_descriptions':{PROOF_BUNDLE_DESCRIPTION:'fixture'},
 '../_lib/corpusNote':{corpusNote:async()=>null}
};
const changes=await moduleFrom(current('functions/api/wrapper/changes.ts'),imports);
function snap(supply=100,escrow=100,as_of='2026-10-14T00:00:00Z'){
 return{as_of,records:[{id:'usdc.e:arbitrum',wrapped_total_supply:supply,escrow_balance:escrow,state:'READ'}]};
}
const failures=[
 ['no current',null,snap()],
 ['no current pair',{as_of:'2026-10-14T00:00:00Z',records:[]},snap()],
 ['no previous',snap(),null],
 ['no previous pair',snap(),{as_of:'2026-10-13T00:00:00Z',records:[]}],
 ['missing normalized read',snap(null,100),snap(90,90,'2026-10-13T00:00:00Z')]
];
for(const [label,now,prev] of failures){
 await test('full wrapper changes paid failure '+label,async()=>{
  const kv=new Kv();settlements=0;paymentAllowed=true;
  cx.fetch=async u=>new Response(JSON.stringify(String(u).includes('-latest.json')?now:prev),{status:(String(u).includes('-latest.json')?now:prev)?200:404});
  const out=await changes.namespace.onRequestGet({request:new Request('https://example.test/api/wrapper/changes?id=usdc.e:arbitrum',{headers:{'x-payment':'fixture'}}),env:{REVENUE_KV:kv}});
  assert.equal(out.status,200);assert.equal(out.headers.get(STATE),'NOT_DELIVERED');
  assert.equal(out.headers.get('x-payment-response'),'opaque-echo');assert.equal(kv.puts,0);assert.equal(settlements,1);
  assert.notEqual((await out.json()).state,'DELTA_READ');
 });
}
await test('full DELTA_READ records exact successful body',async()=>{
 const kv=new Kv();settlements=0;paymentAllowed=true;
 cx.fetch=async u=>new Response(JSON.stringify(String(u).includes('-latest.json')?snap():snap(90,90,'2026-10-13T00:00:00Z')));
 const out=await changes.namespace.onRequestGet({request:new Request('https://example.test/api/wrapper/changes?id=usdc.e:arbitrum',{headers:{'x-payment':'fixture'}}),env:{REVENUE_KV:kv}});
 const actual=await bytes(out),row=JSON.parse(kv.map.get(h.deliveryTxKey('tx-fixture')));
 assert.equal(JSON.parse(actual).state,'DELTA_READ');assert.equal(row.response_sha256,digest(actual));
 assert.equal(out.headers.get('x-payment-response'),'opaque-echo');assert.equal(kv.puts,1);assert.equal(settlements,1);
});
await test('full wrapper preview and decline never record',async()=>{
 for(const preview of [true,false]){
  const kv=new Kv();settlements=0;paymentAllowed=false;cx.fetch=async()=>new Response(JSON.stringify(snap()));
  const out=await changes.namespace.onRequestGet({request:new Request('https://example.test/api/wrapper/changes?id=usdc.e:arbitrum'+(preview?'&preview=1':'')),env:{REVENUE_KV:kv}});
  assert.equal(out.status,preview?200:402);assert.equal(kv.puts,0);assert.equal(settlements,0);
 }
 paymentAllowed=true;
});
await test('full wrapper HEAD never settles or records',async()=>{
 const kv=new Kv();settlements=0;paymentAllowed=true;
 await changes.namespace.onRequestHead({request:new Request('https://example.test/api/wrapper/changes?id=usdc.e:arbitrum',{method:'HEAD',headers:{'x-payment':'fixture'}}),env:{REVENUE_KV:kv}});
 assert.equal(kv.puts,0);assert.equal(settlements,0);
});
const proof=await moduleFrom(current('functions/api/proof.ts'),imports);
await test('full paid proof records exact bundle with one mock settlement',async()=>{
 const kv=new Kv();settlements=0;paymentAllowed=true;const sha='a'.repeat(64);
 cx.fetch=async u=>new Response(JSON.stringify(String(u).endsWith('/root.json')?{card_count:1,card_sha256:[sha],merkle_root:sha}:{cards:{[sha]:{proof:[]}}}));
 const out=await proof.namespace.onRequestGet({request:new Request('https://example.test/api/proof?bundle=1',{headers:{'x-payment':'fixture'}}),env:{REVENUE_KV:kv}});
 const b=await bytes(out),row=JSON.parse(kv.map.get(h.deliveryTxKey('tx-fixture')));
 assert.equal(row.response_sha256,digest(b));assert.equal(row.response_bytes,b.length);
 assert.equal(JSON.parse(b).kind,'bundle');assert.equal(kv.puts,1);assert.equal(settlements,1);
});
await test('full paid proof root failure creates no success row',async()=>{
 const kv=new Kv();settlements=0;cx.fetch=async()=>new Response(JSON.stringify({card_count:2,card_sha256:['a'.repeat(64)]}));
 const out=await proof.namespace.onRequestGet({request:new Request('https://example.test/api/proof?bundle=1',{headers:{'x-payment':'fixture'}}),env:{REVENUE_KV:kv}});
 assert.equal(out.status,503);assert.equal(kv.puts,0);assert.equal(settlements,1);
});
await test('full free proof branch never settles or records',async()=>{
 const kv=new Kv();settlements=0;cx.fetch=async()=>new Response(JSON.stringify({card_count:0,card_sha256:[]}));
 const out=await proof.namespace.onRequestGet({request:new Request('https://example.test/api/proof?sha=invalid'),env:{REVENUE_KV:kv}});
 assert.equal(out.status,400);assert.equal(kv.puts,0);assert.equal(settlements,0);
});
const providerPath='functions/api/feeds/provider-diff.ts';
const providerImports={
 '../_head':headModule,'../_x402':x402,'../_x402_config':{railMode:()=> 'fixture'},
 '../_skus':{SKUS:{}},'../_x402_descriptions':{PROVIDER_DIFF_DESCRIPTION:'fixture'},'../_x402_delivery_record':helperModule
};
const providerModule=await moduleFrom(current(providerPath),providerImports);
const oldProviderModule=await moduleFrom(original(providerPath),providerImports);
async function runProvider(mod,mode,query='history=1',paid=true){
 const kv=new Kv(),calls=[];settlements=0;paymentAllowed=paid;
 const leaf='/feeds/provider-diff/leaves/fixture.json';
 const selected=['leaf-unavailable','missing-leaf','complete-leaf'].includes(mode)?[{id:'fixture',leaf:mode==='missing-leaf'?null:leaf,fetched_at:'2026-01-01T00:00:00Z'}]:[];
 cx.fetch=async input=>{
  const path=new URL(typeof input==='string'?input:input.url).pathname;calls.push(path);
  const key=path.includes('/index.json')?'index':path.includes('/state.json')?'state':path==='/root.json'?'root':'leaf';
  if(mode===key+'-unavailable')return new Response('{}',{status:503});
  const data={index:{as_of:'fixture-date',targets:[],recent_diffs:selected,n_diffs_total:selected.length},state:{schema:'fixture-state'},root:{as_of:'fixture-date',merkle_root:'a'.repeat(64),card_count:0},leaf:{payload:{unicode:'雪'}}};
  assert.ok(key in data);return new Response(JSON.stringify(data[key]));
 };
 const out=await mod.namespace.onRequestGet({request:new Request('https://example.test/api/feeds/provider-diff?'+query,{headers:paid?{'x-payment':'fixture'}:{}}),env:{REVENUE_KV:kv}});
 return{out,kv,calls,settlements};
}
for(const mode of ['index-unavailable','state-unavailable','root-unavailable','leaf-unavailable','missing-leaf']){
 await test('full provider incomplete '+mode+' preserves body without successful row',async()=>{
  const baseline=await runProvider(oldProviderModule,mode),expected=await bytes(baseline.out);
  const actual=await runProvider(providerModule,mode),out=actual.out;
  assert.deepEqual(await bytes(out),expected);assert.equal(out.status,200);assert.equal(actual.settlements,1);
  assert.equal(out.headers.get('x-payment-response'),'opaque-echo');assert.equal(out.headers.get(STATE),'NOT_DELIVERED');
  assert.equal(out.headers.get('x-csoai-delivery-state'),'PAID_NOT_DELIVERED');assert.equal(actual.kv.map.has(h.deliveryTxKey('tx-fixture')),false);
  assert.deepEqual(actual.calls,baseline.calls);
 });
}
for(const mode of ['empty','complete-leaf']){
 await test('full provider readable '+mode+' records exact original output',async()=>{
  const baseline=await runProvider(oldProviderModule,mode),expected=await bytes(baseline.out),actual=await runProvider(providerModule,mode);
  const body=JSON.parse(expected);assert.equal(body.delta.returned,mode==='empty'?0:1);
  await verifyRow(actual.kv,actual.out,expected,{...options(actual.kv),resource:'https://example.test/api/feeds/provider-diff?history=1'});
  assert.equal(actual.settlements,1);assert.deepEqual(actual.calls,baseline.calls);
 });
}
await test('full provider invalid cursor refuses before settlement',async()=>{
 const actual=await runProvider(providerModule,'empty','history=1&since=invalid');
 assert.equal(actual.out.status,400);assert.equal(actual.settlements,0);assert.equal(actual.kv.puts,0);assert.equal(actual.calls.length,1);
});
for(const [name,query,paid,status] of [['free','',true,200],['invoice','invoice=gbp&commissioned_by=fixture',true,402],['declined','history=1',false,402]]){
 await test('full provider '+name+' has no successful paid row',async()=>{
  const actual=await runProvider(providerModule,'empty',query,paid);
  assert.equal(actual.out.status,status);assert.equal(actual.settlements,0);assert.equal(actual.kv.puts,0);assert.equal(actual.calls.length,1);
 });
}
const obligation={id:'fixture',control_id:'fixture',title:'fixture',counsel_confirmed:false,existing_pack:null,regulator:'fixture',obligation:'fixture',statutory_maximum:'fixture'};
let failBundleSign=false;
const evidenceModule=await moduleFrom(current('functions/api/evidence-bundle.ts'),{
 './_head':headModule,'./_x402':x402,'./_x402_config':{railMode:()=> 'fixture'},
 './_obligations':{OBLIGATIONS:{fixture:obligation},resolveObligation:id=>id==='fixture'?obligation:null,isRelevant:()=>false},
 './_invoice_handoff':{invoiceHandoff:()=>({state:'quotation-only'}),INVOICE_CONTACT:'fixture.invalid'},
 '../_lib/cardSign':{sha256Hex:cardSignModule.namespace.sha256Hex,cardV0:cardSignModule.namespace.cardV0,
  signPayload:async payload=>{if(failBundleSign)throw Error('fixture sign failure');return{sha256:digest(Buffer.from(JSON.stringify(payload))),bytes:100,sig_ed25519:null,unsigned_reason:'offline unsigned fixture',did:'did:fixture'};}},
 './_x402_descriptions':{EVIDENCE_BUNDLE_DESCRIPTION:'fixture'},'./_x402_delivery_record':helperModule
});
async function runEvidence(query,paid=true){
 const kv=new Kv();settlements=0;paymentAllowed=paid;
 cx.fetch=async()=>new Response(JSON.stringify({cards:{},merkle_root:'a'.repeat(64),as_of:'fixture-date'}));
 const out=await evidenceModule.namespace.onRequestGet({request:new Request('https://example.test/api/evidence-bundle?'+query,{headers:paid?{'x-payment':'fixture'}:{}}),env:{REVENUE_KV:kv}});
 return{kv,out,settlements};
}
await test('full valid ASSEMBLED-EMPTY records zero-selected bundle',async()=>{
 failBundleSign=false;const actual=await runEvidence('obligation=fixture&bundle=1'),raw=await bytes(actual.out),body=JSON.parse(raw);
 assert.deepEqual(body.cards,{});assert.equal(body.manifest_card.payload.status,'ASSEMBLED-EMPTY');assert.equal(body.manifest_card.payload.card_count,0);
 assert.equal(body.oscal['assessment-results'].results[0].observations.length,0);assert.equal(actual.settlements,1);
 const row=JSON.parse(actual.kv.map.get(h.deliveryTxKey('tx-fixture')));assert.equal(row.response_sha256,digest(raw));assert.equal(row.response_bytes,raw.length);
});
for(const [name,query,paid,status] of [['missing','bundle=1',true,400],['unknown','obligation=unknown&bundle=1',true,404],['preview','obligation=fixture',true,200],['invoice','obligation=fixture&invoice=gbp&commissioned_by=fixture',true,200],['decline','obligation=fixture&bundle=1',false,402]]){
 await test('full evidence '+name+' never creates success row',async()=>{
  failBundleSign=false;const actual=await runEvidence(query,paid);assert.equal(actual.out.status,status);assert.equal(actual.settlements,0);assert.equal(actual.kv.map.has(h.deliveryTxKey('tx-fixture')),false);
  if(name==='invoice'){const body=await actual.out.json();assert.equal(body.kind,'quotation');assert.equal(body.cards,undefined);}
 });
}
await test('full evidence settled sign failure has no successful record',async()=>{
 failBundleSign=true;try{const actual=await runEvidence('obligation=fixture&bundle=1');assert.equal(actual.out.status,500);assert.equal(actual.settlements,1);assert.equal(actual.kv.map.has(h.deliveryTxKey('tx-fixture')),false);}finally{failBundleSign=false;}
});
await test('actual feed response seam retains paid body on storage ERROR',async()=>{
 const p='functions/api/signed-data-feed.ts',kv=new Kv(),globals=scope(kv,'/api/signed-data-feed');
 kv.put=async()=>{throw Error('storage unavailable');};
 const expected=await bytes(await emit(FROZEN_SEAMS[p],globals));
 const out=await emit(paidExpression(current(p)),globals);
 assert.deepEqual(await bytes(out),expected);assert.equal(out.headers.get(STATE),'ERROR');
 assert.equal(out.headers.get('x-payment-response'),'opaque-echo');
});
const paidTools=JSON.parse(current('functions/mcp/paid-tools.json'));
const paidModule=await moduleFrom(current('functions/mcp/_paid.ts'),{
 './paid-tools.json':{default:paidTools},
 './_handlers':{rpc:(id,result)=>new Response(JSON.stringify({jsonrpc:'2.0',id,result}))}
});
const feedTool=paidTools.tools.find(x=>x.csoai.route==='/api/request-attestation');
assert.ok(feedTool,'actual paid tool registry must map the existing commission door');
await test('actual MCP adapter one request, underlying artifact differs from envelope',async()=>{
 const kv=new Kv(),body=Buffer.from(' \n{"signed":"unchanged","unicode":"雪"}\n');let requests=0;
 cx.fetch=async req=>{requests++;assert.equal(req.headers.get('x-payment'),'fixture-payment');return h.recordPaidResponse(response(body),options(kv));};
 const out=await paidModule.namespace.handlePaidTool(1,feedTool.name,{subject:'fixture-subject',x_payment:'fixture-payment'},'https://example.test');
 const envelope=await bytes(out),decoded=JSON.parse(envelope),row=JSON.parse(kv.map.get(h.deliveryTxKey('tx-fixture')));
 assert.equal(requests,1);assert.equal(kv.puts,1);assert.equal(row.response_sha256,digest(body));assert.notEqual(row.response_sha256,digest(envelope));
 assert.equal(decoded.result.structuredContent.delivery_record_state,'WRITTEN');assert.match(decoded.result.structuredContent.delivery_record_scope,/underlying HTTP body/);
});
await test('actual MCP adapter paid-not-delivered HTTP200 is not delivery',async()=>{
 let requests=0;cx.fetch=async()=>{requests++;return h.markPaidUndeliveredResponse(response('{"state":"UNCHECKABLE"}'),true,'opaque-echo');};
 const result=await paidModule.namespace.paidToolResult(feedTool.name,{subject:'fixture-subject',x_payment:'fixture-payment'},'https://example.test');
 assert.equal(requests,1);assert.equal(result.structuredContent.status,'PAID_NOT_DELIVERED');assert.equal(result.structuredContent.delivery_state,'NOT_DELIVERED');assert.equal(result.isError,true);
});
for(const echo of [null,'opaque-route-settlement']){
 await test('unreadable MCP body preserves observed settlement '+(echo?'with echo':'without echo'),async()=>{
  let requests=0;cx.fetch=async()=>{requests++;return new Response(new ReadableStream({start(controller){controller.error(Error('body read failed'));}}),{status:200,headers:echo?{'x-payment-response':echo}:{}});};
  const result=await paidModule.namespace.paidToolResult(feedTool.name,{subject:'fixture-subject',x_payment:'fixture-payment'},'https://example.test');
  assert.equal(requests,1);assert.equal(result.isError,true);assert.equal(result.structuredContent.status,'UNREADABLE_RESPONSE');assert.equal(result.structuredContent.delivery_state,'UNKNOWN');
  assert.equal(result.structuredContent.settlement_state,echo?'REPORTED_BY_ROUTE':'UNCONFIRMED');
  assert.equal(result.structuredContent.payment_response_header,echo??undefined);
  const summary=result.content.filter(x=>x.type==='text').map(x=>x.text).join(' ');
  if(echo)assert.doesNotMatch(summary,/Settlement is unconfirmed/);
 });
}
await test('MCP forwards UNKNOWN bookkeeping state with one underlying request',async()=>{
 const kv=new Kv();kv.put=()=>{kv.puts++;return new Promise(()=>{});};let requests=0;
 cx.fetch=async()=>{requests++;return h.recordPaidResponse(response('paid'),options(kv));};
 const result=await bounded(paidModule.namespace.paidToolResult(feedTool.name,{subject:'fixture-subject',x_payment:'fixture-payment'},'https://example.test'));
 assert.equal(requests,1);assert.equal(kv.puts,1);assert.equal(result.structuredContent.delivery_record_state,'UNKNOWN');assert.equal(result.structuredContent.deliverable.raw,'paid');
});
await test('unreadable MCP without authorization or echo stays NOT_REQUESTED',async()=>{
 let requests=0;cx.fetch=async()=>{requests++;return new Response(new ReadableStream({start(c){c.error(Error('unreadable'));}}));};
 const result=await paidModule.namespace.paidToolResult(feedTool.name,{subject:'fixture-subject'},'https://example.test');
 assert.equal(requests,1);assert.equal(result.isError,true);assert.equal(result.structuredContent.delivery_state,'UNKNOWN');assert.equal(result.structuredContent.settlement_state,'NOT_REQUESTED');assert.equal(result.structuredContent.payment_response_header,undefined);
});
await test('paid MCP authorization refuses automatic redirects',async()=>{
 const built=paidModule.namespace.buildPaidRequest(feedTool.name,{subject:'fixture-subject',x_payment:'fixture-payment'},'https://example.test');
 assert.equal(built.req.redirect,'error');assert.equal(built.req.headers.get('x-payment'),'fixture-payment');assert.equal(new URL(built.req.url).origin,'https://example.test');
});
const testedPaths=new Set([...Object.keys(FROZEN_SEAMS),'functions/api/_x402_delivery_record.ts','functions/mcp/_paid.ts','scripts/test_paid_delivery_records.mjs','scripts/fixtures/paid_delivery_seams.json']);
const source_sha256=Object.fromEntries([...testedPaths].sort().map(p=>[p,digest(Buffer.from(current(p)))]));
const test_revision=execFileSync('git',['-c','protocol.allow=never','rev-parse','HEAD'],{encoding:'utf8'}).trim();
console.log(JSON.stringify({offline:true,test_revision,source_sha256,network_policy:'no external fetch; explicit synthetic transports only',passed:passed.length,cases:passed,paid_api_calls:0,production_changed:false,scope:'helper,27 advertised paid response-emission seams,4 unchanged free entrypoints,full wrapper changes/proof/provider/evidence mocks,actual MCP adapter; other full-route integrations and live acceptance unverified'}));
