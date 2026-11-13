// Research preview only. Uses the unchanged published model core; no fetch/storage/AI bindings.
import {validateModel,validateFeatures,predict,exactRule,WEIGHTS_SHA,sha256} from './vendor/core.mjs';
import rawWeights from './weights-text.mjs';
export const MAX_BYTES=8192,MAX_ROWS=8;
export const EXPIRES_AT='2026-11-12T00:00:00Z';
const enc=new TextEncoder();
const boot=(async()=>{if(await sha256(enc.encode(rawWeights))!==WEIGHTS_SHA)throw Error('MODEL_INTEGRITY');return validateModel(JSON.parse(rawWeights));})();
const limits={max_input_bytes:MAX_BYTES,max_rows:MAX_ROWS,expires_at:EXPIRES_AT};
const baseHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
async function reply(value,status=200){const text=JSON.stringify(value),hash=await sha256(enc.encode(text));return new Response(text,{status,headers:{...baseHeaders,'X-Content-SHA256':hash}});}
async function boundedText(request){
 const declared=request.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>MAX_BYTES))throw Error('BODY_TOO_LARGE');
 if(!request.body)throw Error('EMPTY_BODY');
 const reader=request.body.getReader(),chunks=[];let bytes=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_BYTES){await reader.cancel();throw Error('BODY_TOO_LARGE');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const raw=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length;}
 return {raw,text:new TextDecoder('utf-8',{fatal:true}).decode(raw)};
}
export async function handle(request,now=Date.now()){
 const path=new URL(request.url).pathname;
 if(path==='/health'&&request.method==='GET')return reply({state:now>=Date.parse(EXPIRES_AT)?'EXPIRED_RESEARCH_PREVIEW':'RESEARCH_PREVIEW',weights_sha256:WEIGHTS_SHA,limits,backend:'Cloudflare Worker CPU when deployed; same handler testable in Node',upstream_fetches:0,storage_writes:0,model_training:false,execution_authority:false,gspc_admitted:false});
 if(path!=='/v1/predict')return reply({error:'NOT_FOUND'},404);
 if(request.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405);
 if(now>=Date.parse(EXPIRES_AT))return reply({error:'PREVIEW_EXPIRED'},410);
 if(request.headers.get('content-encoding'))return reply({error:'CONTENT_ENCODING_UNSUPPORTED'},415);
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return reply({error:'JSON_REQUIRED'},415);
 if(request.headers.get('x-model-sha256')!==WEIGHTS_SHA)return reply({error:'MODEL_PIN_REQUIRED_OR_MISMATCH'},409);
 try{
  const {raw,text}=await boundedText(request);let rows;
  try{rows=JSON.parse(text);}catch{return reply({error:'INVALID_JSON'},400);}
  // Array-only grammar: no caller-controlled option/authority/source object keys.
  if(!Array.isArray(rows)||rows.length<1||rows.length>MAX_ROWS)return reply({error:'BATCH_RANGE'},400);
  try{for(const row of rows)validateFeatures(row);}catch{return reply({error:'FEATURE_CONTRACT'},422);}
  const model=await boot;const outputs=rows.map(features=>{const result=predict(model,features);return {raw:result.raw,constrained:result.constrained,exact_synthetic_rule:exactRule(features),expiry_rule_applied:result.expiry_rule_applied};});
  return reply({schema:'csoai.process-cross-runtime/1',state:'SYNTHETIC_PREDICTIONS_ONLY',weights_sha256:WEIGHTS_SHA,input_sha256:await sha256(raw),rows:rows.length,outputs,limits,signed:false,persisted:false,authorises_execution:false,gspc_admitted:false,cosmos_loaded:false});
 }catch(e){if(e.message==='BODY_TOO_LARGE')return reply({error:'BODY_TOO_LARGE'},413);if(e.message==='EMPTY_BODY')return reply({error:'EMPTY_BODY'},400);if(e instanceof TypeError)return reply({error:'INVALID_UTF8_OR_REQUEST'},400);return reply({error:'RESEARCH_WORKER_FAILURE'},500);}
}
export default {fetch(request){return handle(request);}};
