#!/usr/bin/env python3
"""Verify CSOAI snapshot integrity or a single record inclusion proof.
No third-party libraries. No payment, identity, signature or Bitcoin verification is implied.
The expected manifest SHA-256 must come from a separately trusted channel.
"""
from __future__ import annotations
import argparse, base64, datetime as dt, hashlib, hmac, json, re, sys, urllib.parse, urllib.request
from pathlib import Path
MAX_FILE=40_000_000

def encoded(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode('utf-8')
def sha(b):return hashlib.sha256(b).digest()
def tree(leaves):
 if not leaves:return sha(b'')
 if len(leaves)==1:return sha(b'\x00'+leaves[0])
 k=1<<((len(leaves)-1).bit_length()-1)
 return sha(b'\x01'+tree(leaves[:k])+tree(leaves[k:]))

def verify_inclusion(leaf,index,proof,n,root_hex):
 """RFC 9162 section 2.1.3.2, including bounds, excess and incomplete proof rejection."""
 if type(index) is not int or type(n) is not int or not 0<=index<n or n<1:return False
 if not isinstance(leaf,bytes) or not isinstance(proof,list) or len(proof)>n.bit_length():return False
 if not isinstance(root_hex,str) or not re.fullmatch(r'[0-9a-f]{64}',root_hex):return False
 if any(not isinstance(p,bytes) or len(p)!=32 for p in proof):return False
 r=sha(b'\x00'+leaf);fn,sn=index,n-1
 for p in proof:
  if sn==0:return False
  if fn&1 or fn==sn:
   r=sha(b'\x01'+p+r)
   while fn and not fn&1:fn>>=1;sn>>=1
  else:r=sha(b'\x01'+r+p)
  fn>>=1;sn>>=1
 return sn==0 and hmac.compare_digest(r.hex(),root_hex)

def load(path):
 if str(path).startswith('https://'):
  u=urllib.parse.urlsplit(str(path))
  if u.hostname!='huggingface.co' or not u.path.startswith('/datasets/csoai/councilof-ai-mirror/resolve/'):raise ValueError('Remote manifests are limited to the published CSOAI Hugging Face repository; download other manifests first')
  with urllib.request.urlopen(urllib.request.Request(str(path),headers={'User-Agent':'csoai-independent-verifier/0.1'}),timeout=30) as r:raw=r.read(MAX_FILE+1)
 else:
  p=Path(path)
  if p.stat().st_size>MAX_FILE:raise ValueError('Input exceeds 40 MB')
  raw=p.read_bytes()
 if len(raw)>MAX_FILE:raise ValueError('Input exceeds 40 MB')
 return raw

def check_manifest(raw,expected):
 if not re.fullmatch(r'[0-9a-f]{64}',expected or ''):raise ValueError('Supply an independently trusted --expected-manifest-sha256')
 if not hmac.compare_digest(sha(raw).hex(),expected):raise ValueError('Manifest SHA-256 mismatch')
 m=json.loads(raw)
 if m.get('schema')!='csoai.claim-capture-root/0.1' or type(m.get('records')) is not int or m['records']<1:raise ValueError('Unsupported root manifest or count')
 return m

def verify_snapshot(manifest,raw,max_age):
 if sha(raw).hex()!=manifest['snapshot_sha256']:raise ValueError('Snapshot bytes do not match root manifest')
 d=json.loads(raw);rows=d['records'];ids=[(r['population'],r['subject_id']) for r in rows]
 if len(rows)!=manifest['records'] or len(rows)!=d['count'] or ids!=sorted(set(ids)):raise ValueError('Record count, ordering or uniqueness mismatch')
 leaves=[]
 for r in rows:
  if sha(encoded({k:r[k] for k in ('population','subject_id','claim')})).hex()!=r['content_sha256']:raise ValueError('Claim content hash mismatch')
  leaves.append(encoded(r))
 actual=tree(leaves).hex()
 if actual!=manifest['merkle_root'] or actual!=d['merkle_root']:raise ValueError('Snapshot Merkle root mismatch')
 for p in d['inclusion_proof_samples']:
  proof=[bytes.fromhex(x['hash']) for x in p['path']]
  if not verify_inclusion(leaves[p['index']],p['index'],proof,len(leaves),actual):raise ValueError('Inclusion sample failed')
  if verify_inclusion(leaves[p['index']]+b'!',p['index'],proof,len(leaves),actual):raise ValueError('Tampered-record negative control failed')
 instant=dt.datetime.fromisoformat(d['created_at'].replace('Z','+00:00'))
 if instant.tzinfo is None:raise ValueError('Observation timestamp lacks timezone')
 age=(dt.datetime.now(dt.timezone.utc)-instant).total_seconds()
 if age < -300:raise ValueError('Observation timestamp is in the future')
 freshness='FRESH' if age<=max_age else 'STALE'
 return {'content_integrity':'VERIFIED','records':len(rows),'merkle_root':actual,'negative_control':'TAMPER_REJECTED','freshness':freshness,'age_seconds':round(age),'observation_time_is_publisher_asserted':True}

def verify_record(manifest,raw):
 d=json.loads(raw);leaf=base64.b64decode(d['leaf_bytes_base64'],validate=True)
 if d['tree_size']!=manifest['records'] or d['root_hex']!=manifest['merkle_root']:raise ValueError('Proof claims the wrong root or tree size')
 proof=[bytes.fromhex(p) for p in d['audit_path_hex']]
 if not verify_inclusion(leaf,d['leaf_index'],proof,d['tree_size'],d['root_hex']):raise ValueError('Record inclusion verification failed')
 if verify_inclusion(leaf+b'!',d['leaf_index'],proof,d['tree_size'],d['root_hex']):raise ValueError('Tampered-record negative control failed')
 record=json.loads(leaf)
 return {'record_inclusion':'VERIFIED','subject_id':record['subject_id'],'population':record['population'],'tree_size':d['tree_size'],'leaf_index':d['leaf_index'],'proof_hashes':len(proof),'negative_control':'TAMPER_REJECTED'}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('manifest');g=p.add_mutually_exclusive_group(required=True);g.add_argument('--snapshot');g.add_argument('--record-proof');p.add_argument('--expected-manifest-sha256',required=True);p.add_argument('--max-age-hours',type=float,default=36);a=p.parse_args()
 try:
  m=check_manifest(load(a.manifest),a.expected_manifest_sha256)
  result=verify_snapshot(m,load(a.snapshot),a.max_age_hours*3600) if a.snapshot else verify_record(m,load(a.record_proof))
  result.update(verdict='CONTENT_VERIFIED_NOT_PAYMENT_VERIFIED',manifest_sha256=a.expected_manifest_sha256,signature_verified=False,bitcoin_verified=False,payment_verified=False,external_customer_verified=False,source_truth_verified=False)
  print(json.dumps(result,indent=2));return 0
 except Exception as e:print(json.dumps({'verdict':'FAILED','failed_check':str(e)},indent=2));return 1
if __name__=='__main__':sys.exit(main())
