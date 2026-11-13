// MIT. Real inference over the pinned 980-parameter checkpoint. No I/O or execution.
export const VERSION = '0.2.0';
export const WEIGHTS_SHA = '9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b';
export const TEST_SHA = '6349f1e13d5e1952566110d52494d8da3dd4bde7b01bbaffecc28fdb8b66aa9c';
export const METHODS = ['raw_neural','constrained_neural','persistence','exact_synthetic_rule'];
const finite = x => typeof x === 'number' && Number.isFinite(x);
const sum = xs => xs.reduce((a,b)=>a+b,0);
export function validateFeatures(x) {
  if (!Array.isArray(x) || x.length !== 11 || !x.every(finite)) throw Error('Expected exactly 11 finite numeric features; booleans are not numbers.');
  if (x.slice(0,7).some(v=>v<0||v>1) || Math.abs(sum(x.slice(0,4))-1)>1e-8 || Math.abs(sum(x.slice(4,7))-1)>1e-8) throw Error('Previous-state and profile proportions must each sum to one.');
  if (![0,1].includes(x[7]) || ![0,1].includes(x[9]) || x[8]<-.875 || x[8]>1.125 || x[10]<0 || x[10]>.875) throw Error('Outside the qualified synthetic feature range.');
  return x;
}
export function validateModel(m) {
  if (!m || m.format !== 'meok.experimental-process-predictor/1' || m.hidden_activation!=='relu' || m.output_activation!=='identity') throw Error('Unsupported model format.');
  if (!Array.isArray(m.scaler_mean)||m.scaler_mean.length!==11||!m.scaler_mean.every(finite)||!Array.isArray(m.scaler_scale)||m.scaler_scale.length!==11||!m.scaler_scale.every(v=>finite(v)&&v>0)) throw Error('Invalid scaler.');
  if (!Array.isArray(m.coefs)||m.coefs.length<1||m.coefs.length>5||!Array.isArray(m.intercepts)||m.intercepts.length!==m.coefs.length) throw Error('Invalid layers.');
  let width=11;
  m.coefs.forEach((a,i)=>{
    const b=m.intercepts[i];
    if(!Array.isArray(b)||b.length<1||b.length>1024||!b.every(finite)||!Array.isArray(a)||a.length!==width||!a.every(row=>Array.isArray(row)&&row.length===b.length&&row.every(finite))) throw Error('Invalid weight tensor.');
    width=b.length;
  });
  if(width!==4)throw Error('Expected four output states.');
  return m;
}
export function predict(model, features) {
  validateFeatures(features);
  let z=features.map((v,i)=>(v-model.scaler_mean[i])/model.scaler_scale[i]);
  model.coefs.forEach((a,i)=>{
    z=model.intercepts[i].map((bias,j)=>z.reduce((s,v,k)=>s+v*a[k][j],0)+bias);
    if(i+1<model.coefs.length)z=z.map(v=>Math.max(0,v));
  });
  if(!z.every(finite))throw Error('Nonfinite model output.');
  const raw=z.slice();let constrained=raw.map(v=>Math.max(0,Math.min(1,v))),total=sum(constrained);
  constrained=total ? constrained.map(v=>v/total) : features.slice(0,4);
  if(features[8]<=0)constrained=features.slice(0,4);
  return {raw,constrained,expiry_rule_applied:features[8]<=0};
}
// This is an independent closed-form implementation of the published generator's
// choice table, not a learned forecast and not real permission or human approval.
export function exactRule(x) {
  validateFeatures(x);
  if(x[8]<=0)return x.slice(0,4);
  return x[7]===1&&x[9]===1 ? [0,x[4]+x[5],x[6],0] : [x[4],x[5],x[6],0];
}
export function compare(model, features, target=null) {
  const x=validateFeatures(features).slice(),p=predict(model,x);
  if(target!==null && (!Array.isArray(target)||target.length!==4||!target.every(v=>finite(v)&&v>=0&&v<=1)||Math.abs(sum(target)-1)>1e-8))throw Error('Invalid reference target.');
  const outputs={raw_neural:p.raw,constrained_neural:p.constrained,persistence:x.slice(0,4),exact_synthetic_rule:exactRule(x)};
  const errors=target===null?null:Object.fromEntries(METHODS.map(k=>[k,{mae:sum(outputs[k].map((v,i)=>Math.abs(v-target[i])))/4,max_abs_error:Math.max(...outputs[k].map((v,i)=>Math.abs(v-target[i])))}]));
  return {schema:'csoai.meok.hybrid.comparison.v2',version:VERSION,status:'SIMULATION_ONLY',features:x,outputs,reference:target===null?null:target.slice(),reference_kind:target===null?'NONE':'RETAINED_SYNTHETIC_ENGINE_ROW',errors,router:{selected:'exact_synthetic_rule',reason:'Known generator mechanics; neural outputs are advisory, never permission.'},expiry_rule_applied:p.expiry_rule_applied,weights_sha256:WEIGHTS_SHA,executed:false,authorises_execution:false,gspc_admitted:false,cosmos_loaded:false,model_calls:1,limits:['Synthetic procurement transitions with privileged profile counts only.','A rule prediction is not an observation, authenticated approval, or real-world guarantee.','No model training or weight merging occurs.']};
}
export function replay(model, rows) {
  if(!Array.isArray(rows)||rows.length!==560)throw Error('Expected the pinned 560-row test bank.');
  const acc=Object.fromEntries(METHODS.map(k=>[k,{abs:0,max_abs_error:0,out:0,sumError:0}]));
  let expiryRows=0;
  const episodes=new Set();
  for(const row of rows){
    if(row.split!=='test'||!Number.isInteger(row.episode)||row.episode<250||row.episode>319||!Number.isInteger(row.tick)||row.tick<0||row.tick>7)throw Error('Invalid held-out row metadata.');
    episodes.add(row.episode);if(row.features[8]<=0)expiryRows++;
    const c=compare(model,row.features,row.target);
    for(const k of METHODS){const a=acc[k],pred=c.outputs[k];a.sumError+=Math.abs(sum(pred)-1);pred.forEach((v,i)=>{const e=Math.abs(v-row.target[i]);a.abs+=e;a.max_abs_error=Math.max(a.max_abs_error,e);if(v<0||v>1)a.out++;});}
  }
  const metrics=Object.fromEntries(METHODS.map(k=>[k,{mae:acc[k].abs/(rows.length*4),max_abs_error:acc[k].max_abs_error,out_of_range_fraction:acc[k].out/(rows.length*4),sum_constraint_mae:acc[k].sumError/rows.length}]));
  return {schema:'csoai.meok.hybrid.replay.v2',status:'REPLAY_COMPLETE',rows:rows.length,episodes:episodes.size,expiry_rows:expiryRows,metrics,weights_sha256:WEIGHTS_SHA,test_sha256:TEST_SHA,new_training:false,cosmos_loaded:false,paid_compute:false,gspc_admitted:false,authorises_execution:false,limits:['Re-evaluation of an already published test set, not a new blinded benchmark.','Exact-rule performance follows from known synthetic mechanics and fully observed profile counts.','Average improvement does not remove large worst-case learned error.']};
}
export function canonical(x) {
  if(x===null||typeof x==='boolean'||typeof x==='string')return JSON.stringify(x);
  if(typeof x==='number'){if(!finite(x))throw Error('Nonfinite receipt.');return JSON.stringify(x);}
  if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
  if(typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
  throw Error('Unsupported receipt value.');
}
export async function sha256(bytes) {
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verifyBytes(bytes,expected) {
  if(!/^[0-9a-f]{64}$/.test(expected)||await sha256(bytes)!==expected)throw Error('Artifact hash mismatch; inference refused.');
  return bytes;
}
export async function receipt(result) {
  const payload={schema:'csoai.meok.hybrid.receipt.v2',canonicalization:'sorted-json-v1',result,signed:false,persisted:false,authority:'none'};
  return {...payload,payload_sha256:await sha256(new TextEncoder().encode(canonical(payload)))};
}
