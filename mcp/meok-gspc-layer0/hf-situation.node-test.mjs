import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHfSituationRunner, HF_SITUATION_TOOL } from './hf-situation.mjs';
const SHA = 'a'.repeat(40), MODEL_SHA = 'b'.repeat(40);
const ENV = { MEOK_HF_ENABLED:'1', MEOK_HF_SPACE_ID:'fixture/private-meok', MEOK_HF_ORIGIN:'https://fixture-private-meok.hf.space', MEOK_HF_SPACE_SHA:SHA, MEOK_HF_MODEL_SHA:MODEL_SHA, MEOK_HF_TOKEN:'fixture-bearer-not-a-secret', MEOK_HF_TIMEOUT_MS:'1000' };
const ARGS = { goal:'Check a synthetic observation.', situation:'This is fictional input.', consent_to_send:true };
const meta = () => ({ id:ENV.MEOK_HF_SPACE_ID, private:true, host:ENV.MEOK_HF_ORIGIN, sha:SHA, runtime:{sha:SHA,stage:'RUNNING',hardware:{current:'zero-a10g',requested:'zero-a10g'}} });
const lock = () => ({model_id:'nvidia/Cosmos3-Edge',revision:MODEL_SHA,model_role:'REASONER_ONLY',hardware:'zero-a10g',automatic_paid_upgrade:false,max_new_tokens:192,gpu_seconds_per_request:45});
const result = () => ['A model hypothesis, not verified truth.',[
  {stage:'MODEL_RESPONSE_RECEIVED',provider:'Cosmos 3 Edge · ZeroGPU',revision:MODEL_SHA},
  {stage:'EVOLVE_REVIEW',decision:'HOLD'}],{
  schema:'csoai.3kb-reaction-card/0.1',reaction:{claim_state:'SYNTHETIC_HYPOTHESES_ONLY'},
  evolve:{may_train_production:false,may_promote_claim:false,may_mutate_constitution:false},
  authority:{execute_external_effect:false,settle_payment:false,sign_or_anchor:false,self_measure:false,self_promote:false},
},{status:'Waiting for a later outcome'}];
const json = data => new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
const sse = data => new Response('event: heartbeat\ndata: null\n\nevent: complete\ndata: '+JSON.stringify([null,...data])+'\n\n',{headers:{'content-type':'text/event-stream'}});
function fixture({change, changeMeta, changeLock, responseOverride}={}) {
  const requests=[];
  const fetchImpl=async (url, options) => {
    requests.push({url,method:options.method,body:options.body});
    assert.equal(options.redirect,'manual');
    assert.equal(options.headers.authorization,'Bearer '+ENV.MEOK_HF_TOKEN);
    if (responseOverride) { const v=await responseOverride(url, options,requests.length); if(v)return v; }
    if(url.endsWith('/model_lock.json')) {const l=lock();changeLock?.(l);return json(l);}
    if(url.includes('/api/spaces/')) {const m=meta();changeMeta?.(m,requests.length);return json(m);}
    if(options.method==='POST') {
      const b=JSON.parse(options.body);assert.deepEqual(Object.keys(b),['goal','situation','image','provider','consent']);
      assert.equal(b.image,null);assert.equal(b.consent,true);return json({event_id:'fixture_event_1'});
    }
    const data=result();change?.(data);return sse(data);
  };
  return {fetchImpl,requests};
}
async function run(args=ARGS,env=ENV,options={}) {const f=fixture(options);const output=await createHfSituationRunner()(args,{env,fetchImpl:f.fetchImpl});return {output,...f};}

test('route is disabled by default and advertises non-idempotent quota consumption', async()=>{
 const {output,requests}=await run(ARGS,{});assert.equal(output.reason,'HF_ROUTE_DISABLED');assert.equal(requests.length,0);
 assert.equal(HF_SITUATION_TOOL.annotations.idempotentHint,false);assert.equal(HF_SITUATION_TOOL.annotations.readOnlyHint,false);
});
test('input consent and exact argument schema reject without network',async()=>{
 for(const args of [{...ARGS,consent_to_send:false},{...ARGS,url:'https://attacker.test'},{...ARGS,goal:''},{...ARGS,situation:'x'.repeat(4001)},null,[]]) {
  const {output,requests}=await run(args);assert.equal(output.state,'UNCHECKABLE');assert.equal(output.request_attempted,false);assert.equal(requests.length,0);
 }
});
test('credentials, pins, origins and budget settings are validated before network',async()=>{
 for(const override of [{MEOK_HF_SPACE_ID:'../private'},{MEOK_HF_ORIGIN:'http://127.0.0.1'},{MEOK_HF_ORIGIN:'https://fixture.hf.space.attacker.test'},{MEOK_HF_SPACE_SHA:'main'},{MEOK_HF_MODEL_SHA:'bad'},{MEOK_HF_TOKEN:'secret\nheader'},{MEOK_HF_CALL_LIMIT:'101'},{MEOK_HF_TIMEOUT_MS:'120001'}]) {
  const {output,requests}=await run(ARGS,{...ENV,...override});assert.equal(output.reason,'HF_CONFIG_INVALID');assert.equal(requests.length,0);
 }
});
test('metadata drift, public Space, changed origin and paid hardware refuse before submission',async()=>{
 for(const changeMeta of [m=>m.sha='c'.repeat(40),m=>m.runtime.sha='c'.repeat(40),m=>m.private=false,m=>m.host='https://other.hf.space',m=>m.runtime.hardware.current='l40sx1',m=>m.runtime.hardware.requested='l40sx1',m=>m.runtime.stage='BUILDING']) {
  const {output,requests}=await run(ARGS,ENV,{changeMeta});assert.equal(output.state,'UNCHECKABLE');assert.equal(output.request_attempted,false);assert.ok(requests.every(r=>r.method==='GET'));
 }
});
test('model lock change cannot silently substitute a different model or enable paid upgrades',async()=>{
 for(const changeLock of [l=>l.revision='c'.repeat(40),l=>l.model_id='other/model',l=>l.automatic_paid_upgrade=true,l=>l.max_new_tokens=2048,l=>l.gpu_seconds_per_request=60]) {
  const {output,requests}=await run(ARGS,ENV,{changeLock});assert.equal(output.reason,'HF_MODEL_LOCK_MISMATCH');assert.ok(requests.every(r=>r.method==='GET'));
 }
});
test('one bounded roundtrip retains hashes and does not claim truth or learning',async()=>{
 const {output,requests}=await run();assert.equal(output.state,'ANSWER_RECEIVED');assert.equal(requests.filter(r=>r.method==='POST').length,1);
 assert.equal(requests.length,5);assert.equal(output.observation.pre_post_metadata_matched,true);
 for(const value of Object.values(output.limits))assert.equal(value,false);
 assert.match(output.observation.answer_sha256,/^[a-f0-9]{64}$/);assert.ok(output.observation.card_bytes<=3072);
 assert.equal(JSON.stringify(output).includes(ENV.MEOK_HF_TOKEN),false);
});
test('SSE handles split UTF-8 bytes, CRLF and heartbeat before completion',async()=>{
 const data=result();data[0]='An observation: café.';
 const bytes=new TextEncoder().encode('event: heartbeat\r\ndata: null\r\n\r\nevent: complete\r\ndata: '+JSON.stringify([null,...data])+'\r\n\r\n');
 const {output}=await run(ARGS,ENV,{responseOverride:async(u,o)=>o.method==='GET'&&u.includes('/call/reason/')?new Response(new ReadableStream({start(c){for(const b of bytes)c.enqueue(new Uint8Array([b]));c.close();}}),{headers:{'content-type':'text/event-stream'}}):null});
 assert.equal(output.state,'ANSWER_RECEIVED');assert.equal(output.answer,data[0]);
});
test('server error and quota never trigger a second inference or reveal remote text',async()=>{
 for(const override of [()=>new Response('event: error\ndata: "sensitive provider detail"\n\n',{headers:{'content-type':'text/event-stream'}}),()=>new Response('secret provider detail',{status:429})]) {
  const {output,requests}=await run(ARGS,ENV,{responseOverride:async(u,o)=>u.includes('/call/reason/')?override():null});
  assert.equal(output.state,'UNCHECKABLE');assert.equal(output.execution_state,'MAY_HAVE_RUN');assert.equal(output.automatic_retry,false);
  assert.equal(requests.filter(r=>r.method==='POST').length,1);assert.equal(JSON.stringify(output).includes('provider detail'),false);
 }
});
test('redirects are refused at metadata, submission and result retrieval',async()=>{
 for(const position of [1,3,4]) {
  const {output,requests}=await run(ARGS,ENV,{responseOverride:async(u,o,n)=>n===position?new Response('',{status:307,headers:{location:'https://attacker.test'}}):null});
  assert.equal(output.reason,'HF_REDIRECT_REFUSED');assert.ok(requests.every(r=>!r.url.includes('attacker')));
 }
});
test('invalid event IDs cannot escape the fixed result URL',async()=>{
 for(const event_id of ['../../secret','x?url=evil','https://evil.test','',null]) {
  const {output,requests}=await run(ARGS,ENV,{responseOverride:async(u,o)=>o.method==='POST'?json({event_id}):null});
  assert.equal(output.reason,'HF_EVENT_ID_INVALID');assert.equal(requests.length,3);
 }
});
test('empty text, wrong model reports, authority grants and oversize cards are not valid results',async()=>{
 for(const change of [d=>d[0]='',d=>d[1][0].revision='c'.repeat(40),d=>d[1][1].decision='APPROVE',d=>d[2].authority.execute_external_effect=true,d=>d[2].evolve.may_train_production=true,d=>d[2].extra='x'.repeat(4000)]) {
  const {output}=await run(ARGS,ENV,{change});assert.equal(output.state,'UNCHECKABLE');assert.equal(Object.hasOwn(output,'answer'),false);
 }
});
test('changed source after result is withheld rather than attributed to pinned code',async()=>{
 const {output}=await run(ARGS,ENV,{changeMeta:(m,n)=>{if(n===5)m.sha='c'.repeat(40);}});
 assert.equal(output.reason,'HF_SPACE_REVISION_MISMATCH');assert.equal(output.job_accepted,true);assert.equal(Object.hasOwn(output,'answer'),false);
});
test('incomplete, wrong-media and oversize streams are bounded failures',async()=>{
 for(const res of [()=>new Response('event: heartbeat\ndata: null\n\n',{headers:{'content-type':'text/event-stream'}}),()=>new Response('hello',{headers:{'content-type':'text/html'}}),()=>new Response('x'.repeat(2*1024*1024+1),{headers:{'content-type':'text/event-stream'}})]) {
  const {output}=await run(ARGS,ENV,{responseOverride:async(u)=>u.includes('/call/reason/')?res():null});assert.equal(output.state,'UNCHECKABLE');
 }
});
test('deadline bounds stalled fetch and stalled stream with no retry',async()=>{
 const runner=createHfSituationRunner();const o=await runner(ARGS,{env:{...ENV,MEOK_HF_TIMEOUT_MS:'10'},fetchImpl:()=>new Promise(()=>{})});assert.equal(o.reason,'HF_TIMEOUT');assert.equal(o.request_attempted,false);
 let cancelled=false;const {output}=await run(ARGS,{...ENV,MEOK_HF_TIMEOUT_MS:'20'},{responseOverride:async(u)=>u.includes('/call/reason/')?new Response(new ReadableStream({cancel(){cancelled=true;}}),{headers:{'content-type':'text/event-stream'}}):null});
 assert.equal(output.reason,'HF_TIMEOUT');assert.equal(output.job_accepted,true);assert.equal(cancelled,true);
});
test('per-session submission cap and concurrent-call refusal are explicit',async()=>{
 const runner=createHfSituationRunner();const f=fixture();await runner(ARGS,{env:ENV,fetchImpl:f.fetchImpl});
 const count=f.requests.length;const second=await runner(ARGS,{env:ENV,fetchImpl:f.fetchImpl});assert.equal(second.reason,'HF_SESSION_CALL_LIMIT');assert.equal(f.requests.length,count);
 const r=createHfSituationRunner();const first=r(ARGS,{env:{...ENV,MEOK_HF_TIMEOUT_MS:'30'},fetchImpl:()=>new Promise(()=>{})});
 const busy=await r(ARGS,{env:ENV,fetchImpl:()=>assert.fail('must not fetch')});assert.equal(busy.reason,'HF_ROUTE_BUSY');await first;
});
test('transport errors do not expose credentials or raw exceptions',async()=>{
 const output=await createHfSituationRunner()(ARGS,{env:ENV,fetchImpl:async()=>{throw new Error(ENV.MEOK_HF_TOKEN);}});
 assert.equal(output.reason,'HF_REQUEST_FAILED');assert.equal(JSON.stringify(output).includes(ENV.MEOK_HF_TOKEN),false);
});

test('actual stdio bridge advertises HF tool only when opted in and validates before network',async()=>{
 const server=fileURLToPath(new URL('./server.mjs',import.meta.url));
 async function rpc(env,method,params) {
  const child=spawn(process.execPath,[server],{env:{PATH:process.env.PATH,...env},stdio:['pipe','pipe','pipe']});
  return new Promise((resolve,reject)=>{
   let output='';const timer=setTimeout(()=>{child.kill();reject(new Error('stdio timed out'));},3000);
   child.stdout.on('data',chunk=>{output+=chunk;const line=output.split('\n')[0];if(output.includes('\n')){clearTimeout(timer);child.kill();resolve(JSON.parse(line));}});
   child.on('error',reject);child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method,params})+'\n');
  });
 }
 const defaults=await rpc({},'tools/list');assert.equal(defaults.result.tools.some(t=>t.name===HF_SITUATION_TOOL.name),false);
 const enabled=await rpc({MEOK_HF_ENABLED:'1'},'tools/list');assert.equal(enabled.result.tools.some(t=>t.name===HF_SITUATION_TOOL.name),true);
 const refused=await rpc(ENV,'tools/call',{name:HF_SITUATION_TOOL.name,arguments:{...ARGS,consent_to_send:false}});
 assert.equal(refused.result.isError,true);assert.equal(JSON.parse(refused.result.content[0].text).reason,'HF_INPUT_CONSENT_REQUIRED');
});


test('only the exact pinned raw JSON source may use HF text/plain content type', async()=>{
 const good=await run(ARGS,ENV,{responseOverride:async(u)=>u.endsWith('/model_lock.json')?new Response(JSON.stringify(lock()),{headers:{'content-type':'text/plain; charset=utf-8'}}):null});
 assert.equal(good.output.state,'ANSWER_RECEIVED');
 const bad=await run(ARGS,ENV,{responseOverride:async(u)=>u.includes('/api/spaces/')?new Response(JSON.stringify(meta()),{headers:{'content-type':'text/plain'}}):null});
 assert.equal(bad.output.reason,'HF_CONTENT_TYPE_INVALID');assert.equal(bad.output.request_attempted,false);
});

test('model lock token and GPU limits must be positive integers, not coercible values', async()=>{
 for(const changeLock of [l=>l.max_new_tokens=-1,l=>l.max_new_tokens='192',l=>l.gpu_seconds_per_request=0,l=>l.gpu_seconds_per_request='45']){
  const {output}=await run(ARGS,ENV,{changeLock});assert.equal(output.reason,'HF_MODEL_LOCK_MISMATCH');assert.equal(output.request_attempted,false);
 }
});


test('raw SSE requires exactly the null Gradio state slot and never forwards state',async()=>{
 for(const value of [result(), [{private:'session'},...result()], [null,...result(),'extra']]){
  const {output}=await run(ARGS,ENV,{responseOverride:async(u)=>u.includes('/call/reason/')?new Response('event: complete\ndata: '+JSON.stringify(value)+'\n\n',{headers:{'content-type':'text/event-stream'}}):null});
  assert.equal(output.reason,'HF_RESULT_WIRE_SHAPE_INVALID');assert.equal(Object.hasOwn(output,'answer'),false);
 }
});
