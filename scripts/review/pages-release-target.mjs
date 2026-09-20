#!/usr/bin/env node
/** Read-only Cloudflare production-target guard. No deployment, signing or binding writes.
 * Configuration match is not release authority or proof that a stored secret works.
 * Sources: Cloudflare Pages Functions configuration and Pages Project GET API.
 */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v:null;
const has=(v,k)=>v!==null&&typeof v==='object'&&Object.hasOwn(v,k);
const sha=b=>createHash('sha256').update(b).digest('hex');
const finiteHex=v=>typeof v==='string'&&/^[a-f0-9]{32}$/i.test(v);
export function inspectTarget(candidate,project,branch='master'){
 const c=object(candidate),p=object(project),checks=[];const check=(name,ok)=>checks.push({name,state:ok===true?'PASS':'BLOCKED'});
 check('project identities match the named production target',c?.name==='councilof-ai'&&p?.name===c.name);
 check('only the declared production branch is selected',branch==='master'&&p?.production_branch===branch);
 check('build output directory matches',typeof c?.pages_build_output_dir==='string'&&c.pages_build_output_dir.replace(/^\.\//,'')===p?.build_config?.destination_dir);
 const production=object(p?.deployment_configs?.production),preview=object(p?.deployment_configs?.preview);
 check('production configuration returned',!!production);
 check('explicit compatibility date matches',typeof c?.compatibility_date==='string'&&c.compatibility_date===production?.compatibility_date);
 check('compatibility flags match',JSON.stringify([...(c?.compatibility_flags??[])].sort())===JSON.stringify([...(production?.compatibility_flags??[])].sort()));
 // This specific repository uses top-level Pages configuration. Do not silently guess
 // inheritance semantics when a future change introduces environment overrides.
 check('candidate does not introduce unreviewed environment overrides',!has(c?.env,'production')&&!has(c?.env,'preview'));
 const expected=Array.isArray(c?.kv_namespaces)?c.kv_namespaces:[];const remote=object(production?.kv_namespaces);const seen=new Set();const bindings=[];
 check('candidate namespace bindings present',expected.length>0);
 for(const entry of expected){const e=object(entry),name=e?.binding;const shape=typeof name==='string'&&/^[A-Z][A-Z0-9_]*$/.test(name)&&finiteHex(e?.id)&&!seen.has(name);seen.add(name);const match=shape&&object(remote?.[name])?.namespace_id===e.id;check('namespace '+(typeof name==='string'?name:'<invalid>'),match);bindings.push({name:typeof name==='string'?name:null,matches_candidate:match,preview_uses_same_namespace:match&&object(preview?.kv_namespaces?.[name])?.namespace_id===e.id});}
 check('production namespace set does not contain an unreviewed extra binding',!!remote&&Object.keys(remote).length===expected.length);
 const vars=object(c?.vars)??{},remoteVars=object(production?.env_vars);const variables=[];
 for(const [name,value] of Object.entries(vars)){const actual=object(remoteVars?.[name]);const match=actual?.type==='plain_text'&&actual.value===value;check('plain configuration variable '+name,match);variables.push({name,matches_candidate:match});}
 const source=object(p?.source),sourceConfig=object(source?.config);const automaticSource=source?sourceConfig?.deployments_enabled!==false&&sourceConfig?.production_deployments_enabled!==false:false;
 check('no enabled Git-integrated production writer is declared',!automaticSource);
 const variableNames=remoteVars?Object.keys(remoteVars).sort():[];const previewNames=object(preview?.env_vars)?Object.keys(preview.env_vars).sort():[];
 return {schema:'csoai.pages-target-preflight/1',state:checks.every(c=>c.state==='PASS')?'CONFIGURATION_MATCH':'BLOCKED_CONFIGURATION',project:'councilof-ai',requested_branch:branch,observed_production_branch:typeof p?.production_branch==='string'?p.production_branch:null,checks,bindings,plain_variables:variables,source_observation:source?{type:source.type??null,automatic_production_writer_declared:automaticSource}:{type:null,automatic_production_writer_declared:false,note:'No source integration object returned; other direct-upload writers are not ruled out.'},preview:{shared_namespace_count:bindings.filter(b=>b.preview_uses_same_namespace).length,mutation_isolation_established:false,note:'Do not send fixture writes to remote preview merely because its name is preview.'},production:{declared_variable_names:variableNames,signing_secret_declared:variableNames.includes('BOARD_SIGN_KEY_PKCS8_B64'),paddle_secret_declared:variableNames.includes('PADDLE_WEBHOOK_SECRET'),paddle_price_declared:variableNames.includes('PADDLE_PRICE_ID'),fallback_to_assets_setting:production?.fail_open??null,stored_values_validated:false},preview_declared_variable_names:previewNames,release_authority_granted:false,production_ready:false,deployments_created:0,settings_changed:0,secret_values_returned:false};
}
export async function readNamedProject({accountId,token,fetcher=fetch}){
 if(!finiteHex(accountId)||typeof token!=='string'||token.length<12)throw Error('CF_PROJECT_READ_CREDENTIALS_REQUIRED');
 const endpoint='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/pages/projects/councilof-ai';
 const response=await fetcher(endpoint,{method:'GET',headers:{authorization:'Bearer '+token,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('CF_PROJECT_READ_HTTP_'+response.status);
 const reader=response.body?.getReader();if(!reader)throw Error('CF_PROJECT_READ_NO_BODY');const parts=[];let n=0;
 try{while(true){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>2_000_000){await reader.cancel();throw Error('CF_PROJECT_READ_SIZE_LIMIT');}parts.push(r.value);}}finally{reader.releaseLock();}
 const raw=Buffer.concat(parts.map(p=>Buffer.from(p)));let doc;try{doc=JSON.parse(raw);}catch{throw Error('CF_PROJECT_READ_NOT_JSON');}
 if(doc?.success!==true||!object(doc.result))throw Error('CF_PROJECT_READ_UNCONFIRMED');
 return {project:doc.result,responseSha256:sha(raw)};
}
async function main(){
 const args=process.argv.slice(2),value=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};const configPath=path.resolve(value('--config')??'wrangler.jsonc'),branch=value('--branch')??'master';
 const ts=await import('typescript');const parsed=ts.readConfigFile(configPath,ts.sys.readFile);if(parsed.error)throw Error('CANDIDATE_CONFIG_PARSE_FAILED');
 const {project,responseSha256}=await readNamedProject({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN});
 const result={...inspectTarget(parsed.config,project,branch),observed_at:new Date().toISOString(),candidate_config_sha256:sha(fs.readFileSync(configPath)),project_response_sha256:responseSha256};
 const out=value('--out');if(out)fs.writeFileSync(out,JSON.stringify(result,null,2),{flag:'wx'});
 console.log(JSON.stringify(result,null,2));process.exitCode=result.state==='CONFIGURATION_MATCH'?0:2;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(JSON.stringify({state:'PROJECT_READ_UNCHECKABLE',reason:/^CF_|^CANDIDATE_/.test(error.message)?error.message:'UNEXPECTED_READ_FAILURE',settings_changed:0,deployments_created:0}));process.exitCode=2;});
