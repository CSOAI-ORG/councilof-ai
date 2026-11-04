import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicURL,readPublic,validateBoard,validateScenario,changedTotals,LESSONS,practiceKey,practiceScore,makeReviewDraft,coachingContext} from '../public/evidence-learning/contract.mjs';
const board={schema:'csoai.gspc-axes/0.5',axes:[{axis:'governance',task:'A bounded task',status:'MEASURED',n:30}],totals:{axes:1,measured_axes:1,unmeasured_axes:0}};
test('reader allows only exact public sources and one exact axis',()=>{
 assert.equal(publicURL('/api/gspc'),'https://councilof.ai/api/gspc');
 assert.match(publicURL('/api/learning-scenarios?axis=governance'),/axis=governance$/);
 for(const p of ['https://evil.test/api/gspc','/mcp/free','/api/hitl','/api/gspc?x=1','/api/learning-scenarios?axis=x&axis=y','/api/learning-scenarios?axis=x&token=secret','https://user:pass@councilof.ai/api/gspc'])assert.throws(()=>publicURL(p));
});
test('public reads omit credentials and reject redirects; malformed/oversized replies fail',async()=>{
 let options;const fetcher=async(u,o)=>{options=o;return {ok:true,text:async()=>JSON.stringify(board)}};
 await readPublic('/api/gspc',{fetcher});assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>({ok:false,status:503})}),/503/);
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>({ok:true,text:async()=>'{bad'})}));
 await assert.rejects(()=>readPublic('/api/gspc',{fetcher:async()=>({ok:true,text:async()=>'x'.repeat(2000001)})}),/bounded/);
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
});
test('comparison preserves unknown and uses consistent denominators',()=>{
 const x=changedTotals({totals:{axes:33,measured_axes:23,unmeasured_axes:10}},{totals:{axes:34,measured_axes:34,unmeasured_axes:0}});assert.deepEqual(x.map(x=>x.difference),[1,11,-10]);assert.equal(changedTotals(null,{totals:{axes:2}})[0].difference,null);
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
