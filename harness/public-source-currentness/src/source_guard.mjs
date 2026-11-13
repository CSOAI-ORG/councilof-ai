/** Read-only counterpart to source_guard.py. No inference, source execution or authority. */
const H40=/^[0-9a-f]{40}$/,H64=/^[0-9a-f]{64}$/;
const KEYS=['target','repository','path','approved_revision','approved_sha256','max_source_bytes','valid_until_ms'].sort();
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
export function validateLock(l){
 if(!object(l)||JSON.stringify(Object.keys(l).sort())!==JSON.stringify(KEYS))throw Error('INVALID_OPERATOR_LOCK');
 if(l.target!=='specialist-receiver'||l.repository!=='csoai/meok-oowm-hybrid-lab')throw Error('UNSUPPORTED_FIXED_TARGET');
 if(l.path!=='integration-specialist-review/join_assets/harness/component-join-review/receive_artifacts.py')throw Error('UNSUPPORTED_FIXED_PATH');
 if(typeof l.approved_revision!=='string'||!H40.test(l.approved_revision))throw Error('INVALID_REVIEW_REVISION');
 if(typeof l.approved_sha256!=='string'||!H64.test(l.approved_sha256))throw Error('INVALID_REVIEW_DIGEST');
 if(!integer(l.max_source_bytes)||l.max_source_bytes<1||l.max_source_bytes>65536)throw Error('INVALID_SOURCE_BOUND');
 if(!integer(l.valid_until_ms))throw Error('INVALID_LOCK_EXPIRY');
}
export async function assess(lock,o,now){
 validateLock(lock);if(!integer(now))throw Error('INVALID_RECEIVER_CLOCK');
 const base={target:lock.target,scope:'PUBLIC_REPOSITORY_SOURCE_BYTES_ONLY',source_truth_established:false,
  runtime_deployment_verified:false,execution_authorized:false,gspc_admitted:false,signature:null,
  checked_at_ms:now,approved_sha256:lock.approved_sha256};
 const out=(state,reason,more={})=>({...base,state,reason,...more});
 if(now>=lock.valid_until_ms)return out('HOLD','OPERATOR_LOCK_EXPIRED');
 if(!object(o)||JSON.stringify(Object.keys(o).sort())!==JSON.stringify(['after','before','finished_ms','source','started_ms']))return out('UNKNOWN','INCOMPLETE_OBSERVATION');
 if(!integer(o.started_ms)||!integer(o.finished_ms)||!(o.started_ms<=o.finished_ms&&o.finished_ms<=now))return out('UNKNOWN','INVALID_OBSERVATION_CLOCK');
 if(o.finished_ms-o.started_ms>15000)return out('UNKNOWN','READ_DEADLINE_EXCEEDED');
 if(now-o.finished_ms>5000)return out('UNKNOWN','OBSERVATION_TOO_OLD');
 for(const key of ['before','source','after']){
  const v=o[key];if(!object(v))return out('UNKNOWN','INCOMPLETE_OBSERVATION');
  if(!Number.isInteger(v.status)||v.status!==200)return out('UNKNOWN','UPSTREAM_NOT_200');
  if(v.redirected!==false)return out('UNKNOWN','REDIRECT_OR_UNKNOWN_ROUTE');
  if(v.age_seconds!==undefined&&v.age_seconds!==null&&(!integer(v.age_seconds)||v.age_seconds!==0))return out('UNKNOWN','CACHED_OR_INVALID_AGE');
  if(typeof v.revision!=='string'||!H40.test(v.revision))return out('UNKNOWN','INVALID_UPSTREAM_REVISION');
 }
 if(o.before.revision!==o.after.revision)return out('UNKNOWN','SOURCE_MOVED_DURING_READ');
 if(o.source.revision!==o.before.revision)return out('UNKNOWN','SOURCE_REVISION_MISMATCH');
 if(o.source.complete!==true)return out('UNKNOWN','INCOMPLETE_SOURCE_BYTES');
 const s=o.source.body_base64;if(typeof s!=='string'||s.length>87384)return out('UNKNOWN','INVALID_SOURCE_ENCODING');
 let b;
 try{const text=atob(s);if(btoa(text)!==s)throw Error('NONCANONICAL');b=Uint8Array.from(text,x=>x.charCodeAt(0));}
 catch{return out('UNKNOWN','INVALID_SOURCE_ENCODING');}
 if(b.length<1||b.length>lock.max_source_bytes)return out('UNKNOWN','SOURCE_SIZE_BOUND');
 const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
 const more={observed_sha256:actual,observed_revision:o.before.revision,source_bytes:b.length};
 if(actual!==lock.approved_sha256)return out('HOLD','APPROVED_BYTES_CHANGED',more);
 return out('MATCH_AT_OBSERVATION','APPROVED_BYTES_MATCH',{...more,head_changed_since_review:o.before.revision!==lock.approved_revision});
}
