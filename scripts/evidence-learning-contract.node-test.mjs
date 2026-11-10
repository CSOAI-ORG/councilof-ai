import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {publicURL,readPublic,validateBoard,validateScenario,changedTotals,measurementTimeLabel,LESSONS,practiceKey,practiceScore,makeReviewDraft,coachingContext} from '../public/evidence-learning/contract.mjs';
import {dailyBriefing,briefingView,briefingExercise} from '../public/evidence-learning/daily-briefing.mjs';
const board={schema:'csoai.gspc-axes/0.5',axes:[{axis:'governance',task:'A bounded task',status:'MEASURED',n:30}],totals:{axes:1,measured_axes:1,unmeasured_axes:0}};
test('reader allows only exact public sources and one exact axis',()=>{
 assert.equal(publicURL('/api/gspc'),'https://councilof.ai/api/gspc');
 assert.match(publicURL('/api/learning-scenarios?axis=governance'),/axis=governance$/);
 for(const p of ['https://evil.test/api/gspc','/mcp/free','/api/hitl','/api/gspc?x=1','/api/learning-scenarios?axis=x&axis=y','/api/learning-scenarios?axis=x&token=secret','https://user:pass@councilof.ai/api/gspc'])assert.throws(()=>publicURL(p));
});
test('public reads omit credentials and reject redirects; malformed/oversized replies fail',async()=>{
 let options;const fetcher=async(u,o)=>{options=o;return Response.json(board)};
 await readPublic('/api/gspc',{fetcher});assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>({ok:false,status:503})}),/503/);
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>new Response('{bad',{headers:{'content-type':'application/json'}})}));
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>new Response('x'.repeat(2000001),{headers:{'content-type':'application/json'}})}),/bounded/);
});
test('public reader cancels oversized streams and rejects redirect/non-JSON responses before parsing',async()=>{
 let cancelled=false;const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(2000001))},cancel(){cancelled=true}});
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>new Response(stream,{headers:{'content-type':'application/json'}})}),/bounded/);assert.equal(cancelled,true);
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>new Response('<html>login</html>',{headers:{'content-type':'text/html'}})}),/JSON/);
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>({ok:true,redirected:true})}),/redirect/);
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>new Response(JSON.stringify({text:'😀'.repeat(600000)}),{headers:{'content-type':'application/json'}})}),/bounded/);
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>new Response(new Uint8Array([123,34,120,34,58,34,255,34,125]),{headers:{'content-type':'application/json'}})}));
});
test('public source digest covers original bytes, including a decoded UTF-8 BOM',async()=>{
 const bytes=Buffer.concat([Buffer.from([239,187,191]),Buffer.from(JSON.stringify(board))]);const read=await readPublic('/api/gspc',{fetcher:async()=>new Response(bytes,{headers:{'content-type':'application/json'}})});assert.equal(read.sha256,createHash('sha256').update(bytes).digest('hex'));assert.deepEqual(read.data,board);
});
test('board roster is dynamic and count disagreement fails closed',()=>{
 assert.equal(validateBoard(board).axes.length,1);const larger=structuredClone(board);larger.axes.push({axis:'new-axis',task:'Another task',status:'UNMEASURED',n:0});larger.totals.axes=2;larger.totals.unmeasured_axes=1;assert.equal(validateBoard(larger).axes.length,2);
 for(const mutate of [b=>b.totals.axes=99,b=>b.axes.push({...b.axes[0]}),b=>b.axes[0].status='CERTIFIED',b=>b.axes[0].n=-1]){const b=structuredClone(board);mutate(b);assert.throws(()=>validateBoard(b))}
});
test('wrong-axis, duplicate and unavailable scenarios are not substituted',()=>{
 const s={schema:'csoai.learning-scenarios/0.1',scenarios:[{axis:'governance'}]};assert.equal(validateScenario(s,'governance').axis,'governance');assert.throws(()=>validateScenario(s,'care'));s.scenarios.push({axis:'governance'});assert.throws(()=>validateScenario(s,'governance'));
});
test('learning points are axis- and lesson-version-specific',()=>{
 const l=LESSONS[0],p={[practiceKey('governance',l)]:{correct:true}};assert.equal(practiceScore(p,'governance'),1);assert.equal(practiceScore(p,'safety'),0);assert.equal(practiceScore({[practiceKey('governance',{...l,version:'old'})]:{correct:true}},'governance'),0);
});
test('review drafts always hold and cannot convert learning into authority',()=>{
 const p=Object.fromEntries(LESSONS.map(l=>[practiceKey('governance',l),{correct:true}]));
 const d=makeReviewDraft({axis:'governance',capture:{readAt:'2026-11-04',sha256:'abc'},proposal:{task:'Synthetic task',change:'Bounded proposal',notes:'SECRET HUB NOTE'},learning:p});
 assert.equal(d.learning.synthetic_exercises_completed,3);assert.equal(d.learning.grants_authority,false);assert.equal(d.review.execution_allowed,false);assert.equal(d.review.decision,'HOLD');assert.equal(d.review.receipt,null);assert.equal(d.external_delivery.wg_safe,'NOT_SENT');assert.equal(d.external_delivery.provider,'NOT_SENT');assert.doesNotMatch(JSON.stringify(d),/SECRET HUB NOTE/);assert.match(d.canonical_process_records.state,/NOT_CREATED/);
});
test('source-only coaching context does not include private hub notes or proposal data',()=>{
 const c=coachingContext('governance',{readAt:'2026-11-04',data:board,notes:'PRIVATE_SENTINEL'});assert.match(c,/A bounded task/);assert.doesNotMatch(c,/PRIVATE_SENTINEL/);assert.match(c,/Propose changes only/);
 assert.match(c,/Measurement time: Not supplied or uncheckable/);assert.match(c,/Retrieval does not refresh a measurement/);
 const dated=structuredClone(board);dated.axes[0].measurement_time={state:'DAY',observed_on:'2026-08-12'};
 assert.match(coachingContext('governance',{readAt:'2026-11-06',data:dated}),/Measurement time: 2026-08-12 \(day precision\)/);
});
test('comparison preserves unknown and uses consistent denominators',()=>{
 const x=changedTotals({totals:{axes:33,measured_axes:23,unmeasured_axes:10}},{totals:{axes:34,measured_axes:34,unmeasured_axes:0}});assert.deepEqual(x.map(x=>x.difference),[1,11,-10]);assert.equal(changedTotals(null,{totals:{axes:2}})[0].difference,null);
});
test('measurement time displays source precision and does not substitute the retrieval time',()=>{
 assert.equal(measurementTimeLabel({state:'EXACT',observed_at:'2026-09-16T11:06:53Z'}),'2026-09-16T11:06:53Z (exact time reported)');
 assert.equal(measurementTimeLabel({state:'DAY',observed_on:'2026-08-12'}),'2026-08-12 (day precision)');
 assert.equal(measurementTimeLabel({state:'NOT_AFTER',not_after:'2026-08-19T09:24:39.162060+00:00'}),'Not after 2026-08-19T09:24:39.162060+00:00 (exact time unknown)');
 for(const t of [null,{state:'UNCHECKABLE'},{state:'EXACT',observed_at:'bad'},{state:'EXACT',observed_at:'2026-02-30T10:00:00Z'},{state:'DAY',observed_on:'2026-02-30'},{state:'DAY',observed_on:'2026-99-99'},{state:'NOT_AFTER',not_after:'2026-08-19'}])assert.equal(measurementTimeLabel(t),'Not supplied or uncheckable');
 const source=readFileSync(new URL('../public/evidence-learning/element.js',import.meta.url),'utf8');
 assert.match(source,/measurementTimeLabel\(row\.measurement_time\)/);
});
test('the rendered observation distinguishes measurement time from the source read',async()=>{
 const priorElement=globalThis.HTMLElement,priorRegistry=globalThis.customElements;
 globalThis.HTMLElement=class {};globalThis.customElements={get:()=>true};
 try {
  const {CouncilEvidenceLearning}=await import('../public/evidence-learning/element.js');
  const view={capture:{data:{totals:board.totals},readAt:'2026-11-06T06:00:00Z',sha256:'a'.repeat(64)},data:{shots:[]},readState:'SOURCE_READ'};
  const row={...board.axes[0],measurement_time:{state:'EXACT',observed_at:'2026-09-16T11:06:53Z'}};
  const html=CouncilEvidenceLearning.prototype.observe.call(view,row);
  assert.match(html,/Measurement date: 2026-09-16T11:06:53Z \(exact time reported\)/);
  assert.match(html,/Retrieval time below is a separate date/);
  assert.doesNotMatch(html,/Measurement date: Not supplied/);
 } finally {
  if(priorElement===undefined)delete globalThis.HTMLElement;else globalThis.HTMLElement=priorElement;
  if(priorRegistry===undefined)delete globalThis.customElements;else globalThis.customElements=priorRegistry;
 }
});
test('UI has no external execution client and stops polling when hidden or disconnected',()=>{
 const s=readFileSync(new URL('../public/evidence-learning/element.js',import.meta.url),'utf8');assert.doesNotMatch(s,/method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]|sendBeacon|WebSocket/);assert.match(s,/visibilityState==='visible'/);assert.match(s,/disconnectedCallback/);assert.match(s,/60000/);assert.match(s,/NOT_QUALIFIED|Not qualified/);assert.match(s,/this\.data\.proposals\[this\.axis\]/);
});
test('learning imports reject malformed sources and authority-shaped objects',async()=>{
 const {validateLearningBackup,VERSION}=await import('../public/evidence-learning/contract.mjs');
 const value={component_version:VERSION,progress:{},proposals:{},shots:[]};assert.equal(validateLearningBackup(value),value);
 assert.throws(()=>validateLearningBackup({...value,proposals:{constructor:{task:'bad'}}}));
 assert.throws(()=>validateLearningBackup({...value,progress:{'axis:evidence-scope:1':{correct:'yes',selected:1,attempts:1}}}));
 assert.throws(()=>validateLearningBackup({...value,shots:[{url:'https://evil.test',readAt:'2026-11-04',sha256:'a'.repeat(64),totals:{axes:1,measured_axes:1,unmeasured_axes:0}}]}));
});
test('a source cache preserves dates, strips unrelated fields and stays a source capture',async()=>{
 const {captureForStorage}=await import('../public/evidence-learning/contract.mjs');
 const capture=captureForStorage({url:'https://councilof.ai/api/gspc',readAt:'2026-11-04T06:00:00Z',sha256:'a'.repeat(64),raw:'UNRELATED_RAW',data:{...board,unrelated:'UNRELATED_DATA'}});
 assert.equal(capture.readAt,'2026-11-04T06:00:00Z');assert.doesNotMatch(JSON.stringify(capture),/UNRELATED_RAW|UNRELATED_DATA/);assert.throws(()=>captureForStorage({...capture,url:'https://evil.test'}));
});
test('draft completeness is separate from receiver and execution authority',async()=>{
 const {reviewReadiness}=await import('../public/evidence-learning/contract.mjs');assert.equal(reviewReadiness({},null).ready,false);
 const capture={url:'https://councilof.ai/api/gspc',readAt:'2026-11-04T06:00:00Z',sha256:'a'.repeat(64),data:board};const proposal={task:'Public task',target:'Pinned artifact',change:'Bounded proposal'};
 assert.equal(reviewReadiness(proposal,capture).ready,true);assert.equal(makeReviewDraft({axis:'governance',capture,proposal,learning:{}}).review.execution_allowed,false);
});
test('old backups migrate without losing proposals or progress',async()=>{
 const {normalizeLearningState,VERSION}=await import('../public/evidence-learning/contract.mjs');const old={component_version:'0.1.0',progress:{},proposals:{governance:{task:'Saved task'}},shots:[]};const migrated=normalizeLearningState(old);assert.equal(migrated.component_version,VERSION);assert.equal(migrated.proposals.governance.task,'Saved task');assert.deepEqual(migrated.ui,{axis:'governance',stage:'observe'});
});
test('resuming preserves the selected axis and step and rejects inconsistent learning answers',async()=>{
 const {normalizeLearningState,VERSION}=await import('../public/evidence-learning/contract.mjs');const s=normalizeLearningState({component_version:VERSION,progress:{},proposals:{},shots:[],ui:{axis:'safety',stage:'propose'}});assert.equal(s.ui.axis,'safety');assert.equal(s.ui.stage,'propose');assert.throws(()=>normalizeLearningState({...s,progress:{'safety:evidence-scope:1':{correct:true,selected:0,attempts:1}}}));
});
test('background refresh does not replace the proposal source binding',()=>{const s=readFileSync(new URL('../public/evidence-learning/element.js',import.meta.url),'utf8');assert.match(s,/paintSource\(background\)/);assert.match(s,/proposalCapture\(\)/);assert.match(s,/case'pin-source'/);assert.match(s,/aria-controls="stage-panel"/);assert.match(s,/tabindex="\$\{this.stage===id\?'0':'-1'\}"/);assert.match(s,/this\.bound=true/);});

const reportDay='2026-11-06',reportId='a'.repeat(64);
test('dashboard asset revisions bind the shipped module graph independently of the local-state protocol',async()=>{
 const {VERSION}=await import('../public/evidence-learning/contract.mjs');
 const element=readFileSync(new URL('../public/evidence-learning/element.js',import.meta.url));
 const loader=readFileSync(new URL('../client/src/components/DashboardEvidenceLearningPane.tsx',import.meta.url),'utf8');
 const src=loader.match(/script\.src = "([^"]+)"/);assert.ok(src);
 const asset=new URL(src[1],'https://councilof.ai');
 assert.equal(asset.pathname,'/evidence-learning/element.js');
 assert.equal(asset.searchParams.get('v'),VERSION);
 assert.equal(asset.searchParams.get('rev'),createHash('sha256').update(element).digest('hex').slice(0,12));
 const imports=[...element.toString('utf8').matchAll(/^import .+ from ['"]([^'"]+)['"];$/gm)].map(match=>match[1]);
 for(const name of ['contract.mjs','daily-briefing.mjs']){
  const specifier=imports.find(value=>new URL(value,asset).pathname===`/evidence-learning/${name}`);assert.ok(specifier,`${name} import required`);
  const dependency=new URL(specifier,asset),bytes=readFileSync(new URL(`../public/evidence-learning/${name}`,import.meta.url));
  assert.equal(dependency.origin,'https://councilof.ai');
  assert.equal(dependency.searchParams.get('rev'),createHash('sha256').update(bytes).digest('hex').slice(0,12));
 }
});
const dailyIndex=()=>({schema:'csoai.daily-signal-index/0.1',report_count:1,latest_report_day:reportDay,latest_report_id:reportId,signed:false,reports:[{report_day:reportDay,report_id:reportId,json_path:`/reports/daily-signal/${reportDay}.json`,markdown_path:`/reports/daily-signal/${reportDay}.md`,counts:{events_in_horizon:8,mapped_events:0,unmapped_events:8},private_text:'PRIVATE_SENTINEL'}]});
test('daily briefing retains exact dated metadata without source bodies or authority',()=>{
 const b=dailyBriefing(dailyIndex(),'2026-11-07T03:00:00Z');assert.equal(b.state,'AVAILABLE');assert.equal(b.report_id_declared,reportId);assert.equal(b.freshness.age_days,1);assert.equal(b.source_integrity,'INDEX_DECLARATION_ONLY');assert.equal(b.grants_authority,false);assert.equal(b.model_training,false);assert.doesNotMatch(JSON.stringify(b),/PRIVATE_SENTINEL/);
 assert.equal(dailyBriefing(dailyIndex(),'2026-11-10T03:00:00Z').freshness.state,'STALE');
 assert.equal(briefingView(b,'2026-11-10T03:00:00Z').freshness.state,'STALE');
});
test('daily briefing rejects inconsistent IDs, counts, future days and link injection',()=>{
 for(const mutate of [i=>i.report_count=2,i=>i.reports.push({...i.reports[0]}),i=>i.reports[0].report_id='b'.repeat(64),i=>i.reports[0].counts.mapped_events=1,i=>i.reports[0].json_path='https://evil.test/report.json',i=>i.latest_report_day='2026-02-30']){
  const i=dailyIndex();mutate(i);assert.equal(dailyBriefing(i,'2026-11-07').state,'UNAVAILABLE');
 }
 assert.equal(dailyBriefing(dailyIndex(),'2026-11-05').reason,'FUTURE_REPORT_DAY');assert.equal(dailyBriefing(null).state,'UNAVAILABLE');
});
test('free daily exercise derives its question from metadata and grants no completion status',()=>{
 const b=dailyBriefing(dailyIndex(),'2026-11-07');const lesson=briefingExercise(b);assert.match(lesson.question,/8 unmapped/);assert.equal(lesson.answer,1);assert.equal(briefingExercise(null),null);assert.equal(lesson.grants_authority,undefined);
});
test('daily briefing view renders exact first-party links and source limits',async()=>{
 const priorElement=globalThis.HTMLElement,priorRegistry=globalThis.customElements;globalThis.HTMLElement=class {};globalThis.customElements={get:()=>true};
 try {const {CouncilEvidenceLearning}=await import('../public/evidence-learning/element.js');const b=dailyBriefing(dailyIndex());const html=CouncilEvidenceLearning.prototype.dailyBriefingPanel.call({briefing:b,briefingReadAt:'2026-11-07T03:00:00Z',briefingAnswer:1});assert.match(html,/https:\/\/councilof.ai\/reports\/daily-signal\/2026-11-06.md/);assert.match(html,/has not verified the report bytes/);assert.match(html,/grant no role/);assert.match(html,/8 unmapped/);assert.match(html,/data-briefing-answer="1"/);assert.doesNotMatch(html,/PRIVATE_SENTINEL/);
 const unavailable=CouncilEvidenceLearning.prototype.dailyBriefingPanel.call({briefing:null});assert.match(unavailable,/metadata is unavailable/);
 } finally {if(priorElement===undefined)delete globalThis.HTMLElement;else globalThis.HTMLElement=priorElement;if(priorRegistry===undefined)delete globalThis.customElements;else globalThis.customElements=priorRegistry;}
});



// Offline regression cases: synthetic inputs and a minimal view adapter only.
// These do not establish production availability, browser layout or human acceptance.
async function reviewHarness(run) {
 const names=['HTMLElement','customElements','fetch','localStorage','document','setTimeout','clearTimeout'];
 const prior=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 const timers=[];
 Object.assign(globalThis,{HTMLElement:class {},customElements:{get:()=>true},
  fetch:async()=>{throw Error('UNEXPECTED_NETWORK_REQUEST')},
  localStorage:{setItem(){},getItem(){return null}},
  document:{visibilityState:'visible',removeEventListener(){}},
  setTimeout:(fn,ms)=>{const timer={fn,ms,cleared:false};timers.push(timer);return timer},
  clearTimeout:timer=>{if(timer)timer.cleared=true}});
 try {
  const {CouncilEvidenceLearning}=await import('../public/evidence-learning/element.js');
  const nodes=new Map([
   ['[data-learning-summary]',{innerHTML:'OLD_TASK'}],
   ['[data-scenario-context]',{innerHTML:'OLD_CONTEXT'}],
   ['[data-daily-briefing]',{innerHTML:''}],
   ['[data-source-status]',{textContent:''}],
   ['[data-do="refresh"]',{disabled:false}],
   ['.status',{textContent:''}]
  ]);
  const capture={url:'https://councilof.ai/api/gspc',readAt:'2026-11-06T06:00:00Z',sha256:'a'.repeat(64),data:structuredClone(board)};
  const view=Object.assign(Object.create(CouncilEvidenceLearning.prototype),{
   stage:'learn',axis:'governance',capture,scenario:null,scenarioState:'NOT_READ',scenarioNote:'Not read',
   briefing:null,briefingReadAt:null,briefingAnswer:null,readState:'CACHED',error:'',auto:false,
   loading:false,notice:'',draft:null,requestId:0,storage:true,storageBlocked:false,isConnected:true,
   data:{component_version:'0.2.0',progress:{},proposals:{governance:{task:'Saved task',target:'Pinned target',change:'Saved change'}},shots:[],pins:{governance:structuredClone(capture)},lastSource:structuredClone(capture)},
   shadowRoot:{activeElement:null,querySelector:selector=>nodes.get(selector)||null},
   renders:0,render(){this.renders++},scheduled:0,schedule(){this.scheduled++},
   dispatchEvent(){return true}
  });
  const scenario=(axis='governance',note='NEW_CONTEXT')=>({schema:'csoai.learning-scenarios/0.1',scenarios:[{axis,board_measurement:{status:'MEASURED'},evidence:{published_state:'PUBLISHED_VERIFIED'},regulation_context:{state:'UNMAPPED',note,pointers:[]}}]});
  await run({view,nodes,timers,scenario,CouncilEvidenceLearning});
 } finally {
  for(const [name,descriptor] of prior){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name]}
 }
}
const deferredResponse=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
const turn=()=>new Promise(resolve=>setImmediate(resolve));

test('hardening: 24-hour rollover cannot acquire an exact-time label',()=>{
 for(const value of ['2026-11-10T24:00:00Z','2026-11-10T24:00:00.000Z','2026-11-10T24:00:00+01:00'])
  assert.equal(measurementTimeLabel({state:'EXACT',observed_at:value}),'Not supplied or uncheckable',value);
});
test('hardening: upper bounds reject clock rollover too',()=>{
 assert.equal(measurementTimeLabel({state:'NOT_AFTER',not_after:'2026-11-10T24:00:00Z'}),'Not supplied or uncheckable');
});
test('hardening: valid offsets and fractional precision are preserved verbatim',()=>{
 for(const value of ['2026-11-10T00:00:00Z','2026-11-10T23:59:59.123456789Z','2026-11-10T04:30:00+05:45','2026-11-10T04:30:00-03:30'])
  assert.equal(measurementTimeLabel({state:'EXACT',observed_at:value}),value+' (exact time reported)');
});
test('hardening: clock field boundaries reject invalid minutes seconds and offsets',()=>{
 for(const value of ['2026-11-10T25:00:00Z','2026-11-10T01:60:00Z','2026-11-10T01:00:61Z','2026-11-10T01:00:00+24:00','2026-11-10T01:00:00+02:60','2026-02-30T01:00:00Z'])
  assert.equal(measurementTimeLabel({state:'EXACT',observed_at:value}),'Not supplied or uncheckable',value);
});
test('hardening: every valid hour remains exact and every out-of-range hour is uncheckable',()=>{
 for(let hour=0;hour<=99;hour++){
  const value=`2026-11-10T${String(hour).padStart(2,'0')}:00:00Z`;
  assert.equal(measurementTimeLabel({state:'EXACT',observed_at:value}),hour<24?value+' (exact time reported)':'Not supplied or uncheckable',value);
 }
});
test('hardening: invalid dates cannot leak into coaching as exact measurement time',()=>{
 const b=structuredClone(board);b.axes[0].measurement_time={state:'EXACT',observed_at:'2026-11-10T24:00:00Z'};
 const context=coachingContext('governance',{readAt:'2026-11-10T12:00:00Z',data:b});
 assert.match(context,/Measurement time: Not supplied or uncheckable/);
 assert.doesNotMatch(context,/24:00:00Z \(exact time reported\)/);
});
test('hardening: source pins do not retain nested measurement-time aliases',async()=>{
 const {captureForStorage}=await import('../public/evidence-learning/contract.mjs');
 const b=structuredClone(board);b.axes[0].measurement_time={state:'DAY',observed_on:'2026-08-12'};
 const source={url:'https://councilof.ai/api/gspc',readAt:'2026-11-10T01:00:00Z',sha256:'a'.repeat(64),data:b};
 const pin=captureForStorage(source);source.data.axes[0].measurement_time.observed_on='2026-11-10';
 assert.equal(pin.data.axes[0].measurement_time.observed_on,'2026-08-12');
 pin.data.axes[0].measurement_time.state='UNCHECKABLE';assert.equal(source.data.axes[0].measurement_time.state,'DAY');
});
test('hardening: copying a source pin isolates all retained nested metadata',async()=>{
 const {captureForStorage}=await import('../public/evidence-learning/contract.mjs');
 const b=structuredClone(board);b.axes[0].family={label:'original'};b.axes[0].measurement_time={state:'DAY',observed_on:'2026-08-12'};
 const capture={url:'https://councilof.ai/api/gspc',readAt:'2026-11-10T01:00:00Z',sha256:'a'.repeat(64),data:b};
 const pin=captureForStorage(capture),copy=captureForStorage(pin);
 copy.data.axes[0].family.label='changed';copy.data.axes[0].measurement_time.observed_on='2026-11-10';
 assert.equal(pin.data.axes[0].family.label,'original');assert.equal(pin.data.axes[0].measurement_time.observed_on,'2026-08-12');
 assert.equal(pin.sha256,capture.sha256);assert.equal(pin.readAt,capture.readAt);
});
test('hardening: local snapshot totals are not aliases of the current capture',async()=>reviewHarness(async({view})=>{
 view.readState='SOURCE_READ';
 await view.click({target:{closest:()=>({dataset:{do:'capture'},hasAttribute:()=>false})}});
 view.capture.data.totals.axes=99;
 assert.equal(view.data.shots[0].totals.axes,1);
}));
test('refresh: rendered learning markup exposes independent live context regions',async()=>reviewHarness(async({view})=>{
 const html=view.learn(view.axisRow());
 assert.match(html,/data-learning-summary/);assert.match(html,/data-scenario-context/);
 assert.match(html,/data-do="context"/);assert.match(html,/data-daily-briefing/);
}));
test('refresh: current scenario is painted without replacing the whole workspace',async()=>reviewHarness(async({view,nodes,scenario})=>{
 const b=structuredClone(board);b.axes[0].task='NEW_TASK';
 globalThis.fetch=async url=>Response.json(url.endsWith('/api/gspc')?b:scenario());
 const pin=JSON.stringify(view.data.pins),proposal=JSON.stringify(view.data.proposals);
 await view.load({background:true});
 assert.equal(view.scenario.regulation_context.note,'NEW_CONTEXT');
 assert.match(nodes.get('[data-scenario-context]').innerHTML,/NEW_CONTEXT/);
 assert.match(nodes.get('[data-learning-summary]').innerHTML,/NEW_TASK/);
 assert.equal(view.renders,0);assert.equal(JSON.stringify(view.data.pins),pin);assert.equal(JSON.stringify(view.data.proposals),proposal);
}));
test('refresh: starting a refresh hides old context until current evidence arrives',async()=>reviewHarness(async({view,nodes,scenario})=>{
 view.scenario=scenario().scenarios[0];const waiting=deferredResponse();let calls=0;
 globalThis.fetch=async()=>++calls===1?waiting.promise:Response.json(scenario());
 const run=view.load({background:true});
 try{assert.equal(view.scenario,null);assert.doesNotMatch(nodes.get('[data-scenario-context]').innerHTML,/OLD_CONTEXT/);assert.match(nodes.get('[data-scenario-context]').innerHTML,/being refreshed|Reading/)}
 finally{waiting.resolve(Response.json(board));await run}
}));
test('refresh: a failed scenario read removes stale context and is not called complete',async()=>reviewHarness(async({view,nodes})=>{
 globalThis.fetch=async url=>url.endsWith('/api/gspc')?Response.json(board):new Response('unavailable',{status:503});
 await view.load({background:true});
 assert.equal(view.readState,'SOURCE_READ');assert.equal(view.scenario,null);
 assert.match(nodes.get('[data-scenario-context]').innerHTML,/unavailable/);
 assert.doesNotMatch(nodes.get('[data-scenario-context]').innerHTML,/OLD_CONTEXT/);
 assert.match(nodes.get('.status').textContent,/scenario context unavailable/i);
 assert.doesNotMatch(nodes.get('.status').textContent,/^Sources refreshed/);
}));
test('refresh: board failure removes old scenario while retaining the dated source and proposal',async()=>reviewHarness(async({view,nodes,scenario})=>{
 view.scenario=scenario().scenarios[0];const before=JSON.stringify(view.capture),pin=JSON.stringify(view.data.pins);
 globalThis.fetch=async()=>new Response('unavailable',{status:503});
 await view.load({background:true});
 assert.equal(view.readState,'CACHED');assert.equal(JSON.stringify(view.capture),before);assert.equal(JSON.stringify(view.data.pins),pin);
 assert.equal(view.scenario,null);assert.doesNotMatch(nodes.get('[data-scenario-context]').innerHTML,/OLD_CONTEXT/);
 assert.match(nodes.get('[data-scenario-context]').innerHTML,/unavailable/);
}));
test('refresh: unavailable scenario recovers on a later successful read',async()=>reviewHarness(async({view,nodes,scenario})=>{
 let broken=true;globalThis.fetch=async url=>url.endsWith('/api/gspc')?Response.json(board):broken?new Response('unavailable',{status:503}):Response.json(scenario());
 await view.load({background:true});broken=false;await view.load({background:true});
 assert.match(nodes.get('[data-scenario-context]').innerHTML,/NEW_CONTEXT/);
 assert.doesNotMatch(nodes.get('.status').textContent,/unavailable/i);assert.equal(view.error,'');
}));
test('refresh: scenario source text stays escaped on repaint',async()=>reviewHarness(async({view,nodes,scenario})=>{
 globalThis.fetch=async url=>Response.json(url.endsWith('/api/gspc')?board:scenario('governance','<img src=x onerror=alert(1)>'));
 await view.load({background:true});const html=nodes.get('[data-scenario-context]').innerHTML;
 assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
}));
test('refresh: a wrong-axis scenario is not substituted or described as complete',async()=>reviewHarness(async({view,nodes,scenario})=>{
 globalThis.fetch=async url=>Response.json(url.endsWith('/api/gspc')?board:scenario('safety'));
 await view.load({background:true});assert.equal(view.scenario,null);
 assert.match(nodes.get('.status').textContent,/scenario context unavailable/i);
}));
test('refresh: an old timeout cannot abort its replacement request',async()=>reviewHarness(async({view,timers,scenario})=>{
 const first=deferredResponse(),second=deferredResponse();let boards=0;const signals=[];
 globalThis.fetch=async(url,options)=>{if(url.endsWith('/api/gspc')){signals.push(options.signal);return ++boards===1?first.promise:second.promise}return Response.json(scenario())};
 const a=view.load({background:true});const b=view.load({background:true});
 try {timers[0].fn();assert.equal(signals[0].aborted,true);assert.equal(signals[1].aborted,false)}
 finally{second.resolve(Response.json(board));await b;first.resolve(Response.json(board));await a}
}));
test('refresh: obsolete scenario completion cannot overwrite a newer axis',async()=>reviewHarness(async({view,scenario})=>{
 const waiting=deferredResponse();let seen=false;
 const b=structuredClone(board);b.axes.push({axis:'safety',task:'Safety task',status:'UNMEASURED',n:0});b.totals.axes=2;b.totals.unmeasured_axes=1;
 globalThis.fetch=async url=>url.endsWith('/api/gspc')?Response.json(b):url.endsWith('axis=governance')?(seen=true,waiting.promise):Response.json(scenario('safety','CURRENT_SAFETY'));
 const first=view.load({background:true});for(let n=0;n<50&&!seen;n++)await turn();assert.equal(seen,true);
 view.axis='safety';await view.load({background:true});waiting.resolve(Response.json(scenario('governance','OBSOLETE')));await first;
 assert.equal(view.scenario.axis,'safety');assert.equal(view.scenario.regulation_context.note,'CURRENT_SAFETY');
}));
test('refresh: expired current request cannot install a late successful response',async()=>reviewHarness(async({view,timers})=>{
 const waiting=deferredResponse(),before=JSON.stringify(view.capture);
 globalThis.fetch=async()=>waiting.promise;const run=view.load({background:true});timers[0].fn();
 const b=structuredClone(board);b.axes[0].task='TOO_LATE';waiting.resolve(Response.json(b));await run;
 assert.equal(JSON.stringify(view.capture),before);assert.equal(view.readState,'CACHED');assert.notEqual(view.error,'');
}));
test('refresh: disconnect prevents late source installation and rescheduling',async()=>reviewHarness(async({view})=>{
 const waiting=deferredResponse(),before=JSON.stringify(view.capture);
 globalThis.fetch=async()=>waiting.promise;const run=view.load({background:true});view.isConnected=false;view.disconnectedCallback();
 waiting.resolve(Response.json(board));await run;assert.equal(JSON.stringify(view.capture),before);assert.equal(view.scheduled,0);assert.equal(view.loading,false);
}));
test('refresh: proposal and practice stages preserve the active workspace and pinned source',async()=>reviewHarness(async({view,scenario})=>{
 globalThis.fetch=async url=>Response.json(url.endsWith('/api/gspc')?board:scenario());
 const pin=JSON.stringify(view.data.pins),proposal=JSON.stringify(view.data.proposals);
 for(const stage of ['practice','propose','review']){view.stage=stage;await view.load({background:true})}
 assert.equal(view.renders,0);assert.equal(JSON.stringify(view.data.pins),pin);assert.equal(JSON.stringify(view.data.proposals),proposal);
 assert.equal(view.currentDraft().review.execution_allowed,false);
}));
