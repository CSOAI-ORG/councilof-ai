import {afterEach, describe, expect, it, vi} from 'vitest';
import {onRequestGet} from './learning-scenarios';
import {GSPC_LEARNING_PATHS as paths, CANONICAL_AXIS_COUNT as count} from '../../client/src/data/gspc-learning-paths';
import {readLearningScenario} from '../../client/src/lib/learningScenarioReader';
// Real producer and consumer; ONLY upstream network data is synthetic and mocked.
function sources(broken?:string,disagree=false){
 const board={schema:'csoai.gspc-axes/0.5',totals:{axes:count+(disagree?1:0),measured_axes:0},
  axes:paths.map(p=>({axis:p.axis.id,family:p.axis.family,kind:p.axis.kind,bench:p.axis.bench,task:p.axis.task,status:'UNMEASURED',n:0}))};
 const docs:Record<string,unknown>={'/api/gspc':board,
  '/signed/findings_index.json':{schema:'csoai.regulation-findings-index/0.2',counts:{findings:0},axes:[],findings:[]},
  '/api/regulation':{schema:'csoai.regulation-deadlines/0.1',verified_as_of:'2026-09-26',deadlines:[]}};
 const fetcher=vi.fn(async(input:string|URL|Request,init?:RequestInit)=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  if(url.origin!=='https://example.test' || (init?.method??'GET')!=='GET') throw new Error('Unexpected egress');
  if(!Object.hasOwn(docs,url.pathname)) throw new Error('Unexpected source');
  return url.pathname===broken?new Response('unavailable',{status:503}):Response.json(docs[url.pathname]);
 });vi.stubGlobal('fetch',fetcher);return fetcher;
}
const read=(axis:string,n=count)=>readLearningScenario('/api/learning-scenarios?axis='+encodeURIComponent(axis),axis,n,
 {fetchImpl:async()=>onRequestGet({request:new Request('https://example.test/api/learning-scenarios?axis='+encodeURIComponent(axis))})});
afterEach(()=>vi.unstubAllGlobals());
describe('actual scenario producer to bounded display reader',()=>{
 it('round-trips every derived axis with no independent-admission or score claim',async()=>{
  const f=sources();for(const p of paths){const result=await read(p.axis.id);
   expect(result.axis).toBe(p.axis.id);expect(result.evidence.independently_admitted).toBe(false);
   expect(result.board_measurement.status).toBe('UNMEASURED');expect(result).not.toHaveProperty('score');}
  expect(f).toHaveBeenCalledTimes(count*3);
 });
 it('preserves effect-binding instrument identity without importing historical measurement',async()=>{
  sources();const result=await read('effect-binding');expect(result.axis).toBe('effect-binding');
  expect(result.board_measurement.kind).toBe(paths.find(p=>p.axis.id==='effect-binding')!.axis.kind);
  expect(result.board_measurement.status).toBe('UNMEASURED');
  expect(result.evidence.published_state).toBe('NONE_PUBLISHED');
 });
 it('rejects source absence rather than displaying a remembered successful response',async()=>{
  for(const missing of ['/api/gspc','/signed/findings_index.json','/api/regulation']){
   sources(missing);await expect(read('governance')).rejects.toThrow('HTTP 503');
  }
 });
 it('does not accept a board whose own totals disagree',async()=>{
  sources(undefined,true);await expect(read('governance')).rejects.toThrow('HTTP 503');
 });
 it('rejects unknown axis requests rather than substituting a different scenario',async()=>{
  sources();await expect(read('not-an-axis')).rejects.toThrow('HTTP 404');
 });
 it('holds a stale client registry without calling it current',async()=>{
  sources();await expect(read('governance',count-1)).rejects.toThrow('registry differs');
 });
});
