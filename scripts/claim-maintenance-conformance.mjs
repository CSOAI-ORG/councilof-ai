#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArtifact, verifyArtifact, artifactDigest } from './claim-capture.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=resolve(ROOT,'public/spec/claim-maintenance/conformance/v0.2');
const FIX=resolve(OUT,'fixtures');
const D='1'.repeat(64), E='2'.repeat(64), F='3'.repeat(64);
const sha=s=>createHash('sha256').update(s).digest('hex');
const SPEC_SHA='d649ba0fdefb63abc205102bc8863db2e7852b207fd4e9e23e05e286e13e3b2e';
const REF_SHA='10432c76c61b34ff9b726d2341844833b3e9a7fef19e5b77e5e545c45483559d';
const base=(state='CLAIM_CAPTURED')=>buildArtifact({claim_id:'T-1',subject:{name:'Example Corp',identifier:'https://example.com/',identifier_kind:'url'},claim_verbatim:'Example Corp publishes 60 percent coverage',source_url:'https://example.com/',access_date:'2026-09-30T00:00:00Z',content_hash:D,covers:'visible-text',extractor:'csoai-visible-text/2',state,measurement_plan:state==='CLAIM_CAPTURED'||state==='UNMEASURED'?'measure against the public example dataset':undefined,uncheckable_reason:state==='UNCHECKABLE'?'no public denominator exists':undefined,does_not_prove:['this record does not indicate the claim is false'],next_read_utc:'2026-10-07T00:00:00Z'});
const measured=()=>{const a=base('CLAIM_MEASURED');a.window={start:'2026-09-01T00:00:00Z',end:'2026-09-30T00:00:00Z'};a.denominator={description:'public example population',n:100};a.method={description:'count matching rows in the public example dataset',evidence:[{url:'https://example.com/data.json',access_date:'2026-09-30T00:00:00Z',sha256:E}]};a.result={value:'60',unit:'percent',n:100};a.does_not_prove=['that the claim is true beyond this bounded public dataset'];a.artifact_sha256=artifactDigest(a);return a};
const seal=a=>{a.artifact_sha256=artifactDigest(a);return a};
const cases=[
 ['valid-captured',true,base('CLAIM_CAPTURED'),'baseline captured state'],
 ['valid-unmeasured',true,base('UNMEASURED'),'first-class unmeasured state'],
 ['valid-uncheckable',true,base('UNCHECKABLE'),'evidence boundary is stated'],
 ['valid-measured',true,measured(),'bounded measurement with public evidence'],
 ['invalid-fifth-state',false,seal({...base(),state:'PASS'}),'there is no fifth state'],
 ['invalid-empty-does-not-prove',false,seal({...base(),does_not_prove:[] }),'does_not_prove must be non-empty'],
 ['invalid-measured-no-denominator',false,(()=>{const a=measured();delete a.denominator;return seal(a)})(),'rate/share measurements require denominator'],
 ['invalid-numeric-result-value',false,(()=>{const a=measured();a.result.value=60;return seal(a)})(),'numeric result values are not reproducible'],
 ['invalid-identical-change-digests',false,(()=>{const a=base();a.observed_changes=[{observed_utc:'2026-09-30T01:00:00Z',previous_hash:F,current_hash:F,extractor:'csoai-visible-text/2',note:'bytes differ'}];return seal(a)})(),'identical digests are not a change'],
 ['invalid-allegation-change-note',false,(()=>{const a=base();a.observed_changes=[{observed_utc:'2026-09-30T01:00:00Z',previous_hash:E,current_hash:F,extractor:'csoai-visible-text/2',note:'the subject quietly scrubbed the page'}];return seal(a)})(),'observed changes cannot imply motive or verdict'],
 ['invalid-plan-as-measurement',false,(()=>{const a=base('UNMEASURED');a.result={value:'60',unit:'percent',n:100};return seal(a)})(),'a plan/result cannot masquerade as a measurement'],
];
const manifest={schema:'csoai.claim-maintenance.conformance-corpus/0.1',spec_version:'0.2',spec_url:'https://councilof.ai/spec/claim-maintenance/v0.2/',spec_document_sha256:SPEC_SHA,reference_implementation:{url:'https://councilof.ai/spec/claim-maintenance/v0.2/reference/claim-capture.mjs',sha256:REF_SHA},what_this_is:'Deterministic interoperability fixtures for testing the public v0.2 verifier rules.',what_this_is_not:['Not certification.','Not a badge, score, ranking or mark of approval.','Not proof that an implementation is correct beyond these fixtures.'],cases:[]};
let bad=0;mkdirSync(FIX,{recursive:true});
for(const [id,want,a,reason] of cases){const got=verifyArtifact(a);const ok=got.ok===want;if(!ok)bad++;const file=`fixtures/${id}.json`;const body=JSON.stringify(a,null,2)+'\n';manifest.cases.push({id,file,sha256:sha(body),expected:want?'PASS':'FAIL',reason});if(process.argv.includes('--write'))writeFileSync(resolve(OUT,file),body);console.log(`${ok?'PASS':'FAIL'} ${id}: expected ${want?'PASS':'FAIL'} got ${got.ok?'PASS':'FAIL'}${got.errors.length?' · '+got.errors[0]:''}`)}
if(process.argv.includes('--write'))writeFileSync(resolve(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
if(process.argv.includes('--check')){const onDisk=JSON.parse(readFileSync(resolve(OUT,'manifest.json'),'utf8'));if(JSON.stringify(onDisk)!==JSON.stringify(manifest)){console.error('manifest drift');bad++}}
process.exit(bad?1:0);
