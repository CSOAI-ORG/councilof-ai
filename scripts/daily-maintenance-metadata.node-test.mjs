import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,cpSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {projectMaintenanceMetadata,compareMaintenance,maintenanceView,readMetadataSourceBytes} from './daily-maintenance-metadata.mjs';
import {buildDailySignal,main as buildSignal} from './build-daily-signal.mjs';
import {buildProduct,loadArchive} from './build-daily-product.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const h=b=>createHash('sha256').update(b).digest('hex');
const paths={board:'public/signed/card-matrix.json',claims:'public/spec/claim-maintenance/register.json'};
const board=()=>({schema:'csoai.card-matrix/1',as_of:'2026-08-19T00:00:00Z',counts:{cells:1,models:1,axes:1},axes:[{id:'gov',cards:1,models:1,as_of:'2026-08-19T00:00:00Z'}]});
const claims=()=>({schema:'csoai.claim-maintenance.register/0.1',as_of:'2026-11-01T00:00:00Z',totals:{subjects:1,claims:1,by_state:{UNMEASURED:1}},subjects:[{last_read:'2026-10-01T00:00:00Z',next_scheduled_read_state:'DUE_EXECUTION_UNVERIFIED'}]});
function projection(b=board(),c=claims(),pretty=false){const sources={board:b,claims:c},generatedFrom={};for(const role of Object.keys(paths))generatedFrom[role]={state:'READ',path:paths[role],sha256:h(JSON.stringify(sources[role],null,pretty?2:0))};return projectMaintenanceMetadata({board:b,claims:c,generatedFrom,asOf:"2026-11-07"});}
const report=m=>({as_of:'2026-11-07',maintenance_metadata:m});

test('source projection keeps dates, counts and unknown rights without source text or authority',()=>{
 const b=board(),c=claims();b.secret='DO_NOT_COPY';c.subjects[0].claim_text='DO_NOT_COPY';c.subjects[0].subject='DO_NOT_COPY';
 const p=projection(b,c);assert.equal(p.sources.board.metadata.last_measurement_declared_at,'2026-08-19T00:00:00Z');
 assert.equal(p.sources.claims.metadata.last_measurement_declared_at,null);assert.equal(p.sources.claims.metadata.register_as_of_declared,'2026-11-01T00:00:00Z');
 assert.equal(p.sources.claims.metadata.scheduled_subject_states.DUE_EXECUTION_UNVERIFIED,1);
 assert.equal(p.sources.board.rights,'UNKNOWN');assert.equal(p.sources.claims.issuer_verification,'NOT_PERFORMED');
 assert.equal(p.canonical_event_created,false);assert.equal(p.grants_authority,false);assert.equal(p.execution_allowed,false);assert.equal(p.model_training,false);
 assert.doesNotMatch(JSON.stringify(p),/DO_NOT_COPY/);
});

test('same selected metadata dedupes unchanged reports and whitespace-only source changes',()=>{
 const old=report(projection()),same=report(projection());
 assert.equal(compareMaintenance(same,old).state,'UNCHANGED');assert.deepEqual(compareMaintenance(same,old).recheck_candidates,[]);
 const bytesOnly=compareMaintenance(report(projection(board(),claims(),true)),old);
 assert.equal(bytesOnly.state,'BYTES_CHANGED_METADATA_UNCHANGED');assert.deepEqual(bytesOnly.semantic_changed_roles,[]);assert.equal(bytesOnly.byte_changed_roles.length,2);assert.deepEqual(bytesOnly.recheck_candidates,[]);
});

test('semantic changes create stable review candidates, not measurement or execution',()=>{
 const old=report(projection()),b=board();b.counts.cells=2;
 const now=report(projection(b));const result=compareMaintenance(now,old);
 assert.equal(result.state,'METADATA_CHANGED');assert.deepEqual(result.semantic_changed_roles,['board']);assert.equal(result.recheck_candidates.length,1);
 const candidate=result.recheck_candidates[0];assert.equal(candidate.state,'PENDING_SOURCE_REVIEW');assert.equal(candidate.execution_allowed,false);assert.equal(candidate.independently_verified,false);
 assert.equal(compareMaintenance(now,old).recheck_candidates[0].id,candidate.id);
 assert.deepEqual(compareMaintenance(now,now).recheck_candidates,[]);
});

test('missing, unsupported and non-allowlisted sources remain unavailable',()=>{
 const m=projectMaintenanceMetadata({board:board(),claims:claims(),generatedFrom:{board:{path:'/private/input.json',state:'READ',sha256:'a'.repeat(64)}}});
 assert.equal(m.sources.board.state,'UNAVAILABLE');assert.equal(m.sources.board.metadata,null);
 const bad=board();bad.axes=[{id:'../secret'}];assert.equal(projection(bad).sources.board.state,'UNAVAILABLE');
 const b=board();b.schema='other';const result=compareMaintenance(report(projection(b)),report(projection()));
 assert.equal(result.recheck_candidates[0].reason,'SOURCE_METADATA_UNAVAILABLE');
 assert.equal(compareMaintenance({},{...report(projection())}).state,'METADATA_UNAVAILABLE');
 const tampered=projection();tampered.sources.board.metadata.counts.cells=99;assert.equal(maintenanceView(report(tampered)).snapshot,null);
});

test('actual retained reports stay unchanged and do not acquire invented metadata',t=>{
 const root=mkdtempSync(join(tmpdir(),'daily-maint-history-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const directory=join(root,'public/reports/daily-signal');mkdirSync(directory,{recursive:true});
 const expected=new Map();for(const day of ['2026-11-04','2026-11-05','2026-11-06']){const name=day+'.json',bytes=readFileSync(join(ROOT,'public/reports/daily-signal',name));expected.set(name,h(bytes));writeFileSync(join(directory,name),bytes)}
 writeFileSync(join(directory,'latest.json'),readFileSync(join(directory,'2026-11-06.json')));
 const product=buildProduct(directory);assert.equal(loadArchive(directory).length,3);assert.equal(product.index.maintenance_metadata.snapshot,null);
 assert.equal(product.index.maintenance_metadata.comparison.state,'METADATA_UNAVAILABLE');
 for(const [name,digest]of expected)assert.equal(h(readFileSync(join(directory,name))),digest);
});

test('canonical daily producer records exact public source bytes and replay compares current metadata',t=>{
 const root=mkdtempSync(join(tmpdir(),'daily-maint-producer-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 for(const path of Object.values(paths)){const dest=join(root,path);mkdirSync(join(dest,'..'),{recursive:true});cpSync(join(ROOT,path),dest)}
 mkdirSync(join(root,'public/reports/daily-signal'),{recursive:true});
 writeFileSync(join(root,'public/regulatory-clock.json'),JSON.stringify({events:[]}));
 const first=buildSignal(['--as-of','2026-11-07'],root);assert.equal(first.maintenance_metadata.sources.board.state,'PROJECTED');
 assert.equal(first.maintenance_metadata.sources.board.bytes_sha256,h(readFileSync(join(root,paths.board))));
 assert.equal(first.maintenance_metadata.sources.board.metadata.last_measurement_declared_at,'2026-08-19T09:24:39.174226+00:00');
 const second=buildSignal(['--as-of','2026-11-08'],root);assert.equal(second.maintenance_metadata.semantic_snapshot_id,first.maintenance_metadata.semantic_snapshot_id);
 const product=buildProduct(join(root,'public/reports/daily-signal'));
 assert.equal(product.index.maintenance_metadata.comparison.state,'UNCHANGED');assert.deepEqual(product.index.maintenance_metadata.comparison.recheck_candidates,[]);
 assert.match(product.files.get('latest.md'),/Maintenance metadata/);assert.match(product.files.get('index.html'),/Rights UNKNOWN/);
});


test('declared dates reject rollover and qualify future dates without calling them fresh',()=>{
 const b=board();b.as_of='2026-11-07T24:00:00Z';const invalid=projection(b);
 assert.equal(invalid.sources.board.metadata.last_measurement_declared_at,null);
 b.as_of='2026-11-08T01:00:00Z';const future=projection(b);
 assert.equal(future.sources.board.declared_date_check.state,'FUTURE_SOURCE_DECLARATION');
 assert.equal(future.sources.board.declared_date_check.freshness,'NOT_ASSESSED');
 const next=projectMaintenanceMetadata({board:b,claims:claims(),generatedFrom:{board:{path:paths.board,state:'READ',sha256:'a'.repeat(64)},claims:{path:paths.claims,state:'READ',sha256:'b'.repeat(64)}},asOf:'2026-11-09'});
 assert.equal(next.sources.board.declared_date_check.state,'NOT_AFTER_REPORT_DAY');
 assert.equal(future.sources.board.semantic_sha256,next.sources.board.semantic_sha256);
 const tampered=projection();tampered.grants_authority=true;assert.equal(maintenanceView(report(tampered)).snapshot,null);
});

test('metadata source reads reject oversized files and links before parsing',t=>{
 const root=mkdtempSync(join(tmpdir(),'daily-maint-bounds-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const file=join(root,'input.json');writeFileSync(file,'x'.repeat(4*1024*1024+1));assert.throws(()=>readMetadataSourceBytes(file),/4 MiB/);
 const target=join(root,'target.json');writeFileSync(target,'{}');const link=join(root,'link.json');symlinkSync(target,link);assert.throws(()=>readMetadataSourceBytes(link));
 assert.equal(readMetadataSourceBytes(target).toString(),'{}');
});


test('rehashed malicious projections cannot add text, date spoofing or authority to the index',()=>{
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const digest=v=>h(JSON.stringify(canonical(v)));
 const mutations=[
  m=>m.sources.board.metadata.source_schema='other',
  m=>m.sources.board.metadata.measurement_time_basis='authenticated',
  m=>m.sources.board.metadata.last_measurement_declared_at='[bad](javascript:run())',
  m=>m.sources.board.metadata.axes[0].last_measurement_declared_at='2026-11-07T24:00:00Z',
  m=>m.sources.board.metadata.axes.push({...m.sources.board.metadata.axes[0]}),
  m=>m.sources.board.metadata.axes.push(null),
  m=>m.sources.board.metadata.counts.private_field=2,
  m=>m.sources.board.metadata.private_text='DO_NOT_COPY',
  m=>m.sources.claims.metadata.latest_subject_read_declared_at='bad',
  m=>m.sources.claims.metadata.claim_states.CERTIFIED=1,
 ];
 for(const mutate of mutations){const m=projection();mutate(m);for(const v of Object.values(m.sources))v.semantic_sha256=digest(v.metadata);m.semantic_snapshot_id=digest(Object.fromEntries(Object.entries(m.sources).map(([k,v])=>[k,{state:v.state,semantic_sha256:v.semantic_sha256}])));assert.equal(maintenanceView(report(m)).snapshot,null);}
});


test('containing report date binds future warnings and each axis date is checked',()=>{
 const m=projection(),future=board();future.axes[0].as_of='2026-11-08T00:00:00Z';
 assert.equal(projection(future).sources.board.declared_date_check.state,'FUTURE_SOURCE_DECLARATION');
 assert.equal(maintenanceView({...report(m),as_of:'2099-01-01'}).snapshot,null);
 m.sources.board.declared_date_check.as_of_report_day='2099-01-01';assert.equal(maintenanceView(report(m)).snapshot,null);
});

test('unprojected parsed-content changes require review despite unchanged selected metadata',()=>{
 const b=board(),old=report(projection(b));b.unprojected_public_claim='changed public assertion';
 const current=report(projection(b));const comparison=compareMaintenance(current,old);
 assert.equal(comparison.state,'SOURCE_CONTENT_CHANGED_METADATA_UNCHANGED');assert.deepEqual(comparison.semantic_changed_roles,[]);
 assert.deepEqual(comparison.parsed_content_changed_roles,['board']);assert.equal(comparison.recheck_candidates[0].reason,'SOURCE_CONTENT_CHANGED_SCOPE_REVIEW_REQUIRED');
 assert.deepEqual(compareMaintenance(current,current).recheck_candidates,[]);
});
