/** Offline regressions: synthetic responses only; no signing, payments or external effect. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Layer0} from '../../packages/layer0-js/index.js';
import {ledgerCanonical,verifyOutcomes,scheduledReadState} from '../claims/maintenance-schedule-state.mjs';
const sha=x=>'sha256:'+createHash('sha256').update(x).digest('hex');
const canon=x=>Array.isArray(x)?'['+x.map(canon).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}':JSON.stringify(x);
const noNetwork=async()=>{throw Error('Unexpected network request')};
globalThis.fetch=noNetwork;
function envelope(body){
 const from=body.from,to=body.to,action=body.action,payload=body.payload;
 return {v:'csoai.a2a/0.1',id:'SYNTHETIC-NOT-A-RECEIPT',ts:'2026-11-10T00:00:00.000Z',from,to,intent:'attestation',action,payload,
  policy:{decision:payload.decisionState,controls:[],conditions:[],statutory_basis:null},
  episode:{hash:sha(canon({from,to,action,payload})),anchor:'fixture-only'},
  sig:{alg:'Ed25519',kid:'fixture-shape-only',value:Buffer.alloc(64).toString('base64')}};
}
function fixture(change=x=>x,{decision='allow',verifyApproval}={}){
 const requests=[];let callbackCalls=0;
 const client=new Layer0({base:'https://offline.invalid',identity:'fixture-person',endpoint:'tool://fixture',verifyApproval,
  fetchImpl:async(url,options)=>{const body=JSON.parse(options.body);requests.push({path:new URL(url).pathname,body});
   if(url.endsWith('/api/gate'))return {ok:true,json:async()=>({state:decision})};
   if(url.endsWith('/api/a2a/route'))return {ok:true,json:async()=>({envelope:change(envelope(body))})};
   throw Error('Unexpected request');}});
 const run=result=>client.governed('fixture.read',{subject:'same'},async()=>{callbackCalls++;return result});
 return {client,requests,run,get callbackCalls(){return callbackCalls}};
}
test('malformed truthy values cannot acquire the legacy attested status',async()=>{
 for(const value of [{},'not-a-receipt',{verified:true,signature:null},[],true,123]){
  const f=fixture(()=>value),out=await f.run({answer:'retained'});
  assert.equal(out.attested,false);assert.equal(out.status,'executed_unattested');
  assert.equal(out.attestationCheck.state,'MALFORMED_RECEIPT');assert.deepEqual(out.attestation,value);
  assert.equal(out.result.answer,'retained');assert.equal(f.callbackCalls,1);assert.equal(f.requests.length,2);
 }
});
test('receipt shape and echoed bindings are not promoted to signature, issuer or effect verification',async()=>{
 const out=await fixture().run({answer:42});assert.equal(out.attested,true);assert.equal(out.status,'attested');
 assert.deepEqual(out.attestationCheck,{state:'RECEIVED_UNVERIFIED',signatureVerification:'NOT_PERFORMED',issuerTrust:'NOT_ESTABLISHED',authorityVerified:false,independentEffect:'NOT_OBSERVED'});
});
test('missing receipt preserves the result without a retry',async()=>{
 const f=fixture(()=>null),out=await f.run('result');assert.equal(out.attestationCheck.state,'NO_RECEIPT');assert.equal(out.result,'result');assert.equal(out.attested,false);assert.equal(f.callbackCalls,1);
});
for(const [name,change] of [
 ['action',x=>x.action='different'],['input',x=>x.payload.inputsHash='sha256:'+'f'.repeat(64)],
 ['identity',x=>x.from.party='someone-else'],['endpoint',x=>x.from.endpoint='tool://elsewhere'],
 ['recipient',x=>x.to.endpoint='csoai://other'],['intent',x=>x.intent='other'],
 ['gate state',x=>x.policy.decision='deny'],['declared decision',x=>x.payload.decisionState='deny']]){
 test(`receipt rejects a mismatched ${name}`,async()=>{const f=fixture(x=>{change(x);return x}),out=await f.run('result');assert.equal(out.attestationCheck.state,'REQUEST_BINDING_MISMATCH');assert.equal(out.attested,false);assert.equal(f.callbackCalls,1)});
}
for(const [name,change]of [['output digest',x=>x.payload.outputsHash='sha256:'+'f'.repeat(64)],['omitted output',x=>delete x.payload.outputsHash],['encoding',x=>x.payload.outputEncoding='other']]){
 test(`receipt refuses ${name} mismatch`,async()=>{const out=await fixture(x=>{change(x);return x}).run('result');assert.equal(out.attestationCheck.state,'OUTPUT_BINDING_MISMATCH');assert.equal(out.attested,false)});
}
test('episode digest is checked against the complete returned episode parts',async()=>{
 const out=await fixture(x=>({...x,episode:{...x.episode,hash:'sha256:'+'f'.repeat(64)}})).run('result');assert.equal(out.attestationCheck.state,'EPISODE_DIGEST_MISMATCH');assert.equal(out.attested,false);
});
test('different outputs produce distinct requests without transmitting the output text',async()=>{
 const a=fixture(),b=fixture();const x=await a.run({value:'private-output-A'}),y=await b.run({value:'private-output-B'});
 assert.notEqual(x.outputBinding.sha256,y.outputBinding.sha256);assert.notDeepEqual(a.requests[1].body.payload,b.requests[1].body.payload);
 assert.doesNotMatch(JSON.stringify(a.requests),/private-output-A/);assert.equal(x.outputBinding.sha256,sha(canon({value:'private-output-A'})));
});
test('output JSON fingerprint preserves the existing canonical object-key ordering',async()=>{
 const a=await fixture().run({z:[true,null,3.2],a:'x'}),b=await fixture().run({a:'x',z:[true,null,3.2]});assert.equal(a.outputBinding.sha256,b.outputBinding.sha256);
});
test('unsupported results stay available but cannot acquire an exact-output attestation',async()=>{
 const cycle={};cycle.self=cycle;const sparse=[];sparse.length=1;
 for(const result of [undefined,NaN,Infinity,1n,new Date(),cycle,sparse,{x:undefined}]){
  const f=fixture(),out=await f.run(result);assert.equal(out.result,result);assert.equal(out.outputBinding.state,'UNCHECKABLE');assert.equal(out.attested,false);assert.equal(f.callbackCalls,1);
 }
});
test('output accessors and toJSON hooks are not invoked to manufacture a fingerprint',async()=>{
 let accessed=0;const result={};Object.defineProperty(result,'answer',{enumerable:true,get(){accessed++;return 1}});
 const out=await fixture().run(result);assert.equal(accessed,0);assert.equal(out.outputBinding.state,'UNCHECKABLE');assert.equal(out.attested,false);
});
test('oversized result cannot be labelled output-bound',async()=>{const out=await fixture().run('x'.repeat(2000001));assert.equal(out.outputBinding.state,'UNCHECKABLE');assert.equal(out.attested,false)});
test('malformed signature shape and impossible receipt times remain uncheckable',async()=>{
 for(const change of [x=>x.sig.value='x',x=>x.sig.alg='none',x=>x.ts='2026-11-10T24:00:00Z',x=>x.ts='2026-02-30T10:00:00Z']){
  const out=await fixture(x=>{change(x);return x}).run('result');assert.equal(out.attestationCheck.state,'MALFORMED_RECEIPT');assert.equal(out.attested,false);
 }
});
test('local execution hold remains before callback or transport',async()=>{const f=fixture();await assert.rejects(()=>f.client.governedLocal('read',{},()=>{throw Error('must not run')}),{code:'LOCAL_EXECUTOR_NOT_QUALIFIED'});assert.equal(f.requests.length,0)});
test('escalation without authenticated host verification cannot reach the callback',async()=>{
 const f=fixture(x=>x,{decision:'escalate'});await assert.rejects(()=>f.run('result'),{code:'ESCALATION_REQUIRED'});assert.equal(f.callbackCalls,0);assert.equal(f.requests.length,1);
});
test('input mutation remains refused before dispatch',async()=>{
 const f=fixture(),inputs={a:1};f.client.gate=async()=>{inputs.a=2;return {state:'allow'}};let ran=0;
 await assert.rejects(()=>f.client.governed('read',inputs,async()=>ran++),{code:'AUTHORIZATION_INPUTS_CHANGED'});assert.equal(ran,0);
});
test('attribution mutation remains refused before dispatch',async()=>{
 const f=fixture();f.client.gate=async()=>{f.client.identity='changed';return {state:'allow'}};let ran=0;
 await assert.rejects(()=>f.client.governed('read',{},async()=>ran++),{code:'AUTHORIZATION_CONTEXT_CHANGED'});assert.equal(ran,0);
});
test('callback error remains unknown and is not followed by an attestation or a second call',async()=>{
 const f=fixture();let ran=0;await assert.rejects(()=>f.client.governed('read',{},async()=>{ran++;throw Error('response lost')}),{code:'EXECUTION_OUTCOME_UNKNOWN'});assert.equal(ran,1);assert.equal(f.requests.length,1);
});
test('attestation transport failure preserves obtained result and cancellation state',async()=>{
 const f=fixture();f.client._attest=async()=>{throw Error('unavailable')};const control=new AbortController();
 const out=await f.client.governed('read',{},async()=>{control.abort();return 'retained'},{signal:control.signal});
 assert.equal(out.result,'retained');assert.equal(out.attestationCheck.state,'NO_RECEIPT');assert.equal(out.cancellationRequested,true);
});
test('pre-dispatch cancellation prevents all network and callback work',async()=>{
 const f=fixture();await assert.rejects(()=>f.client.governed('read',{},async()=>1,{signal:AbortSignal.abort()}),{code:'EXECUTION_CANCELLED'});assert.equal(f.requests.length,0);
});
const digest=x=>createHash('sha256').update(x).digest('hex');
const registry={id:'fixture',url:'https://example.invalid/registry',sha256:'a'.repeat(64)};
function ledgerFixture(overrides={}){
 const body={schema:'csoai.claim-maintenance-check/0.2',seq:0,prev_hash:'0'.repeat(64),registry_id:registry.id,registry_url:registry.url,registry_sha256:registry.sha256,check:'scheduled-read',due:'2026-11-10',checked_at:'2026-11-10T10:00:00Z',outcome:'UNCHANGED',claim_ids_read:['A'],claims_fetch_failed:[],claims_unconfirmed:[],...overrides};
 const row={...body,row_sha256:digest(ledgerCanonical(body))},raw=Buffer.from(JSON.stringify(row)+'\n');const revision='b'.repeat(40);
 const capture={schema:'csoai.claim-maintenance-public-capture/0.1',file:'outcomes.jsonl',source_revision:revision,source_url:`https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/${revision}/public/interop/claim-maintenance/outcomes.jsonl`,bytes_sha256:digest(raw),entries:1,outcomes_head_sha256:row.row_sha256,captured_at:'2026-11-11T00:00:00Z'};
 return {raw,capture,row};
}
const project=(ledger,overrides={})=>scheduledReadState({next:'2026-11-10T00:00:00Z',asOf:'2026-11-11T00:00:00Z',registry,claimIds:['A'],ledger,...overrides});
test('valid claim completion retains original times and unsigned provenance',()=>{
 const f=ledgerFixture(),p=project(verifyOutcomes(f.raw,f.capture));assert.equal(p.state,'COMPLETED');assert.equal(p.evidence.checked_at,f.row.checked_at);assert.match(p.evidence.boundary,/Unsigned/);
});
for(const value of ['2026-11-10T25:00:00Z','2026-11-10T24:00:00Z','2026-11-10T12:61:00Z','2026-11-10T12:00:60Z','2026-02-30T10:00:00Z','2026-04-31T10:00:00Z','1900-02-29T00:00:00Z','2100-02-29T00:00:00Z']){
 test(`hash-valid ledger rejects impossible clock ${value}`,()=>{const f=ledgerFixture({checked_at:value});assert.throws(()=>verifyOutcomes(f.raw,f.capture),/chain\/schema/)});
}
test('ledger due dates require real calendar days',()=>{for(const due of ['2026-02-30','2026-00-01','2026-13-01','2026-11-31','1900-02-29']){const f=ledgerFixture({due});assert.throws(()=>verifyOutcomes(f.raw,f.capture),/chain\/schema/)}});
test('Gregorian leap days in 2000 and 2024 remain accepted',()=>{for(const day of ['2000-02-29','2024-02-29']){const f=ledgerFixture({due:day,checked_at:day+'T12:00:00Z'});assert.equal(verifyOutcomes(f.raw,f.capture).rows.length,1)}});
test('next and asOf are validated even when their string ordering looks valid',()=>{
 const f=ledgerFixture(),ledger=verifyOutcomes(f.raw,f.capture);
 for(const field of ['next','asOf'])for(const value of ['',false,{},'2026-02-30T00:00:00Z','2026-11-10T24:00:00Z','2026-11-10','2026-11-10T12:00:00+01:00'])assert.throws(()=>project(ledger,{[field]:value}),/invalid/);
 assert.throws(()=>project(ledger,{next:null,asOf:'bad'}),/asOf/);
});
test('exported schedule projection rejects an unvalidated impossible row',()=>{
 const f=ledgerFixture({checked_at:'2026-11-10T25:00:00Z'});assert.throws(()=>project({rows:[f.row],capture:f.capture}),/ledger time/);
});
test('missing schedule and future schedule keep their existing distinct states',()=>{
 const f=ledgerFixture(),ledger=verifyOutcomes(f.raw,f.capture);
 assert.equal(project(ledger,{next:null}).state,'UNSCHEDULED');assert.equal(project(ledger,{next:undefined}).state,'UNSCHEDULED');assert.equal(project(ledger,{next:'2026-11-12T00:00:00Z'}).state,'SCHEDULED');
});
test('wrong registry, missing claims and out-of-window reads still do not complete',()=>{
 for(const overrides of [{registry_sha256:'c'.repeat(64)},{claim_ids_read:['B']},{checked_at:'2026-11-09T00:00:00Z'},{checked_at:'2026-11-12T00:00:00Z'}]){const f=ledgerFixture(overrides);assert.equal(project(verifyOutcomes(f.raw,f.capture)).state,'DUE_EXECUTION_UNVERIFIED')}
});
test('reported fetch failure and unconfirmed siblings do not become completion',()=>{
 for(const overrides of [{outcome:'FETCH_FAILED'},{claims_unconfirmed:['B']},{claims_fetch_failed:['B']}]){const f=ledgerFixture(overrides);assert.equal(project(verifyOutcomes(f.raw,f.capture)).state,'RETRY_REQUIRED')}
});
test('byte and chain validation remain required in addition to valid dates',()=>{
 const f=ledgerFixture(),changed=Buffer.from(f.raw.toString().replace('UNCHANGED','CHANGED_CONFIRMED'));
 assert.throws(()=>verifyOutcomes(changed,f.capture),/pin mismatch/);assert.throws(()=>verifyOutcomes(changed,{...f.capture,bytes_sha256:digest(changed)}),/chain/);
});

test('a result changed during attestation retains its value without an outdated binding label',async()=>{
 const result={value:'original'};const f=fixture(envelope=>{result.value='changed';return envelope});
 const out=await f.run(result);assert.equal(out.result,result);assert.equal(out.result.value,'changed');
 assert.equal(out.attestationCheck.state,'OUTPUT_CHANGED_AFTER_CAPTURE');assert.equal(out.attested,false);
 assert.equal(f.callbackCalls,1);assert.equal(f.requests.length,2);
});
