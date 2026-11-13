import {assess,validateLock} from '../src/source_guard.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const canonical=x=>JSON.stringify(Array.isArray(x)?x.map(v=>JSON.parse(canonical(v))):x!==null&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(canonical(x[k]))])):x);
const rows=JSON.parse(readFileSync(new URL('./vectors.json',import.meta.url)));const decisions=[],failures=[];
for(const row of rows){
 const before=canonical(row);
 try{const r=await assess(row.lock,row.observation,row.now_ms);decisions.push({id:row.id,result:r});
 if(r.state!==row.expected_state||r.reason!==row.expected_reason||r.execution_authorized!==false||r.signature!==null||before!==canonical(row))failures.push({id:row.id,result:r});}
 catch(e){decisions.push({id:row.id,error:e.name});failures.push({id:row.id,error:e.message});}
}
const digest=createHash('sha256').update(canonical(decisions)).digest('hex');
const out={runtime:process.version,contract_cases:rows.length,passed:rows.length-failures.length,decision_sha256:digest,status:failures.length?'FAILED':'PASSED',failures};
writeFileSync(new URL('../results/decisions-node.json',import.meta.url),canonical(decisions)+'\n');
writeFileSync(new URL('../results/node-result.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
if(failures.length)process.exitCode=1;
