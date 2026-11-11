import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildProduct, loadArchive, main, strictJson, digest, compareReports} from './build-daily-product.mjs';

const H = 'a'.repeat(64), H2 = 'b'.repeat(64);
function fixture(day='2026-11-04') {
  const source = {path:'public/example.json',sha256:H,state:'READ'};
  const signal = {source_index:0,event_sha256:H,date:'2026-11-10',days_until:(Date.parse('2026-11-10')-Date.parse(day))/86400000,
    instrument:'Example instrument',jurisdiction:'Example',provision:'Article 1',requires:'Evidence',binds:'Example actor',
    source_status:'CLOCK_ASSERTION_NOT_REVALIDATED',evidence_coverage:null,mapping:{state:'UNMAPPED',reason:'No reviewed mapping',declaration:null},mapped_provisions:[],gspc_axes:[]};
  return {schema:'csoai.daily-signal/0.1',as_of:day,horizon_days:90,headline:{clock_events:1,events_in_horizon:1,mapped_events:0,unmapped_events:1,invalid_events:0,excluded_events:0},
    generated_from:{clock:source,board:source,crosswalk:source,claims:source,mappings:{path:null,sha256:null,state:'ABSENT'}},
    corrections:{register_state:'PRESENT',register_as_of:'2026-10-01T00:00:00Z',delta_state:'NOT_COMPUTED',subjects_listed:0},
    signals:[signal],unmapped:[{event_sha256:H,date:signal.date,instrument:signal.instrument,reason:signal.mapping.reason}],excluded_events:[],invalid_events:[],orphaned_mapping_event_ids:[],limitations:[]};
}
function temporary(t) {
  const root=mkdtempSync(join(tmpdir(),'daily-product-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const dir=join(root,'public/reports/daily-signal');mkdirSync(dir,{recursive:true});
  return {root,dir};
}
function put(dir, report, latest=true, raw=null) {
  const bytes=raw??JSON.stringify(report,null,1)+'\n';
  writeFileSync(join(dir,report.as_of+'.json'),bytes);
  if(latest)writeFileSync(join(dir,'latest.json'),bytes);
  return bytes;
}

test('single snapshot produces accessible static archive and explicitly unavailable comparison',t=>{
  const {dir}=temporary(t), r=fixture(), bytes=put(dir,r), {files,index}=buildProduct(dir);
  assert.equal(index.latest_report_id,digest(bytes));assert.equal(index.report_count,1);
  assert.equal(index.measurement_count,null);assert.equal(index.valuation,null);
  assert.equal(index.reports[0].comparison.state,'PRIOR_REPORT_UNAVAILABLE');
  assert.equal(index.reports[0].comparison.added_event_ids,null);
  const html=files.get('index.html');
  assert.match(html,/<html lang="en">/);assert.match(html,/name="viewport"/);assert.match(html,/Skip to report/);
  assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/scope="col"/);assert.doesNotMatch(html,/<script\b/i);
  assert.match(html,/2026-10-01T00:00:00Z/);assert.match(html,/General per-source retrieval timestamps are not supplied/);
  assert.equal(files.get('latest.md'),files.get('2026-11-04.md'));
});
test('raw-byte changes alter report identity without claiming a new measurement',t=>{
  const {dir}=temporary(t), r=fixture();put(dir,r);const first=buildProduct(dir).index.latest_report_id;
  put(dir,r,true,JSON.stringify(r));const second=buildProduct(dir).index.latest_report_id;
  assert.notEqual(first,second);assert.equal(buildProduct(dir).index.measurement_count,null);
});
test('all findings bind exact report bytes, JSON pointers and qualification actions',t=>{
  const {dir}=temporary(t);const raw=put(dir,fixture());const pack=JSON.parse(buildProduct(dir).files.get('findings.json'));
  assert.equal(pack.signed,false);assert.equal(pack.report_id,digest(raw));assert.equal(pack.findings.length,4);
  for(const f of pack.findings){assert.match(f.id,/^[a-f0-9]{64}$/);assert.equal(f.source.report_sha256,digest(raw));assert.ok(f.source.json_pointer.startsWith('/'));assert.ok(f.qualification_action.length>10);}
  assert.equal(new Set(pack.findings.map(f=>f.id)).size,pack.findings.length);
});
test('retained comparison ignores the daily countdown but detects actual mapping/source changes',t=>{
  const {dir}=temporary(t);put(dir,fixture('2026-11-03'),false);put(dir,fixture());
  let {index}=buildProduct(dir);assert.equal(index.reports[0].comparison.state,'COMPARED_RETAINED_REPORTS');
  assert.deepEqual(index.reports[0].comparison.changed_event_ids,[]);
  const next=fixture();next.signals[0].mapping.reason='Revision review pending';next.generated_from.board={path:'public/example.json',sha256:H2,state:'READ'};put(dir,next);
  ({index}=buildProduct(dir));assert.deepEqual(index.reports[0].comparison.changed_event_ids,[H]);assert.deepEqual(index.reports[0].comparison.changed_source_roles,['board']);
});
test('window entry and exit are reported separately from amendments',t=>{
  const {dir}=temporary(t);put(dir,fixture('2026-11-03'),false);
  const next=fixture();next.signals[0].event_sha256=H2;next.unmapped[0].event_sha256=H2;put(dir,next);
  const c=buildProduct(dir).index.reports[0].comparison;
  assert.deepEqual(c.added_event_ids,[H2]);assert.deepEqual(c.removed_event_ids,[H]);assert.match(c.scope,/not a legal amendment/);
});
test('malicious source strings remain escaped text in HTML and Markdown',t=>{
  const {dir}=temporary(t), r=fixture();r.signals[0].instrument='<img src=x onerror="alert(1)">';r.signals[0].provision='[attack](javascript:alert(1))';r.signals[0].mapping.reason='</td><script>alert(2)</script>';r.unmapped[0].instrument=r.signals[0].instrument;
  put(dir,r);const {files}=buildProduct(dir), html=files.get('index.html'), markdown=files.get('latest.md');
  assert.doesNotMatch(html,/<img|<script>/);assert.match(html,/&lt;img/);assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(markdown,/<img|\[attack\]\(javascript/);assert.match(markdown,/\\\[attack\\\]/);
});
test('duplicate JSON keys including escaped aliases are rejected',()=>{
  assert.throws(()=>strictJson('{"schema":"x","schema":"y"}'),/duplicate JSON key/);
  assert.throws(()=>strictJson('{"x":{"a":1,"\\u0061":2}}'),/duplicate JSON key/);
  assert.deepEqual(strictJson('{"a": ["brace }", {"b": true}], "c":null}'),{a:['brace }',{b:true}],c:null});
});
test('invalid calendar dates and filename/date mismatches fail before output',t=>{
  const {dir}=temporary(t), r=fixture();put(dir,r);writeFileSync(join(dir,'2026-02-30.json'),JSON.stringify({...r,as_of:'2026-02-30'}));
  assert.throws(()=>buildProduct(dir),/invalid calendar date/);rmSync(join(dir,'2026-02-30.json'));
  writeFileSync(join(dir,'2026-11-03.json'),JSON.stringify(r));assert.throws(()=>buildProduct(dir),/filename\/date mismatch/);
});
test('unknown schema, missing fields and inconsistent counts fail closed',t=>{
  const {dir}=temporary(t);
  for(const mutate of [r=>r.schema='other',r=>delete r.generated_from,r=>r.headline.mapped_events=7,r=>delete r.signals[0].instrument,r=>r.signals[0].days_until=7]){
    const r=fixture();mutate(r);put(dir,r);assert.throws(()=>buildProduct(dir));
  }
});
test('duplicate event digests or source positions cannot inflate the index',t=>{
  const {dir}=temporary(t), r=fixture();r.signals.push({...r.signals[0]});r.headline.clock_events++;r.headline.events_in_horizon++;r.headline.unmapped_events++;r.unmapped.push({...r.unmapped[0]});put(dir,r);
  assert.throws(()=>buildProduct(dir),/duplicate source index/);
  r.signals[1].source_index=1;put(dir,r);assert.throws(()=>buildProduct(dir),/duplicate event digest/);
});
test('unmapped index and unsupported evidence claims are rejected',t=>{
  const {dir}=temporary(t), r=fixture();r.unmapped=[];put(dir,r);assert.throws(()=>buildProduct(dir),/unmapped index mismatch/);
  const r2=fixture();r2.signals[0].evidence_coverage=1;put(dir,r2);assert.throws(()=>buildProduct(dir),/unsupported evidence claim/);
});
test('missing or stale latest pointer cannot silently select another snapshot',t=>{
  const {dir}=temporary(t);put(dir,fixture('2026-11-03'));put(dir,fixture(),false);assert.throws(()=>loadArchive(dir),/latest.json differs/);
  rmSync(join(dir,'latest.json'));assert.throws(()=>loadArchive(dir),/ENOENT/);
});
test('generation is deterministic, preserves sources and detects derived-output tampering',t=>{
  const {root,dir}=temporary(t), bytes=put(dir,fixture());writeFileSync(join(dir,'other-note.txt'),'keep');
  const first=main([],root);assert.ok(first.changed.length>0);assert.deepEqual(main([],root).changed,[]);assert.deepEqual(main(['--check'],root).changed,[]);
  assert.equal(readFileSync(join(dir,'latest.json'),'utf8'),bytes);assert.equal(readFileSync(join(dir,'2026-11-04.json'),'utf8'),bytes);assert.equal(readFileSync(join(dir,'other-note.txt'),'utf8'),'keep');
  writeFileSync(join(dir,'index.html'),'tampered');assert.throws(()=>main(['--check'],root),/Daily product differs/);
});
test('a stamped changed output prevents every write',t=>{
  const {root,dir}=temporary(t);put(dir,fixture());writeFileSync(join(dir,'index.html'),'retained');writeFileSync(join(dir,'index.html.ots'),'stamp');
  assert.throws(()=>main([],root),/stamped output/);assert.equal(readFileSync(join(dir,'index.html'),'utf8'),'retained');assert.equal(existsSync(join(dir,'findings.json')),false);
});
test('input and output symlinks are refused, including dangling outputs',t=>{
  const {root,dir}=temporary(t);put(dir,fixture());rmSync(join(dir,'2026-11-04.json'));symlinkSync(join(dir,'latest.json'),join(dir,'2026-11-04.json'));assert.throws(()=>buildProduct(dir),/regular report file/);
  rmSync(join(dir,'2026-11-04.json'));put(dir,fixture());symlinkSync(join(dir,'missing'),join(dir,'index.html'));assert.throws(()=>main([],root),/Unsafe output target/);
});
test('oversized files, empty archives and unsupported CLI flags fail',t=>{
  const {root,dir}=temporary(t);assert.throws(()=>loadArchive(dir),/No dated/);put(dir,fixture());writeFileSync(join(dir,'2026-11-04.json'),' '.repeat(2*1024*1024+1));assert.throws(()=>loadArchive(dir),/2 MiB/);assert.throws(()=>main(['--deploy'],root),/Usage/);
});

// Report-to-existing-offer navigation: no new price, SKU, authority or source facts.
import {serviceHandoff, renderServiceHandoff} from './report-service-handoff.mjs';
const handoffEntry=()=>({filename:'2026-11-04.json',sha256:H,report:fixture()});
test('handoff binds the exact retained report identity',()=>{
 const v=serviceHandoff(handoffEntry());assert.equal(v.report_id,H);assert.equal(v.report_day,'2026-11-04');assert.equal(v.report_source,'/reports/daily-signal/2026-11-04.json');
});
test('four navigation options reuse three canonical product identifiers',()=>{
 const v=serviceHandoff(handoffEntry());assert.equal(v.options.length,4);assert.deepEqual([...new Set(v.options.map(x=>x.product_id))],['evidence_bundle','provider_diff_feed','data_feed']);
});
test('each option starts with a free preview and a separately labelled current quote',()=>{
 for(const o of serviceHandoff(handoffEntry()).options){assert.ok(o.preview_path.startsWith('/api/'));assert.ok(o.quote_path.startsWith('/api/'));assert.notEqual(o.preview_path,o.quote_path);assert.ok(o.scope.length>40);assert.ok(o.does_not_establish.length>20);}
 const html=renderServiceHandoff(handoffEntry());assert.equal((html.match(/Inspect free preview/g)||[]).length,4);assert.equal((html.match(/Request current x402 quote/g)||[]).length,4);
});
test('no fixed price, payment permission or delivery state is inferred',()=>{
 const v=serviceHandoff(handoffEntry());assert.equal(v.payment_attempted,false);assert.equal(v.delivery_verified,false);assert.equal(v.applicability_determined,false);assert.equal(v.report_is_the_paid_deliverable,false);assert.equal(v.reuse_rights_established,false);assert.equal(v.commercial_state,'NAVIGATION_ONLY_NO_LIVE_OFFER_CHECK');
 assert.doesNotMatch(JSON.stringify(v),/"(?:price|amount|payTo|private_key)"|\$\d/);
});
test('legal relevance is reader selected, not inferred from a report title',()=>{
 const e=handoffEntry();e.report.signals[0].instrument='AI Act Article 53';e.report.signals[0].mapping.state='REVIEWED_DECLARATION';
 assert.deepEqual(serviceHandoff(e),serviceHandoff(handoffEntry()));assert.equal(serviceHandoff(e).selection_basis,'READER_CHOICE_NOT_LEGAL_APPLICABILITY');
});
test('untrusted source words cannot create new links or HTML',()=>{
 const e=handoffEntry();e.report.signals[0].instrument='<img src=x onerror=alert(1)>';e.report.signals[0].mapping.reason='https://attacker.invalid/buy';
 const html=renderServiceHandoff(e);assert.doesNotMatch(html,/attacker|<img|<script|onerror/);
});
test('source payload cannot overwrite fixed offer URLs',()=>{
 const e=handoffEntry();e.report.offers=[{quote_path:'https://attacker.invalid/'}];e.report.quote_path='javascript:alert(1)';
 assert.deepEqual(serviceHandoff(e),serviceHandoff(handoffEntry()));
});
test('fresh work stays an input-scoped request, never a paid booking',()=>{
 const f=serviceHandoff(handoffEntry()).fresh_work;assert.equal(f.request_path,'/contact/?arm=run');assert.equal(f.state,'INPUT_SCOPE_AND_CURRENT_TERMS_REQUIRED');assert.match(f.note,/not a booking/);assert.equal(f.existing_product_ids.length,3);
});
test('verification and catalogue remain existing free/read-only references',()=>{
 const v=serviceHandoff(handoffEntry());assert.equal(v.catalog_path,'/api/x402');assert.equal(v.instructions_path,'/quickstart/');assert.equal(v.free_verification_path,'/gspc-verify');assert.match(renderServiceHandoff(handoffEntry()),/Verification stays free/);
});
test('freshness and repeat use are not invented by rendering',()=>{
 const v=serviceHandoff(handoffEntry());assert.match(v.repeat_trigger,/unchanged quote is not new evidence/);assert.match(v.options[2].scope,/new report date does not make the records fresh/);assert.match(v.options[3].does_not_establish,/Not recurring cadence/);
});
test('new report bytes change only the handoff reference, not service facts',()=>{
 const e=handoffEntry(),first=serviceHandoff(e);e.sha256=H2;const next=serviceHandoff(e);assert.notEqual(next.report_id,first.report_id);assert.deepEqual(next.options,first.options);
});
test('returned handoffs do not share mutable nested objects',()=>{
 const a=serviceHandoff(handoffEntry());a.options[0].quote_path='/changed';a.fresh_work.existing_product_ids.push('new');assert.notEqual(serviceHandoff(handoffEntry()).options[0].quote_path,'/changed');assert.equal(serviceHandoff(handoffEntry()).fresh_work.existing_product_ids.length,3);
});
test('malformed report references cannot enter href or code fields',()=>{
 for(const change of [e=>e.sha256='<script>',e=>e.filename='../../private',e=>e.report.as_of='2026-02-30',e=>e.report.as_of='bad']){const e=handoffEntry();change(e);assert.throws(()=>serviceHandoff(e));}
});
test('handoff rendering is deterministic, static and has no purchase-on-load action',()=>{
 const e=handoffEntry();assert.equal(renderServiceHandoff(e),renderServiceHandoff(e));assert.doesNotMatch(renderServiceHandoff(e),/<script|<form|onclick|fetch\(/);assert.match(renderServiceHandoff(e),/A quote is not a purchase/);
});
test('latest machine index and HTML carry the same report-bound handoff',t=>{
 const {dir}=temporary(t);put(dir,fixture());const {files,index}=buildProduct(dir);const serialized=JSON.parse(files.get('index.json'));
 assert.equal(index.service_handoff.report_id,index.latest_report_id);assert.deepEqual(serialized.service_handoff,index.service_handoff);
 const html=files.get('index.html');assert.ok(html.includes(renderServiceHandoff({filename:'2026-11-04.json',sha256:index.latest_report_id,report:fixture()})));assert.equal(files.get('latest.md'),files.get('2026-11-04.md'));
});
test('new navigation does not change measured coverage, findings or rights',t=>{
 const {dir}=temporary(t);put(dir,fixture());const {files,index}=buildProduct(dir);assert.equal(index.measurement_count,null);assert.equal(index.valuation,null);assert.equal(JSON.parse(files.get('findings.json')).findings.length,4);assert.equal(index.service_handoff.reuse_rights_established,false);
});
