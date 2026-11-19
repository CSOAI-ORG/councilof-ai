// Replay with a trusted local copy of the pinned Layer-0 module. No network or vendor app.
import { strict as assert } from 'node:assert';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const source = resolve(process.argv[2] ?? 'packages/layer0-js/index.js');
const digest = createHash('sha256').update(readFileSync(source)).digest('hex');
assert.equal(digest, '0eef4ed967b64be6b33e7a9b378a8b68c7680892bb54486795dd818d89578736');
const { Layer0 } = await import(pathToFileURL(source));
const work = mkdtempSync(join(tmpdir(), 'coliseum-controlled-')); const rows=[];
// An independent process reads the payload, not the callback's assertions. Any read error other than ENOENT fails.
const observer=`const fs=require('node:fs');try{process.stdout.write(fs.readFileSync(process.argv[1],'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;process.stdout.write('ABSENT')}`;
try {
  async function check(name,gate,act,expectedCode,expectedBody,expectedCount,expectedStatus=null) {
    const file=join(work,name);let callbacks=0;
    const layer=new Layer0({identity:'fixture-service',fetchImpl:async()=>{throw new Error('No external transport permitted')}});
    layer.gate=async()=>({state:gate}); layer._attest=async()=>null;
    const effect=(lose=false)=>{callbacks++;writeFileSync(file,'fixture-byte',{flag:'wx'});if(lose) throw new Error('fixture response lost');return 'fixture-byte';};
    let error=null, status=null;
    try{const v=await act(layer,effect);status=v?.status??null;}catch(e){error=e.code??e.message;}
    const r=spawnSync(process.execPath,['-e',observer,file],{encoding:'utf8',timeout:4000});
    assert.equal(r.status,0);assert.equal(r.stdout,expectedBody,name);assert.equal(callbacks,expectedCount,name);
    if(expectedCode instanceof RegExp)assert.match(error??'',expectedCode,name); else assert.equal(error,expectedCode,name);
    assert.equal(status,expectedStatus,name);rows.push({case:name,callbacks,observed_file:r.stdout==='ABSENT'?'ABSENT':'EXACT_FIXTURE_BYTES',error,status});
  }
  await check('gate-deny','deny',(l,run)=>l.governed('fixture_write',{},()=>run()),/denied/i,'ABSENT',0);
  await check('gate-unknown','undecided',(l,run)=>l.governed('fixture_write',{},()=>run()),'INVALID_GATE_DECISION','ABSENT',0);
  await check('escalated-unverified','escalate',(l,run)=>l.governed('fixture_write',{},()=>run(),{approval:{approved:true}}),'APPROVAL_NOT_VERIFIED','ABSENT',0);
  await check('unqualified-local','allow',(l,run)=>l.governedLocal('execute_fixture',{},()=>run(),{approvalReceipt:{approver:'fixture'}}),'LOCAL_EXECUTOR_NOT_QUALIFIED','ABSENT',0);
  await check('cancel-before-dispatch','allow',(l,run)=>l.governed('fixture_write',{},()=>run(),{signal:AbortSignal.abort()}),'EXECUTION_CANCELLED','ABSENT',0);
  await check('allowed-fixture','allow',(l,run)=>l.governed('fixture_write',{},()=>run()),null,'fixture-byte',1,'executed_unattested');
  await check('effect-before-lost-reply','allow',(l,run)=>l.governed('fixture_write',{},()=>run(true)),'EXECUTION_OUTCOME_UNKNOWN','fixture-byte',1);
  // Positive sensitivity control: the same callback actually writes without the wrapper.
  await check('observer-positive-control','deny',async(_,run)=>{run()},null,'fixture-byte',1);
  console.log(JSON.stringify({source_sha256:digest,node:process.version,cases:rows,pass:rows.length,scope:'Injected gate decisions; real callback/filesystem and separate reader; no native vendor client, deployment or human approval.'}));
} finally {rmSync(work,{recursive:true,force:true});}
