#!/usr/bin/env node
/** Additive-only KV binding reconciliation for the Cloudflare Pages project.
 *
 * WHY THIS EXISTS. The read-only preflight (scripts/review/pages-release-target.mjs)
 * requires the production project's binding set to match the reviewed candidate
 * exactly. That makes a legitimate ADDITION impossible: the deploy that would
 * apply a newly declared binding is blocked by the absence of that binding, and
 * every master deploy fails until the remote project already carries it.
 *
 * WHAT THIS DOES. It may only ADD a binding that the reviewed candidate declares
 * and the production config lacks. It never changes an existing binding's
 * namespace id, never removes a binding, and never touches the preview config.
 *
 * WHAT THIS DOES NOT DO. It does not relax the preflight. Every check the
 * preflight made still stands: a binding whose id drifted, a binding the remote
 * carries and the candidate does not declare, a removed binding, project, branch,
 * compatibility or plaintext drift all still block the deploy. This step only
 * makes the one legitimate difference — a declared binding that is not yet
 * applied — expressible. It is additive, idempotent, and fails closed.
 *
 * HOW A NAMESPACE IS PROVEN TO EXIST. Before an id is bound, the account's own KV
 * namespace list must show it. There are two ways to get that list, and the output
 * always names which one was used, so no reader is ever told a live read happened
 * when it did not:
 *   1. live_account_list — an authenticated read of the account's namespace list.
 *      The deploy's Cloudflare credential is expected to make it.
 *   2. pinned_provenance — the committed receipt of an earlier authenticated read
 *      (scripts/review/kv-namespace-provenance.json). Consulted only when no
 *      credential in the run can read the list, only when the receipt names this
 *      account, and only when it covers every id the candidate declares.
 * If neither can confirm an id, nothing is bound and the step fails closed.
 *
 * Additive only. Fail closed. Never prints a namespace id.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v:null;
const finiteHex=v=>typeof v==='string'&&/^[a-f0-9]{32}$/i.test(v);
const BINDING_NAME=/^[A-Z][A-Z0-9_]*$/;
const PROJECT='councilof-ai';

const remoteBindings=project=>object(object(project?.deployment_configs)?.production)?.kv_namespaces||null;

/** Pure plan. Names only — a namespace id never enters the result. */
export function planBindingAdditions(candidate,project){
  const c=object(candidate);
  const declared=Array.isArray(c?.kv_namespaces)?c.kv_namespaces:[];
  const remote=remoteBindings(project);
  if(!remote)throw Error('REMOTE_PRODUCTION_CONFIG_UNREADABLE');
  const seen=new Set(),additions=[],conflicts=[];
  for(const entry of declared){
    const e=object(entry),name=e?.binding;
    if(typeof name!=='string'||!BINDING_NAME.test(name))throw Error('CANDIDATE_BINDING_NAME_INVALID');
    if(!finiteHex(e?.id))throw Error('CANDIDATE_BINDING_ID_INVALID');
    if(seen.has(name))throw Error('CANDIDATE_BINDING_DUPLICATE');
    seen.add(name);
    const current=object(remote[name]);
    if(!current)additions.push({name});
    else if(current.namespace_id!==e.id)conflicts.push(name);
  }
  return {additions,conflicts,extraRemote:Object.keys(remote).filter(n=>!seen.has(n)),candidateNames:[...seen],remoteNames:Object.keys(remote)};
}

export async function readNamedProject({accountId,token,fetcher=fetch}){
  if(!finiteHex(accountId)||typeof token!=='string'||token.length<12)throw Error('CF_PROJECT_READ_CREDENTIALS_REQUIRED');
  const endpoint='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects/'+PROJECT;
  const response=await fetcher(endpoint,{method:'GET',headers:{authorization:'Bearer '+token,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('CF_PROJECT_READ_HTTP_'+response.status);
  const reader=response.body?.getReader();if(!reader)throw Error('CF_PROJECT_READ_NO_BODY');
  const parts=[];let n=0;
  try{while(true){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>2_000_000){await reader.cancel();throw Error('CF_PROJECT_READ_SIZE_LIMIT');}parts.push(r.value);}}finally{reader.releaseLock();}
  const raw=Buffer.concat(parts.map(p=>Buffer.from(p)));let doc;try{doc=JSON.parse(raw);}catch{throw Error('CF_PROJECT_READ_NOT_JSON');}
  if(doc?.success!==true||!object(doc.result))throw Error('CF_PROJECT_READ_UNCONFIRMED');
  return doc.result;
}

/** Every KV namespace id this account owns. Proves a declared id is real and is ours.
 *
 * A namespace list that cannot be read is UNKNOWN, not an empty list of known ids.
 * Treating "unknown" as "every id is fine" would let a typo straight through into
 * production, which is the one thing this step exists to prevent.
 */
export async function readAccountNamespaceIds({accountId,token,fetcher=fetch}){
  if(!finiteHex(accountId)||typeof token!=='string'||token.length<12)throw Error('CF_NAMESPACE_READ_CREDENTIALS_REQUIRED');
  const endpoint='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/storage/kv/namespaces';
  const response=await fetcher(endpoint,{method:'GET',headers:{authorization:'Bearer '+token,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('CF_NAMESPACE_READ_HTTP_'+response.status);
  const doc=await response.json();
  if(doc?.success!==true||!Array.isArray(doc.result))throw Error('CF_NAMESPACE_READ_UNCONFIRMED');
  return doc.result.map(n=>n?.id).filter(finiteHex);
}

/** The committed receipt of an earlier authenticated read of the account's namespace list.
 *
 * It exists because the deploy's own Cloudflare credential can read Pages but cannot
 * read Workers KV (the list read is refused with an authentication error). Without a
 * second way to prove a namespace id, every deploy would stop at this step forever.
 * It is a receipt, not a capability: it proves what was OBSERVED at observed_at, and
 * the output always says which proof was used so a reader is never misled.
 */
export function readProvenanceReceipt(path){
  let raw;try{raw=fs.readFileSync(path,'utf8');}catch{return null;}
  let doc;try{doc=JSON.parse(raw);}catch{return null;}
  const p=object(doc);
  if(p?.schema!=='csoai.kv-namespace-provenance/0.1')return null;
  if(!finiteHex(p.account_id))return null;
  const namespaces=object(p.namespaces);
  if(!namespaces)return null;
  const ids=[];
  for(const [name,value] of Object.entries(namespaces)){
    const v=object(value);
    if(typeof name!=='string'||!BINDING_NAME.test(name))return null;
    if(!finiteHex(v?.id))return null;
    ids.push(v.id);
  }
  return {accountId:p.account_id,observedAt:typeof p.observed_at==='string'?p.observed_at:null,ids};
}

/** Does the pinned receipt prove every id this step is about to bind, on THIS account?
 *
 * Three ways it can say no: no receipt at all, a receipt for another account, or a
 * receipt that does not cover every id the candidate declares. Each is a refusal.
 */
export function checkProvenance({provenance,accountId,wantedIds}){
  const p=object(provenance);
  if(!p)return {ok:false,reason:'PROVENANCE_ABSENT'};
  if(p.accountId!==accountId)return {ok:false,reason:'PROVENANCE_ACCOUNT_MISMATCH'};
  const owned=new Set(p.ids);
  const missing=(Array.isArray(wantedIds)?wantedIds:[]).filter(id=>!owned.has(id));
  if(missing.length)return {ok:false,reason:'PROVENANCE_MISSING_NAMESPACE',missing:missing.length};
  return {ok:true,observedAt:p.observedAt??null};
}

export async function applyBindingAdditions({candidate,project,accountId,token,fetcher=fetch,accountNamespaceIds,kvReadTokens=[],provenance=null,report=false}){
  const c=object(candidate);
  if(c?.name!==PROJECT)throw Error('TARGET_PROJECT_MISMATCH');
  if(project?.name!==PROJECT)throw Error('TARGET_PROJECT_MISMATCH');
  if(project?.production_branch!=='master')throw Error('TARGET_BRANCH_MISMATCH');
  const plan=planBindingAdditions(c,project);
  const remote=remoteBindings(project);
  const summary={schema:'csoai.pages-binding-additions/0.1',state:'NO_CHANGE',changed:false,added:[],refused:[],conflicts:plan.conflicts,extra_remote:plan.extraRemote,readback:'NOT_REQUIRED',proof:null};
  // A remote that already diverges from the reviewed candidate is left exactly as it is:
  // that divergence is the preflight's to judge, not this step's to paper over.
  if(plan.conflicts.length||plan.extraRemote.length)return summary;
  if(!plan.additions.length)return summary;

  const declared=Array.isArray(c.kv_namespaces)?c.kv_namespaces:[];
  const wanted=new Map(declared.map(e=>[e.binding,e.id]));

  // Prove the namespace exists on THIS account before it is bound to production. A
  // namespace from another account, or a typo, would otherwise be published as a
  // binding that can never be read.
  //
  // TWO PROOFS, IN ORDER, AND THE OUTPUT ALWAYS SAYS WHICH ONE WAS USED:
  //   1. live_account_list - an authenticated read of the account's KV namespace list.
  //      The strongest proof, and the one the deploy's own credential is expected to
  //      make. When it succeeds nothing else is consulted.
  //   2. pinned_provenance - the committed receipt of an earlier authenticated read
  //      (scripts/review/kv-namespace-provenance.json). Used ONLY when no credential
  //      in this run can read the list, and only when it names THIS account and
  //      covers every id the candidate declares.
  // A namespace list that cannot be read is UNKNOWN, not an empty list of known ids.
  // Treating "unknown" as "every id is fine" would let a typo straight through into
  // production, which is the one thing this step exists to prevent.
  const declaredIds=[...new Set(declared.map(e=>e.id))];
  const wantedIds=[...new Set(plan.additions.map(a=>wanted.get(a.name)))];
  let ids=accountNamespaceIds, proof=null;
  const attempts=[];
  if(ids===undefined){
    const tokens=[token,...(Array.isArray(kvReadTokens)?kvReadTokens:[])].filter(t=>typeof t==='string'&&t.length>=12);
    for(const [i,t] of tokens.entries()){
      try{
        ids=await readAccountNamespaceIds({accountId,token:t,fetcher});
        proof={tier:'live_account_list',source:'account namespace list read (credential '+(i+1)+' of '+tokens.length+')',observed_at:null};
        break;
      }catch(error){attempts.push('credential_'+(i+1)+':'+String(error?.message||'UNREADABLE'));}
    }
  }else{
    proof={tier:'live_account_list',source:'account namespace list read (supplied by the caller)',observed_at:null};
  }
  if(!proof){
    const checked=checkProvenance({provenance,accountId,wantedIds:declaredIds});
    if(checked.ok){
      ids=[...provenance.ids];
      proof={tier:'pinned_provenance',source:'committed receipt scripts/review/kv-namespace-provenance.json',observed_at:provenance.observedAt??null};
    }else{
      attempts.push('provenance:'+checked.reason+(checked.missing?'('+checked.missing+' id(s) not covered)':''));
    }
  }
  summary.proof=proof;
  if(!Array.isArray(ids)){
    return {...summary,state:'UNCONFIRMED_NAMESPACE',refused:plan.additions.map(a=>a.name),proof_attempts:attempts,note:"the account's KV namespace list could not be read and no pinned receipt covers this account, so a declared namespace id cannot be confirmed; nothing was bound"};
  }
  const owned=new Set(ids);
  const unknown=plan.additions.filter(a=>!owned.has(wanted.get(a.name)));
  if(unknown.length){
    return {...summary,state:'UNKNOWN_NAMESPACE',refused:unknown.map(a=>a.name),note:'no KV namespace with this id exists on this account; nothing was bound'};
  }
  if(report)return {...summary,state:'WOULD_BIND',added:plan.additions.map(a=>a.name),note:'report-only: nothing was written'};

  // The PATCH carries the COMPLETE merged map. A partial map could drop a binding
  // that is live in production, so the remote entries are copied through untouched.
  const merged={};
  for(const [name,value] of Object.entries(remote))merged[name]={namespace_id:value.namespace_id};
  for(const {name} of plan.additions)merged[name]={namespace_id:wanted.get(name)};

  const endpoint='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects/'+PROJECT;
  const response=await fetcher(endpoint,{method:'PATCH',headers:{authorization:'Bearer '+token,'content-type':'application/json',accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000),body:JSON.stringify({deployment_configs:{production:{kv_namespaces:merged}}})});
  if(!response.ok){
    let codes=[];try{const body=await response.json();codes=(Array.isArray(body?.errors)?body.errors:[]).map(e=>e?.code).filter(c=>typeof c==='number');}catch{}
    throw Error('CF_PROJECT_PATCH_HTTP_'+response.status+(codes.length?'_CODES_'+codes.join('_'):''));
  }

  // Read back and prove the addition took and that nothing else moved.
  const after=await readNamedProject({accountId,token,fetcher});
  const now=remoteBindings(after);
  for(const {name} of plan.additions)if(object(now?.[name])?.namespace_id!==wanted.get(name))throw Error('READBACK_BINDING_NOT_APPLIED');
  for(const [name,value] of Object.entries(remote))if(object(now?.[name])?.namespace_id!==value.namespace_id)throw Error('READBACK_BINDING_CHANGED_OR_DROPPED');

  return {...summary,state:'BOUND',changed:true,added:plan.additions.map(a=>a.name),readback:'VERIFIED'};
}

async function main(){
  const args=process.argv.slice(2),value=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};
  const configPath=path.resolve(value('--config')??'wrangler.jsonc');
  const report=args.includes('--report');
  const ts=await import('typescript');
  const parsed=ts.readConfigFile(configPath,ts.sys.readFile);
  if(parsed.error)throw Error('CANDIDATE_CONFIG_PARSE_FAILED');
  const accountId=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
  // A second credential, if one is configured, is offered to the namespace-list read
  // only. The Pages read and the PATCH always use the deploy's own credential.
  const kvReadToken=(process.env.CLOUDFLARE_KV_READ_TOKEN??'').trim();
  const provenancePath=path.resolve(value('--provenance')??path.join(path.dirname(fileURLToPath(import.meta.url)),'kv-namespace-provenance.json'));
  const provenance=readProvenanceReceipt(provenancePath);
  const project=await readNamedProject({accountId,token});
  const result=await applyBindingAdditions({candidate:parsed.config,project,accountId,token,report,kvReadTokens:kvReadToken?[kvReadToken]:[],provenance});
  console.log(JSON.stringify(result,null,2));
  process.exitCode=(result.state==='BOUND'||result.state==='NO_CHANGE'||result.state==='WOULD_BIND')?0:2;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{
    console.error(JSON.stringify({schema:'csoai.pages-binding-additions/0.1',state:'BLOCKED',reason:/^CF_|^CANDIDATE_|^TARGET_|^REMOTE_|^READBACK_|^PROVENANCE_/.test(error.message)?error.message:'UNEXPECTED_FAILURE',changed:false}));
    process.exitCode=2;
  });
}
