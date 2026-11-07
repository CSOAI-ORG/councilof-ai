// Derived metadata in the existing daily report. No network, private input,
// canonical event, signer, scheduler, decision or model invocation.
import {createHash} from 'node:crypto';
import {constants,openSync,readSync,fstatSync,closeSync} from 'node:fs';

const PATHS = {board:'public/signed/card-matrix.json', claims:'public/spec/claim-maintenance/register.json'};
const HASH = /^[a-f0-9]{64}$/;
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const integer = v => Number.isSafeInteger(v) && v >= 0;
const ordered = v => Array.isArray(v) ? v.map(ordered) : object(v) ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])) : v;
const encode = v => JSON.stringify(ordered(v));
const hash = v => createHash('sha256').update(typeof v === 'string' ? v : encode(v)).digest('hex');
const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10) === v.slice(0,10);
const numeric = (value, keys) => Object.fromEntries(keys.filter(k=>integer(value?.[k])).map(k=>[k,value[k]]));
const states = ['CLAIM_CAPTURED','CLAIM_MEASURED','UNMEASURED','UNCHECKABLE'];
const BOARD_COUNTS=['cards_read','cells','models','models_third_party','models_own','models_own_unconfirmed','cells_third_party','zero_not_quotable','axes','signed_cells','possible_cells','skipped_cards'];
const CLAIM_COUNTS=['registries','registry_files_on_disk','registries_superseded','subjects','claims','scheduled_checks','scheduled_checks_after_as_of','scheduled_checks_on_or_before_as_of','subjects_with_a_scheduled_next_read','subjects_with_due_execution_unverified','subjects_with_a_completed_scheduled_read','subjects_with_a_retry_required'];
const AXIS_COUNTS=['cards','models','models_third_party','models_own','zero_not_quotable'];
const SUBJECT_STATES=['COMPLETED','DUE_EXECUTION_UNVERIFIED','RETRY_REQUIRED','SCHEDULED','NOT_DUE','UNKNOWN_OR_UNRECOGNISED'];
const keys=(v,allowed)=>object(v)&&Object.keys(v).every(k=>allowed.includes(k));
const counts=(v,allowed)=>keys(v,allowed)&&Object.values(v).every(integer);
const maybeDate=v=>v===null||date(v);
const limits = [
  'Derived, unsigned metadata from two already-public committed sources; not a new measurement or a source re-read.',
  'Semantic comparison covers only the named metadata fields. Unchanged metadata does not mean unchanged source claims or safe operation.',
  'Rights and reuse permission are UNKNOWN. Publication, a digest or a review candidate grants no execution or training authority.',
  'Source dates and scheduled-read states are publisher declarations, not independently authenticated outcomes.',
];

// Bound reads before allocation/parsing. A growing file still cannot exceed the
// sentinel buffer; links/FIFOs cannot redirect or block this source inspection.
export function readMetadataSourceBytes(file) {
  let fd;
  try {
    if (!Number.isInteger(constants.O_NOFOLLOW) || !Number.isInteger(constants.O_NONBLOCK)) throw Error('Metadata source open is unsupported.');
    fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
    const stat=fstatSync(fd), cap=4*1024*1024;
    if (!stat.isFile() || stat.size>cap) throw Error('Metadata source must be a regular file of at most 4 MiB.');
    const held=Buffer.alloc(cap+1);let size=0;
    while(size<=cap){const n=readSync(fd,held,size,cap+1-size,size);if(!n)break;size+=n;}
    if(size>cap)throw Error('Metadata source exceeds 4 MiB.');
    return held.subarray(0,size);
  } finally {if(fd!==undefined)closeSync(fd);}
}

function boardMetadata(value) {
  if (!object(value) || value.schema !== 'csoai.card-matrix/1' || !object(value.counts) ||
      !Array.isArray(value.axes) || value.axes.length > 500) return null;
  const axes = [];
  for (const row of value.axes) {
    if (!object(row) || typeof row.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(row.id)) return null;
    axes.push({id:row.id, ...numeric(row,AXIS_COUNTS),
      last_measurement_declared_at:date(row.as_of) ? row.as_of : null});
  }
  if (new Set(axes.map(a=>a.id)).size !== axes.length || (integer(value.counts.axes) && value.counts.axes!==axes.length)) return null;
  return {source_schema:value.schema, kind:'BENCHMARK_CARD_CORPUS_NOT_GOVERNANCE_BOARD',
    last_measurement_declared_at:date(value.as_of) ? value.as_of : null,
    measurement_time_basis:'CARD_CORPUS_AS_OF_DECLARATION',
    counts:numeric(value.counts,BOARD_COUNTS),
    axes:axes.sort((a,b)=>a.id.localeCompare(b.id))};
}

function claimsMetadata(value) {
  if (!object(value) || value.schema !== 'csoai.claim-maintenance.register/0.1' || !object(value.totals) ||
      !Array.isArray(value.subjects) || value.subjects.length > 5000) return null;
  if (integer(value.totals.subjects) && value.totals.subjects!==value.subjects.length) return null;
  const reads = [], checks = [], observedStates = {};
  for (const row of value.subjects) {
    if (!object(row)) return null;
    if (date(row.last_read)) reads.push(row.last_read);
    if (date(row.next_scheduled_read_evidence?.checked_at)) checks.push(row.next_scheduled_read_evidence.checked_at);
    const status = ['COMPLETED','DUE_EXECUTION_UNVERIFIED','RETRY_REQUIRED','SCHEDULED','NOT_DUE'].includes(row.next_scheduled_read_state)
      ? row.next_scheduled_read_state : 'UNKNOWN_OR_UNRECOGNISED';
    observedStates[status] = (observedStates[status] || 0) + 1;
  }
  const newest = values => values.sort((a,b)=>Date.parse(a)-Date.parse(b)).at(-1) ?? null;
  return {source_schema:value.schema, kind:'PUBLIC_CLAIM_REGISTER_METADATA',
    register_as_of_declared:date(value.as_of) ? value.as_of : null,
    last_measurement_declared_at:null, measurement_time_basis:'NOT_SUPPLIED_BY_REGISTER',
    latest_subject_read_declared_at:newest(reads), latest_scheduled_read_declared_at:newest(checks),
    counts:numeric(value.totals,CLAIM_COUNTS),
    claim_states:numeric(value.totals.by_state,states), scheduled_subject_states:ordered(observedStates)};
}

function dateCheck(metadata,asOf) {
  const day=typeof asOf==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(asOf)&&date(asOf+'T00:00:00Z') ? asOf : null;
  const dates=metadata ? ['last_measurement_declared_at','register_as_of_declared','latest_subject_read_declared_at','latest_scheduled_read_declared_at']
    .map(k=>metadata[k]).concat(Array.isArray(metadata.axes)?metadata.axes.map(a=>a?.last_measurement_declared_at):[]).filter(date) : [];
  return {as_of_report_day:day,state:!day?'NOT_ASSESSED':!dates.length?'NO_DATE_DECLARED':
    dates.some(v=>Date.parse(v)>=Date.parse(day+'T00:00:00Z')+86400000)?'FUTURE_SOURCE_DECLARATION':'NOT_AFTER_REPORT_DAY',
    freshness:'NOT_ASSESSED'};
}

export function projectMaintenanceMetadata({board, claims, generatedFrom = {}, asOf = null}) {
  const sources = {};
  for (const [role, input, project] of [['board',board,boardMetadata],['claims',claims,claimsMetadata]]) {
    const ref = generatedFrom[role];
    const qualified = ref?.state === 'READ' && ref.path === PATHS[role] && HASH.test(ref.sha256 || '');
    const metadata = qualified ? project(input) : null;
    sources[role] = {path:PATHS[role], bytes_sha256:qualified ? ref.sha256 : null,
      parsed_content_sha256:qualified && input!==undefined ? hash(input) : null,
      state:metadata ? 'PROJECTED' : 'UNAVAILABLE', semantic_sha256:metadata ? hash(metadata) : null,
      metadata, declared_date_check:dateCheck(metadata,asOf), rights:'UNKNOWN', issuer_verification:'NOT_PERFORMED'};
  }
  return {projection_version:'0.1', sources,
    semantic_snapshot_id:hash(Object.fromEntries(Object.entries(sources).map(([role,s])=>[role,{state:s.state,semantic_sha256:s.semantic_sha256}]))),
    canonical_event_created:false, grants_authority:false, execution_allowed:false, model_training:false, limitations:limits};
}

function validProjection(value, reportDay) {
  if (!keys(value,['projection_version','sources','semantic_snapshot_id','canonical_event_created','grants_authority','execution_allowed','model_training','limitations']) ||
      value.projection_version !== '0.1' || !keys(value.sources,Object.keys(PATHS)) || Object.keys(value.sources).length!==2 ||
      value.canonical_event_created!==false || value.grants_authority!==false || value.execution_allowed!==false || value.model_training!==false ||
      !Array.isArray(value.limitations) || encode(value.limitations)!==encode(limits)) return false;
  for (const role of Object.keys(PATHS)) {
    const source=value.sources[role];
    if (!keys(source,['path','bytes_sha256','parsed_content_sha256','state','semantic_sha256','metadata','declared_date_check','rights','issuer_verification']) || source.path !== PATHS[role] ||
        !['PROJECTED','UNAVAILABLE'].includes(source.state) || source.rights!=='UNKNOWN' || source.issuer_verification!=='NOT_PERFORMED') return false;
    if (!object(source.declared_date_check) || encode(source.declared_date_check)!==encode(dateCheck(source.metadata,reportDay))) return false;
    if (source.bytes_sha256!==null && (!HASH.test(source.bytes_sha256||'') || (source.parsed_content_sha256!==null && !HASH.test(source.parsed_content_sha256||'')))) return false;
    if (source.state==='PROJECTED' && !HASH.test(source.parsed_content_sha256||'')) return false;
    if (source.bytes_sha256===null && source.parsed_content_sha256!==null) return false;
    if (source.state==='PROJECTED') {
      const m=source.metadata;
      const allowed=role==='board' ? ['source_schema','kind','last_measurement_declared_at','measurement_time_basis','counts','axes']
        : ['source_schema','kind','register_as_of_declared','last_measurement_declared_at','measurement_time_basis','latest_subject_read_declared_at','latest_scheduled_read_declared_at','counts','claim_states','scheduled_subject_states'];
      if (!keys(m,allowed) || !counts(m.counts,role==='board'?BOARD_COUNTS:CLAIM_COUNTS)) return false;
      if (role==='board' && (m.source_schema!=='csoai.card-matrix/1' || m.measurement_time_basis!=='CARD_CORPUS_AS_OF_DECLARATION' || !maybeDate(m.last_measurement_declared_at))) return false;
      if (role==='claims' && (m.source_schema!=='csoai.claim-maintenance.register/0.1' || m.measurement_time_basis!=='NOT_SUPPLIED_BY_REGISTER' ||
          !['register_as_of_declared','latest_subject_read_declared_at','latest_scheduled_read_declared_at'].every(k=>maybeDate(m[k])))) return false;
      if (role==='board' && (m.kind!=='BENCHMARK_CARD_CORPUS_NOT_GOVERNANCE_BOARD' || !Array.isArray(m.axes) || m.axes.length>500 ||
          m.axes.some(a=>!keys(a,['id','cards','models','models_third_party','models_own','zero_not_quotable','last_measurement_declared_at']) ||
            typeof a.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(a.id)||!maybeDate(a.last_measurement_declared_at)||Object.entries(a).some(([k,v])=>!['id','last_measurement_declared_at'].includes(k)&&!integer(v))))) return false;
      if (role==='board' && new Set(m.axes.map(a=>a.id)).size!==m.axes.length) return false;
      if (role==='claims' && (m.kind!=='PUBLIC_CLAIM_REGISTER_METADATA' || m.last_measurement_declared_at!==null ||
          !counts(m.claim_states,states) || !counts(m.scheduled_subject_states,SUBJECT_STATES))) return false;
    }
    if (source.state === 'PROJECTED' && (!HASH.test(source.bytes_sha256||'') || !object(source.metadata) || source.semantic_sha256 !== hash(source.metadata))) return false;
    if (source.state === 'UNAVAILABLE' && (source.metadata !== null || source.semantic_sha256 !== null)) return false;
  }
  const expected=hash(Object.fromEntries(Object.entries(value.sources).map(([role,s])=>[role,{state:s.state,semantic_sha256:s.semantic_sha256}])));
  return value.semantic_snapshot_id === expected;
}

export function compareMaintenance(currentReport, previousReport = null) {
  const current=currentReport?.maintenance_metadata, previous=previousReport?.maintenance_metadata;
  const unavailable={state:'METADATA_UNAVAILABLE', semantic_snapshot_id:null, previous_semantic_snapshot_id:null,
    byte_changed_roles:null, parsed_content_changed_roles:null, semantic_changed_roles:null, recheck_candidates:[], scope:limits[1]};
  if (!validProjection(current,currentReport?.as_of)) return unavailable;
  if (!validProjection(previous,previousReport?.as_of)) return {...unavailable,state:'BASELINE_ONLY',semantic_snapshot_id:current.semantic_snapshot_id};
  const byteChanged=Object.keys(PATHS).filter(role=>current.sources[role].bytes_sha256 !== previous.sources[role].bytes_sha256);
  const contentChanged=Object.keys(PATHS).filter(role=>current.sources[role].parsed_content_sha256 !== previous.sources[role].parsed_content_sha256);
  const semanticChanged=Object.keys(PATHS).filter(role=>current.sources[role].state !== previous.sources[role].state || current.sources[role].semantic_sha256 !== previous.sources[role].semantic_sha256);
  const candidates=[...new Set([...semanticChanged,...contentChanged])].sort().map(role=>{
    const from=previous.sources[role],to=current.sources[role];
    const identity={role,previous_semantic_sha256:from.semantic_sha256,current_semantic_sha256:to.semantic_sha256,
      previous_parsed_content_sha256:from.parsed_content_sha256,current_parsed_content_sha256:to.parsed_content_sha256,
      reason:to.state==='UNAVAILABLE'?'SOURCE_METADATA_UNAVAILABLE':semanticChanged.includes(role)?'SOURCE_METADATA_CHANGED_REVIEW_REQUIRED':'SOURCE_CONTENT_CHANGED_SCOPE_REVIEW_REQUIRED'};
    return {id:hash(identity),...identity,source_path:PATHS[role],previous_bytes_sha256:from.bytes_sha256,
      current_bytes_sha256:to.bytes_sha256,state:'PENDING_SOURCE_REVIEW',
      next_step:to.state==='UNAVAILABLE'?'Recheck the allowed source and its input contract; preserve unknown.':'Inspect the exact source versions and affected dependencies; a metadata change does not establish a factual or legal change.',
      independently_verified:false, rights:'UNKNOWN', grants_authority:false, execution_allowed:false};
  });
  return {state:semanticChanged.length?'METADATA_CHANGED':contentChanged.length?'SOURCE_CONTENT_CHANGED_METADATA_UNCHANGED':byteChanged.length?'BYTES_CHANGED_METADATA_UNCHANGED':'UNCHANGED',
    semantic_snapshot_id:current.semantic_snapshot_id,previous_semantic_snapshot_id:previous.semantic_snapshot_id,
    byte_changed_roles:byteChanged,parsed_content_changed_roles:contentChanged,semantic_changed_roles:semanticChanged,recheck_candidates:candidates,scope:limits[1]};
}

export function maintenanceView(report, previousReport) {
  const comparison=compareMaintenance(report,previousReport);
  return {comparison, snapshot:validProjection(report?.maintenance_metadata,report?.as_of) ? report.maintenance_metadata : null};
}
