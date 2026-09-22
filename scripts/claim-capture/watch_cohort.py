#!/usr/bin/env python3
"""Revisit 100 named subjects using source APIs; never execute listed MCP servers or buy services."""
from __future__ import annotations
import collections, concurrent.futures, datetime as dt, fcntl, json, os, sys, urllib.parse
from pathlib import Path
import claim_capture as cc
BASE=Path(__file__).resolve().parent;STATE=BASE/'state'

def run():
 lock=(STATE/'watch.lock').open('w')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:return 75
 watch=json.loads((STATE/'watchlist.json').read_text());members=watch['members']
 if len(members)>100:raise ValueError('Watchlist exceeds 100-subject cap')
 latest=STATE/'watch-latest.json';previous=json.loads(latest.read_text()) if latest.exists() else None
 if previous and (dt.datetime.now(dt.timezone.utc)-dt.datetime.fromisoformat(previous['as_of'])).total_seconds()<3*3600:
  print('NOOP: watchlist already refreshed in the past 3 hours');return 0
 bulk={};failures={}
 for source in ['stablecoins','protocols']:
  try:
   d,r=cc.fetch(cc.SOURCES[source],STATE);items=d['peggedAssets'] if source=='stablecoins' else d
   if not isinstance(items,list) or not items:raise ValueError('Empty or invalid full response')
   bulk[source]=({str(x['id']):(i,x) for i,x in enumerate(items)},r)
  except Exception as e:failures[source]=f'{type(e).__name__}: {str(e)[:160]}'
 def inspect(m):
  source=m['population'];identity=m['subject_id'];watch_id=source+':'+identity
  try:
   if source in bulk:
    idx,rec=bulk[source]
    if identity not in idx:return {'watch_id':watch_id,'population':source,'state':'NOT_SEEN_IN_COMPLETE_RESPONSE','delisting_asserted':False}
    i,item=idx[identity];pointer=('/peggedAssets' if source=='stablecoins' else '')+'/'+str(i)
   elif source in failures:raise ValueError(failures[source])
   else:
    if source=='mcp_versions':url=cc.SOURCES[source]+'/'+urllib.parse.quote(identity.rsplit('@',1)[0],safe='')+'/versions/latest'
    elif source=='x402_services':url=cc.SOURCES[source]+'/'+urllib.parse.quote(identity,safe='')
    else:raise ValueError('Unsupported watch source')
    item,rec=cc.fetch(url,STATE);pointer=''
   row=cc.make_record(source,item,rec,pointer)
   return {'watch_id':watch_id,'population':source,'state':'CLAIM_CAPTURED','observed_subject_id':row['subject_id'],'claim':row['claim'],'content_sha256':row['content_sha256'],'source_url':row['source_url'],'source_body_sha256':row['source_body_sha256'],'source_pointer':pointer,'observed_at':row['observed_at']}
  except Exception as e:return {'watch_id':watch_id,'population':source,'state':'UNCHECKABLE','reason':f'{type(e).__name__}: {str(e)[:160]}','delisting_asserted':False}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(inspect,members))
 rows.sort(key=lambda r:r['watch_id']);old={r['watch_id']:r for r in previous['observations']} if previous else {};events=[]
 for r in rows:
  o=old.get(r['watch_id'])
  if not o or o['state']!='CLAIM_CAPTURED' or r['state']!='CLAIM_CAPTURED':continue
  if r['content_sha256']!=o['content_sha256']:
   fields=sorted(k for k in r['claim'].keys()|o['claim'].keys() if r['claim'].get(k)!=o['claim'].get(k))
   events.append({'watch_id':r['watch_id'],'kind':'OBSERVED_CHANGE','changed_fields':fields,'before':{k:o['claim'].get(k) for k in fields},'after':{k:r['claim'].get(k) for k in fields},'review_state':'UNREVIEWED','correction_asserted':False})
 counts=dict(collections.Counter(r['state'] for r in rows));doc={'schema':'csoai.watch-cohort-observation/0.1','as_of':cc.now(),'watchlist_size':len(members),'counts':counts,'observations':rows,'events':events,'merkle_root':cc.merkle_root([cc.encoded(r) for r in rows]).hex(),'signature_state':'UNSIGNED','anchor_state':'NOT_SUBMITTED','truth_measured':False,'source_api_requests_budget':52,'no_listed_server_executed':True,'no_payments_made':True}
 out=STATE/'watch-runs'/dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ');out.mkdir(parents=True,exist_ok=True);cc.write_json(out/'snapshot.json',doc);cc.write_json(latest,doc)
 print(json.dumps({'status':'WATCH_COMPLETED','subjects':len(members),'counts':counts,'observed_changes':len(events),'requests_budget':52,'root':doc['merkle_root']},indent=2));return 0 if counts.get('UNCHECKABLE',0)==0 else 2
if __name__=='__main__':sys.exit(run())
