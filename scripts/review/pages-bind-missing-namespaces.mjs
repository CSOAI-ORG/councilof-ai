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

/** One KV namespace, by id.
 *
 * A narrower read than the account-wide list, and it answers the only question that
 * matters here: does THIS id exist on THIS account? The list endpoint and the
 * single-namespace endpoint are two different reads, and a token may be permitted for
 * one and not the other. When the list cannot be read, this is the fallback that
 * still refuses to bind an id it could not confirm.
 */
export async function readNamespaceById({accountId,namespaceId,token,fetcher=fetch}){
  if(!finiteHex(accountId)||!finiteHex(namespaceId)||typeof token!=='string'||token.length<12)throw Error('CF_NAMESPACE_READ_CREDENTIALS_REQUIRED');
  const endpoint='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/storage/kv/namespaces/'+namespaceId;
  const response=await fetcher(endpoint,{method:'GET',headers:{authorization:'Bearer '+token,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('CF_NAMESPACE_READ_HTTP_'+response.status);
  const doc=await response.json();
  if(doc?.success!==true||!object(doc.result))throw Error('CF_NAMESPACE_READ_UNCONFIRMED');
  if(doc.result.id!==namespaceId)throw Error('CF_NAMESPACE_READ_ID_MISMATCH');
  return doc.result.id;
}

export async function applyBindingAdditions({candidate,project,accountId,token,fetcher=fetch,accountNamespaceIds,report=false}){
  const c=object(candidate);
  if(c?.name!==PROJECT)throw Error('TARGET_PROJECT_MISMATCH');
  if(project?.name!==PROJECT)throw Error('TARGET_PROJECT_MISMATCH');
  if(project?.production_branch!=='master')throw Error('TARGET_BRANCH_MISMATCH');
  const plan=planBindingAdditions(c,project);
  const remote=remoteBindings(project);
  const summary={schema:'csoai.pages-binding-additions/0.1',state:'NO_CHANGE',changed:false,added:[],refused:[],conflicts:plan.conflicts,extra_remote:plan.extraRemote,readback:'NOT_REQUIRED',namespace_confirmation:'NOT_NEEDED'};
  // A remote that already diverges from the reviewed candidate is left exactly as it is:
  // that divergence is the preflight's to judge, not this step's to paper over.
  if(plan.conflicts.length||plan.extraRemote.length)return summary;
  if(!plan.additions.length)return summary;

  const declared=Array.isArray(c.kv_namespaces)?c.kv_namespaces:[];
  const wanted=new Map(declared.map(e=>[e.binding,e.id]));

  // Prove the namespace exists on THIS account before it is bound to production. A
  // namespace from another account, or a typo, would otherwise be published as a
  // binding that can never be read.
  let ids=accountNamespaceIds;
  let readError=null,confirmedBy='account-list';
  if(ids===undefined){
    try{ids=await readAccountNamespaceIds({accountId,token,fetcher});}catch(error){ids=null;readError=error?.message??'CF_NAMESPACE_READ_UNKNOWN';}
  }
  if(!Array.isArray(ids)){
    // The account-wide list could not be read. That is NOT the same as "the namespace
    // does not exist": the list endpoint and the single-namespace endpoint are two
    // different reads, and a token can be permitted for one and not the other. So ask
    // the narrower question directly - does THIS id exist on THIS account? - and keep
    // the reason the wider read failed either way, because a refusal that cannot say
    // why is a refusal nobody can act on.
    const confirmed=[],failures=[];
    for(const {name} of plan.additions){
      try{await readNamespaceById({accountId,namespaceId:wanted.get(name),token,fetcher});confirmed.push(wanted.get(name));}
      catch(error){failures.push(name+': '+(error?.message??'UNKNOWN'));}
    }
    if(failures.length){
      return {...summary,state:'UNCONFIRMED_NAMESPACE',refused:plan.additions.map(a=>a.name),read_error:readError,namespace_confirmation:'NONE',note:"the account's KV namespace list could not be read ("+readError+"), and the namespace id(s) could not be confirmed directly either ("+failures.join('; ')+"); nothing was bound"};
    }
    ids=confirmed;
    confirmedBy='direct-read';
  }
  const owned=new Set(ids);
  const unknown=plan.additions.filter(a=>!owned.has(wanted.get(a.name)));
  if(unknown.length){
    return {...summary,state:'UNKNOWN_NAMESPACE',refused:unknown.map(a=>a.name),namespace_confirmation:confirmedBy,note:'no KV namespace with this id exists on this account; nothing was bound'};
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

  return {...summary,state:'BOUND',changed:true,added:plan.additions.map(a=>a.name),readback:'VERIFIED',namespace_confirmation:confirmedBy};
}

async function main(){
  const args=process.argv.slice(2),value=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};
  const configPath=path.resolve(value('--config')??'wrangler.jsonc');
  const report=args.includes('--report');
  const ts=await import('typescript');
  const parsed=ts.readConfigFile(configPath,ts.sys.readFile);
  if(parsed.error)throw Error('CANDIDATE_CONFIG_PARSE_FAILED');
  const accountId=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
  const project=await readNamedProject({accountId,token});
  const result=await applyBindingAdditions({candidate:parsed.config,project,accountId,token,report});
  console.log(JSON.stringify(result,null,2));
  process.exitCode=(result.state==='BOUND'||result.state==='NO_CHANGE'||result.state==='WOULD_BIND')?0:2;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{
    console.error(JSON.stringify({schema:'csoai.pages-binding-additions/0.1',state:'BLOCKED',reason:/^CF_|^CANDIDATE_|^TARGET_|^REMOTE_|^READBACK_/.test(error.message)?error.message:'UNEXPECTED_FAILURE',changed:false}));
    process.exitCode=2;
  });
}
