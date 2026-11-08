import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nEff, rhoFromNEff, observedRho, assessCouncil } from '../src/quorum-neff.mjs';
const varying = [[0,0,1,1], [0,1,0,1]];
function legsWithRho(nLegs, m, targetRho, seed = 1) {
  const p = Math.sqrt(Math.max(0, Math.min(1, targetRho)));
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const truth = Array.from({ length: m }, () => (rnd() < .5 ? 1 : 0));
  return Array.from({ length: nLegs }, () => truth.map(t => rnd() < p ? t : (rnd() < .5 ? 1 : 0)));
}
test('closed-form boundaries remain intact', () => {
  assert.equal(nEff(3,0),3); assert.equal(nEff(3,1),1); assert.equal(nEff(33,1),1);
});
test('historical DR-0007 number round-trips; no fresh measurement', () => {
  const rho = rhoFromNEff(3,1.21); assert.ok(Math.abs(rho-.7397)<.001);
  assert.ok(Math.abs(nEff(3,rho)-1.21)<.001);
});
test('inverse proxy reaches two at rho .25', () => assert.ok(Math.abs(rhoFromNEff(3,2)-.25)<1e-9));
test('seeded complete panels retain correlation calibration', () => {
  for(const target of [0,.3,.6,.9]) assert.ok(Math.abs(observedRho(legsWithRho(3,4000,target,7)).rho-target)<.05);
});
test('all constant panels have no identified correlation', () => {
  const r=assessCouncil(Array.from({length:33},()=>Array(50).fill(1)),23);
  assert.equal(r.state,'UNCHECKABLE'); assert.equal(r.n_eff,null); assert.equal(r.rho,null); assert.equal(r.constantLegs,33);
});
test('different constant opinions are also uncheckable', () => {
  const r=assessCouncil([[0,0],[1,1]],2); assert.equal(r.rho,null); assert.equal(r.n_eff,null);
});
test('complete low-correlated panels have a proxy but no effective quorum', () => {
  const r=assessCouncil(legsWithRho(33,2000,.05,11),23);
  assert.equal(r.state,'MEASURED'); assert.ok(r.n_eff>10); assert.equal(r.effectiveQuorum,null);
});
test('correlated complete panels retain a small design effect', () => assert.ok(assessCouncil(legsWithRho(33,2000,.74,3),23).n_eff<3));
test('constant added seat cannot inflate full-roster estimate', () => {
  const r=assessCouncil([...varying,[1,1,1,1]],2);
  assert.equal(r.state,'PARTIAL'); assert.equal(r.n_eff,null); assert.equal(r.degeneratePairs,2); assert.equal(r.rho,0);
});
test('strict binary types; no false-to-true or null-to-false coercion', () => {
  for(const bad of ['false','0',null,undefined,true,false,2,-1,NaN,{},[]])
    assert.throws(()=>observedRho([[0,1],[0,bad]]));
});
test('empty or malformed legs rejected before constant branch', () => {
  for(const bad of [[],[[]],[[],[]],[[1]],[[0,1],[1]],null,[{},{}],[[0,1],null]]) assert.throws(()=>assessCouncil(bad,1));
});
test('sparse verdict arrays are missing evidence', () => assert.throws(()=>assessCouncil([[0,1],new Array(2)],1)));
test('quorum cannot exceed roster or be coercible', () => {
  for(const q of [0,-1,3,1.5,'2',true,NaN,Infinity]) assert.throws(()=>assessCouncil(varying,q));
});
test('singular negative-correlation boundary rejected', () => assert.throws(()=>nEff(3,-.5)));
test('finite numeric arguments required', () => {
  for(const rho of ['0',null,NaN,Infinity,{},-2,2]) assert.throws(()=>nEff(3,rho));
  for(const n of ['3',null,1.5,0,-1,Infinity]) assert.throws(()=>nEff(n,0));
});
test('inverse input validation', () => {
  for(const n of [1,'3',3.5,NaN]) assert.throws(()=>rhoFromNEff(n,2));
  for(const e of [0,-1,.5,'2',NaN,Infinity]) assert.throws(()=>rhoFromNEff(3,e));
});
test('all result states are non-authorizing', () => {
  for(const input of [varying,[...varying,[1,1,1,1]],[[0,0],[1,1]]]) {
    const r=assessCouncil(input,2); assert.equal(r.independence_established,false);
    assert.equal(r.bft_status,'NOT_DEMONSTRATED'); assert.equal(r.execution_authorized,false);
  }
});
test('pairwise zero correlation can coexist with deterministic dependence', () => {
  const xor=[0,1,1,0],r=assessCouncil([...varying,xor],2);
  assert.equal(r.rho,0); assert.equal(r.n_eff,3); assert.equal(r.independence_established,false);
  assert.deepEqual(varying[0].map((x,i)=>x^varying[1][i]),xor);
});
test('measurement is a label for this statistic, never accuracy', () => {
  const r=assessCouncil(varying,2); assert.equal(r.statistic,'binary-verdict-phi/equicorrelation-design-effect');
  assert.equal(r.accuracy,undefined); assert.equal(r.human_approved,undefined);
});
test('input arrays are not modified', () => {
  const copy=JSON.stringify(varying); assessCouncil(varying,2); assert.equal(JSON.stringify(varying),copy);
});
