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
