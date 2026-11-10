import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ledgerCanonical,verifyOutcomes,scheduledReadState} from './maintenance-schedule-state.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const registry={id:'r',url:'https://councilof.ai/claims/r.json',sha256:'a'.repeat(64)};
function fixture(overrides={}) {
 const row={schema:'csoai.claim-maintenance-check/0.2',seq:0,prev_hash:'0'.repeat(64),registry_id:registry.id,registry_url:registry.url,registry_sha256:registry.sha256,check:'scheduled-read',due:'2026-11-09',checked_at:'2026-11-10T01:00:00Z',outcome:'UNCHANGED',claim_ids_read:['A'],claims_fetch_failed:[],claims_unconfirmed:[],...overrides};
 row.row_sha256=sha(ledgerCanonical(row));
 const raw=Buffer.from(JSON.stringify(row)+'\n');
 const revision='b'.repeat(40);
 const capture={schema:'csoai.claim-maintenance-public-capture/0.1',file:'outcomes.jsonl',source_revision:revision,source_url:`https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/${revision}/public/interop/claim-maintenance/outcomes.jsonl`,bytes_sha256:sha(raw),entries:1,outcomes_head_sha256:row.row_sha256,captured_at:'2026-11-10T02:00:00Z'};
 return {row,raw,capture};
}
const verified=(overrides={})=>{const f=fixture(overrides);return verifyOutcomes(f.raw,f.capture)};
const state=(ledger,overrides={})=>scheduledReadState({next:'2026-11-09T00:00:00Z',asOf:'2026-11-10T02:00:00Z',registry,claimIds:['A'],ledger,...overrides});
for(const checked_at of ['2026-11-10T25:00:00Z','2026-11-10T24:00:00Z','2026-11-10T12:61:00Z','2026-11-10T12:00:60Z','2026-02-30T10:00:00Z','2026-02-29T10:00:00Z','1900-02-29T10:00:00Z','2026-04-31T10:00:00Z','2026-00-01T00:00:00Z','2026-13-01T00:00:00Z','2026-11-00T00:00:00Z',null,42,'2026-11-10T01:00:00+00:00','2026-11-10T01:00:00.000Z']){
 test(`hash-valid ledger refuses checked_at ${String(checked_at)}`,()=>assert.throws(()=>verified({checked_at}),/schema/));
}
for(const due of ['2026-02-30','2026-02-29','1900-02-29','2026-04-31','2026-00-01','2026-13-01','2026-11-00','2026-11-32',null,42,'2026-11-09T00:00:00Z']){
 test(`hash-valid ledger refuses due ${String(due)}`,()=>assert.throws(()=>verified({due}),/schema/));
}
for(const day of ['2000-02-29','2024-02-29','2026-02-28','2026-04-30','2026-12-31','0001-01-01']){
 test(`valid day and UTC instant preserve source bytes ${day}`,()=>{const f=fixture({due:day,checked_at:day+'T23:59:59Z'});const v=verifyOutcomes(f.raw,f.capture);assert.equal(v.rows[0].checked_at,day+'T23:59:59Z');assert.equal(v.rows[0].row_sha256,f.row.row_sha256);assert.equal(sha(f.raw),f.capture.bytes_sha256)});
}
for(const field of ['next','asOf'])for(const value of ['2026-02-30','2026-11-10T24:00:00Z','2026-11-10T12:61:00Z',42]){
 test(`projection refuses invalid ${field} ${value}`,()=>assert.throws(()=>state(verified(),{[field]:value}),/clock/));
}
test('missing next retains UNSCHEDULED but does not skip asOf validation',()=>{assert.equal(state(verified(),{next:null}).state,'UNSCHEDULED');assert.throws(()=>state(verified(),{next:null,asOf:'nonsense'}),/asOf/)});
test('valid exact check completes with unchanged evidence date',()=>{const f=verified();const r=state(f);assert.equal(r.state,'COMPLETED');assert.equal(r.evidence.checked_at,'2026-11-10T01:00:00Z');assert.equal(r.evidence.row_sha256,f.rows[0].row_sha256)});
test('valid date-only clocks retain established ordering',()=>{assert.equal(state(verified(),{next:'2026-11-09',asOf:'2026-11-11'}).state,'COMPLETED');assert.equal(state(verified(),{next:'2026-11-11'}).state,'SCHEDULED')});
test('empty verified history remains execution-unverified, not failed subject',()=>assert.equal(state({rows:[],capture:null}).state,'DUE_EXECUTION_UNVERIFIED'));
test('failed read and incomplete claims preserve RETRY_REQUIRED',()=>{assert.equal(state(verified({outcome:'FETCH_FAILED'})).state,'RETRY_REQUIRED');assert.equal(state(verified({claims_unconfirmed:['B']})).state,'RETRY_REQUIRED')});
test('wrong registry and future observation do not complete',()=>{assert.equal(state(verified({registry_sha256:'c'.repeat(64)})).state,'DUE_EXECUTION_UNVERIFIED');assert.equal(state(verified({checked_at:'2026-11-10T03:00:00Z'})).state,'DUE_EXECUTION_UNVERIFIED')});
test('direct retained objects cannot bypass temporal validation',()=>{const f=verified();f.rows[0].checked_at='2026-11-10T25:00:00Z';assert.throws(()=>state(f),/ledger clock/)});
test('hash and source pins remain enforced',()=>{const f=fixture();assert.throws(()=>verifyOutcomes(Buffer.from(f.raw.toString().replace('UNCHANGED','FETCH_FAILED')),f.capture),/pin/);assert.throws(()=>verifyOutcomes(f.raw,{...f.capture,source_url:f.capture.source_url.replace('b'.repeat(40),'main')}),/pin/)});
