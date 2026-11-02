#!/usr/bin/env node
/**
 * Production anchor for the PR facts-gate (Measure ruling on #3266, 16 Oct 2026).
 *
 * pr-gates now judges the pages against the board THIS commit renders (--board-reference, the
 * same bound file deploy uses). That alone would let a PR silently change a measured result, so
 * this check pins the measured part of that board to PRODUCTION:
 *   - every axis production measured is still measured here, with the same status, separation,
 *     n and every numeric score field;
 *   - an axis PROMOTED here (a declared slot that became MEASURED) must arrive with its
 *     evidence: method_status "meets-rule", a sha256 bank_sha256, and n >= 30. Growth without
 *     evidence is refused. 2026-10-29: the first promotion ever (claim-maintenance) — before
 *     that day the measured set could only ever be identical to production's.
 *   - every production axis id is still present; the unmeasured count may grow, or fall by
 *     exactly the number of promotions. Growth is published; shrinkage is drift.
 *   - the shipped signed/card_index.json has the same n_cards / n_cells / head as production.
 * No fallback: an unreachable production endpoint fails the check.
 *
 *   node scripts/board-production-anchor.mjs dist/client --board-reference prerender-board-reference.json
 *   node scripts/board-production-anchor.mjs --selftest
 */
import fs from 'node:fs';import path from 'node:path';
import {verifyBoardReference} from './surface/render-board-reference.mjs';
const PROD='https://councilof.ai';
const rowKey=r=>{const o={status:r.status,separation:r.separation??null};for(const[k,v]of Object.entries(r))if(typeof v==='number')o[k]=v;return JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]));};
const cardKey=c=>JSON.stringify({n_cards:c.n_cards,n_cells:c.n_cells,cards:Array.isArray(c.cards)?c.cards.length:c.cards,head:c.head});
export function compare(prod,commit,prodCards,commitCards){
  const errs=[];const P=new Map(prod.axes.map(r=>[r.axis,r])),C=new Map(commit.axes.map(r=>[r.axis,r]));
  const pm=[...P.values()].filter(r=>r.status==='MEASURED').map(r=>r.axis).sort(),cm=[...C.values()].filter(r=>r.status==='MEASURED').map(r=>r.axis).sort();
  // A PROMOTION is a declared slot becoming MEASURED with a frozen, sha-pinned bank behind
  // it (2026-10-29: claim-maintenance, the first measured subject axis). Before that day
  // the measured set could only ever be identical to production's, because nothing had ever
  // been promoted in a PR. The rule now separates the two things this gate exists to catch:
  // a MEASUREMENT that changed, and a MEASUREMENT that vanished. Neither is a promotion.
  //   - every axis production measured must still be measured here, with the same numbers;
  //   - an axis newly measured here must arrive WITH ITS EVIDENCE: method_status
  //     "meets-rule", a 64-hex bank_sha256, and n >= 30. Growth without evidence is refused.
  // Growth is published; shrinkage is drift.
  const demoted=pm.filter(id=>!cm.includes(id));
  const promoted=cm.filter(id=>!pm.includes(id));
  for(const id of demoted)errs.push(`axis ${id} was measured in production and is not measured in this commit`);
  for(const id of promoted){
    const c=C.get(id);
    if(!c){errs.push(`newly measured axis ${id} is missing from the commit board`);continue;}
    const shaOk=/^[0-9a-f]{64}$/.test(String(c.bank_sha256??''));
    if(c.method_status!=='meets-rule'||!shaOk||!(Number.isInteger(c.n)&&c.n>=30))
      errs.push(`newly measured axis ${id} must arrive with method_status "meets-rule", a sha256 bank_sha256 and n >= 30`);
  }
  if(commit.totals.measured_axes!==prod.totals.measured_axes+promoted.length)errs.push(`measured_axes ${commit.totals.measured_axes} != production ${prod.totals.measured_axes} + ${promoted.length} promotion(s)`);
  for(const id of P.keys())if(!C.has(id))errs.push(`production axis ${id} missing from commit board`);
  for(const id of pm){const c=C.get(id);if(c&&rowKey(c)!==rowKey(P.get(id)))errs.push(`measured axis ${id}: status/separation/n/score changed`);}
  if(commit.totals.axes<prod.totals.axes)errs.push(`axis count shrank ${prod.totals.axes} -> ${commit.totals.axes}`);
  const pu=prod.totals.axes-prod.totals.measured_axes,cu=commit.totals.axes-commit.totals.measured_axes;
  // The unmeasured count may grow (a new declared slot) or fall by exactly the number of
  // promotions (a declared slot that became measured). Any other fall is drift.
  if(cu<pu-promoted.length)errs.push(`unmeasured count shrank ${pu} -> ${cu} beyond the ${promoted.length} promotion(s)`);
  if(cardKey(prodCards)!==cardKey(commitCards))errs.push(`card_index differs from production: ${cardKey(prodCards)} vs ${cardKey(commitCards)}`);
  return errs;
}
async function getJson(u){const r=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{accept:'application/json'}});if(!r.ok)throw Error(`PRODUCTION_UNREADABLE ${r.status} ${u}`);return r.json();}
function selftest(){
  const ax=(axis,status,n,x)=>({axis,status,n,separation:'TIE',fleet_mean:x});
  // A promotion: a declared slot that became MEASURED, with the evidence the Measure
  // ruling demands — a frozen, sha-pinned bank, method_status "meets-rule" and n >= 30.
  const pr=(axis,n,bank_sha256='a'.repeat(64),method_status='meets-rule')=>({axis,status:'MEASURED',n,method_status,bank_sha256});
  const b=(axes)=>({axes,totals:{axes:axes.length,measured_axes:axes.filter(a=>a.status==='MEASURED').length}});
  const cards={n_cards:335,n_cells:335,cards:335,head:'h'};
  const prod=b([ax('a','MEASURED',10,.5),ax('b','MEASURED',20,.6)]);
  const cases=[
    ['grows unmeasured only',b([ax('a','MEASURED',10,.5),ax('b','MEASURED',20,.6),ax('c','UNMEASURED',0)]),cards,true],
    ['n changed',b([ax('a','MEASURED',11,.5),ax('b','MEASURED',20,.6)]),cards,false],
    ['score changed',b([ax('a','MEASURED',10,.51),ax('b','MEASURED',20,.6)]),cards,false],
    ['measured count changed',b([ax('a','MEASURED',10,.5),ax('b','MEASURED',20,.6),ax('c','MEASURED',5,.1)]),cards,false],
    ['axis dropped to unmeasured',b([ax('a','MEASURED',10,.5),ax('b','UNMEASURED',0)]),cards,false],
    ['axis removed',b([ax('a','MEASURED',10,.5)]),cards,false],
    ['card_index changed',prod,{...cards,n_cards:336},false],
    // PROMOTIONS. Growth is published, shrinkage is drift — but growth must carry its evidence.
    ['a promotion with a frozen sha-pinned bank and n>=30 is allowed',b([ax('a','MEASURED',10,.5),ax('b','MEASURED',20,.6),pr('c',174)]),cards,true],
    ['a promotion without a bank sha256 is refused',b([ax('a','MEASURED',10,.5),ax('b','MEASURED',20,.6),pr('c',174,null)]),cards,false],
    ['a promotion with a short bank sha256 is refused',b([ax('a','MEASURED',10,.5),ax('b','MEASURED',20,.6),pr('c',174,'abc')]),cards,false],
    ['a promotion below n>=30 is refused',b([ax('a','MEASURED',10,.5),ax('b','MEASURED',20,.6),pr('c',29)]),cards,false],
    ['a promotion without method_status meets-rule is refused',b([ax('a','MEASURED',10,.5),ax('b','MEASURED',20,.6),pr('c',174,'a'.repeat(64),'no-method: declared slot')]),cards,false],
  ];
  for(const[name,commit,cc,ok]of cases){const e=compare(prod,commit,cards,cc);if((e.length===0)!==ok){console.error(`selftest FAILED: ${name} -> ${e.join('; ')||'no error'}`);process.exit(1);}}
  console.log(`board-production-anchor selftest OK (${cases.length} cases, ${cases.filter(c=>!c[3]).length} must-fail)`);
}
const args=process.argv.slice(2);
if(args.includes('--selftest')){selftest();process.exit(0);}
const dist=args[0],i=args.indexOf('--board-reference'),ref=i<0?null:args[i+1];
if(!dist||!ref){console.error('usage: board-production-anchor.mjs <dist/client> --board-reference <file> | --selftest');process.exit(2);}
const v=verifyBoardReference(ref,dist);
const doc=JSON.parse(fs.readFileSync(ref,'utf8'));const commit=JSON.parse(Buffer.from(doc.board_base64,'base64').toString('utf8'));
const commitCards=JSON.parse(fs.readFileSync(path.join(dist,'signed/card_index.json'),'utf8'));
const prod=await getJson(PROD+'/api/gspc'),prodCards=await getJson(PROD+'/signed/card_index.json');
const errs=compare(prod,commit,prodCards,commitCards);
console.log(`board-production-anchor: commit board ${v.board_sha256.slice(0,12)} axes ${commit.totals.axes} measured ${commit.totals.measured_axes}; production axes ${prod.totals.axes} measured ${prod.totals.measured_axes}; card_index ${prodCards.n_cards}`);
if(errs.length){for(const e of errs)console.error('  ✗ '+e);console.error(`board-production-anchor FAILED: ${errs.length} difference(s) from production`);process.exit(1);}
console.log('board-production-anchor OK: production measurements are unchanged, any promotion carries a frozen sha-pinned bank with n >= 30, and card_index matches production; only unmeasured axes may grow.');
