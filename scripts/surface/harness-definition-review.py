#!/usr/bin/env python3
"""Retain adapter definitions while separating specifications from execution evidence.
The input snapshots are immutable; no scheduler, source fetch or measurement runs here.
"""
from pathlib import Path
import json,hashlib,argparse,copy
ROOT=Path(__file__).resolve().parents[2]
INPUT='evidence/harness-definition-review-2026-09-18'
NAMES=['continuous-churn-engine-v0.1.json']+[f'master-harness-index-v0.{n}.json' for n in range(1,5)]
def sha(raw):return hashlib.sha256(raw).hexdigest()
def generate(root=ROOT):
 original_manifest=json.loads((root/INPUT/'manifest.json').read_text());out={}
 for name in NAMES:
  raw=(root/INPUT/name).read_bytes();pin=original_manifest['files'][name]
  if sha(raw)!=pin['sha256'] or len(raw)!=pin['bytes']:raise ValueError('ORIGINAL_DEFINITION_CHANGED')
  old=json.loads(raw);doc=copy.deepcopy(old)
  if any(old.get(k) for k in ['signature','sig_ed25519','jws']):raise ValueError('SIGNED_DEFINITION_REQUIRES_SEPARATE_REVIEW')
  # Keep structural adapter identities, goals and mapping fields used by existing consumers.
  doc['title']='GSPC adapter schedule specification' if name.startswith('continuous') else 'GSPC harness definition: proposed source and goal mappings'
  doc['review']={'schema':'csoai.definition-review/1','reviewed_on':'2026-09-18','state':'SPECIFICATION_NOT_EXECUTION_RECEIPT','original_sha256':pin['sha256'],'original_generated_at':old.get('generated_at'),'original_bytes':'/interop/retired-claim-bytes/'+pin['sha256']+'.body','rule':'Definitions, desired ticks and mappings do not prove installed schedulers, completed measurements, authorisation, legal applicability, signatures or public release. Current counts must be read from the named measurement response.','new_measurements':0,'new_schedulers':0,'permissions_granted':False}
  doc.pop('sha256',None);doc.pop('byte_size',None)
  if name.startswith('continuous'):
   doc['purpose']='Proposed source-adapter and scheduling definitions for review. Actual execution, freshness and permissions require separate operator receipts.'
   doc['principle']='Use bounded permitted reads, stable source identity, explicit unknowns and independent evidence admission. An intended interval is not a running loop.'
  else:
   doc['principle']='Proposed common evidence-object grammar. Binding a source name to a goal is not evidence that the source was read or that the goal was satisfied.'
   for key in ['axes_measured_quotable','axes_registering','axes_total_declared']:
    if key in doc:doc[key]=None
   if 'honest_findings' in doc:doc['honest_findings']=['This definition alone establishes no current measurement, score or organisation-wide coverage. Original assertions are retained in the exact historical bytes.']
  for collection in ['adapters','sources_bound_to_harness']:
   for row in doc.get(collection,[]):
    if not isinstance(row,dict):raise ValueError('ADAPTER_OBJECT_REQUIRED')
    source=row.get('source')
    if isinstance(source,str) and source.startswith('GSPC board ('):
     row['source']='GSPC board: counts come from one scoped /api/gspc response'
     row['measurement_reference']='/api/gspc'
    elif isinstance(source,str) and source.startswith('GSPC measurement cards ('):
     row['source']='GSPC card-index collection: indexed documents are not independent measurements'
    row['execution_evidence']='NOT_ESTABLISHED_BY_THIS_DEFINITION'
    if 'status' in row:row['status']='DECLARED_SPECIFICATION_NOT_CURRENT_ASSESSMENT'
  out['public/interop/'+name]=(json.dumps(doc,indent=2,ensure_ascii=False)+'\n').encode()
 return out
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--repo',type=Path,default=ROOT);p.add_argument('--check',action='store_true');a=p.parse_args();generated=generate(a.repo)
 for rel,raw in generated.items():
  path=a.repo/rel
  if a.check:
   if not path.is_file() or path.read_bytes()!=raw:raise SystemExit('DEFINITION_VIEW_DRIFT: '+rel)
  else:path.write_bytes(raw)
 print(json.dumps({'state':'CHECKED_DEFINITIONS' if a.check else 'REVIEWED_DEFINITIONS_WRITTEN','files':len(generated),'new_executions':0,'new_authority':False}))
