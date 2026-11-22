import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {handle,EXPIRES_AT,MAX_BYTES} from './worker.mjs';
import {predict,exactRule,validateModel,WEIGHTS_SHA,sha256} from './vendor/core.mjs';
const model=validateModel(JSON.parse(await readFile(new URL('vendor/weights.json',import.meta.url),'utf8')));
const rows=(await readFile(new URL('vendor/test.jsonl',import.meta.url),'utf8')).trim().split('\n').map(JSON.parse);
const now=Date.parse('2026-11-11T00:00:00Z'),url='https://preview.example/v1/predict';
let checks=0;const named=[];
function check(name,ok){assert.ok(ok,name);checks++;named.push(name);}
async function request(body,{method='POST',headers={},path=url,time=now}={}){
 const r=new Request(path,{method,headers:{'content-type':'application/json','x-model-sha256':WEIGHTS_SHA,...headers},...(method==='GET'?{}:{body})});
 const res=await handle(r,time),bytes=new Uint8Array(await res.arrayBuffer());assert.equal(await sha256(bytes),res.headers.get('x-content-sha256'));return {status:res.status,data:JSON.parse(new TextDecoder().decode(bytes)),headers:res.headers};
}
let worst=0,batches=0;
for(let i=0;i<rows.length;i+=8){
 const batch=rows.slice(i,i+8).map(r=>r.features),raw=JSON.stringify(batch),res=await request(raw);assert.equal(res.status,200);assert.equal(res.data.input_sha256,await sha256(new TextEncoder().encode(raw)));batches++;
 for(let j=0;j<batch.length;j++){
  const p=predict(model,batch[j]),out=res.data.outputs[j];for(const k of ['raw','constrained'])for(let x=0;x<4;x++)worst=Math.max(worst,Math.abs(p[k][x]-out[k][x]));assert.deepEqual(out.exact_synthetic_rule,exactRule(batch[j]));
 }
}
check('560-row handler parity versus unchanged numerical core',worst===0);check('all70 response hashes and request byte digests verified',batches===70);
const good=rows[0].features;const bool=[...good];bool[0]=true;const str=[...good];str[0]='0';const huge=[...good];huge[0]=1e300;
for(const [name,body,opts,status,error] of [
 ['empty-batch','[]',{},400,'BATCH_RANGE'],['too-many-rows',JSON.stringify(Array(9).fill(good)),{},400,'BATCH_RANGE'],['malformed','[',{},400,'INVALID_JSON'],['object-not-array','{"rows":[]}',{},400,'BATCH_RANGE'],['short-features','[[1]]',{},422,'FEATURE_CONTRACT'],['booleans',JSON.stringify([bool]),{},422,'FEATURE_CONTRACT'],['numeric-strings',JSON.stringify([str]),{},422,'FEATURE_CONTRACT'],['huge-number',JSON.stringify([huge]),{},422,'FEATURE_CONTRACT'],['infinity','[[1e309,0,0,0,1,0,0,0,1,1,0]]',{},422,'FEATURE_CONTRACT'],['wrong-model',JSON.stringify([good]),{headers:{'x-model-sha256':'0'.repeat(64)}},409,'MODEL_PIN_REQUIRED_OR_MISMATCH'],['wrong-media','[]',{headers:{'content-type':'text/plain'}},415,'JSON_REQUIRED'],['compressed','[]',{headers:{'content-encoding':'gzip'}},415,'CONTENT_ENCODING_UNSUPPORTED'],['wrong-method',null,{method:'GET'},405,'METHOD_NOT_ALLOWED'],['unknown-path','[]',{path:'https://preview.example/private'},404,'NOT_FOUND'],['expired',JSON.stringify([good]),{time:Date.parse(EXPIRES_AT)},410,'PREVIEW_EXPIRED'],['large-body',' '.repeat(MAX_BYTES+1),{},413,'BODY_TOO_LARGE'],['declared-large','[]',{headers:{'content-length':'9000'}},413,'BODY_TOO_LARGE'],['invalid-utf8',new Uint8Array([0xff]),{},400,'INVALID_UTF8_OR_REQUEST']]){
 const res=await request(body,opts);check(name,res.status===status&&res.data.error===error&&!('outputs' in res.data));
}
const health=await request(null,{method:'GET',path:'https://preview.example/health'});check('health exposes fixed model and no authority',health.status===200&&health.data.execution_authority===false&&health.data.storage_writes===0);
const expiry=await request(null,{method:'GET',path:'https://preview.example/health',time:Date.parse(EXPIRES_AT)});check('expired health is explicit',expiry.data.state==='EXPIRED_RESEARCH_PREVIEW');
const valid=await request(JSON.stringify([good]));check('valid input recovers after refusals',valid.status===200);check('preview responses not cacheable',valid.headers.get('cache-control')==='no-store');check('predictions carry explicit research limits',valid.data.gspc_admitted===false&&valid.data.cosmos_loaded===false&&valid.data.signed===false&&valid.data.persisted===false);
const report={state:'PASS',contract_checks:checks,assertions:named,retained_rows:rows.length,batches,batch_limit:8,max_handler_difference:worst,model_sha256:WEIGHTS_SHA,environment:'Node handler tests, not Cloudflare-hosted execution',new_training:false};
await writeFile(new URL('node-tests.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
