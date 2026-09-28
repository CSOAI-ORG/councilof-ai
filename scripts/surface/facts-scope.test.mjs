import {readFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {test} from 'node:test';import assert from 'node:assert/strict';import {currentCountContent,isFrozenBankSubset,correctedHistoricalContent} from './facts-scope.mjs';
const item=()=>({schema:'csoai.correction-watch/0.1',scans:[{id:'C-2026-0918-01',first_observed_at:'2026-09-18T08:00:00Z',what_was_wrong:'We incorrectly wrote 99 axes.',why_it_was_wrong:'15 slots was the wrong denominator.',current_summary:'There are 999 axes now.'}]});
test('explicit past quotation is not a fresh count assertion',()=>{const d=JSON.parse(currentCountContent(JSON.stringify(item())));assert.ok(!d.scans[0].what_was_wrong.includes('99 axes'));assert.ok(!d.scans[0].why_it_was_wrong.includes('15 slots'));});
test('present summaries are never exempted',()=>assert.ok(currentCountContent(JSON.stringify(item())).includes('999 axes now')));
test('a text label without valid correction identity grants no exemption',()=>{const d=item();d.scans[0].id='anything';assert.ok(currentCountContent(JSON.stringify(d)).includes('99 axes'));});
test('missing or invalid date grants no exemption',()=>{const d=item();d.scans[0].first_observed_at='not a date';assert.ok(currentCountContent(JSON.stringify(d)).includes('99 axes'));});
test('other schemas and malformed JSON stay byte-identical',()=>{for(const s of ['{bad',JSON.stringify({schema:'other',scans:item().scans})])assert.equal(currentCountContent(s),s);});
test('bank-qualified subpopulation is smaller than or equal to board',()=>{assert.equal(isFrozenBankSubset(22,23,' carrying a frozen bank resolve to a dataset'),true);assert.equal(isFrozenBankSubset(24,23,' carrying a frozen bank'),false);});
test('unqualified board count or vague carrying phrase still checked',()=>{assert.equal(isFrozenBankSubset(22,23,' in the current board'),false);assert.equal(isFrozenBankSubset(22,23,' carrying a leader'),false);});

test('exact-byte historical correction scopes only six pinned files',()=>{
 const root=resolve('public');
 const correction=JSON.parse(readFileSync(join(root,'interop/historical-interop-correction-2026-09-23.json'),'utf8'));
 assert.equal(correction.records.length,6);
 for(const record of correction.records){
  const raw=readFileSync(join(root,record.path),'utf8');
  const scan=correctedHistoricalContent(raw,record.path,root);
  assert.notEqual(scan,raw,record.path+' must be scoped');
  assert.equal((scan.match(/Historical assertion superseded/g)||[]).length,record.historical_fields.length);
  const tampered=raw+' ';
  assert.equal(correctedHistoricalContent(tampered,record.path,root),tampered);
  assert.equal(correctedHistoricalContent(raw,'interop/unlisted.json',root),raw);
 }
});
