#!/usr/bin/env python3
"""Derived engineering review packs. No crawler, grader, publisher, signer or authority.

Input: explicit bounded source observations and the existing research register/plan.
Output: deterministic JSON, readable Markdown, local HTML review and checksum index.
Requires Python 3.10+. Repeat observations are not new measurements or IP valuation.
"""
from __future__ import annotations
import argparse,hashlib,html,json,math,os,re,stat
from review_page import render
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlsplit
MAX_BYTES=2*1024*1024
SCHEMA='csoai.engineering-review/1'

def canonical(v):return (json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n').encode('utf-8')
def digest(v):return hashlib.sha256(canonical(v)).hexdigest()
def duplicate_reject(pairs):
 d={}
 for k,v in pairs:
  if k in d:raise ValueError('Duplicate JSON key')
  d[k]=v
 return d

def read(path:Path):
 fd=os.open(path,os.O_RDONLY|getattr(os,'O_NOFOLLOW',0))
 try:
  s=os.fstat(fd)
  if not stat.S_ISREG(s.st_mode) or s.st_size>MAX_BYTES:raise ValueError('Input is not a bounded regular file')
  with os.fdopen(fd,'rb',closefd=False) as f:b=f.read(MAX_BYTES+1)
  if len(b)>MAX_BYTES:raise ValueError('Input exceeded limit')
 finally:os.close(fd)
 return json.loads(b.decode('utf-8'),object_pairs_hook=duplicate_reject,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('Nonfinite JSON')))

def timestamp(text):
 if not isinstance(text,str):raise ValueError('Missing source read time')
 d=datetime.fromisoformat(text.replace('Z','+00:00'))
 if d.tzinfo is None:raise ValueError('Timestamp requires timezone')
 return d.astimezone(timezone.utc)

def public_url(value):
 if not isinstance(value,str):raise ValueError('Source URL required')
 u=urlsplit(value)
 if u.scheme!='https' or u.username or u.password or u.query or not u.hostname or any(ord(c)<33 for c in value):raise ValueError('Expected a credential-free HTTPS source URL')
 if u.hostname not in {'github.com','api.github.com','raw.githubusercontent.com','councilof.ai','huggingface.co','developer.crowdstrike.com','www.palantir.com'}:raise ValueError('Unreviewed source host')
 return value

def normalize(source,now):
 if not isinstance(source,dict):raise ValueError('Source observation must be object')
 url=public_url(source.get('url'));collected=timestamp(source.get('retrieved_at'))
 if collected>now:raise ValueError('Future source observation')
 state=source.get('availability')
 if state not in ['AVAILABLE','UNAVAILABLE']:raise ValueError('Explicit collection availability required')
 age=(now-collected).total_seconds();freshness='CURRENT_READ' if age<=86400 else 'STALE_READ'
 meta=source.get('metadata')
 if state=='AVAILABLE':
  if not isinstance(meta,dict) or not re.fullmatch('[a-f0-9]{64}',source.get('raw_sha256','')):raise ValueError('Available observation needs metadata and exact source-byte hash')
  allowed={'title','state','merged','draft','head_sha','merge_sha','updated_at','published_at','tag','text_sha256','content_sha256','role'}
  meta={k:v for k,v in meta.items() if k in allowed}
  for k,v in meta.items():
   if k not in ['merged','draft'] and (not isinstance(v,str) or len(v)>2000):raise ValueError('Metadata must be bounded scalar text')
   if k in ['text_sha256','content_sha256'] and not re.fullmatch('[a-f0-9]{64}',v):raise ValueError('Invalid source content digest')
  for k in ['merged','draft']:
   if k in meta and type(meta[k])is not bool:raise ValueError('Boolean field is not a boolean')
 else:meta=None
 status='UNVERIFIED'
 if state=='UNAVAILABLE':status='VISIBILITY_GAP'
 elif freshness=='STALE_READ':status='STALE_OBSERVATION'
 elif meta.get('merged')is True:status='SOURCE_MERGED_NOT_DEPLOYMENT'
 elif meta.get('state')=='closed' and meta.get('merged')is False:status='CLOSED_UNMERGED'
 elif meta.get('state')=='open':status='OPEN_UPSTREAM_RECORD'
 elif meta.get('tag'):status='PUBLISHED_RELEASE_NOT_LOCAL_ACCEPTANCE'
 else:status='PUBLIC_SOURCE_READ'
 # Exclude retrieval time, counters and update timestamps from substantive revision identity.
 semantic={k:v for k,v in (meta or {}).items() if k!='updated_at'}
 logical={'url':url,'availability':state,'metadata':semantic}
 return {'source_id':digest({'url':url}),'revision_id':digest(logical),'url':url,'label':str(source.get('label','Public source'))[:240],
   'retrieved_at':collected.isoformat(),'source_updated_at':(meta or {}).get('updated_at'),'raw_sha256':source.get('raw_sha256') if state=='AVAILABLE' else None,
   'availability':state,'freshness':freshness,'status':status,'metadata':meta,'failure_kind':str(source.get('failure_kind','unavailable'))[:80] if state=='UNAVAILABLE' else None}

def build(observations,plan,as_of,previous=None,reproduction=None):
 now=timestamp(as_of)
 if not isinstance(observations,list) or len(observations)>80:raise ValueError('At most 80 explicit observations')
 sources={}
 for source in observations:
  row=normalize(source,now);key=row['source_id']
  if key in sources:
   prior=sources[key]
   if row['retrieved_at']==prior['retrieved_at'] and row['revision_id']!=prior['revision_id']:raise ValueError('Conflicting same-time source observations')
   if row['retrieved_at']<prior['retrieved_at']:continue
  sources[key]=row
 sources=dict(sorted(sources.items()))
 old={}
 if previous is not None:
  if previous.get('schema')!=SCHEMA or digest({k:v for k,v in previous.items() if k!='report_id'})!=previous.get('report_id'):raise ValueError('Previous report content does not verify')
  if timestamp(previous['as_of'])>now:raise ValueError('Previous report is from the future')
  old={r['source_id']:r for r in previous['sources']}
 changes=[]
 for key,row in sources.items():
  prior=old.get(key)
  if previous is None:kind='BASELINE_OBSERVATION'
  elif prior is None:kind='NEWLY_OBSERVED_SOURCE'
  elif row['revision_id']!=prior['revision_id']:
   if row['availability']!=prior['availability']:kind='VISIBILITY_CHANGED'
   else:
    a={k:v for k,v in (prior.get('metadata') or {}).items() if k!='updated_at'}
    b={k:v for k,v in (row.get('metadata') or {}).items() if k!='updated_at'}
    shared=set(a)&set(b)
    kind='SOURCE_CHANGED' if any(a[k]!=b[k] for k in shared) else 'OBSERVATION_COVERAGE_CHANGED'
  elif row['freshness']!=prior['freshness']:kind='FRESHNESS_CHANGED'
  else:continue
  changes.append({'finding_id':digest({'source_id':key,'revision_id':row['revision_id'],'kind':kind,'freshness':row['freshness']}),'kind':kind,'source_id':key,'url':row['url'],'status':row['status'],
    'previous_revision':prior['revision_id'] if prior else None,'current_revision':row['revision_id'],'review_state':'PENDING_HUMAN_REVIEW','action':'Inspect the exact source change and applicable acceptance boundary; source availability or merge is not execution, deployment, adoption or authority.'})
 for key,prior in old.items():
  if key not in sources:changes.append({'finding_id':digest({'source_id':key,'kind':'NOT_OBSERVED_THIS_RUN'}),'kind':'NOT_OBSERVED_THIS_RUN','source_id':key,'url':prior['url'],'status':'COVERAGE_GAP','review_state':'PENDING_HUMAN_REVIEW','action':'Collect the missing source before inferring removal, resolution or success.'})
 opportunities=plan.get('opportunities',[])
 if not isinstance(opportunities,list) or len(opportunities)>100:raise ValueError('Invalid plan')
 ids=[r.get('id') for r in opportunities]
 if len(set(ids))!=len(ids) or not all(isinstance(i,str) and re.fullmatch(r'[A-Z]{1,4}-\d\d',i) for i in ids):raise ValueError('Duplicate or invalid plan identifiers')
 work=[]
 for r in opportunities:
  work.append({'id':r['id'],'priority':r.get('priority'),'area':r.get('area'),'opening':r.get('opening'),
    'acceptance':r.get('acceptance'),'owner_gate':r.get('gate'),'state':'RESEARCH_OR_EXISTING_OWNER_WORK_NOT_CLOSED_BY_THIS_REPORT',
    'sources':r.get('sources',''),'review_state':'PENDING_HUMAN_REVIEW'})
 checks=None
 if reproduction is not None:
  if reproduction.get('schema')!='csoai.controlled-reproduction/1':raise ValueError('Unsupported reproduction record')
  after=reproduction.get('candidate',{});before=reproduction.get('baseline',{});rows=after.get('checks',[])
  for part in [before,after]:
   cases=part.get('checks',[])
   if not isinstance(cases,list) or not cases or len(cases)>500:raise ValueError('Invalid reproduction case list')
   if type(part.get('passed'))is not int or type(part.get('total'))is not int:raise ValueError('Invalid reproduction counts')
   if any(not isinstance(x,dict) or type(x.get('satisfied'))is not bool or not isinstance(x.get('case'),str) for x in cases):raise ValueError('Invalid reproduction case')
   if len({x['case'] for x in cases})!=len(cases):raise ValueError('Duplicate reproduction case')
   if part['total']!=len(cases) or part['passed']!=sum(x['satisfied'] for x in cases):raise ValueError('Reproduction summary does not match observed rows')
  if {x['case'] for x in before['checks']}!={x['case'] for x in rows} or reproduction.get('disabled_guard_detected')is not True:raise ValueError('Reproduction cases or negative control do not agree')
  checks={'record_sha256':digest(reproduction),'source_commit':reproduction['source_commit'],'baseline_passed':before.get('passed'),'candidate_passed':after['passed'],'cases':after['total'],'negative_control_detected':True,'scope':reproduction['scope'],'limits':reproduction['limits']}
  for r in work:
   if r['id']=='RH-01':r['state']='CONTROLLED_REPRODUCTION_AND_CANDIDATE_NOT_UPSTREAM_CLOSED'
 report={'schema':SCHEMA,'as_of':now.isoformat(),'signature_status':'UNSIGNED','review_only':True,'grants_authority':False,'previous_report_id':previous.get('report_id') if previous else None,
   'comparison':'ACTUAL_PREVIOUS_PACK' if previous else 'UNAVAILABLE_NO_BASELINE','plan_digest':digest(plan),'sources':list(sources.values()),'findings':changes,'work':work,'controlled_reproduction':checks,
   'counts':{'planned_opportunities':len(work),'unique_source_locations':len(sources),'distinct_source_revisions':len({r['revision_id'] for r in sources.values()}),'unavailable':sum(r['availability']=='UNAVAILABLE' for r in sources.values()),'stale_reads':sum(r['freshness']=='STALE_READ' for r in sources.values()),'changed_records':sum(c['kind'] in ['SOURCE_CHANGED','VISIBILITY_CHANGED','FRESHNESS_CHANGED'] for c in changes),'observation_coverage_changes':sum(c['kind'] in ['NEWLY_OBSERVED_SOURCE','OBSERVATION_COVERAGE_CHANGED','NOT_OBSERVED_THIS_RUN'] for c in changes),'integrations_closed':0},
   'value_boundary':'Reusable code, discriminating cases and source-bound history can be counted. Copies, daily re-reads and report generation are not new measurements, customers, exclusive IP rights, certification, or monetary valuation.'}
 report['report_id']=digest(report);return report

def markdown(r):
 lines=['# Council of AI — engineering evidence review','',f"Observed: {r['as_of']} · UNSIGNED · REVIEW ONLY",'',f"Report: `{r['report_id']}`",'',f"{r['counts']['planned_opportunities']} tracked opportunities; {r['counts']['unique_source_locations']} unique source locations; {r['counts']['unavailable']} unavailable; {r['counts']['stale_reads']} stale; {r['counts']['changed_records']} changes against an actual prior pack.",f"Comparison: {r['comparison']}. This is source readback, not fresh model measurement.",'','## Findings and human actions','']
 for f in r['findings']:lines += [f"### {f['kind']}: {f['status']}",f"Source: {f['url']}",f"Action: {f['action']}",'']
 if r['controlled_reproduction']:
  c=r['controlled_reproduction'];lines+=['## Scoped engineering result',f"Pinned MiDojo collector/orchestrator: baseline {c['baseline_passed']}/{c['cases']}; candidate {c['candidate_passed']}/{c['cases']}; deliberately removed guard detected.",c['scope'],*c['limits'],'']
 lines+=['## Opportunity queue','']
 for w in r['work']:lines += [f"### {w['id']} · {w['priority']} · {w['area']}",w['opening']or'',f"State: {w['state']}",f"Acceptance: {w['acceptance']}",f"Gate: {w['owner_gate']}",'']
 lines+=['## Rights and value',r['value_boundary'],'No external organisation was notified by this report. No historical signature was changed and no learning completion grants execution permission.']
 return '\n'.join(lines)+'\n'

def write_pack(report:dict,out:Path):
 out.mkdir(parents=True,exist_ok=False)
 artifacts={'report.json':canonical(report),'findings.json':canonical(report['findings']),'report.md':markdown(report).encode(),'review.html':render(report).encode()}
 for name,b in artifacts.items():(out/name).write_bytes(b)
 index={'schema':'csoai.review-pack-index/1','report_id':report['report_id'],'signature_status':'UNSIGNED','files':[{'name':k,'sha256':hashlib.sha256(v).hexdigest(),'bytes':len(v)} for k,v in artifacts.items()],'authority':False}
 (out/'index.json').write_bytes(canonical(index));return index

def verify_pack(out:Path):
 index=read(out/'index.json')
 if index.get('schema')!='csoai.review-pack-index/1' or index.get('signature_status')!='UNSIGNED' or index.get('authority')is not False:raise ValueError('Unknown pack profile')
 expected={'report.json','findings.json','report.md','review.html'}
 if {x.get('name') for x in index['files']}!=expected or len(index['files'])!=4:raise ValueError('Unexpected pack file set')
 for f in index['files']:
  p=out/f['name']
  if p.is_symlink():raise ValueError('Symlink in pack')
  if p.stat().st_size>MAX_BYTES:raise ValueError('Oversized pack file')
  b=p.read_bytes()
  if len(b)>MAX_BYTES or len(b)!=f['bytes'] or hashlib.sha256(b).hexdigest()!=f['sha256']:raise ValueError('Changed pack bytes')
 r=read(out/'report.json')
 if digest({k:v for k,v in r.items() if k!='report_id'})!=r.get('report_id') or r['report_id']!=index['report_id']:raise ValueError('Changed report identity')
 if read(out/'findings.json')!=r['findings'] or (out/'report.md').read_bytes()!=markdown(r).encode() or (out/'review.html').read_bytes()!=render(r).encode():raise ValueError('Inconsistent report projections')
 return {'state':'BYTES_AND_PROJECTIONS_MATCH','report_id':r['report_id'],'issuer_authenticated':False,'grants_authority':False}

def main():
 p=argparse.ArgumentParser(description=__doc__);s=p.add_subparsers(dest='cmd',required=True)
 b=s.add_parser('build');b.add_argument('--captures',type=Path,required=True);b.add_argument('--plan',type=Path,required=True);b.add_argument('--as-of',required=True);b.add_argument('--previous',type=Path);b.add_argument('--reproduction',type=Path);b.add_argument('--out',type=Path,required=True)
 v=s.add_parser('verify');v.add_argument('directory',type=Path)
 a=p.parse_args()
 if a.cmd=='verify':print(json.dumps(verify_pack(a.directory)));return
 captures=read(a.captures);plan=read(a.plan);prev=read(a.previous)if a.previous else None;repro=read(a.reproduction)if a.reproduction else None
 r=build(captures,plan,a.as_of,prev,repro);print(json.dumps(write_pack(r,a.out),indent=2))
if __name__=='__main__':main()
