import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildQueue} from './build.mjs';
const cw = Buffer.from(JSON.stringify({frameworks:[]}));
const digest = createHash('sha256').update(cw).digest('hex');
const signal = {event_sha256:'a'.repeat(64), mapping:{state:'UNMAPPED'}, source_index:0, date:'2026-12-01', jurisdiction:'EU', instrument:'example', provision:'Art.1', source_status:'CLOCK_ASSERTION_NOT_REVALIDATED'};
const report = extra => Buffer.from(JSON.stringify({schema:'csoai.daily-signal/0.1', as_of:'2026-11-06', generated_from:{crosswalk:{sha256:digest}}, signals:[signal,...extra]}));
test('queue preserves event identity and never assigns approval', () => {
 const q=buildQueue(report([{...signal,event_sha256:'b'.repeat(64),mapping:{state:'REVIEWED_DECLARATION'}}]),cw);
 assert.equal(q.items.length,1); assert.equal(q.items[0].event_sha256,signal.event_sha256);
 assert.equal(q.items[0].review_status,'PENDING'); assert.equal(q.items[0].reviewer,null);
 assert.deepEqual(q.items[0].candidate_provision_ids,[]);
});
test('reject altered crosswalk and malformed identity', () => {
 assert.throws(()=>buildQueue(report([]),Buffer.from('{"frameworks":[{}]}')),/do not match/);
 assert.throws(()=>buildQueue(report([{...signal,event_sha256:'invalid'}]),cw),/invalid event digest/);
});

test('CLI preserves an existing queue and fails closed on mismatched bytes', async () => {
 const {mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync} = await import('node:fs');
 const {tmpdir} = await import('node:os');
 const {join} = await import('node:path');
 const {spawnSync} = await import('node:child_process');
 const {fileURLToPath} = await import('node:url');
 const dir = mkdtempSync(join(tmpdir(), 'daily-queue-'));
 try {
  const input=join(dir,'report.json'), crosswalk=join(dir,'crosswalk.json'), out=join(dir,'queue.json');
  const script=fileURLToPath(new URL('./build.mjs',import.meta.url));
  writeFileSync(input,report([])); writeFileSync(crosswalk,cw); writeFileSync(out,'preserve');
  const existing=spawnSync(process.execPath,[script,input,crosswalk,out],{encoding:'utf8'});
  assert.notEqual(existing.status,0); assert.equal(readFileSync(out,'utf8'),'preserve');
  rmSync(out); writeFileSync(crosswalk,'{"frameworks":[{}]}');
  const mismatch=spawnSync(process.execPath,[script,input,crosswalk,out],{encoding:'utf8'});
  assert.notEqual(mismatch.status,0); assert.match(mismatch.stderr,/do not match/); assert.equal(existsSync(out),false);
 } finally { rmSync(dir,{recursive:true,force:true}); }
});
