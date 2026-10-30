#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Retain repeatable research comparisons using the existing evidence event.

No network, signing, model call, executable pack code or execution authority.
A matching repository revision is a scoped comparison, not runtime qualification.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone, timedelta
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import tempfile
import event as E
from render import otel, sarif

SCHEMA='csoai.research-cycle/0.1'
VERSION='0.1.0'
HERE=Path(__file__).resolve().parent
FILES={'catalogue.json','observations.json','binding.json','events.jsonl','summary.json','evaluation.otlp.json','evidence.sarif.json'}
MAX_BYTES=8_000_000
PIN=re.compile(r'^[0-9a-f]{40}$')
DIGEST=re.compile(r'^[0-9a-f]{64}$')
REPO=re.compile(r'^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$')
LIMITS=[
 'Comparison of retained repository observations against a reviewed research snapshot only.',
 'Collector declarations and HTTPS locators do not authenticate the publisher or establish independent review.',
 'No upstream code or model executed; no product quality, institutional acceptance or execution authority established.',
 'An equal revision does not refresh historical vendor pages, licences or installed dependencies.',
 'Unsigned local evidence; no public anchor or verified human approval.'
]

class CycleError(ValueError): pass

def sha(raw): return hashlib.sha256(raw).hexdigest()
def encoded(value): return E.jcs(value)+b'\n'
def parse(raw):
 if len(raw)>MAX_BYTES: raise CycleError('input exceeds byte limit')
 def pairs(items):
  out={}
  for k,v in items:
   if k in out: raise CycleError('duplicate JSON property')
   out[k]=v
  return out
 def bad(x): raise CycleError('non-finite JSON number')
 try:return json.loads(raw,object_pairs_hook=pairs,parse_constant=bad)
 except (json.JSONDecodeError,UnicodeError,RecursionError) as exc:raise CycleError('invalid JSON input') from exc

def timestamp(text):
 if not isinstance(text,str) or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)',text):raise CycleError('explicit UTC timestamp required')
 try:return datetime.fromisoformat(text.replace('Z','+00:00'))
 except ValueError as exc:raise CycleError('invalid UTC timestamp') from exc

def source_pins():
 names=['research_cycle.py','event.py','render/__init__.py','render/otel.py','render/sarif.py']
 return {n:sha((HERE/n).read_bytes()) for n in names}

def compare(reviewed,observed):return 'CONSISTENT' if reviewed==observed else 'DIVERGENT'

def records(catalogue):
 if not isinstance(catalogue,dict) or catalogue.get('schema')!='council.research-catalogue/1':raise CycleError('unsupported catalogue')
 rows=catalogue.get('records')
 if not isinstance(rows,list) or not 1<=len(rows)<=2000:raise CycleError('bounded nonempty catalogue required')
 ids=set();repos=set();selected=[]
 for r in rows:
  if not isinstance(r,dict) or not isinstance(r.get('id'),str) or not r['id'] or r['id'] in ids:raise CycleError('invalid or duplicate record id')
  ids.add(r['id'])
  if not r.get('repo'):continue
  if not isinstance(r['repo'],str) or not REPO.fullmatch(r['repo']) or r['repo'] in repos:raise CycleError('invalid or duplicate repository')
  if not isinstance(r.get('commit'),str) or not PIN.fullmatch(r['commit']):raise CycleError('full reviewed commit required')
  if r.get('runtime_status')!='NOT_RUN':raise CycleError('research input cannot assert runtime qualification')
  repos.add(r['repo']);selected.append(r)
 if not selected:raise CycleError('catalogue has no repositories')
 return sorted(selected,key=lambda r:r['id']),len(rows)-len(selected)

def derive(cat_raw,obs_raw,binding):
 cat=parse(cat_raw); selected,others=records(cat);observations=parse(obs_raw)
 asof=timestamp(binding['as_of']);hours=binding['max_age_hours']
 if type(hours)!=int or not 1<=hours<=168:raise CycleError('age window must be an integer from 1 to 168 hours')
 if binding.get('implementation_pins')!=source_pins():raise CycleError('trusted reader revision differs; requalify instead of importing bundle code')
 if not isinstance(observations,list) or len(observations)>2000:raise CycleError('bounded observation list required')
 lookup={};known={r['repo'] for r in selected}
 for row in observations:
  if not isinstance(row,dict) or row.get('repo') not in known or row['repo'] in lookup:raise CycleError('unknown or duplicate observation')
  if not isinstance(row.get('observed_commit'),str) or not PIN.fullmatch(row['observed_commit']):raise CycleError('full observed commit required')
  when=timestamp(row.get('observed_at'))
  if when>asof:raise CycleError('observation is later than evaluation time')
  expected='https://api.github.com/repos/'+row['repo']+'/commits?per_page=1'
  if row.get('source_url')!=expected:raise CycleError('repository observation source mismatch')
  lookup[row['repo']]=row
 prior=binding.get('previous_event_ids',{})
 if not isinstance(prior,dict) or not all(k in known and isinstance(v,str) and re.fullmatch(r'sha256:[0-9a-f]{64}',v) for k,v in prior.items()):raise CycleError('invalid predecessor bindings')
 events=[];queue=[]
 for record in selected:
  repo=record['repo'];row=lookup.get(repo);actual=row['observed_commit'] if row else None
  if row is None:state='UNMEASURED';reason='NO_OBSERVATION'
  elif asof-timestamp(row['observed_at'])>timedelta(hours=hours):state='UNCHECKABLE';reason='OBSERVATION_TOO_OLD'
  else:state=compare(record['commit'],actual);reason='REVISION_MATCH' if state=='CONSISTENT' else 'UPSTREAM_CHANGED'
  # A real deliberately different input is passed through the same comparator.
  mutant=('1' if record['commit'][0]=='0' else '0')+record['commit'][1:]
  got=compare(record['commit'],mutant)
  if got!='DIVERGENT':raise CycleError('comparison negative control did not discriminate')
  event=E.build(subject={'kind':'repository','locator':'https://github.com/'+repo},
   claim={'text':'Retained repository observation matches the reviewed research revision.', 'source_sha256':sha(cat_raw),'read_at':binding['as_of']},
   method={'id':'csoai.research-revision-comparison','version':VERSION,'holder':'csoai'},
   declared={'record_id':record['id'],'reviewed_commit':record['commit'],'catalogue_sha256':sha(cat_raw)},
   observed={'commit':actual,'read_at':row['observed_at'] if row else binding['as_of'],'source_url':row['source_url'] if row else None,'reason':reason,'max_age_hours':hours},
   state=state,value=None,negative_control={'id':'different-revision-must-diverge','expected':'DIVERGENT','got':got},limits=LIMITS,supersedes=prior.get(repo))
  events.append(event)
  queue.append({'record_id':record['id'],'repo':repo,'state':state,'reason':reason,'event_id':event['event_id'],'supersedes':event['supersedes'],
   'reviewed_commit':record['commit'],'observed_commit':actual,'next_action':'REVIEW_UPSTREAM_DIFF' if state=='DIVERGENT' else 'COLLECT_CURRENT_OBSERVATION' if state in ('UNCHECKABLE','UNMEASURED') else 'RETAIN_AND_RECHECK',
   'automatic_adoption':False})
 summary={'schema':SCHEMA,'as_of':binding['as_of'],'repository_count':len(events),'non_repository_records_not_remeasured':others,
  'state_counts':dict(sorted(Counter(e['state'] for e in events).items())),'negative_controls_exercised':len(events),
  'prior_events_linked':sum(e['supersedes'] is not None for e in events),'queue':queue,'runtime_qualification':'NOT_RUN','grants_authority':False,'limits':LIMITS}
 return {'catalogue.json':cat_raw,'observations.json':obs_raw,'binding.json':encoded(binding),
  'events.jsonl':b''.join(encoded(e) for e in events),'summary.json':encoded(summary),
  'evaluation.otlp.json':encoded(otel.render_batch(events)),'evidence.sarif.json':encoded(sarif.render_batch(events))}

def read_regular(root,name):
 if name not in FILES|{'manifest.json'}:raise CycleError('unexpected bundle filename')
 root=Path(root)
 if root.is_symlink():raise CycleError('symlink bundle root rejected')
 fd=os.open(root,os.O_RDONLY|os.O_DIRECTORY|getattr(os,'O_NOFOLLOW',0))
 try:
  f=os.open(name,os.O_RDONLY|getattr(os,'O_NOFOLLOW',0),dir_fd=fd)
  with os.fdopen(f,'rb') as stream:
   info=os.fstat(stream.fileno())
   if not stat.S_ISREG(info.st_mode) or info.st_size>MAX_BYTES:raise CycleError('bounded regular bundle file required')
   raw=stream.read(MAX_BYTES+1)
   if len(raw)>MAX_BYTES:raise CycleError('bundle file too large')
   return raw
 finally:os.close(fd)

def verify(root,expected):
 if not isinstance(expected,str) or not DIGEST.fullmatch(expected):raise CycleError('independently selected manifest digest required')
 raw=read_regular(root,'manifest.json')
 if sha(raw)!=expected:raise CycleError('manifest differs from expected digest')
 manifest=parse(raw)
 if manifest.get('schema')!=SCHEMA or set(manifest.get('files',{}))!=FILES:raise CycleError('unsupported or incomplete file inventory')
 payload={}
 for name,pin in manifest['files'].items():
  data=read_regular(root,name)
  if not isinstance(pin,dict) or pin!={'sha256':sha(data),'bytes':len(data)}:raise CycleError('bundle byte mismatch: '+name)
  payload[name]=data
 binding=parse(payload['binding.json'])
 if manifest.get('cycle_id')!=sha(encoded({'catalogue':sha(payload['catalogue.json']),'observations':sha(payload['observations.json']),'binding':binding})):raise CycleError('cycle identity mismatch')
 if manifest.get('previous_manifest_sha256')!=binding.get('previous_manifest_sha256'):raise CycleError('predecessor mismatch')
 actual=derive(payload['catalogue.json'],payload['observations.json'],binding)
 if payload!=actual:raise CycleError('derived evidence or carrier accounting differs')
 summary=parse(payload['summary.json'])
 return {'state':'VERIFIED_LOCAL_DERIVATION','manifest_sha256':expected,'cycle_id':manifest['cycle_id'],'events':summary['repository_count'],'state_counts':summary['state_counts'],
  'prior_chain':'REFERENCE_ONLY' if manifest.get('previous_manifest_sha256') else 'NO_PARENT','producer_authenticated':False,'runtime_qualification':'NOT_RUN','grants_authority':False}

def build(catalogue,observations,store,as_of,max_age_hours=24,previous=None,expected_previous=None):
 cat_raw=Path(catalogue).read_bytes();obs_raw=Path(observations).read_bytes()
 selected,_=records(parse(cat_raw));prior={}
 if bool(previous)!=bool(expected_previous):raise CycleError('previous directory and its selected digest must be supplied together')
 if previous:
  previous_result=verify(previous,expected_previous)
  previous_binding=parse(read_regular(previous,'binding.json'))
  if timestamp(as_of)<timestamp(previous_binding['as_of']):raise CycleError('evaluation predates its predecessor')
  if cat_raw==read_regular(previous,'catalogue.json') and obs_raw==read_regular(previous,'observations.json') and as_of==previous_binding['as_of'] and max_age_hours==previous_binding['max_age_hours']:
   return previous_result|{'disposition':'REUSED','directory':str(previous)}
  prior_events=[parse(line) for line in read_regular(previous,'events.jsonl').splitlines()]
  known={r['repo'] for r in selected}
  prior={ev['subject']['locator'].removeprefix('https://github.com/'):ev['event_id'] for ev in prior_events if ev['subject']['locator'].removeprefix('https://github.com/') in known}
 binding={'schema':SCHEMA,'as_of':as_of,'max_age_hours':max_age_hours,'implementation_pins':source_pins(),'previous_manifest_sha256':expected_previous,'previous_event_ids':prior}
 payload=derive(cat_raw,obs_raw,binding)
 cid=sha(encoded({'catalogue':sha(cat_raw),'observations':sha(obs_raw),'binding':binding}))
 manifest={'schema':SCHEMA,'cycle_id':cid,'previous_manifest_sha256':expected_previous,'files':{name:{'sha256':sha(raw),'bytes':len(raw)} for name,raw in sorted(payload.items())}}
 manifest_raw=encoded(manifest);digest=sha(manifest_raw)
 root=Path(store)
 if root.is_symlink():raise CycleError('symlink output store rejected')
 root.mkdir(parents=True,exist_ok=True);destination=root/cid
 with (root/'.research-cycle.lock').open('a+b') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX)
  if destination.exists():
   result=verify(destination,digest);return result|{'disposition':'REUSED','directory':str(destination)}
  tmp=Path(tempfile.mkdtemp(prefix='.cycle-stage-',dir=root))
  try:
   for name,raw in {**payload,'manifest.json':manifest_raw}.items():
    with (tmp/name).open('xb') as out:out.write(raw);out.flush();os.fsync(out.fileno())
   verify(tmp,digest)
   os.rename(tmp,destination)
   dfd=os.open(root,os.O_RDONLY|os.O_DIRECTORY)
   try:os.fsync(dfd)
   finally:os.close(dfd)
  finally:
   if tmp.exists():shutil.rmtree(tmp)
 return verify(destination,digest)|{'disposition':'CREATED','directory':str(destination)}

def verify_chain(root,expected,previous,expected_previous):
 current=verify(root,expected);parent=verify(previous,expected_previous)
 binding=parse(read_regular(root,'binding.json'));prior_binding=parse(read_regular(previous,'binding.json'))
 if binding['previous_manifest_sha256']!=expected_previous:raise CycleError('selected predecessor does not match chain')
 if timestamp(binding['as_of'])<timestamp(prior_binding['as_of']):raise CycleError('evaluation predates its predecessor')
 prior_events=[parse(line) for line in read_regular(previous,'events.jsonl').splitlines()]
 selected,_=records(parse(read_regular(root,'catalogue.json')));known={r['repo'] for r in selected}
 expected_ids={e['subject']['locator'].removeprefix('https://github.com/'):e['event_id'] for e in prior_events if e['subject']['locator'].removeprefix('https://github.com/') in known}
 if binding['previous_event_ids']!=expected_ids:raise CycleError('predecessor event links differ')
 return current|{'prior_chain':'SELECTED_PARENT_VERIFIED','prior_manifest_sha256':expected_previous,'prior_event_links':len(expected_ids)}

def packet(root,expected):
 verify(root,expected)
 return {'schema':'csoai.research-cycle-download/0.1','manifest_text':read_regular(root,'manifest.json').decode('utf-8'),
         'files':{name:read_regular(root,name).decode('utf-8') for name in sorted(FILES)}}

def verify_packet(raw,expected):
 obj=parse(raw)
 if not isinstance(obj,dict) or set(obj)!={'schema','manifest_text','files'} or obj['schema']!='csoai.research-cycle-download/0.1':raise CycleError('unsupported download packet')
 if not isinstance(obj['manifest_text'],str) or not isinstance(obj['files'],dict) or set(obj['files'])!=FILES or not all(isinstance(v,str) for v in obj['files'].values()):raise CycleError('invalid packet file inventory')
 with tempfile.TemporaryDirectory(prefix='csoai-research-reader-') as d:
  for name,text in {**obj['files'],'manifest.json':obj['manifest_text']}.items():
   raw=text.encode('utf-8')
   if len(raw)>MAX_BYTES:raise CycleError('packet file too large')
   (Path(d)/name).write_bytes(raw)
  return verify(d,expected)

def main():
 p=argparse.ArgumentParser(description=__doc__);s=p.add_subparsers(dest='command',required=True)
 b=s.add_parser('build');b.add_argument('--catalogue',required=True);b.add_argument('--observations',required=True);b.add_argument('--store',required=True);b.add_argument('--as-of',required=True);b.add_argument('--max-age-hours',type=int,default=24);b.add_argument('--previous');b.add_argument('--expected-previous')
 c=s.add_parser('verify-chain');c.add_argument('directory');c.add_argument('--expected-manifest',required=True);c.add_argument('--previous',required=True);c.add_argument('--expected-previous',required=True)
 v=s.add_parser('verify');v.add_argument('directory');v.add_argument('--expected-manifest',required=True)
 d=s.add_parser('verify-packet');d.add_argument('packet');d.add_argument('--expected-manifest',required=True)
 a=p.parse_args()
 try:
  if a.command=='build':result=build(a.catalogue,a.observations,a.store,a.as_of,a.max_age_hours,a.previous,a.expected_previous)
  elif a.command=='verify':result=verify(a.directory,a.expected_manifest)
  elif a.command=='verify-chain':result=verify_chain(a.directory,a.expected_manifest,a.previous,a.expected_previous)
  else:result=verify_packet(Path(a.packet).read_bytes(),a.expected_manifest)
  print(json.dumps(result,indent=2));return 0
 except (ValueError,KeyError,TypeError,OSError) as exc:
  print(json.dumps({'state':'REJECTED','reason':str(exc)}),file=sys.stderr);return 2
if __name__=='__main__':raise SystemExit(main())
