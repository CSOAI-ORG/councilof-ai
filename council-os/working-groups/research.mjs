/** Evidence usability checks, not a truth oracle, grader or authority service. */
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0,10) === value;
const text = value => typeof value === 'string' && value.trim().length > 0;
const statuses = ['source-reported','observed','unsupported','superseded'];
export function validateResearchPack(pack) {
  const fail = message => { throw Error('Invalid research evidence pack: '+message); };
  if (pack?.schema !== 'csoai.research-evidence-pack/1' || !/^[a-z][a-z0-9-]+$/.test(pack.id)) fail('schema or id');
  if (!Number.isSafeInteger(pack.version) || pack.version < 1 || !text(pack.title) || !text(pack.scope)) fail('identity');
  if (!date(pack.asOf) || !date(pack.reviewAfter) || pack.reviewAfter < pack.asOf) fail('review dates');
  if (pack.status !== 'research-candidate' || pack.authorityGranted !== false || pack.partnershipEstablished !== false || pack.sourceContentLicenceGranted !== false || pack.externalAcceptance !== null) fail('unsupported authority or acceptance');
  if (![pack.sources,pack.claims,pack.crosswalk,pack.opportunities].every(Array.isArray)) fail('collections');
  const sources = new Map();
  for (const s of pack.sources) {
    if (!/^S\d{2,4}$/.test(s.id) || sources.has(s.id)) fail('duplicate or invalid source');
    sources.set(s.id,s);
    let u; try {u=new URL(s.url);} catch {fail('source URL');}
    if (u.protocol !== 'https:' || u.username || u.password || ['chatgpt.com','localhost'].includes(u.hostname) || /^\d+(\.\d+){3}$/.test(u.hostname)) fail('public HTTPS source required');
    if (![s.title,s.kind,s.coverage,s.rights,s.authority,s.legalStatus,s.reviewMethod].every(text) || !date(s.checked) || s.checked > pack.asOf || !['reviewed','partial'].includes(s.access)) fail('source provenance');
    // These are source-review summaries, not downloaded byte captures.
    if (s.sourceBytesSha256 !== null) fail('source byte capture not established');
  }
  const refs = xs => Array.isArray(xs) && xs.every(id => sources.has(id)) && new Set(xs).size === xs.length;
  const claims = new Map();
  for (const c of pack.claims) {
    if (!/^CL\d{2,4}$/.test(c.id) || claims.has(c.id)) fail('duplicate or invalid claim');
    claims.set(c.id,c);
    if (!statuses.includes(c.status) || ![c.title,c.statement,c.scope,c.limitations,c.use].every(text) || !refs(c.sourceIds)) fail('claim fields');
    if (!date(c.observedOn) || !date(c.reviewAfter) || c.observedOn > pack.asOf || c.reviewAfter < c.observedOn) fail('claim dates');
    if (c.humanReview !== null) fail('human review not established');
    if (!Array.isArray(c.history) || !c.history.length || c.history.some((h,i)=>h.version!==i+1 || !date(h.date) || !text(h.event))) fail('history');
    if (!Array.isArray(c.artifacts) || c.artifacts.some(a=>!/^evidence\/research\/controlai\/[a-zA-Z0-9_.-]+$/.test(a.path) || !/^[a-f0-9]{64}$/.test(a.sha256))) fail('artifact identity');
    if (c.status === 'source-reported' && !c.sourceIds.length) fail('missing supporting sources');
    if (c.status === 'observed' && (!c.artifacts.length || !text(c.runtime?.model) || !text(c.runtime?.environment) || !text(c.runtime?.method) || !Array.isArray(c.runtime?.tools) || !c.runtime.tools.length || !Array.isArray(c.runtime?.permissions) || !c.runtime.permissions.length)) fail('runtime observation evidence');
    if (c.use === 'synthetic-negative-control' && c.synthetic !== true) fail('synthetic label required');
    if (c.use === 'policy-status' && !c.sourceIds.some(id=>sources.get(id).authority==='official-legislative-record')) fail('policy status requires official record');
  }
  for (const c of pack.claims) {
    if (c.status === 'superseded' && (!claims.has(c.supersededBy) || claims.get(c.supersededBy).supersedes !== c.id)) fail('correction link');
    if (c.supersedes && (!claims.has(c.supersedes) || claims.get(c.supersedes).supersededBy !== c.id)) fail('reverse correction link');
  }
  const ids = new Set();
  for (const row of pack.crosswalk) {
    if (!/^C\d{2,4}$/.test(row.id) || ids.has(row.id) || !refs(row.sourceIds) || !row.sourceIds.length || row.status !== 'UNTESTED_PROPOSAL' || ![row.source_hook,row.destination,row.proposed_evidence,row.acceptance,row.groupId,row.implementationStatus].every(text)) fail('crosswalk');
    ids.add(row.id);
  }
  ids.clear();
  for (const row of pack.opportunities) {
    if (!/^W\d{2,4}$/.test(row.id) || ids.has(row.id) || !refs(row.evidence) || ![row.name,row.status,row.proposal,row.gate].every(text)) fail('opportunity');
    ids.add(row.id);
  }
  return pack;
}
export function assessClaim(pack, id, {asOf, runtime} = {}) {
  validateResearchPack(pack);
  if (!date(asOf)) throw Error('An explicit valid asOf date is required.');
  const claim=pack.claims.find(c=>c.id===id);
  if (!claim) throw Error('Unknown claim.');
  let outcome='READY_FOR_HUMAN_REVIEW';
  const reasons=[];
  if (claim.synthetic) { outcome='SYNTHETIC_FIXTURE'; reasons.push('Never treat this record as real-world evidence.'); }
  else if (claim.status==='unsupported') {outcome='NEEDS_EVIDENCE'; reasons.push('No supported observation is established.');}
  else if (claim.status==='superseded') {outcome='SUPERSEDED'; reasons.push('Use correction '+claim.supersededBy+'; retain the old record.');}
  else if (asOf < claim.observedOn || asOf < pack.asOf) {outcome='OUTSIDE_OBSERVATION_WINDOW'; reasons.push('This record cannot establish an earlier observation.');}
  else if (asOf >= claim.reviewAfter || asOf >= pack.reviewAfter) {outcome='RECHECK_REQUIRED'; reasons.push('The dated review interval has ended.');}
  else if (runtime && JSON.stringify(runtime)!==JSON.stringify(claim.runtime)) {outcome='SCOPE_MISMATCH'; reasons.push('Model, tools, permissions, environment or method differ from the observation.');}
  if (claim.sourceIds.some(id=>pack.sources.find(s=>s.id===id).access==='partial')) reasons.push('At least one source has partial access.');
  reasons.push('Usability check only: no truth verification, certification, human acceptance or execution permission.');
  return {id,outcome,asOf,reasons,limitations:claim.limitations,authorityGranted:false};
}
