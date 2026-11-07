import test from 'node:test';
import assert from 'node:assert/strict';
import { CorrectionDraft } from './correction.mjs';

const context = () => ({thread:'observed-thread',run:'observed-run',revision:1});
const observation = () => ({question:'How did safety measure?',answer:'The observed fixture reports no completed safety measurement.',status:'done'});
const deferred = () => { let resolve, reject; const promise=new Promise((a,b)=>{resolve=a;reject=b;}); return {promise,resolve,reject}; };

test('staging is local, bounded and freezes the exact observed task',()=>{
  const state=new CorrectionDraft(), current=context();
  const draft=state.stage('  Use the revised date.  ',current,observation());
  current.run='changed';
  assert.equal(draft.text,'Use the revised date.');
  assert.equal(draft.context.run,'observed-run');
  assert(Object.isFrozen(draft));assert(Object.isFrozen(draft.context));
  assert.equal(state.pending,false);
  for(const value of ['', ' '.repeat(10), 'x'.repeat(2001), null])assert.throws(()=>state.stage(value,context(),observation()),/2,000/);
  assert.throws(()=>state.stage('Date changed',{...context(),revision:NaN},observation()),/Observe a task/);
});

test('a changed run, thread or revision cannot dispatch a staged correction',async()=>{
  for(const changed of [{run:'another'},{thread:'another'},{revision:2}]){
    const state=new CorrectionDraft();state.stage('Use the revised date.',context(),observation());let calls=0;
    await assert.rejects(state.send({...context(),...changed},()=>{calls++;return {};}),/task changed/);
    assert.equal(calls,0);
  }
});

test('a handoff sends the reviewed correction and bounded observed context once',async()=>{
  const state=new CorrectionDraft();state.stage('Keep £500; <img src=x>.',context(),observation());const messages=[];
  const result=await state.send(context(),message=>{messages.push(message);return {isError:false};});
  assert.deepEqual(result,{status:'sent',delivery:'acknowledged'});
  assert.equal(messages.length,1);assert.equal(messages[0].role,'user');
  const text=messages[0].content[0].text;
  assert.match(text,/does not apply a MEOK graph change or grant execution permission/);
  const payload=JSON.parse(text.split('Correction: ')[1]);
  assert.deepEqual(payload,{observedTask:context(),observation:{question:observation().question,answerExcerpt:observation().answer,answerTruncated:false,status:'done',source:'https://councilof.ai/api/agui/run'},correction:'Keep £500; <img src=x>.'});
  await assert.rejects(state.send(context(),()=>{messages.push('duplicate');return {};}),/task changed/);
  assert.equal(messages.length,1);
});

test('duplicate clicks and restaging cannot dispatch while a reply is pending',async()=>{
  const state=new CorrectionDraft(), reply=deferred();let calls=0;
  state.stage('Date changed',context(),observation());
  const pending=state.send(context(),()=>{calls++;return reply.promise;});
  assert.equal(state.pending,true);
  await assert.rejects(state.send(context(),()=>{calls++;return {};}),/still pending/);
  assert.throws(()=>state.stage('Second edit',context(),observation()),/still pending/);
  reply.resolve({});await pending;
  assert.equal(calls,1);assert.equal(state.pending,false);
});

test('a host refusal consumes the stage and is not delivery',async()=>{
  const state=new CorrectionDraft();state.stage('Date changed',context(),observation());
  assert.deepEqual(await state.send(context(),()=>({isError:true})),{status:'declined',delivery:'declined'});
  assert.equal(state.draft,null);assert.equal(state.pending,false);
});

test('a thrown or malformed acknowledgement remains unknown and is never retried',async()=>{
  for(const answer of [null,undefined,[],{isError:'false'},new Error('connection lost')]){
    const state=new CorrectionDraft();state.stage('Date changed',context(),observation());let calls=0;
    await assert.rejects(state.send(context(),()=>{calls++;if(answer instanceof Error)throw answer;return answer;}));
    assert.equal(calls,1);assert.equal(state.pending,false);assert.equal(state.draft,null);
    await assert.rejects(state.send(context(),()=>{calls++;return {};}),/task changed/);assert.equal(calls,1);
  }
});

test('a delayed acknowledgement after navigation or host loss is superseded',async()=>{
  for(const isError of [false,true]){
    const state=new CorrectionDraft(), reply=deferred();state.stage('Date changed',context(),observation());
    const pending=state.send(context(),()=>reply.promise);
    state.invalidate();reply.resolve({isError});
    assert.deepEqual(await pending,{status:'superseded',delivery:isError?'declined':'acknowledged'});
    assert.equal(state.draft,null);assert.equal(state.pending,false);
  }
});

test('editing invalidates an old draft before any host call',async()=>{
  const state=new CorrectionDraft();state.stage('Old text',context(),observation());state.invalidate();
  let calls=0;await assert.rejects(state.send(context(),()=>{calls++;return {};}),/task changed/);
  assert.equal(calls,0);
  state.stage('New text',context(),observation());assert.equal(state.draft.text,'New text');
});


test('the staged observed context is frozen, bounded and explicitly marks truncation',async()=>{
  const state=new CorrectionDraft(), observed=observation();observed.answer='a'.repeat(2001);
  state.stage('Check the date',context(),observed);observed.question='A later task';observed.answer='New result';
  const payloads=[];await state.send(context(),message=>{payloads.push(JSON.parse(message.content[0].text.split('Correction: ')[1]));return {};});
  assert.equal(payloads[0].observation.question,'How did safety measure?');
  assert.equal(payloads[0].observation.answerExcerpt,'a'.repeat(2000));
  assert.equal(payloads[0].observation.answerTruncated,true);
  assert(!JSON.stringify(payloads).includes('New result'));
});

test('missing or oversized observation context cannot stage a correction',()=>{
  const state=new CorrectionDraft();
  for(const observed of [null,{}, {...observation(),question:'x'.repeat(3001)}, {...observation(),answer:null}])assert.throws(()=>state.stage('Check the date',context(),observed),/context are unavailable/);
});
