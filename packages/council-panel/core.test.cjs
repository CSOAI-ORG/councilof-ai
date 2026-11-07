const test=require('node:test'),assert=require('node:assert/strict');
const {TaskProjection,benchmarkRows,publicBoard,safeLink,screenSnapshot,validateScreen,streamRun}=require(process.env.PANEL_CORE_MODULE||'./.test-core.cjs');
function task(){const t=new TaskProjection('What does the leaderboard show?','panel-owned');t.bindRequest(JSON.stringify({threadId:'panel-owned',runId:'run-owned',messages:[]}));return t;}
const ev=(type,n,extra={})=>({type,eventId:'run-owned:'+n,runId:'run-owned',threadId:'panel-owned',timestamp:Date.now(),...extra});
function complete(){const t=task();t.accept(ev('RUN_STARTED',1));t.accept(ev('TOOL_CALL_START',2,{toolCallId:'t',toolCallName:'board_totals'}));t.accept(ev('TOOL_CALL_END',3,{toolCallId:'t'}));t.accept(ev('TOOL_CALL_RESULT',4,{toolCallId:'t',content:JSON.stringify({label:'MEASURED',summary:'Public record',output:{totals:{axes:34,measured_axes:34,unmeasured_axes:0}}})}));t.accept(ev('TEXT_MESSAGE_START',5,{messageId:'m',role:'assistant'}));t.accept(ev('TEXT_MESSAGE_CONTENT',6,{messageId:'m',delta:'Published result.'}));t.accept(ev('TEXT_MESSAGE_END',7,{messageId:'m'}));t.accept(ev('RUN_FINISHED',8,{result:{grounded:true}}));return t;}
test('new task grants no authority and invents no score',()=>{const t=task();assert.equal(t.summary().authority,false);assert.equal(t.summary().returned,0);assert(!('score'in t.summary()))});
test('request cannot change thread',()=>assert.throws(()=>task().bindRequest('{"threadId":"other","runId":"r"}')));
test('request cannot include paid confirmation',()=>assert.throws(()=>task().bindRequest('{"threadId":"panel-owned","runId":"r","forwardedProps":{"confirm":true}}')));
test('request cannot declare executable page tools',()=>assert.throws(()=>task().bindRequest('{"threadId":"panel-owned","runId":"r","tools":[]}')));
test('unrelated task event refused at first event',()=>assert.throws(()=>task().accept(ev('RUN_STARTED',1,{runId:'other'})),/bound/));
test('unrelated thread event refused',()=>assert.throws(()=>task().accept(ev('RUN_STARTED',1,{threadId:'other'})),/bound/));
test('tool-end is not an observed result',()=>{const t=task();t.accept(ev('RUN_STARTED',1));t.accept(ev('TOOL_CALL_START',2,{toolCallId:'t',toolCallName:'board_totals'}));t.accept(ev('TOOL_CALL_END',3,{toolCallId:'t'}));assert.equal(t.summary().returned,0);assert.equal(t.summary().unresolved,1)});
test('actual result plus terminal sequence projects completion only',()=>{const t=complete();assert.equal(t.run.status,'done');assert.equal(t.summary().returned,1);assert.equal(t.summary().authority,false);assert.equal(t.export().signatureStatus,'UNSIGNED')});
test('duplicate same event does not count twice',()=>{const t=task(),e=ev('RUN_STARTED',1);t.accept(e);t.accept(e);assert.equal(t.events.length,1)});
test('changed duplicate is an error',()=>{const t=task(),e=ev('RUN_STARTED',1);t.accept(e);t.accept({...e,timestamp:123});assert.equal(t.run.status,'error')});
test('local interruption does not claim cancelled effect',()=>{const t=task();t.accept(ev('RUN_STARTED',1));t.interrupt('Lost connection');assert.equal(t.run.status,'interrupted');assert.notEqual(t.run.status,'cancelled')});
test('empty and oversized questions refused',()=>{assert.throws(()=>new TaskProjection('','x'));assert.throws(()=>new TaskProjection('x'.repeat(3001),'x'))});
test('board true zeros remain visible',()=>assert.deepEqual(publicBoard({totals:{axes:0,measured_axes:0,unmeasured_axes:0}}),{axes:0,measured:0,unmeasured:0}));
test('missing board fields do not become zero',()=>assert.equal(publicBoard({totals:{axes:34}}),null));
test('non-number counts do not become measurements',()=>assert.equal(publicBoard({axes:34,measured_axes:'34',unmeasured_axes:0}),null));
test('source URLs are limited to Council HTTPS',()=>{assert.equal(safeLink('/api/gspc'),'https://councilof.ai/api/gspc');for(const u of ['javascript:alert(1)','https://evil.invalid/','http://councilof.ai','https://secret@councilof.ai'])assert.equal(safeLink(u),null)});
const inspect=()=>({status:'success',eval:{task:'fixture',model:'fixture-model',task_version:3},results:{completed_samples:10,scores:[{name:'match',metrics:{accuracy:{value:0}}}]}});
test('Inspect zero stays zero with task version and count',()=>{const r=benchmarkRows(inspect())[0];assert.equal(r.value,0);assert.equal(r.revision,'3');assert.equal(r.samples,10);assert.equal(r.state,'IMPORTED_UNVERIFIED')});
test('unfinished Inspect run not treated as completed',()=>{const d=inspect();d.status='started';assert.throws(()=>benchmarkRows(d),/not marked successful/)});
test('metric text is not cast to a number',()=>{const d=inspect();d.results.scores[0].metrics.accuracy.value='0.8';assert.throws(()=>benchmarkRows(d),/finite/)});
test('lm harness retains metric scale and ignores standard error',()=>{const r=benchmarkRows({config:{model:'fixture'},versions:{task:'1'},results:{task:{'acc,none':.7,'acc_stderr,none':.1}},'n-samples':{task:{effective:20}}});assert.equal(r.length,1);assert.equal(r[0].value,.7);assert.equal(r[0].metric,'acc,none');assert.equal(r[0].samples,20)});
test('unknown format not guessed from a score',()=>assert.throws(()=>benchmarkRows({score:97}),/Supported/));
test('no imported metric averaged or made a credential',()=>{const d=inspect();d.results.scores.push({name:'another',metrics:{latency:{value:1800}}});const r=benchmarkRows(d);assert.equal(r.length,2);assert.equal(r[1].value,1800);assert(!r.some(x=>'overall'in x))});
test('screen projection excludes text and full task identifiers',()=>{const t=complete();t.run.question='SECRET-QUESTION';t.run.text='SECRET-ANSWER';const j=JSON.stringify(screenSnapshot(t));assert(!j.includes('SECRET'));assert(!j.includes('run-owned'));assert(!j.includes('panel-owned'))});
test('screen payload rejects unbounded rows',()=>assert.equal(validateScreen({schema:'csoai.local-screen/1',at:Date.now(),tools:Array(51).fill({})}),null));
test('screen projection strips extra attacker fields',()=>{const r=validateScreen({schema:'csoai.local-screen/1',at:Date.now(),status:'done',tools:[{name:'tool',status:'done',action:'delete'}],action:'execute'});assert(!JSON.stringify(r).includes('delete'));assert(!('action'in r))});
function response(events,closed=true){const text=events.map(e=>'id: '+e.eventId+'\nevent: '+e.type+'\ndata: '+JSON.stringify(e)+'\n\n').join('')+(closed?'':'data: {');return new Response(new TextEncoder().encode(text),{headers:{'content-type':'text/event-stream'}})}
test('shared stream parser emits ordered activity',async()=>{let n=0;await streamRun({question:'fixture',threadId:'panel-owned',fetchImpl:async()=>response([ev('RUN_STARTED',1),ev('RUN_FINISHED',2)]),onEvent:()=>n++});assert.equal(n,2)});
test('shared stream rejects truncated result',async()=>{await assert.rejects(streamRun({question:'fixture',fetchImpl:async()=>response([ev('RUN_STARTED',1)]),onEvent:()=>{}}),/terminal/)});
test('shared stream rejects changed event identity',async()=>{await assert.rejects(streamRun({question:'fixture',fetchImpl:async()=>response([ev('RUN_STARTED',1),ev('RUN_FINISHED',2,{threadId:'other'})]),onEvent:()=>{}}),/identity/)});
test('shared stream rejects malformed frames',async()=>{await assert.rejects(streamRun({question:'fixture',fetchImpl:async()=>response([ev('RUN_STARTED',1),ev('RUN_FINISHED',2)],false),onEvent:()=>{}}),/terminal/)});
test('pre-aborted stream sends no request',async()=>{const c=new AbortController();c.abort(new Error('stop'));let calls=0;await assert.rejects(streamRun({question:'fixture',signal:c.signal,fetchImpl:async()=>{calls++;return response([])},onEvent:()=>{}}));assert.equal(calls,0)});

test('harness model identity does not collapse to the adapter',()=>{const a=benchmarkRows({model_name:'org/model-a',config:{model:'hf'},versions:{t:1},results:{t:{acc:.1}}})[0];const b=benchmarkRows({model_name:'org/model-b',config:{model:'hf'},versions:{t:1},results:{t:{acc:.2}}})[0];assert.notEqual(a.model,b.model);assert.equal(a.adapter,'hf')});
test('harness reads explicit object and string model arguments',()=>{for(const args of [{pretrained:'org/model-c'},'pretrained=org/model-c,dtype=float16']){const r=benchmarkRows({config:{model:'hf',model_args:args},versions:{t:1},results:{t:{acc:0}}})[0];assert.equal(r.model,'org/model-c')}});
test('unknown model remains unspecified rather than adapter identity',()=>{const r=benchmarkRows({config:{model:'openai-completions'},versions:{t:1},results:{t:{acc:.5}}})[0];assert.equal(r.model,'Unspecified model');assert.equal(r.adapter,'openai-completions')});
test('all 51 harness tasks are retained inside the row budget',()=>{const results={},versions={};for(let i=0;i<51;i++){results['t'+i]={acc:i===50?0:1};versions['t'+i]=1}const rows=benchmarkRows({config:{model:'hf'},results,versions});assert.equal(rows.length,51);assert.equal(rows.at(-1).value,0)});
test('all 51 Inspect scorer results are retained',()=>{const d=inspect();d.results.scores=Array.from({length:51},(_,i)=>({name:'score'+i,metrics:{acc:{value:i===50?0:1}}}));const rows=benchmarkRows(d);assert.equal(rows.length,51);assert.equal(rows.at(-1).value,0)});
test('over-budget summaries are refused as a whole',()=>{const results={},versions={};for(let i=0;i<201;i++){results['t'+i]={acc:1};versions['t'+i]=1}assert.throws(()=>benchmarkRows({config:{model:'hf'},results,versions}),/entire import was refused/)});

const liveBoard=(counts)=>({kind:'live-board-totals',state:'LIVE',reachable:true,counts});
const namedBoard=[{name:'unmeasured',value:0},{name:'axis_slots',value:34},{name:'measured',value:34}];
test('native MCP board counts render by name and preserve zero',()=>assert.deepEqual(publicBoard(liveBoard(namedBoard)),{axes:34,measured:34,unmeasured:0}));
test('native MCP board rejects missing duplicate or invalid counts',()=>{
 for(const rows of [namedBoard.slice(1),[...namedBoard,namedBoard[0]],namedBoard.map(x=>x.name==='measured'?{...x,value:'34'}:x),namedBoard.map(x=>x.name==='measured'?{...x,value:33}:x)])assert.equal(publicBoard(liveBoard(rows)),null);
});
test('native MCP board does not infer available evidence from cached or unreachable output',()=>{
 assert.equal(publicBoard({...liveBoard(namedBoard),state:'UNAVAILABLE'}),null);
 assert.equal(publicBoard({...liveBoard(namedBoard),reachable:false}),null);
 assert.equal(publicBoard({text:'34 axes and 34 measured'}),null);
});
