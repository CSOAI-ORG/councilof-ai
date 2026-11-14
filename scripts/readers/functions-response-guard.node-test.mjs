import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audit,observe,CONTRACTS,checkedOrigin,main} from '../functions-guard.mjs';
const bodies=[
 {schema:'csoai.gspc-axes/0.5',totals:{axes:0},axes:[]},
 {schema:'csoai.gspc-cards/0.1',status:'UNPUBLISHED',cards:{count:0,list:[]}},
 {schema:'csoai.gspc-axis-register/0.1',registry_axis_count:0,axes:[]},
 {schema:'csoai.mcp-registry/1',servers:[]},
 {total:0,total_kind:'probed',catalogue_total:0,tools:[]},
 {schema:'csoai.receipts.latest/0.2',status:'UNRECORDED',count:null},
 {schema:'csoai.east-west.pair-gap/0.1',east_vs_west:{},market:{},human:{}},
 {schema:'csoai.insurability-evidence-pack/0.1',bundle:[],signature_envelope:{signed:false}},
];
const origin='https://inspection.invalid';
const json=(data,headers={})=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json',...headers}});
function responder(url) {
 const path=new URL(url).pathname;
 if(path==='/api/dorado') return new Response(null,{status:308,headers:{location:'/api/east-west-bench'}});
 if(path==='/api/east-west-bench') return json(bodies[6]);
 return json(bodies[CONTRACTS.findIndex(c=>c.path===path)]);
}
const first=options=>observe(CONTRACTS[0],origin,options);

test('eight contracts match without inferring data validity or execution',async()=>{
 const requests=[]; const result=await audit(origin,{fetchImpl:async(u,o)=>{requests.push([u,o]);return responder(u);}});
 assert.equal(result.exit_code,0);assert.equal(result.matched,8);assert.equal(requests.length,9);
 assert.equal(result.evidence_validated,false);assert.equal(result.functions_execution_authenticated,false);
 assert.equal(result.results[1].source_status,'UNPUBLISHED');assert.equal(result.results[5].source_status,'UNRECORDED');
 assert.ok(requests.every(([,o])=>o.method==='GET'&&o.redirect==='manual'));
});
test('HTTP200 fallback HTML is not an API success',async()=>{
 const r=await first({fetchImpl:async()=>new Response('<html>fallback</html>',{headers:{'content-type':'text/html'}})});
 assert.equal(r.state,'OBSERVED_CONTRACT_MISMATCH');assert.equal(r.reason,'JSON_CONTENT_TYPE_REQUIRED');
});
test('HTML labelled as JSON fails decoding',async()=>{
 const r=await first({fetchImpl:async()=>new Response('<html/>',{headers:{'content-type':'application/json'}})});
 assert.equal(r.reason,'INVALID_JSON_OR_UTF8');
});
test('a different endpoint schema is rejected',async()=>{
 assert.equal((await first({fetchImpl:async()=>json(bodies[1])})).reason,'SCHEMA_MISMATCH');
});
test('schema alone without the expected structure is not sufficient',async()=>{
 assert.equal((await first({fetchImpl:async()=>json({schema:bodies[0].schema})})).reason,'RESPONSE_SHAPE_MISMATCH');
});
for(const value of [null,[],true]) test('nonobject JSON rejected: '+JSON.stringify(value),async()=>{
 assert.equal((await first({fetchImpl:async()=>json(value)})).reason,'OBJECT_RESPONSE_REQUIRED');
});
test('API HTTP503 is a mismatch, not a diagnosed concurrent deployment',async()=>{
 const r=await first({fetchImpl:async()=>new Response('unavailable',{status:503})});
 assert.equal(r.responses[0].http,503);assert.equal(r.reason,'HTTP_STATUS_NOT_200');
 assert.equal(r.deployment_cause,'NOT_ESTABLISHED');
});
test('network exceptions are uncheckable rather than absent routes',async()=>{
 const r=await first({fetchImpl:async()=>{throw new TypeError('synthetic network error');}});
 assert.equal(r.state,'UNCHECKABLE');assert.equal(r.reason,'FETCH_OR_STREAM_ERROR');
});
test('fetch that never resolves is bounded even if it ignores abort',async()=>{
 let signal;const r=await first({timeoutMs:15,fetchImpl:(_u,o)=>{signal=o.signal;return new Promise(()=>{});}});
 assert.equal(r.reason,'READ_DEADLINE');assert.equal(signal.aborted,true);
});
test('stalled body is bounded and cancellation requested',async()=>{
 let cancelled=false;
 const body=new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelled=true;}});
 const r=await first({timeoutMs:15,fetchImpl:async()=>new Response(body,{headers:{'content-type':'application/json'}})});
 assert.equal(r.reason,'READ_DEADLINE');assert.equal(cancelled,true);assert.equal(r.body_complete,false);
});
test('declared oversized body is not read',async()=>{
 const r=await first({maxBytes:20,fetchImpl:async()=>json(bodies[0],{'content-length':'10000'})});
 assert.equal(r.reason,'DECLARED_BODY_LIMIT');assert.equal(r.bytes_read,0);assert.equal(r.state,'UNCHECKABLE');
});
test('actual streamed body is capped without trusting content length',async()=>{
 const r=await first({maxBytes:20,fetchImpl:async()=>json(bodies[0])});
 assert.equal(r.reason,'ACTUAL_BODY_LIMIT');assert.equal(r.body_complete,false);
});
test('malformed UTF8 is rejected',async()=>{
 const r=await first({fetchImpl:async()=>new Response(new Uint8Array([0xc3,0x28]),{headers:{'content-type':'application/json'}})});
 assert.equal(r.reason,'INVALID_JSON_OR_UTF8');
});
test('malformed content length is not interpreted as a valid budget',async()=>{
 assert.equal((await first({fetchImpl:async()=>json(bodies[0],{'content-length':'not-a-number'})})).reason,'INVALID_CONTENT_LENGTH');
});
for(const location of ['https://other.invalid/api/east-west-bench','/login','/api/east-west-bench?changed=1']) {
 test('legacy redirect refuses '+location,async()=>{
  let calls=0;const r=await observe(CONTRACTS[6],origin,{fetchImpl:async()=>{calls++;return new Response(null,{status:308,headers:{location}});}});
  assert.equal(r.reason,'UNEXPECTED_REDIRECT');assert.equal(calls,1);
 });
}
test('a repeated legacy redirect stops after the second request',async()=>{
 let calls=0;const r=await observe(CONTRACTS[6],origin,{fetchImpl:async()=>{calls++;return new Response(null,{status:308,headers:{location:'/api/east-west-bench'}});}});
 assert.equal(calls,2);assert.equal(r.reason,'UNEXPECTED_REDIRECT');
});
test('ordinary API paths do not follow even a same-origin redirect',async()=>{
 const r=await first({fetchImpl:async()=>new Response(null,{status:302,headers:{location:'/api/gspc'}})});
 assert.equal(r.reason,'UNEXPECTED_REDIRECT');
});
test('HTTP200 malformed results give nonzero aggregate exit',async()=>{
 const r=await audit(origin,{fetchImpl:async()=>json({})});assert.equal(r.exit_code,1);assert.equal(r.matched,0);
});
test('an uncompleted scan cannot report all clear',async()=>{
 const r=await audit(origin,{fetchImpl:async()=>{throw new Error('blocked');}});assert.equal(r.exit_code,2);assert.equal(r.matched,0);
});
test('host credentials, path, fragment and query are rejected',()=>{
 for(const host of ['https://user:pass@example.invalid','https://example.invalid/path','https://example.invalid/?x=1','https://example.invalid/#x','http://example.invalid']) assert.throws(()=>checkedOrigin(host));
 assert.equal(checkedOrigin('http://127.0.0.1:8080'),'http://127.0.0.1:8080');
});
test('CLI rejects unknown options before any fetch',async()=>{
 let calls=0;await assert.rejects(main(['--anything'],{fetchImpl:async()=>{calls++;}}));assert.equal(calls,0);
});
test('unknown contracts and invalid budgets rejected before fetch',async()=>{
 await assert.rejects(observe({path:'/other'},origin));
 for(const options of [{timeoutMs:0},{maxBytes:0},{timeoutMs:30001},{maxBytes:2097153}]) await assert.rejects(first(options));
});
test('complete response retains exact bytes digest but not raw source data',async()=>{
 const r=await first({fetchImpl:async()=>json(bodies[0])});
 assert.match(r.body_sha256,/^[0-9a-f]{64}$/);assert.equal(r.body_complete,true);
 assert.equal(r.bytes_read,Buffer.byteLength(JSON.stringify(bodies[0])));
 assert.equal(r.evidence_validity,'NOT_EVALUATED');assert.equal('body' in r,false);
});
test('a limited published card list is not forced to equal the total registry count',async()=>{
 const r=await observe(CONTRACTS[1],origin,{fetchImpl:async()=>json({schema:bodies[1].schema,cards:{count:101,list:[]}})});
 assert.equal(r.state,'RESPONSE_CONTRACT_MATCH');
});
test('source UNRECORDED is retained rather than converted to zero',async()=>{
 const r=await observe(CONTRACTS[5],origin,{fetchImpl:async()=>json(bodies[5])});
 assert.equal(r.source_status,'UNRECORDED');assert.equal('count' in r,false);
});
