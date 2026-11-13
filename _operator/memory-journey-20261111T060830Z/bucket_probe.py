"""Bounded private-bucket qualification. Only newly created synthetic keys are touched."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,uuid,time
from huggingface_hub import HfApi
ROOT=Path(__file__).resolve().parent
BUCKET='csoai/meok-working-data'
run=uuid.uuid4().hex;prefix='research/memory-qualification/'+run+'/'
protocol={'id':'csoai.memory-storage-preflight.20261111.v1','bucket':BUCKET,'prefix':prefix,
 'bytes_limit':4096,'cases':['two_immutable_revisions','fresh_client_readback','anonymous_metadata_refusal','remove_only_created_revision','other_revision_preserved'],
 'fixture':'Artificial qualification strings only; no user conversation, identity, credentials or training data.',
 'mount_tested':False,'live_runtime_change':False,'training':False,'gspc_admitted':False}
(ROOT/'bucket-protocol.json').write_text(json.dumps(protocol,indent=2)+'\n')
api=HfApi(token=True); info=api.bucket_info(BUCKET);assert info.private is True
assert list(api.list_bucket_tree(BUCKET,prefix=prefix,recursive=True))==[]
rows=[];keys=[];payloads=[]
for generation in (1,2):
 raw=json.dumps({'schema':'csoai.synthetic-storage-probe/1','run':run,'generation':generation,'text':'Synthetic memory qualification cafe — no customer data','authority':'NONE'},sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()
 assert len(raw)<=protocol['bytes_limit'];digest=hashlib.sha256(raw).hexdigest();key=prefix+digest+'.json';keys.append(key);payloads.append(raw)
 t=time.perf_counter();api.batch_bucket_files(BUCKET,add=[(raw,key)]);seconds=time.perf_counter()-t
 fresh=HfApi(token=True);p=ROOT/('bucket-readback-'+str(generation)+'.json')
 fresh.download_bucket_files(BUCKET,[(key,p)],raise_on_missing_files=True)
 assert p.read_bytes()==raw
 rows.append({'case':'fresh_client_revision_'+str(generation),'passed':True,'bytes':len(raw),'sha256':digest,'write_seconds_diagnostic':seconds})
# A public client must not resolve the private probe; use the same documented method.
try:HfApi(token=False).get_bucket_file_metadata(BUCKET,keys[0])
except Exception as exc:
 status=getattr(getattr(exc,'response',None),'status_code',None)
 assert status in (401,403,404),'UNEXPECTED_ANONYMOUS_ERROR'
 rows.append({'case':'anonymous_metadata_refused','passed':True,'http_status':status})
else:raise AssertionError('ANONYMOUS_ACCESS_UNEXPECTEDLY_SUCCEEDED')
# Delete only the first key created by this run. Never remove any unrelated object.
api.batch_bucket_files(BUCKET,delete=[keys[0]])
remaining=list(HfApi(token=True).get_bucket_paths_info(BUCKET,keys))
paths={x.path for x in remaining}
assert keys[0] not in paths and keys[1] in paths
rows.append({'case':'selected_revision_removed_other_preserved','passed':True})
p=ROOT/'bucket-survivor-readback.json';HfApi(token=True).download_bucket_files(BUCKET,[(keys[1],p)],raise_on_missing_files=True)
assert p.read_bytes()==payloads[1]
rows.append({'case':'survivor_exact_readback','passed':True})
# Clean up our remaining synthetic data; no buckets, settings or live source are removed.
api.batch_bucket_files(BUCKET,delete=[keys[1]])
assert list(api.list_bucket_tree(BUCKET,prefix=prefix,recursive=True))==[]
rows.append({'case':'created_probe_keys_removed','passed':True})
assert api.bucket_info(BUCKET).private is True
receipt={'id':protocol['id'],'at':datetime.now(timezone.utc).isoformat(),'status':'PASS_OBJECT_API_ONLY','checks':rows,
 'private_before_and_after':True,'existing_objects_changed':False,'keys_created':2,'keys_removed':2,
 'bucket_mounted':False,'configured_live_memory_root':False,'space_restarted':False,
 'auth_scope':'Existing user account/API credential; anonymous read refused. Not a second-user isolation or token-revocation test.',
 'scope':'Object API persistence/readback only. Does not qualify POSIX locking, fsync, atomicity, mounted filesystem, restart durability or end-user save/restore.',
 'model_calls':0,'training':False,'gspc_admitted':False,'cost':'UNKNOWN','energy':'UNKNOWN'}
(ROOT/'bucket-result.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,indent=2),flush=True)
