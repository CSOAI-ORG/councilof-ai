// Existing bounded-reader assertions moved into the repository's native test runner.
import assert from 'node:assert/strict';
import {it as test} from 'vitest';
import {parseLearningScenario as parse, readLearningScenario as read} from './learningScenarioReader';
const fixture: any = {"schema": "csoai.learning-scenarios/0.1", "state": "READY", "canonical_axis_count": 23, "scenario_count": 1, "policy": {"read_only": true, "candidate_submission_requires_explicit_consent": true, "writes_board": false, "model_training": false, "automatic_fixing": false, "automatic_promotion": false}, "scenarios": [{"axis": "governance", "board_measurement": {"status": "UNMEASURED", "kind": "model-comparison", "source": "fixture:synthetic-board"}, "evidence": {"published_state": "NONE_PUBLISHED", "independently_admitted": false}, "regulation_context": {"state": "UNMAPPED", "source": "fixture:no-legal-source", "pointers": []}}]};
const copy = () => structuredClone(fixture);
const reject = (change) => {const x=copy();change(x);assert.throws(()=>parse(x,'governance',23));};
test('synthetic_source_exact_axis_parses',()=>assert.equal(parse(fixture,'governance',23).axis,'governance'));
test('projection_does_not_export_measurement_rows',()=>assert.equal('published_measurements' in parse(fixture,'governance',23).evidence,false));
test('projection_omits_raw_authority',()=>{const x=copy();x.execute=true;assert.equal('execute' in parse(x,'governance',23),false);});
for(const [id,change] of [
 ['schema',x=>x.schema='wrong'], ['state_missing',x=>delete x.state], ['state_array',x=>x.state=['READY']],
 ['state_unavailable',x=>x.state='UNAVAILABLE'], ['axis_count',x=>x.canonical_axis_count=13], ['axis_count_string',x=>x.canonical_axis_count='23'],
 ['scenario_count',x=>x.scenario_count=2], ['scenario_count_string',x=>x.scenario_count='1'],
 ['duplicate_scenarios',x=>x.scenarios.push(structuredClone(x.scenarios[0]))], ['empty_scenarios',x=>x.scenarios=[]],
 ['wrong_axis',x=>x.scenarios[0].axis='safety'], ['policy_missing',x=>delete x.policy], ['policy_array',x=>x.policy=[]],
 ['readonly_false',x=>x.policy.read_only=false], ['consent_missing',x=>delete x.policy.candidate_submission_requires_explicit_consent],
 ['board_array',x=>x.scenarios[0].board_measurement=[]], ['board_status_object',x=>x.scenarios[0].board_measurement.status={}],
 ['board_status_blank',x=>x.scenarios[0].board_measurement.status=' '], ['published_state_object',x=>x.scenarios[0].evidence.published_state={}],
 ['admission_true',x=>x.scenarios[0].evidence.independently_admitted=true], ['admission_zero',x=>x.scenarios[0].evidence.independently_admitted=0],
 ['pointers_object',x=>x.scenarios[0].regulation_context.pointers={}], ['pointer_null',x=>x.scenarios[0].regulation_context.pointers=[null]],
 ['pointer_text_object',x=>x.scenarios[0].regulation_context.pointers=[{obligation:{text:'injected'}}]],
 ['pointer_oversize',x=>x.scenarios[0].regulation_context.pointers=Array(201).fill({})],
 ['mapping_note_object',x=>x.scenarios[0].regulation_context.note={}],
]) test('reject_'+id,()=>reject(change));
for (const key of ['writes_board','model_training','automatic_fixing','automatic_promotion']) {
 for (const [label,value] of [['true',true],['zero',0],['missing',undefined]])
  test(`reject_${key}_${label}`,()=>reject(x=>{if(value===undefined)delete x.policy[key];else x.policy[key]=value;}));
}
test('root_null_rejected',()=>assert.throws(()=>parse(null,'governance',23)));
test('invalid_axis_rejected',()=>assert.throws(()=>parse(fixture,'../governance',23)));
test('positive_int_axis_registry_required',()=>assert.throws(()=>parse(fixture,'governance',0)));
const response=(body: BodyInit=JSON.stringify(fixture),headers: Record<string,string>={})=>new Response(body,{headers:{'content-type':'application/json',...headers}});
test('bounded_transport_valid',async()=>assert.equal((await read('/fixture','governance',23,{fetchImpl:async()=>response()})).axis,'governance'));
for(const media of ['text/html','application/jsonp','text/plain'])
 test('reject_media_'+media,()=>assert.rejects(()=>read('/fixture','governance',23,{fetchImpl:async()=>response('{}',{'content-type':media})}),/JSON contract/));
test('reject_http_503',()=>assert.rejects(()=>read('/fixture','governance',23,{fetchImpl:async()=>new Response('{}',{status:503})}),/HTTP 503/));
test('reject_bad_json',()=>assert.rejects(()=>read('/fixture','governance',23,{fetchImpl:async()=>response('{')}),/invalid JSON/));
test('reject_invalid_utf8',()=>assert.rejects(()=>read('/fixture','governance',23,{fetchImpl:async()=>response(new Uint8Array([0xff]))})));
test('reject_claimed_size',()=>assert.rejects(()=>read('/fixture','governance',23,{fetchImpl:async()=>response('{}',{'content-length':'2097153'})}),/budget/));
test('reject_streamed_size',()=>assert.rejects(()=>read('/fixture','governance',23,{maxBytes:10,fetchImpl:async()=>response(' '.repeat(100))}),/budget/));
test('timeout_before_headers',()=>assert.rejects(()=>read('/fixture','governance',23,{timeoutMs:15,fetchImpl:()=>new Promise<Response>(()=>{})}),/timed out/));
test('timeout_during_stream',()=>assert.rejects(()=>read('/fixture','governance',23,{timeoutMs:15,fetchImpl:async()=>response(new ReadableStream({start(){}}))}),/timed out/));
test('pre_cancel_never_fetches',async()=>{let n=0;const c=new AbortController();c.abort();await assert.rejects(()=>read('/fixture','governance',23,{signal:c.signal,fetchImpl:async()=>{n++;return response();}}),{name:'AbortError'});assert.equal(n,0);});
test('cancel_pending_fetch',async()=>{const c=new AbortController();const r=read('/fixture','governance',23,{signal:c.signal,fetchImpl:()=>new Promise<Response>(()=>{})});setTimeout(()=>c.abort(),10);await assert.rejects(r,{name:'AbortError'});});
test('reject_timeout_zero',()=>assert.rejects(()=>read('/fixture','governance',23,{timeoutMs:0}),/timeout/));
test('reject_size_zero',()=>assert.rejects(()=>read('/fixture','governance',23,{maxBytes:0}),/byte budget/));
