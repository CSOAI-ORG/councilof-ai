import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planBindingAdditions,applyBindingAdditions,readNamedProject} from './pages-bind-missing-namespaces.mjs';

const id='a'.repeat(32),other='b'.repeat(32),third='c'.repeat(32),acct='0'.repeat(32),token='secret-token-value';

// One id per binding name, so the candidate and the remote agree unless a case
// deliberately makes them disagree.
const idFor=name=>name==='STORE'?id:name==='LEADS'?other:third;

const config=(names)=>({name:'councilof-ai',kv_namespaces:names.map(name=>({binding:name,id:idFor(name)}))});
const project=(names=[])=>({name:'councilof-ai',production_branch:'master',deployment_configs:{production:{kv_namespaces:Object.fromEntries(names.map(n=>[n,{namespace_id:idFor(n)}]))}}});

// A fetcher that serves the current project and records every PATCH body.
function harness(startNames,nextNames){
  const calls=[];let current=project(startNames);
  const fetcher=async(url,options)=>{
    const method=options?.method??'GET';
    calls.push({url,method,body:options?.body?JSON.parse(options.body):null});
    if(method==='GET')return Response.json({success:true,result:current});
    if(method==='PATCH'){
      const body=JSON.parse(options.body);
      current={...current,deployment_configs:{production:{kv_namespaces:body.deployment_configs.production.kv_namespaces}}};
      return Response.json({success:true,result:current});
    }
    return new Response('unexpected',{status:500});
  };
  return {calls,fetcher,read:()=>current};
}

test('adds a binding the production project lacks',()=>{
  const h=harness(['STORE'],['STORE','HITL_KV']);
  return applyBindingAdditions({candidate:config(['STORE','HITL_KV']),project:h.read(),accountId:acct,token,fetcher:h.fetcher}).then(r=>{
    assert.equal(r.changed,true);
    assert.deepEqual(r.added,['HITL_KV']);
    assert.equal(r.state,'BOUND');
  });
});

test('never changes an existing binding id and never removes one the candidate does not declare',async()=>{
  const h=harness(['STORE','LEGACY'],['STORE','LEGACY']);
  const r=await applyBindingAdditions({candidate:config(['STORE']),project:h.read(),accountId:acct,token,fetcher:h.fetcher});
  assert.equal(r.changed,false);
  assert.equal(r.state,'NO_CHANGE');
  assert.equal(h.calls.filter(c=>c.method==='PATCH').length,0,'a divergent remote must not be mutated');
  assert.deepEqual(Object.keys(h.read().deployment_configs.production.kv_namespaces).sort(),['LEGACY','STORE']);
});

test('a binding present remotely with a different id is reported, never silently rebound',async()=>{
  const h=harness(['STORE'],['STORE']);
  const r=await applyBindingAdditions({candidate:{name:'councilof-ai',kv_namespaces:[{binding:'STORE',id:'c'.repeat(32)}]},project:h.read(),accountId:acct,token,fetcher:h.fetcher});
  assert.equal(r.changed,false);
  assert.deepEqual(r.conflicts,['STORE']);
  assert.equal(h.calls.filter(c=>c.method==='PATCH').length,0);
});

test('the patch carries the complete merged map so no existing binding can be dropped',async()=>{
  const h=harness(['STORE','LEADS'],['STORE','LEADS']);
  await applyBindingAdditions({candidate:config(['STORE','LEADS','HITL_KV']),project:h.read(),accountId:acct,token,fetcher:h.fetcher});
  const patch=h.calls.find(c=>c.method==='PATCH');
  const sent=patch.body.deployment_configs.production.kv_namespaces;
  assert.deepEqual(Object.keys(sent).sort(),['HITL_KV','LEADS','STORE']);
  assert.equal(sent.STORE.namespace_id,id,'an existing binding must survive the patch with its own id');
});

test('a malformed candidate id is refused before any request is made',async()=>{
  const h=harness(['STORE'],['STORE']);
  await assert.rejects(applyBindingAdditions({candidate:{name:'councilof-ai',kv_namespaces:[{binding:'STORE',id:'NOT-HEX'}]},project:h.read(),accountId:acct,token,fetcher:h.fetcher}),/CANDIDATE_BINDING_ID_INVALID/);
  assert.equal(h.calls.length,0);
});

test('a duplicate candidate binding is refused',async()=>{
  const h=harness(['STORE'],['STORE']);
  await assert.rejects(applyBindingAdditions({candidate:{name:'councilof-ai',kv_namespaces:[{binding:'STORE',id},{binding:'STORE',id}]},project:h.read(),accountId:acct,token,fetcher:h.fetcher}),/CANDIDATE_BINDING_DUPLICATE/);
});

test('the wrong project or the wrong production branch is refused before any request',async()=>{
  const h=harness(['STORE'],['STORE']);
  await assert.rejects(applyBindingAdditions({candidate:config(['STORE']),project:{...h.read(),name:'other'},accountId:acct,token,fetcher:h.fetcher}),/TARGET_PROJECT_MISMATCH/);
  await assert.rejects(applyBindingAdditions({candidate:config(['STORE']),project:{...h.read(),production_branch:'main'},accountId:acct,token,fetcher:h.fetcher}),/TARGET_BRANCH_MISMATCH/);
  assert.equal(h.calls.length,0);
});

test('the readback fails closed when the binding did not take',async()=>{
  const calls=[];
  const fetcher=async(url,options)=>{
    const method=options?.method??'GET';
    calls.push({method});
    if(method==='GET')return Response.json({success:true,result:project(['STORE'])});
    return Response.json({success:true,result:project(['STORE'])});// the patch silently did nothing
  };
  await assert.rejects(applyBindingAdditions({candidate:config(['STORE','HITL_KV']),project:project(['STORE']),accountId:acct,token,fetcher}),/READBACK_/);
});

test('the readback fails closed when an existing binding changed id',async()=>{
  let current=project(['STORE','LEADS']);
  const fetcher=async(url,options)=>{
    const method=options?.method??'GET';
    if(method==='GET')return Response.json({success:true,result:current});
    const body=JSON.parse(options.body);
    current={...current,deployment_configs:{production:{kv_namespaces:{...body.deployment_configs.production.kv_namespaces,LEADS:{namespace_id:'d'.repeat(32)}}}}};
    return Response.json({success:true,result:current});
  };
  await assert.rejects(applyBindingAdditions({candidate:config(['STORE','LEADS','HITL_KV']),project:project(['STORE','LEADS']),accountId:acct,token,fetcher}),/READBACK_/);
});

test('never prints a namespace id',async()=>{
  const h=harness(['STORE'],['STORE','HITL_KV']);
  const r=await applyBindingAdditions({candidate:config(['STORE','HITL_KV']),project:h.read(),accountId:acct,token,fetcher:h.fetcher});
  const s=JSON.stringify(r);
  assert.ok(!s.includes(id));
  assert.ok(!s.includes('a'.repeat(32)));
});

test('a denied project read is uncheckable, never a silent no-op',async()=>{
  const fetcher=async()=>new Response('denied',{status:403});
  await assert.rejects(readNamedProject({accountId:acct,token,fetcher}),/HTTP_403/);
});

test('the reader uses one named GET and refuses redirect following',async()=>{
  let called=0;
  await readNamedProject({accountId:acct,token,fetcher:async(url,options)=>{called++;assert.equal(url,'https://api.cloudflare.com/client/v4/accounts/'+acct+'/pages/projects/councilof-ai');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');return Response.json({success:true,result:project(['STORE'])});}});
  assert.equal(called,1);
});

test('an invalid credential shape sends no network request',async()=>{
  await assert.rejects(readNamedProject({accountId:'../x',token,fetcher:()=>{throw Error('network must not be reached');}}),/CREDENTIALS/);
});

test('the plan names what would change without naming any namespace id',()=>{
  const p=planBindingAdditions(config(['STORE','HITL_KV']),project(['STORE']));
  assert.deepEqual(p.additions.map(a=>a.name),['HITL_KV']);
  assert.equal(JSON.stringify(p).includes(id),false);
});

test('the deploy workflow binds before the preflight, and the preflight still runs',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/deploy.yml',import.meta.url),'utf8');
  const bind=workflow.indexOf('pages-bind-missing-namespaces.mjs --config wrangler.jsonc');
  const gate=workflow.indexOf('Production target and binding preflight');
  const deploy=workflow.indexOf('- name: Deploy → councilof.ai');
  assert.ok(bind>0,'the additive bind step must exist');
  assert.ok(gate>bind,'the bind step must run before the read-only preflight');
  assert.ok(deploy>gate,'the preflight must still run before the upload');
  assert.ok(workflow.slice(workflow.indexOf('Bind candidate KV namespaces missing'),gate).includes('node --test scripts/review/pages-bind-missing-namespaces.test.mjs'),'the bind step carries its own ratchet');
});

test('the bind step never uploads and never ignores a failure',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/deploy.yml',import.meta.url),'utf8');
  const start=workflow.indexOf('Bind candidate KV namespaces missing');
  const end=workflow.indexOf('- name: Production target and binding preflight');
  const step=workflow.slice(start,end);
  assert.ok(start>0&&end>start);
  assert.doesNotMatch(step,/wrangler pages deploy/,'the bind step must not upload');
  assert.doesNotMatch(step,/continue-on-error|\|\| true/,'a failure must not be ignored');
});
