#!/usr/bin/env python3
"""Build verifiable, bounded release bundles; never claim a paid sale or truth verdict."""
from __future__ import annotations
import argparse, base64, collections, datetime as dt, fcntl, hashlib, json, os, re, shutil, subprocess, sys, urllib.parse, zipfile
from pathlib import Path
import claim_capture as cc
from sign_capture import sign
ROOT=Path(__file__).resolve().parent
CALENDARS=['https://alice.btc.calendar.opentimestamps.org','https://bob.btc.calendar.opentimestamps.org','https://finney.calendar.eternitywall.com']

def read(p): return json.loads(Path(p).read_bytes())
def proof_state(run, upgrade=False):
 from opentimestamps.core.timestamp import DetachedTimestampFile
 from opentimestamps.core.serialize import BytesDeserializationContext
 from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
 from opentimestamps.core.op import OpSHA256
 proof=run/'root.json.ots'; root=run/'root.json'; log=''; upgraded_rc=None
 if not proof.exists(): return {'state':'NOT_STAMPED','bitcoin_chain_verified':False}
 before=cc.sha(proof.read_bytes())
 if upgrade:
  backup=run/'proof-history'/f'{before}.ots';backup.parent.mkdir(exist_ok=True)
  if not backup.exists():shutil.copy2(proof,backup)
  cmd=['ots','--no-default-whitelist']
  for url in CALENDARS:cmd+=['-l',url]
  try:
   r=subprocess.run(cmd+['upgrade',str(proof)],capture_output=True,text=True,timeout=75)
   log=(r.stdout+r.stderr)[-3000:];upgraded_rc=r.returncode
  except subprocess.TimeoutExpired:log='Upgrade timeout; no Bitcoin verification asserted.'
 parsed=DetachedTimestampFile.deserialize(BytesDeserializationContext(proof.read_bytes()))
 if not isinstance(parsed.file_hash_op,OpSHA256) or parsed.file_digest!=hashlib.sha256(root.read_bytes()).digest():raise ValueError('OTS proof does not bind to root file')
 heights=sorted({a.height for _,a in parsed.timestamp.all_attestations() if isinstance(a,BitcoinBlockHeaderAttestation)})
 verified=False;verification_log='No Bitcoin block attestation present.'
 if heights and upgrade:
  try:
   r=subprocess.run(['ots','verify',str(proof)],capture_output=True,text=True,timeout=20)
   verification_log=(r.stdout+r.stderr)[-1500:]
   verified=r.returncode==0 and 'Success!' in verification_log
  except subprocess.TimeoutExpired:verification_log='Local-node verification timed out.'
 state='BITCOIN_VERIFIED_LOCAL_NODE' if verified else 'BITCOIN_ATTESTATION_PRESENT_UNVERIFIED' if heights else 'PENDING_CALENDAR_COMMITMENT'
 return {'state':state,'bitcoin_chain_verified':verified,'verification_method':'OpenTimestamps client with local Bitcoin node' if verified else None,'block_heights_present':heights,'proof_sha256':cc.sha(proof.read_bytes()),'proof_bytes':proof.stat().st_size,'proof_binds_to_file_digest':True,'file_sha256':cc.sha(root.read_bytes()),'upgrade_exit':upgraded_rc,'upgrade_note':log,'verification_note':verification_log}

def changes_between(previous,current):
 old={(r['population'],r['subject_id']):r for r in previous['records']} if previous else {}
 now={(r['population'],r['subject_id']):r for r in current['records']}
 out=[];stats=collections.Counter()
 for key,row in now.items():
  before=old.get(key)
  kind='NEW_OBSERVATION' if before is None else 'UNCHANGED' if before['content_sha256']==row['content_sha256'] else 'OBSERVED_CHANGE'
  stats[kind]+=1
  if kind!='OBSERVED_CHANGE':continue
  fields=sorted(k for k in before['claim'].keys()|row['claim'].keys() if before['claim'].get(k)!=row['claim'].get(k))
  important=any(k in {'url','version','packages','remotes','payment_asset','payment_network','http_method','price_usd','x402_payment_valid','pegType','pegMechanism','chains'} for k in fields)
  deltas={}
  for k in fields:
   a=before['claim'].get(k);b=row['claim'].get(k)
   if isinstance(a,(float,int)) and not isinstance(a,bool) and isinstance(b,(float,int)) and not isinstance(b,bool):
    rel=None if a==0 else (b-a)/abs(a);deltas[k]={'before':a,'after':b,'difference':b-a,'fractional_change':rel}
    important=important or rel is not None and abs(rel)>=0.10
  if key[0]=='stablecoins':
   before_supply=before['claim'].get('circulating',{}).get('peggedUSD');after_supply=row['claim'].get('circulating',{}).get('peggedUSD')
   if isinstance(before_supply,(int,float)) and isinstance(after_supply,(int,float)) and before_supply!=after_supply:
    relative=None if before_supply==0 else (after_supply-before_supply)/abs(before_supply)
    deltas['circulating.peggedUSD']={'before':before_supply,'after':after_supply,'difference':after_supply-before_supply,'fractional_change':relative}
    important=important or relative is not None and abs(relative)>0.01
   # USD peg only: do not treat non-USD assets as depegged from one dollar.
   after_price=row['claim'].get('price')
   if 'price' in fields and row['claim'].get('pegType')=='peggedUSD' and isinstance(after_price,(int,float)):
    important=important or abs(after_price-1)>0.01
  out.append({'kind':kind,'population':key[0],'subject_id':key[1],'changed_fields':fields,'before':{k:before['claim'].get(k) for k in fields},'after':{k:row['claim'].get(k) for k in fields},'before_content_sha256':before['content_sha256'],'after_content_sha256':row['content_sha256'],'numeric_deltas':deltas,'material_review_candidate':bool(important),'review_state':'UNREVIEWED','correction_asserted':False})
 complete={s['source'] for s in current['sources'] if s['coverage']=='COMPLETE_UPSTREAM_RESPONSE' and s['status']=='OK'}
 for key in old.keys()-now.keys():
  if key[0] in complete:
   stats['NOT_SEEN_IN_COMPLETE_SNAPSHOT']+=1
   out.append({'kind':'NOT_SEEN_IN_COMPLETE_SNAPSHOT','population':key[0],'subject_id':key[1],'delisting_asserted':False,'review_state':'UNREVIEWED'})
 return {'schema':'csoai.observed-change-report/0.1','before_run':previous['run_id'] if previous else None,'after_run':current['run_id'],'counts':dict(stats),'events':out,'meaning':'Snapshot differences, not proof of error, misconduct, or a correction. Partial windows never establish deletion.'}

def safe_for_publication(raw):
 text=raw.decode('utf-8',errors='ignore')
 if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bhf_[A-Za-z0-9]{25,}|\bghp_[A-Za-z0-9]{25,}|\bsk-proj-[A-Za-z0-9_-]{30,}',text):raise ValueError('Potential credential pattern: publication held')

def build(state,upgrade=False):
 runs=sorted(p for p in (state/'runs').iterdir() if (p/'snapshot.json').is_file() and (p/'root.json').is_file() and (p/'receipt.json').is_file() and all(x['status']=='OK' for x in read(p/'root.json')['source_status']))
 if not runs:raise ValueError('No completed snapshots')
 latest=runs[-1];current=read(latest/'snapshot.json');previous=read(runs[-2]/'snapshot.json') if len(runs)>1 else None
 for run in runs[-2:]:
  cc.verify(run/'snapshot.json');root=read(run/'root.json');snap=read(run/'snapshot.json')
  if root['snapshot_sha256']!=cc.sha((run/'snapshot.json').read_bytes()) or root['merkle_root']!=snap['merkle_root'] or root['records']!=snap['count']:raise ValueError('Root/snapshot mismatch')
 statuses={}
 for run in runs[-3:]:
  cached=run/'anchor-status.json'
  if cached.exists() and (not upgrade or read(cached).get('bitcoin_chain_verified')):status=read(cached)
  else:status=proof_state(run,upgrade)
  if not cached.exists() or read(cached)!=status:cc.write_json(cached,status)
  statuses[run.name]=status
 export=state/'release';export.mkdir(exist_ok=True)
 runout=export/'runs'/latest.name;runout.mkdir(parents=True,exist_ok=True)
 # Published snapshots are source-scoped public fields. Raw page responses remain private to the local archive.
 for run in runs[-2:]:
  dest=export/'runs'/run.name;dest.mkdir(parents=True,exist_ok=True)
  for name in ['root.json','snapshot.json']:
   raw=(run/name).read_bytes();safe_for_publication(raw);(dest/name).write_bytes(raw)
  sig=sign(run/'root.json')
  cc.write_json(dest/'root.json.sig.json',sig)
  status=statuses.get(run.name) or proof_state(run)
  if (run/'root.json.ots').exists():
   pd=dest/'proofs';pd.mkdir(exist_ok=True);(pd/(status['proof_sha256']+'.ots')).write_bytes((run/'root.json.ots').read_bytes())
  cc.write_json(dest/'anchor-status.json',status)
 report=changes_between(previous,current);cc.write_json(runout/'changes.json',report)
 populations={}
 for src in current['sources']:
  name=src['source'];rows=[r for r in current['records'] if r['population']==name]
  doc={'schema':'csoai.claim-population-slice/0.1','run_id':current['run_id'],'population':name,'as_of':current['created_at'],'count':len(rows),'unique_entities':len({r['entity_id'] for r in rows}),'coverage':src['coverage'],'source_status':src['status'],'source_errors':src['errors'],'source_total_reported':src['source_total_reported'],'evidence_state':'CLAIM_CAPTURED','truth_measured':False,'snapshot_sha256':read(latest/'root.json')['snapshot_sha256'],'snapshot_merkle_root':current['merkle_root'],'records':rows}
  path=runout/'populations'/f'{name}.json';cc.write_json(path,doc)
  populations[name]={k:doc[k] for k in ['population','as_of','count','unique_entities','coverage','source_status','source_errors','source_total_reported','evidence_state']}
  populations[name].update(path=str(path.relative_to(export)),sha256=cc.sha(path.read_bytes()))
 # Freeze a small explicit monitoring cohort once; discovery population and frequent watchlist remain distinct.
 watchpath=state/'watchlist.json'
 if not watchpath.exists():
  selected=[]
  for source in cc.SOURCES:
   rows=[r for r in current['records'] if r['population']==source]
   if source=='stablecoins':rows.sort(key=lambda r:-(r['claim'].get('circulating',{}).get('peggedUSD') or 0))
   if source=='protocols':rows.sort(key=lambda r:-(r['claim'].get('tvl') or 0))
   selected += [{'population':r['population'],'subject_id':r['subject_id']} for r in rows[:25]]
  cc.write_json(watchpath,{'schema':'csoai.monitoring-cohort/0.1','seed_run':current['run_id'],'members':selected,'selection':'25 per captured population: largest available supply/TVL for economic series; stable lexical first window for registry records. Operational seed, not a market ranking.'})
 watch=read(watchpath);seen={(r['population'],r['subject_id']) for r in current['records']};covered=[m for m in watch['members'] if (m['population'],m['subject_id']) in seen]
 cohort={'members':len(watch['members']),'observed_this_run':len(covered),'not_observed_this_run':len(watch['members'])-len(covered),'not_observed_is_not_delisted':True,'selection':watch['selection']}
 cc.write_json(runout/'watchlist-coverage.json',cohort)
 material=[e for e in report['events'] if e.get('material_review_candidate')]
 lines=['# CSOAI observed changes', '',f"Run `{current['run_id']}`: {current['count']:,} captured subject/version records.",f"Previous run: `{report['before_run']}`.",f"Observed changes: {report['counts'].get('OBSERVED_CHANGE',0):,}. Material-review candidates: {len(material):,}.",'','## Evidence boundary','Captured upstream statements, not verified truth. Changes are unreviewed. No correction or customer sale is asserted.',f"Timestamp state: {statuses[latest.name]['state']}. Signature state: UNSIGNED.",'','## Population coverage']
 for name,p in populations.items():lines.append(f"- {name}: {p['count']:,} records, {p['unique_entities']:,} entities; {p['coverage']}.")
 lines+=['','## Review candidates']+[f"- {e['population']} / {e['subject_id']}: {', '.join(e['changed_fields'])}. Unreviewed; see changes.json for before/after values." for e in material[:30]]
 lines+=['','## Reproduce','Download snapshot.json and root.json. Run the included claim_capture.py with --verify snapshot.json. Verify root.json.ots against root.json using OpenTimestamps. Raw source responses remain archived locally.']
 (runout/'report.md').write_text('\n'.join(lines)+'\n')
 # Proof sample uses the complete run, not a separately rooted slice.
 cc.write_json(runout/'inclusion-proofs.json',{'root':current['merkle_root'],'snapshot_count':current['count'],'samples':current['inclusion_proof_samples']})
 # A proof carries exact serialized leaf bytes, index and size; no cross-language float reserialization.
 leaves=[cc.encoded(r) for r in current['records']]
 usdt=next((i for i,r in enumerate(current['records']) if r['population']=='stablecoins' and r['claim'].get('symbol')=='USDT'),None)
 if usdt is not None:
  proof={'schema':'csoai.record-inclusion-proof/0.1','tree_size':len(leaves),'leaf_index':usdt,'root_hex':current['merkle_root'],'leaf_bytes_base64':base64.b64encode(leaves[usdt]).decode(),'audit_path_hex':[p['hash'] for p in cc.inclusion(leaves,usdt)],'root_manifest_sha256':cc.sha((latest/'root.json').read_bytes()),'root_manifest_path':f'runs/{latest.name}/root.json','statement':'Membership in this capture root, not verification of USDT supply, reserves or source truth.'}
  cc.write_json(runout/'USDT-inclusion-proof.json',proof)
 (export/'code').mkdir(exist_ok=True)
 for name in ['claim_capture.py','delivery_pipeline.py','verify_csoai_delivery.py','test_delivery_pipeline.py','test_buyer_verifier.py','watch_cohort.py','sign_capture.py']:(export/'code'/name).write_bytes((ROOT/name).read_bytes())
 (export/'THREAT_MODEL.md').write_bytes((ROOT/'THREAT_MODEL.md').read_bytes())
 (export/'README.md').write_text('# CSOAI public claim capture\n\nImmutable dated snapshots and digest-checked population slices. Not certification, an issuer attestation, or proof that a captured claim is true.\n\nAll source rights remain with their respective publishers. Raw upstream bodies are retained locally; source URLs and hashes identify them. The enclosing repository license does not relicense third-party source material. No vendor-page prose is republished by this pipeline.\n\nOpen latest.json for a pinned Hugging Face revision and exact file digests. Capture and publication are separate. Bitcoin confirmation is reported only from successful OpenTimestamps verification. No payment or customer outcome is asserted.\n')
 if (state/'watch-latest.json').exists():
  watch_observation=read(state/'watch-latest.json')
  cc.write_json(runout/'watch-observations.json',watch_observation)
  cohort.update(last_watch_at=watch_observation['as_of'],last_watch_counts=watch_observation['counts'],observed_watch_changes=len(watch_observation['events']))
 files={str(p.relative_to(export)):{'sha256':cc.sha(p.read_bytes()),'bytes':p.stat().st_size} for p in export.rglob('*') if p.is_file() and p.name not in ['release.json','bundle.zip']}
 for rel in files:
  if rel.startswith('/') or '..' in Path(rel).parts:raise ValueError('Unsafe export path')
 manifest={'schema':'csoai.claim-capture-release/0.1','run_id':latest.name,'as_of':current['created_at'],'record_count':current['count'],'snapshot_merkle_root':current['merkle_root'],'anchor':statuses[latest.name],'signature_state':'DETACHED_CAPTURE_KEY_SIGNATURE','signature_key_id':sign(latest/'root.json')['key_id_sha256'],'identity_assurance':'self-published capture key, not board identity','populations':populations,'change_counts':report['counts'],'material_review_candidates':len(material),'reviewed_events':0,'materiality_policy':{'version':'1','stablecoin_supply_fraction':0.01,'usd_peg_price_absolute_deviation':0.01,'protocol_tvl_fraction':0.10,'identity_payment_chain_changes':'review','thresholds_are_operational_not_risk_grades':True},'watchlist':cohort,'paid_deliveries_verified':None,'files':files}
 cc.write_json(export/'release.json',manifest)
 archive=state/'release.zip';temp=archive.with_suffix('.tmp')
 with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
  for name in sorted([*files,'release.json']):z.write(export/name,name)
 os.replace(temp,archive)
 print(json.dumps({'run_id':latest.name,'records':current['count'],'changes':report['counts'],'review_candidates':len(material),'watchlist':cohort,'anchor':statuses[latest.name]['state'],'release_sha256':cc.sha((export/'release.json').read_bytes()),'zip_bytes':archive.stat().st_size,'files':len(files)},indent=2))
 return 0

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--state',type=Path,default=ROOT/'state');ap.add_argument('--upgrade',action='store_true');a=ap.parse_args()
 lock=(a.state/'delivery.lock').open('w')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:print('HELD: release build already running');return 75
 return build(a.state,a.upgrade)
if __name__=='__main__':sys.exit(main())
