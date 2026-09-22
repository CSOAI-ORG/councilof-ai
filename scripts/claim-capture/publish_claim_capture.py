#!/usr/bin/env python3
"""Publish only digest-checked capture bundles; keep the HF key in the Mac keychain."""
from __future__ import annotations
import concurrent.futures, datetime as dt, fcntl, hashlib, ipaddress, json, os, re, subprocess, sys, tempfile, urllib.error, urllib.parse, urllib.request, zipfile
from pathlib import Path
BASE=Path(__file__).resolve().parent
POD='fpowppss5ngtkw';HOST_KEY='SHA256:tN4kYexAkVh3HKjyaQmBscbSC+P89WEfTpauJ5uaB9Q'
REPO='csoai/councilof-ai-mirror';PREFIX='claim-capture/'
UA='csoai-capture-publication/0.1 (+https://councilof.ai; anonymous verification)'
def enc(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def tree(leaves):
 if not leaves:return hashlib.sha256(b'').digest()
 if len(leaves)==1:return hashlib.sha256(b'\x00'+leaves[0]).digest()
 k=1<<((len(leaves)-1).bit_length()-1)
 return hashlib.sha256(b'\x01'+tree(leaves[:k])+tree(leaves[k:])).digest()
def run(args,timeout=30):return subprocess.run(args,capture_output=True,check=True,timeout=timeout).stdout

def fetch(url):
 req=urllib.request.Request(url,headers={'User-Agent':UA})
 with urllib.request.build_opener().open(req,timeout=40) as r:
  raw=r.read(40_000_001)
  if len(raw)>40_000_000:raise ValueError('Readback exceeds cap')
  return raw

def sync():
 d=json.loads(run(['/opt/homebrew/bin/runpodctl','pod','get',POD,'-o','json']))
 if d['id']!=POD or d.get('runtimeStatus')!='running':raise ValueError('Expected existing pod is not running')
 s=d['ssh'];ip=str(ipaddress.ip_address(s['ip']));port=str(int(s['port']))
 host=run(['ssh-keyscan','-T','8','-p',port,'-t','ed25519',ip])
 fingerprint=subprocess.run(['ssh-keygen','-lf','-'],input=host,capture_output=True,check=True).stdout.decode()
 if HOST_KEY not in fingerprint:raise ValueError('Pod host key changed; refused connection')
 kh=BASE/'known_hosts';kh.write_bytes(host);kh.chmod(0o600)
 key=Path.home()/'.runpod/ssh/runpodctl-ssh-key'
 options=['-i',str(key),'-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(kh)]
 # Rebuild only; daily collection and proof upgrades belong to the existing pod runner.
 output=run(['ssh',*options,'-p',port,'root@'+ip,'python3 /workspace/csoai-claim-capture/delivery_pipeline.py'],timeout=90)
 (BASE/'last-build-summary.json').write_bytes(output)
 archive=BASE/'incoming.zip'
 run(['scp',*options,'-P',port,'root@'+ip+':/workspace/csoai-claim-capture/state/release.zip',str(archive)],timeout=90)
 if archive.stat().st_size>40_000_000:raise ValueError('Archive exceeds cap')
 with zipfile.ZipFile(archive) as z:
  if sum(i.file_size for i in z.infolist())>128_000_000:raise ValueError('Expanded archive exceeds cap')
  manifest_raw=z.read('release.json');manifest=json.loads(manifest_raw);files=manifest['files']
  if set(z.namelist())!=set(files)|{'release.json'}:raise ValueError('Unexpected archive member')
  payload={}
  for rel,meta in files.items():
   p=Path(rel)
   if p.is_absolute() or '..' in p.parts or rel.startswith('.') or not re.match(r'^(README\.md|THREAT_MODEL\.md|code/[a-z_]+\.py|runs/[0-9TZ]+/)',rel):raise ValueError('Unsafe archive path')
   raw=z.read(rel)
   if sha(raw)!=meta['sha256'] or len(raw)!=meta['bytes']:raise ValueError('File digest mismatch: '+rel)
   if re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bhf_[A-Za-z0-9]{25,}|\bghp_[A-Za-z0-9]{25,}|\bsk-proj-[A-Za-z0-9_-]{30,}',raw):raise ValueError('Potential credential: publication held')
   payload[rel]=raw
  for rel,raw in payload.items():
   if not rel.endswith('/snapshot.json'):continue
   snap=json.loads(raw);root=json.loads(payload[rel.replace('/snapshot.json','/root.json')]);rows=snap['records'];ids=[(r['population'],r['subject_id']) for r in rows]
   if ids!=sorted(set(ids)) or len(rows)!=snap['count'] or root['records']!=len(rows):raise ValueError('Snapshot identity/count error')
   for row in rows:
    if sha(enc({k:row[k] for k in ('population','subject_id','claim')}))!=row['content_sha256']:raise ValueError('Claim digest error')
   if sha(raw)!=root['snapshot_sha256'] or tree([enc(r) for r in rows]).hex()!=root['merkle_root']:raise ValueError('Root reconstruction failed')
  # Verify every detached root signature cryptographically before publishing.
  import base64
  from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
  signatures_checked=0
  for rel,raw in payload.items():
   if not rel.endswith('/root.json.sig.json'):continue
   signature=json.loads(raw);public=base64.b64decode(signature['public_key_base64'],validate=True);signature_bytes=base64.b64decode(signature['signature_base64'],validate=True)
   root_bytes=payload[rel.removesuffix('.sig.json')]
   if sha(public)!=signature['key_id_sha256'] or sha(root_bytes)!=signature['signed_file_sha256']:raise ValueError('Detached signature identity/digest mismatch')
   Ed25519PublicKey.from_public_bytes(public).verify(signature_bytes,root_bytes);signatures_checked+=1
  if manifest.get('signature_state')=='DETACHED_CAPTURE_KEY_SIGNATURE' and not signatures_checked:raise ValueError('Missing promised capture signature')
  release_sha=sha(manifest_raw);payload['release.json']=manifest_raw
 latest_url=f'https://huggingface.co/datasets/{REPO}/resolve/main/{PREFIX}latest.json'
 try:
  latest=json.loads(fetch(latest_url))
  if latest.get('release_sha256')==release_sha:
   print(json.dumps({'status':'NOOP_PUBLIC_POINTER_MATCHES','run_id':manifest['run_id'],'release_sha256':release_sha}));return
 except urllib.error.HTTPError as e:
  if e.code!=404:raise
 from huggingface_hub import HfApi,CommitOperationAdd
 token=run(['security','find-generic-password','-s','meok-keystone','-a','HF_TOKEN','-w']).decode().strip()
 if not token:raise ValueError('HF key missing')
 api=HfApi(token=token)
 head=api.repo_info(repo_id=REPO,repo_type='dataset').sha
 ops=[CommitOperationAdd(path_in_repo=PREFIX+rel,path_or_fileobj=raw) for rel,raw in payload.items()]
 commit=api.create_commit(repo_id=REPO,repo_type='dataset',operations=ops,parent_commit=head,commit_message='claim capture: verified release '+manifest['run_id'])
 base=f'https://huggingface.co/datasets/{REPO}/resolve/{commit.oid}/{PREFIX}'
 def verify(item):
  rel,raw=item;got=fetch(base+urllib.parse.quote(rel,safe='/'))
  if sha(got)!=sha(raw):raise ValueError('Anonymous readback mismatch '+rel)
  return rel
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:verified=list(pool.map(verify,payload.items()))
 pointer={'schema':'csoai.claim-capture-pointer/0.1','run_id':manifest['run_id'],'as_of':manifest['as_of'],'published_at':dt.datetime.now(dt.timezone.utc).isoformat(),'hf_commit':commit.oid,'release_sha256':release_sha,'release_url':base+'release.json','record_count':manifest['record_count'],'snapshot_merkle_root':manifest['snapshot_merkle_root'],'anchor':manifest['anchor'],'signature_state':manifest['signature_state'],'signature_key_id':manifest.get('signature_key_id'),'identity_assurance':manifest.get('identity_assurance'),'populations':{},'changes_url':base+'runs/'+manifest['run_id']+'/changes.json','report_url':base+'runs/'+manifest['run_id']+'/report.md','root_url':base+'runs/'+manifest['run_id']+'/root.json','snapshot_url':base+'runs/'+manifest['run_id']+'/snapshot.json','verified_files':len(verified),'paid_delivery_verified':False}
 for name,p in manifest['populations'].items():pointer['populations'][name]=dict(p,artifact_url=base+p['path'])
 proof_hash=manifest['anchor'].get('proof_sha256')
 if proof_hash:pointer['ots_url']=base+'runs/'+manifest['run_id']+'/proofs/'+proof_hash+'.ots'
 pointer['signature_url']=base+'runs/'+manifest['run_id']+'/root.json.sig.json'
 pointer['buyer_verifier_url']=base+'code/verify_csoai_delivery.py'
 pointer['usdt_inclusion_proof_url']=base+'runs/'+manifest['run_id']+'/USDT-inclusion-proof.json'
 pbytes=enc(pointer)+b'\n'
 pcommit=api.create_commit(repo_id=REPO,repo_type='dataset',operations=[CommitOperationAdd(path_in_repo=PREFIX+'latest.json',path_or_fileobj=pbytes)],parent_commit=commit.oid,commit_message='claim capture: promote anonymously verified release '+manifest['run_id'])
 actual=fetch(f'https://huggingface.co/datasets/{REPO}/resolve/{pcommit.oid}/{PREFIX}latest.json')
 if actual!=pbytes:raise ValueError('Public pointer readback mismatch')
 receipt={'status':'PUBLISHED_AND_ANONYMOUSLY_VERIFIED','run_id':manifest['run_id'],'records':manifest['record_count'],'files_verified':len(verified),'release_sha256':release_sha,'artifact_commit':commit.oid,'pointer_commit':pcommit.oid,'public_pointer':latest_url,'verified_at':dt.datetime.now(dt.timezone.utc).isoformat(),'paid_delivery_verified':False,'capture_signatures_verified':signatures_checked,'signature_key_id':manifest.get('signature_key_id')}
 tmp=BASE/'publication-receipt.tmp';tmp.write_bytes(enc(receipt)+b'\n');os.replace(tmp,BASE/'publication-receipt.json')
 (BASE/'public-latest.json').write_bytes(pbytes)
 print(json.dumps(receipt,indent=2))

def main():
 BASE.mkdir(parents=True,exist_ok=True);lock=(BASE/'publication.lock').open('w')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:print('HELD: publisher already running');return 75
 try:sync();return 0
 except Exception as e:
  # No subprocess payloads or authentication values in logs.
  print(json.dumps({'status':'FAILED_OR_HELD','error_type':type(e).__name__,'reason':str(e)[:300] if not isinstance(e,subprocess.CalledProcessError) else 'A required local/SSH command failed; no successful publication is asserted.'}),file=sys.stderr);return 2
if __name__=='__main__':sys.exit(main())
