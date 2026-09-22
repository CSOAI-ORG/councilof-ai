#!/usr/bin/env python3
"""CSOAI bounded public-claim capture. No inference, paid API, signing or indexing.
Raw response bytes are retained locally, not automatically redistributed.
Claim changes are observations, not proof that a source was wrong.
Sorted-key UTF-8 JSON serialization is specified here, not claimed JCS.
Tree shape and 0x00/0x01 prefixes follow RFC 9162 section 2.1.1.
"""
from __future__ import annotations
import argparse, collections, datetime as dt, fcntl, gzip, hashlib, json, os
from pathlib import Path
import sqlite3, sys, time, urllib.error, urllib.parse, urllib.request
UA='csoai-claim-capture/0.1 (+https://councilof.ai)'
SOURCES={'stablecoins':'https://stablecoins.llama.fi/stablecoins?includePrices=true','protocols':'https://api.llama.fi/protocols','mcp_versions':'https://registry.modelcontextprotocol.io/v0.1/servers','x402_services':'https://402index.io/api/v1/services'}
FIELDS={'stablecoins':('id','name','symbol','pegType','pegMechanism','price','circulating','chains'),'protocols':('id','name','slug','symbol','category','chains','tvl','chainTvls'),'mcp_versions':('name','title','version','websiteUrl','repository','packages','remotes'),'x402_services':('id','name','url','protocol','http_method','price_usd','payment_asset','payment_network','provider','health_status','x402_payment_valid','domain_verified')}
def now(): return dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
def encoded(obj): return json.dumps(obj,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
def sha(b): return hashlib.sha256(b).hexdigest()
def write_json(path,obj):
 path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
 tmp=path.with_name(path.name+'.tmp');tmp.write_bytes(encoded(obj)+b'\n');os.replace(tmp,path)
def merkle_root(leaves):
 if not leaves:return hashlib.sha256(b'').digest()
 if len(leaves)==1:return hashlib.sha256(b'\x00'+leaves[0]).digest()
 k=1<<((len(leaves)-1).bit_length()-1)
 return hashlib.sha256(b'\x01'+merkle_root(leaves[:k])+merkle_root(leaves[k:])).digest()
def inclusion(leaves,index):
 if not 0<=index<len(leaves):raise ValueError('leaf index out of range')
 if len(leaves)==1:return []
 k=1<<((len(leaves)-1).bit_length()-1)
 if index<k:return inclusion(leaves[:k],index)+[{'side':'right','hash':merkle_root(leaves[k:]).hex()}]
 return inclusion(leaves[k:],index-k)+[{'side':'left','hash':merkle_root(leaves[:k]).hex()}]
def verify_inclusion(leaf,path,root):
 digest=hashlib.sha256(b'\x00'+leaf).digest()
 for item in path:
  sibling=bytes.fromhex(item['hash'])
  if len(sibling)!=32 or item['side'] not in ('left','right'):return False
  pair=sibling+digest if item['side']=='left' else digest+sibling
  digest=hashlib.sha256(b'\x01'+pair).digest()
 return digest.hex()==root
class AllowedRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  p=urllib.parse.urlsplit(newurl)
  if p.scheme!='https' or p.hostname not in {urllib.parse.urlsplit(u).hostname for u in SOURCES.values()}:raise ValueError('Unexpected redirect host')
  return super().redirect_request(req,fp,code,msg,headers,newurl)
def fetch(url,state):
 opener=urllib.request.build_opener(AllowedRedirect())
 for attempt in range(3):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
   with opener.open(req,timeout=30) as r:
    raw=r.read(30_000_001)
    if len(raw)>30_000_000:raise ValueError('response exceeds 30 MB budget')
    data=json.loads(raw)
    receipt={'url':url,'final_url':r.geturl(),'observed_at':now(),'http_status':r.status,'body_sha256':sha(raw),'bytes':len(raw),'headers':{k:r.headers.get(k) for k in ('Content-Type','ETag','Last-Modified','Date') if r.headers.get(k)}}
   p=state/'raw'/f"{receipt['body_sha256']}.json.gz";p.parent.mkdir(parents=True,exist_ok=True)
   if not p.exists():
    tmp=p.with_suffix('.tmp');tmp.write_bytes(gzip.compress(raw,mtime=0));os.replace(tmp,p)
   receipt['raw_file']=str(p.relative_to(state));return data,receipt
  except urllib.error.HTTPError as e:
   if e.code not in (429,500,502,503,504) or attempt==2:raise
   try:delay=float(e.headers.get('Retry-After',''))
   except ValueError:delay=2**attempt
   if delay>30:raise RuntimeError(f'HTTP {e.code}: Retry-After exceeds run budget') from e
   time.sleep(max(1,delay))
 raise RuntimeError('fetch attempts exhausted')
def make_record(source,row,receipt,pointer):
 claim_row=row['server'] if source=='mcp_versions' else row
 claim={k:claim_row[k] for k in FIELDS[source] if k in claim_row}
 if source=='mcp_versions':
  if not claim.get('name') or not claim.get('version'):raise ValueError('MCP row missing name/version')
  identity=claim['name']+'@'+claim['version'];entity=claim['name']
 else:
  if claim.get('id') is None:raise ValueError('source row missing ID')
  identity=str(claim['id']);entity=identity
 core={'population':source,'subject_id':identity,'claim':claim}
 return dict(core,entity_id=entity,content_sha256=sha(encoded(core)),state='CLAIM_CAPTURED',source_url=receipt['url'],source_body_sha256=receipt['body_sha256'],source_pointer=pointer,observed_at=receipt['observed_at'])
def collect(source,state,cursor,page_budget):
 receipts=[];seen=set();errors=[];complete=False;total=None;start=cursor;duplicates=0;by_id={}
 for page in range(page_budget if source in ('mcp_versions','x402_services') else 1):
  params={}
  if source=='mcp_versions':
   params={'limit':100}
   if cursor:params['cursor']=cursor
  elif source=='x402_services':params={'protocol':'x402','limit':200,'offset':int(cursor or 0),'sort':'name','order':'asc'}
  url=SOURCES[source]+(('?'+urllib.parse.urlencode(params)) if params else '')
  if url in seen:errors.append('repeated pagination cursor');break
  seen.add(url)
  try:
   data,rec=fetch(url,state);receipts.append(rec)
   if source=='stablecoins':items=data['peggedAssets'];prefix='/peggedAssets'
   elif source=='protocols':items=data;prefix=''
   elif source=='mcp_versions':items=data['servers'];prefix='/servers'
   else:items=data['services'];total=int(data['total']);prefix='/services'
   if not isinstance(items,list):raise ValueError('source did not return a row list')
   for i,item in enumerate(items):
    row=make_record(source,item,rec,f'{prefix}/{i}');key=row['subject_id']
    if key in by_id:
     duplicates+=1
     if by_id[key]['content_sha256']!=row['content_sha256']:raise ValueError('conflicting duplicate ID '+key)
    else:by_id[key]=row
   if source in ('stablecoins','protocols'):
    if not items:raise ValueError('empty population response; baseline preserved')
    complete=True;cursor=None;total=len(items)
   elif source=='mcp_versions':cursor=data.get('metadata',{}).get('nextCursor');complete=not bool(cursor)
   else:
    cursor=int(cursor or 0)+len(items);complete=cursor>=total
    if not items and not complete:raise ValueError('empty page before reported total')
   if complete:cursor=None;break
   time.sleep(0.2)
  except Exception as e:errors.append(f'{type(e).__name__}: {e}'[:350]);break
 rows=list(by_id.values());coverage='COMPLETE_UPSTREAM_RESPONSE' if complete and start in (None,0,'') and not errors else 'PARTIAL_WINDOW'
 return rows,{'source':source,'coverage':coverage,'status':'ERROR' if errors else 'OK','rows':len(rows),'unique_entities':len({r['entity_id'] for r in rows}),'source_total_reported':total,'pages':len(receipts),'duplicate_rows':duplicates,'cursor_start':start,'cursor_next':cursor,'pagination_is_atomic':False,'errors':errors,'requests':receipts},cursor

def connect(path):
 db=sqlite3.connect(path);db.execute('PRAGMA journal_mode=WAL')
 db.execute('CREATE TABLE IF NOT EXISTS subjects (population TEXT, subject_id TEXT, content_hash TEXT, claim TEXT, first_seen TEXT, last_seen TEXT, PRIMARY KEY(population,subject_id))')
 return db
def apply_records(db,rows,sources):
 stats=collections.Counter();events=[]
 for row in rows:
  key=(row['population'],row['subject_id']);old=db.execute('SELECT content_hash,claim FROM subjects WHERE population=? AND subject_id=?',key).fetchone()
  kind='NEW_OBSERVATION' if old is None else 'UNCHANGED' if old[0]==row['content_sha256'] else 'OBSERVED_CHANGE';stats[kind]+=1
  if kind=='OBSERVED_CHANGE':
   before=json.loads(old[1]);after=row['claim']
   events.append({'kind':kind,'population':key[0],'subject_id':key[1],'before_hash':old[0],'after_hash':row['content_sha256'],'changed_fields':sorted(k for k in before.keys()|after.keys() if before.get(k)!=after.get(k)),'review_state':'UNREVIEWED','correction_asserted':False})
  db.execute('INSERT INTO subjects VALUES (?,?,?,?,?,?) ON CONFLICT(population,subject_id) DO UPDATE SET content_hash=excluded.content_hash,claim=excluded.claim,last_seen=excluded.last_seen',(*key,row['content_sha256'],encoded(row['claim']).decode(),row['observed_at'],row['observed_at']))
 for src in sources:
  if src['coverage']!='COMPLETE_UPSTREAM_RESPONSE' or src['status']!='OK':continue
  current={r['subject_id'] for r in rows if r['population']==src['source']};previous={r[0] for r in db.execute('SELECT subject_id FROM subjects WHERE population=?',(src['source'],))};absent=previous-current
  for identity in sorted(absent):events.append({'kind':'NOT_SEEN_IN_COMPLETE_SNAPSHOT','population':src['source'],'subject_id':identity,'review_state':'UNREVIEWED','delisting_asserted':False})
  stats['NOT_SEEN_IN_COMPLETE_SNAPSHOT']+=len(absent)
 return dict(stats),events

def stamp(root_path):
 from opentimestamps.calendar import RemoteCalendar
 from opentimestamps.core.timestamp import Timestamp,DetachedTimestampFile
 from opentimestamps.core.op import OpSHA256,OpAppend
 from opentimestamps.core.serialize import BytesSerializationContext,BytesDeserializationContext
 from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
 digest=bytes.fromhex(sha(root_path.read_bytes()));ts=Timestamp(digest);commitment=ts.ops.add(OpAppend(os.urandom(16))).ops.add(OpSHA256());accepted=[];errors=[]
 for url in ('https://alice.btc.calendar.opentimestamps.org','https://bob.btc.calendar.opentimestamps.org','https://finney.calendar.eternitywall.com'):
  try:commitment.merge(RemoteCalendar(url).submit(commitment.msg,timeout=15));accepted.append(url)
  except Exception as e:errors.append({'calendar':url,'error':type(e).__name__})
 if not accepted:return {'state':'NOT_STAMPED','errors':errors}
 proof=DetachedTimestampFile(OpSHA256(),ts);ctx=BytesSerializationContext();proof.serialize(ctx);target=root_path.with_suffix(root_path.suffix+'.ots');target.write_bytes(ctx.getbytes())
 parsed=DetachedTimestampFile.deserialize(BytesDeserializationContext(target.read_bytes()))
 if parsed.file_digest!=digest:raise ValueError('OTS proof does not bind to file')
 heights=[a.height for _,a in parsed.timestamp.all_attestations() if isinstance(a,BitcoinBlockHeaderAttestation)]
 return {'state':'BITCOIN_ATTESTATION_PRESENT_UNVERIFIED' if heights else 'PENDING_CALENDAR_COMMITMENT','proof_file':target.name,'proof_sha256':sha(target.read_bytes()),'proof_bytes':target.stat().st_size,'file_sha256':digest.hex(),'proof_parses':True,'proof_binds_to_file_digest':True,'bitcoin_chain_verified':False,'block_heights_present':heights,'calendars_accepted':accepted,'errors':errors}
def verify(snapshot_path):
 d=json.loads(Path(snapshot_path).read_text());rows=d['records'];leaves=[encoded(r) for r in rows];ids=[(r['population'],r['subject_id']) for r in rows]
 if ids!=sorted(set(ids)) or len(rows)!=d['count']:raise ValueError('duplicate rows, ordering or count mismatch')
 for r in rows:
  core={k:r[k] for k in ('population','subject_id','claim')}
  if sha(encoded(core))!=r['content_sha256']:raise ValueError('content hash mismatch')
 if merkle_root(leaves).hex()!=d['merkle_root']:raise ValueError('Merkle root mismatch')
 for p in d['inclusion_proof_samples']:
  if not verify_inclusion(leaves[p['index']],p['path'],d['merkle_root']):raise ValueError('inclusion proof mismatch')
 return {'records':len(rows),'root_valid':True,'sample_proofs_valid':len(d['inclusion_proof_samples'])}
def run(args):
 state=args.state.resolve();state.mkdir(parents=True,exist_ok=True);lock=(state/'capture.lock').open('w')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:print('HELD: another capture is running');return 75
 cp_path=state/'checkpoint.json';cp=json.loads(cp_path.read_text()) if cp_path.exists() else {'cursors':{}}
 if args.daily and cp.get('last_success_date')==now()[:10]:print('NOOP: daily capture already completed');return 0
 run_id=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');out=state/'runs'/run_id;out.mkdir(parents=True);start=time.monotonic();rows=[];sources=[];next_cursors={}
 for source in SOURCES:
  batch,meta,cursor=collect(source,state,None if args.restart_pages else cp.get('cursors',{}).get(source),args.pages);rows.extend(batch);sources.append(meta);next_cursors[source]=cursor
  print(source,meta['rows'],meta['coverage'],meta['status'],flush=True)
 rows.sort(key=lambda r:(r['population'],r['subject_id']))
 if not rows:write_json(out/'failed.json',{'sources':sources});return 2
 leaves=[encoded(r) for r in rows];root=merkle_root(leaves).hex();db=connect(state/'subjects.sqlite3')
 with db:
  counts,events=apply_records(db,rows,sources)
  document={'schema':'csoai.claim-capture/0.1','run_id':run_id,'created_at':now(),'honesty':'Public upstream records, not verified truth, not new unique entities per re-harvest; not search indexing.','hash_serialization':'sorted-key UTF-8 JSON, compact separators, no NaN; reference implementation included','tree':'RFC9162 section 2.1.1 shape; sha256; 0x00 leaf / 0x01 node; no odd-leaf duplication','count':len(rows),'merkle_root':root,'sources':sources,'change_counts':counts,'observed_changes':events,'records':rows,'inclusion_proof_samples':[{'index':i,'path':inclusion(leaves,i)} for i in sorted({0,len(rows)//2,len(rows)-1})]}
  snapshot=out/'snapshot.json';write_json(snapshot,document);validation=verify(snapshot)
  root_doc={'schema':'csoai.claim-capture-root/0.1','run_id':run_id,'records':len(rows),'merkle_root':root,'snapshot_sha256':sha(snapshot.read_bytes()),'source_status':[{'source':s['source'],'coverage':s['coverage'],'status':s['status'],'rows':s['rows']} for s in sources],'code_sha256':sha(Path(__file__).read_bytes()),'signature_state':'UNSIGNED'}
  root_path=out/'root.json';write_json(root_path,root_doc)
 summary=dict(root_doc,as_of=now(),change_counts=counts,verification=validation,elapsed_seconds=round(time.monotonic()-start,2),unique_subject_versions_seen=db.execute('SELECT COUNT(*) FROM subjects').fetchone()[0],source_population_counts={s['source']:{'rows':s['rows'],'unique_entities':s['unique_entities'],'source_total_reported':s['source_total_reported'],'coverage':s['coverage']} for s in sources},api_authentication_used=False,paid_api_calls=0,new_compute_provisioned=False,costs_note='No paid API calls; existing hardware, bandwidth and platform costs not audited.',index_listing_state='NOT_SUBMITTED_BY_THIS_RUN',delivery_state='LOCAL_FILES_ONLY')
 summary['anchor']={'state':'NOT_SUBMITTED','bitcoin_chain_verified':False}
 if args.stamp:
  try:summary['anchor']=stamp(root_path)
  except Exception as e:summary['anchor']={'state':'NOT_STAMPED','error':str(e)[:250],'bitcoin_chain_verified':False}
 write_json(out/'receipt.json',summary);cp['cursors']=next_cursors;cp['latest_run']=run_id
 success=all(s['status']=='OK' for s in sources) and (not args.stamp or summary['anchor']['state']!='NOT_STAMPED')
 if success:cp['last_success_date']=now()[:10]
 write_json(cp_path,cp);write_json(state/'latest.json',summary);print(json.dumps(summary,indent=2));db.close();return 0 if success else 2
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--state',type=Path,default=Path.home()/'.csoai/claim-harvest-state');ap.add_argument('--pages',type=int,default=6);ap.add_argument('--stamp',action='store_true');ap.add_argument('--daily',action='store_true');ap.add_argument('--restart-pages',action='store_true');ap.add_argument('--verify',type=Path);args=ap.parse_args()
 if not 1<=args.pages<=20:ap.error('pages must be 1..20')
 if args.verify:print(json.dumps(verify(args.verify)));return 0
 return run(args)
if __name__=='__main__':sys.exit(main())
