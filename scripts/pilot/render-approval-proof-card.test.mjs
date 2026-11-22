import {test} from 'node:test';
import assert from 'node:assert/strict';
import {render} from './render-approval-proof-card.mjs';
const commit='b'.repeat(40);
const fixture=()=>({
 schema:'csoai.pilot-demo/0.1', outcome:'PASS', source_sha256:'a'.repeat(64),
 ran_at:'2026-11-20T06:43:19Z', fixture_count:14,
 results:{authorised_effect_and_readback:true,negative_controls:true,honest_scope:true,upstream_trial_passed:true},
 independent_review:'NOT_CONDUCTED',human_approval:'SYNTHETIC_KEY_ONLY',
 production_authority:false,gspc_measurement_admission:false,
 cases:[{scenario:'pass',execution:'EXECUTED',observer:'EFFECT_READBACK_MATCHED',actual_effect_written:true},
 ...Array.from({length:13},(_,i)=>({scenario:'bad-'+i,execution:'DENIED',observer:'NO_EFFECT',actual_effect_written:false}))]
});
test('one passing synthetic run becomes an expressly scoped proof card',()=>{
 const {card,markdown}=render(fixture(),commit);
 assert.equal(card.invalid_fixtures_denied_without_effect,13);
 assert.equal(card.model_attack_detection_tested,false);
 assert.match(markdown,/No authenticated human/);
});
test('cannot relabel an actual invalid effect as stopped',()=>{
 const r=fixture();r.cases[5].actual_effect_written=true;
 assert.throws(()=>render(r,commit),/effect evidence/);
});
test('cannot turn a synthetic run into a production or endorsed claim',()=>{
 const r=fixture();r.production_authority=true;
 assert.throws(()=>render(r,commit),/scope and authority/);
});
test('requires complete, correctly bounded evidence',()=>{
 const r=fixture();r.cases.pop();
 assert.throws(()=>render(r,commit),/unexpected denominator/);
 assert.throws(()=>render(fixture(),'master'),/source commit/);
});
test('rejects failed negative controls',()=>{
 const r=fixture();r.results.negative_controls=false;
 assert.throws(()=>render(r,commit),/upstream controls/);
});
