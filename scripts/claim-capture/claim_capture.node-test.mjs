import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readClaimCapture} from '../../functions/api/_claim_capture.ts';
const H=b=>createHash('sha256').update(b).digest('hex');const J=x=>Buffer.from(JSON.stringify(x));
const NOW=Date.parse('2026-09-22T15:00:00Z');const COMMIT='a'.repeat(40);const BASE=`https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/${COMMIT}/claim-capture/`;
function fixture(change=()=>{}){
 const s={run_id:'run',population:'stablecoins',count:1,records:[{population:'stablecoins',subject_id:'1',state:'CLAIM_CAPTURED'}]};change(s);
 const raw=J(s);const p={count:1,unique_entities:1,as_of:'2026-09-22T14:00:00Z',coverage:'COMPLETE_UPSTREAM_RESPONSE',source_status:'OK',sha256:H(raw),path:'runs/run/populations/stablecoins.json'};
 const r={run_id:'run',populations:{stablecoins:p},anchor:{state:'PENDING_CALENDAR_COMMITMENT'}};const rb=J(r);
 const ptr={schema:'csoai.claim-capture-pointer/0.1',hf_commit:COMMIT,release_sha256:H(rb),release_url:BASE+'release.json',run_id:'run',as_of:p.as_of};
 return {ptr,r,raw,rb,urls:[],async fetch(url){this.urls.push(url);return new Response(url.endsWith('latest.json')?J(this.ptr):url.endsWith('release.json')?this.rb:this.raw,{status:200})}};
}
async function run(f,id='stablecoins',full=true){return readClaimCapture(id,full,{fetchImpl:f.fetch.bind(f),nowMs:NOW})}
test('full slice is hash verified and remains unmeasured truth',async()=>{const f=fixture();const r=await run(f);assert.equal(r.state,'INDEXED');assert.equal(r.n,1);assert.equal(r.head.truth_measured,false);assert.equal(r.rows.count,1);});
test('tampered payload cannot be delivered',async()=>{const f=fixture();f.raw=J({changed:true});const r=await run(f);assert.equal(r.state,'UNCHECKABLE');assert.equal(r.rows,undefined);});
test('wrong count is rejected even with matching byte digest',async()=>{const f=fixture(s=>s.records=[]);assert.equal((await run(f)).state,'UNCHECKABLE');});
test('stale capture is not offered as live',async()=>{const f=fixture();f.ptr.as_of='2026-09-01T00:00:00Z';assert.equal((await run(f)).state,'UNMEASURED');assert.equal(f.urls.length,1);});
test('foreign URL cannot cause a second fetch',async()=>{const f=fixture();f.ptr.release_url='https://example.invalid/secret';assert.equal((await run(f)).state,'UNMEASURED');assert.equal(f.urls.length,1);});
test('wrong release hash fails closed',async()=>{const f=fixture();f.ptr.release_sha256='0'.repeat(64);assert.equal((await run(f)).state,'UNCHECKABLE');});
test('preview does not download the whole population',async()=>{const f=fixture();assert.equal((await run(f,'stablecoins',false)).n,1);assert.equal(f.urls.length,2);});
test('unknown population never contacts any upstream',async()=>{const f=fixture();assert.equal((await run(f,'unknown')).state,'UNMEASURED');assert.equal(f.urls.length,0);});
test('duplicate identities rejected',async()=>{const f=fixture(s=>{s.records.push({...s.records[0]});s.count=2;});f.r.populations.stablecoins.count=2;f.rb=J(f.r);f.ptr.release_sha256=H(f.rb);assert.equal((await run(f)).state,'UNCHECKABLE');});
