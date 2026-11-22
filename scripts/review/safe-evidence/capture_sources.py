#!/usr/bin/env python3
"""Bounded public GitHub metadata capture; no fetching linked/private content.
Uses the existing gh login locally without reading/exporting credentials. No writes.
"""
from pathlib import Path
from datetime import datetime,timezone
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,subprocess,sys
TARGETS=[
 ('SAFE review framework','OpenSecureAIAlliance/wg-safe','pulls',64),
 ('SAFE maintained claims','OpenSecureAIAlliance/wg-safe','issues',72),
 ('SAFE small-operator template','OpenSecureAIAlliance/wg-safe','pulls',60),
 ('NVIDIA OCSF integrity','NVIDIA/OpenShell','issues',5177),
 ('NVIDIA trace correlation','NVIDIA/OpenShell','issues',5210),
 ('Cisco named gateway','cisco-ai-defense/defenseclaw','issues',1394),
 ('Cisco policy-component digest','cisco-ai-defense/defenseclaw','issues',1415),
 ('Red Hat/asago evidence completeness','asago-ai/midojo','issues',190),
 ('Red Hat/asago evidence retry','asago-ai/midojo','issues',192),
 ('Council native companion','CSOAI-ORG/councilof-ai','pulls',3905),
 ('Council evidence-learning bridge','CSOAI-ORG/councilof-ai','pulls',3902),
 ('Council daily regulatory signal','CSOAI-ORG/councilof-ai','pulls',3915),
 ('Council evidence routing','CSOAI-ORG/councilof-ai','pulls',3916),
 ('Council GPAI tooling','CSOAI-ORG/councilof-ai','pulls',3917),
 ('Council released Atlas archive','CSOAI-ORG/councilof-ai','pulls',3918),
 ('Council latest wording correction','CSOAI-ORG/councilof-ai','pulls',3921),
]
# README content is hashed as source identity; no legal or feature assessment is inferred.
TEXTS=[('CrowdStrike current contribution policy','CrowdStrike/falcon-mcp','README.md'),('Palantir public integration boundary','palantir/palantir-mcp','README.md')]
def capture(t):
 label,repo,kind,number=t
 url=f'https://github.com/{repo}/{"pull" if kind=="pulls" else "issues"}/{number}'
 endpoint=f'repos/{repo}/{kind}/{number}'
 result={'label':label,'url':url,'retrieved_at':datetime.now(timezone.utc).isoformat(),'availability':'UNAVAILABLE'}
 try:
  p=subprocess.run(['gh','api',endpoint],capture_output=True,timeout=18)
  if p.returncode or len(p.stdout)>2*1024*1024:result['failure_kind']='API_UNAVAILABLE_OR_OVERSIZE';return result
  d=json.loads(p.stdout);m={k:d[k] for k in ['title','state','merged','draft','updated_at'] if k in d}
  body=d.get('body');m['content_sha256']=hashlib.sha256((body if isinstance(body,str) else '').encode('utf-8')).hexdigest()
  if isinstance(d.get('head'),dict):m['head_sha']=d['head'].get('sha')
  if d.get('merged')is True:m['merge_sha']=d.get('merge_commit_sha')
  result.update(availability='AVAILABLE',raw_sha256=hashlib.sha256(p.stdout).hexdigest(),metadata=m)
 except (subprocess.TimeoutExpired,ValueError):result['failure_kind']='TIMEOUT_OR_INVALID_RESPONSE'
 return result

def text_capture(t):
 label,repo,path=t;url=f'https://github.com/{repo}/blob/HEAD/{path}';result={'label':label,'url':url,'retrieved_at':datetime.now(timezone.utc).isoformat(),'availability':'UNAVAILABLE'}
 try:
  p=subprocess.run(['gh','api',f'repos/{repo}/contents/{path}'],capture_output=True,timeout=18)
  if p.returncode or len(p.stdout)>2*1024*1024:result['failure_kind']='API_UNAVAILABLE_OR_OVERSIZE';return result
  d=json.loads(p.stdout)
  if d.get('encoding')!='base64' or not isinstance(d.get('content'),str):raise ValueError()
  import base64
  raw=base64.b64decode(d['content'],validate=False)
  result.update(availability='AVAILABLE',raw_sha256=hashlib.sha256(p.stdout).hexdigest(),metadata={'title':label,'text_sha256':hashlib.sha256(raw).hexdigest(),'role':'PUBLIC_DOCUMENT_NOT_PRODUCT_ACCEPTANCE'})
 except (subprocess.TimeoutExpired,ValueError):result['failure_kind']='TIMEOUT_OR_INVALID_RESPONSE'
 return result

if __name__=='__main__':
 out=Path(sys.argv[1]);out.parent.mkdir(parents=True,exist_ok=True)
 if out.exists():raise SystemExit('Output exists; preserve historical capture')
 with ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(capture,TARGETS))+list(pool.map(text_capture,TEXTS))
 out.write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps({'captured_at':datetime.now(timezone.utc).isoformat(),'path':str(out),'records':len(rows),'available':sum(r['availability']=='AVAILABLE' for r in rows),'scope':'Explicit public-source metadata only; not vendor test execution or deployment verification.'}))
