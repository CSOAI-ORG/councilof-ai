import {describe,it,expect,vi} from 'vitest';
import * as agenticFix from './agentic-fix';
import * as files from './files';
import * as learnLoop from './learn-loop';
import * as memory from './memory';
import * as operator from './operator';
import * as sandbox from './sandbox';
import * as witness from './witness';
import * as sovTownState from './sov-town/state.jsonl';
import * as corpusWatch from './corpus-watch';
import * as dashboard from './dashboard';
import * as decide from './decide';
import * as include from './include';
import * as mint from './mint';
import * as report from './report';
import * as reported from './reported';
import * as subscribe from './subscribe';
import * as verifyBatch from './verify-batch';
import * as verifyCard from './verify-card';

type Handler=(ctx:any)=>Promise<Response>|Response;
const cases:{name:string;method:'GET'|'POST';handler:Handler}[]=[
 ['agentic-fix','GET',agenticFix.onRequestGet as Handler],
 ['agentic-fix','POST',agenticFix.onRequestPost as Handler],
 ['files','GET',files.onRequestGet as Handler],
 ['files','POST',files.onRequestPost as Handler],
 ['learn-loop','GET',learnLoop.onRequestGet as Handler],
 ['learn-loop','POST',learnLoop.onRequestPost as Handler],
 ['memory','GET',memory.onRequestGet as Handler],
 ['memory','POST',memory.onRequestPost as Handler],
 ['operator','GET',operator.onRequestGet as Handler],
 ['operator','POST',operator.onRequestPost as Handler],
 ['sandbox','GET',sandbox.onRequestGet as Handler],
 ['sandbox','POST',sandbox.onRequestPost as Handler],
 ['witness','GET',witness.onRequestGet as Handler],
 ['witness','POST',witness.onRequestPost as Handler],
 ['sov-town/state.jsonl','GET',sovTownState.onRequestGet as Handler],
 ['corpus-watch','GET',corpusWatch.onRequestGet as Handler],
 ['corpus-watch','POST',corpusWatch.onRequestPost as Handler],
 ['dashboard','GET',dashboard.onRequestGet as Handler],
 ['dashboard','POST',dashboard.onRequestPost as Handler],
 ['decide','GET',decide.onRequestGet as Handler],
 ['include','GET',include.onRequestGet as Handler],
 ['mint','GET',mint.onRequestGet as Handler],
 ['report','POST',report.onRequestPost as Handler],
 ['reported','POST',reported.onRequestPost as Handler],
 ['subscribe','GET',subscribe.onRequestGet as Handler],
 ['subscribe','POST',subscribe.onRequestPost as Handler],
 ['verify-batch','GET',verifyBatch.onRequestGet as Handler],
 ['verify-card','GET',verifyCard.onRequestGet as Handler],
].map(([name,method,handler])=>({name:name as string,method:method as 'GET'|'POST',handler:handler as Handler}));

describe('all non-live fail-closed public methods remain closed',()=>{
 for(const c of cases){
  it(c.method+' /api/'+c.name+' cannot accidentally become a successful/effectful surface',async()=>{
   const put=vi.fn(async()=>undefined);
   const kv={get:vi.fn(async()=>null),put};
   const request=new Request('https://councilof.ai/api/'+c.name,{method:c.method,body:c.method==='POST'?new Uint8Array([1]):undefined});
   const response=await c.handler({request,env:{REVENUE_KV:kv,WITNESS_KV:kv},params:{},data:{},waitUntil:vi.fn()});
   expect(response).toBeInstanceOf(Response);
   expect(response.status).toBeGreaterThanOrEqual(400);
   expect(response.status).toBeLessThan(600);
   expect(response.headers.get('payment-required')).toBeNull();
   expect(response.headers.get('x-payment-response')).toBeNull();
   expect(response.headers.get('payment-response')).toBeNull();
   expect(put).not.toHaveBeenCalled();
   const text=await response.text();
   expect(text).not.toMatch(/"accepted"\s*:\s*true/i);
   expect(text).not.toMatch(/"persisted"\s*:\s*true/i);
   expect(text).not.toMatch(/"signed"\s*:\s*true/i);
   expect(text).not.toMatch(/"status"\s*:\s*"queued"/i);
   expect(text).not.toMatch(/"state"\s*:\s*"MEASURED"/i);
  });
 }
});
