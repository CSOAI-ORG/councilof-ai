#!/usr/bin/env python3
"""Private bounded Request Attention -> measured source consistency -> retrieval.
Reuses the living observer. No inference, money, signing, publication or shell tools.
"""
from __future__ import annotations
import argparse, datetime as dt, hashlib, importlib.util, json, re, sqlite3
from pathlib import Path

VERSION='source-consistency/1'
HEX=re.compile(r'^[0-9a-f]{64}$')
MAX_JOBS=6

def now():return dt.datetime.now(dt.timezone.utc).isoformat()
def digest(b):return hashlib.sha256(b).hexdigest()
def canonical(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=True,allow_nan=False).encode()
def observer(root):
    s=importlib.util.spec_from_file_location('bounded_source_observer',root/'living_observatory.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def read_latest(root):
    m=observer(root);report=m.status(root/'state')
    if report.get('state') not in ('OBSERVED','PARTIAL'):raise ValueError('NO_VALID_OBSERVER_RECEIPT')
    if report.get('freshness')!='CURRENT_WINDOW':raise ValueError('OBSERVER_RECEIPT_STALE')
    return m,report

def connection(root):
    state=root/'assurance';state.mkdir(mode=0o700,exist_ok=True)
    db=sqlite3.connect(state/'queue.sqlite',timeout=5);db.row_factory=sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL');db.execute('PRAGMA foreign_keys=ON')
    db.execute('CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, request TEXT NOT NULL, state TEXT NOT NULL, result_sha TEXT, error TEXT, created TEXT NOT NULL, completed TEXT)')
    db.commit();return db

def source_request(root,source_id):
    m,report=read_latest(root)
    sources={i:(u,c) for i,u,c in m.SOURCES}
    if source_id not in sources:raise ValueError('SOURCE_NOT_ALLOWLISTED')
    if source_id not in m.JSON_SOURCE_IDS:raise ValueError('DOCUMENT_REQUIRES_SEMANTIC_REVIEW')
    row=next((r for r in report['sources'] if r['id']==source_id),None)
    if not row or row['state']=='UNAVAILABLE' or not HEX.fullmatch(row.get('body_sha256','')):raise ValueError('SOURCE_UNAVAILABLE')
    if row.get('url')!=sources[source_id][0]:raise ValueError('SOURCE_ID_URL_MISMATCH')
    b=(root/'state/blobs'/(row['body_sha256']+'.body')).read_bytes()
    if len(b)>1_000_000 or digest(b)!=row['body_sha256']:raise ValueError('SOURCE_DIGEST_MISMATCH')
    method_sha=digest(Path(__file__).read_bytes())
    identity={'schema':'csoai.private-source-request/0.1','source_id':source_id,'source_sha256':row['body_sha256'],'method':VERSION,'method_sha256':method_sha}
    return {**identity,'request_id':digest(canonical(identity)),'observer_receipt_sha256':report['retained_report_sha256'],'observer_source_sha256':report['source_sha256'],'source_url':row['url'],'source_as_of':row.get('source_as_of'),'admitted_at':now(),'authority':'OWNER_AUTHORISED_PRIVATE_SOURCE_CONSISTENCY_ONLY','budget':{'new_paid_requests':0,'inference':0,'wallet_actions':0},'publication':'PRIVATE_UNSIGNED'}

def admit(root,source_id):
    req=source_request(root,source_id)
    with connection(root) as db:
        db.execute('INSERT OR IGNORE INTO jobs(id,request,state,created) VALUES(?,?,?,?)',(req['request_id'],canonical(req).decode(),'QUEUED',req['admitted_at']))
        row=db.execute('SELECT id,state,result_sha FROM jobs WHERE id=?',(req['request_id'],)).fetchone()
    return dict(row)

def source_checks(root,req):
    m=observer(root);allowed={i:(u,c) for i,u,c in m.SOURCES}
    if req.get('source_id') not in allowed or req.get('source_url')!=allowed[req['source_id']][0]:raise ValueError('SOURCE_BINDING_MISMATCH')
    if req.get('method')!=VERSION or req.get('method_sha256')!=digest(Path(__file__).read_bytes()):raise ValueError('METHOD_REVIEW_REQUIRED')
    identity={k:req[k] for k in ('schema','source_id','source_sha256','method','method_sha256')}
    if req['request_id']!=digest(canonical(identity)) or not HEX.fullmatch(req['source_sha256']):raise ValueError('REQUEST_BINDING_MISMATCH')
    body=(root/'state/blobs'/(req['source_sha256']+'.body')).read_bytes()
    if len(body)>1_000_000 or digest(body)!=req['source_sha256']:raise ValueError('SOURCE_DIGEST_MISMATCH')
    data=json.loads(body,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('NONFINITE_JSON')))
    if not isinstance(data,dict):raise ValueError('SOURCE_NOT_OBJECT')
    collection=allowed[req['source_id']][1]
    inventory=m.row_inventory(body,req['source_id'],collection)
    count=len(inventory) if collection else None
    declared=next((data[k] for k in ('asset_count','universe_asset_count','n') if k in data),None)
    if declared is not None and (isinstance(declared,bool) or not isinstance(declared,int) or declared<0):raise ValueError('INVALID_DECLARED_DENOMINATOR')
    states={}
    for r in inventory.values():
        s=r.get('state',r.get('status','NOT_RECORDED'));s=s if isinstance(s,str) else 'UNRECOGNISED_STATE'
        states[s]=states.get(s,0)+1
    return {'instrument':VERSION,'scope':'RETAINED_SOURCE_STRUCTURE_AND_IDENTITY_CONSISTENCY','record_count':count,'record_unit':collection,'unique_record_ids':True if collection else None,'declared_count':declared,'declared_count_agrees':count==declared if count is not None and declared is not None else None,'recorded_state_counts':states,'payload_digest_verified':True,'source_as_of':req.get('source_as_of'),'organisation_compliance':'NOT_ASSESSED','model_performance':'NOT_ASSESSED','signatures_verified':False,'chain_state_verified':False}

def work(root,limit=MAX_JOBS):
    if isinstance(limit,bool) or not isinstance(limit,int) or not 1<=limit<=MAX_JOBS:raise ValueError('JOB_LIMIT')
    if (root/'state/STOP').exists():return {'state':'STOPPED','completed':[]}
    pin=root/'assurance/reviewed-source.sha256'
    if not pin.exists() or pin.read_text().strip()!=digest(Path(__file__).read_bytes()):return {'state':'SOURCE_REVIEW_REQUIRED','completed':[]}
    records=[]
    for _ in range(limit):
        db=connection(root)
        try:
            db.execute('BEGIN IMMEDIATE')
            job=db.execute("SELECT * FROM jobs WHERE state='QUEUED' ORDER BY created,id LIMIT 1").fetchone()
            if not job:db.commit();break
            req=json.loads(job['request'])
            try:
                result=source_checks(root,req)
                envelope={'schema':'csoai.private-evidence-delivery/0.1','request_id':job['id'],'request_scope_sha256':job['id'],'source_sha256':req['source_sha256'],'method_sha256':req['method_sha256'],'observer_receipt_sha256':req['observer_receipt_sha256'],'completed_at':now(),'measurement':result,'signature':None,'signature_state':'NOT_SIGNED','root_state':'NOT_ROOTED','witness_state':'NOT_WITNESSED','paid':False,'public':False}
                raw=canonical(envelope);sha=digest(raw);directory=root/'assurance/deliveries';directory.mkdir(exist_ok=True)
                path=directory/(sha+'.json')
                if not path.exists():
                    with path.open('xb') as f:f.write(raw)
                elif digest(path.read_bytes())!=sha:raise ValueError('EXISTING_DELIVERY_TAMPERED')
                db.execute("UPDATE jobs SET state='DELIVERED_UNSIGNED',result_sha=?,completed=? WHERE id=?",(sha,envelope['completed_at'],job['id']))
                records.append({'request_id':job['id'],'source_id':req['source_id'],'state':'DELIVERED_UNSIGNED','sha256':sha,'records':result['record_count']})
            except Exception as e:
                db.execute("UPDATE jobs SET state='REJECTED',error=?,completed=? WHERE id=?",(str(e)[:200],now(),job['id']))
                records.append({'request_id':job['id'],'state':'REJECTED','reason':str(e)[:200]})
            db.commit()
        finally:db.close()
    return {'state':'COMPLETED_BOUNDED_PASS','completed':records,'model_evaluations':0,'new_signatures':0}

def retrieve(root,request_id):
    if not isinstance(request_id,str) or not HEX.fullmatch(request_id):raise ValueError('INVALID_REQUEST_ID')
    with connection(root) as db:row=db.execute('SELECT * FROM jobs WHERE id=?',(request_id,)).fetchone()
    if not row:return {'state':'NOT_FOUND'}
    if row['state']!='DELIVERED_UNSIGNED':return {'state':row['state'],'request_id':request_id,'reason':row['error']}
    sha=row['result_sha'];path=root/'assurance/deliveries'/(sha+'.json');raw=path.read_bytes()
    if digest(raw)!=sha:raise ValueError('DELIVERY_DIGEST_MISMATCH')
    body=json.loads(raw);req=json.loads(row['request'])
    if body['request_id']!=request_id or body['source_sha256']!=req['source_sha256'] or body['method_sha256']!=req['method_sha256']:raise ValueError('DELIVERY_SCOPE_MISMATCH')
    return {'state':'RETRIEVED_UNSIGNED','request_id':request_id,'delivery_sha256':sha,'evidence':body,'receipt_integrity':'EXACT_BYTES_CHECKED','certification':False}

def status(root):
    p=root/'assurance/queue.sqlite'
    if not p.exists():return {'state':'NOT_INITIALISED','checked_here':False}
    db=sqlite3.connect(f'file:{p}?mode=ro',uri=True);db.row_factory=sqlite3.Row
    try:
        counts={r[0]:r[1] for r in db.execute('SELECT state,count(*) FROM jobs GROUP BY state')}
        latest=[dict(r) for r in db.execute('SELECT id,state,result_sha,completed,error FROM jobs ORDER BY completed DESC LIMIT 15')]
    finally:db.close()
    return {'state':'PRIVATE_SOURCE_DELIVERY','counts':counts,'recent':latest,'checked_here':False,'scope':'Source structure only; no model, legal, financial or human-study assessments','production_signed_delivery':False}

def tick(root):
    if (root/'state/STOP').exists():return {'state':'STOPPED'}
    pin=root/'assurance/reviewed-source.sha256'
    if not pin.exists() or pin.read_text().strip()!=digest(Path(__file__).read_bytes()):return {'state':'SOURCE_REVIEW_REQUIRED'}
    m,r=read_latest(root);queued=[];held=[]
    for source in r['sources']:
        try:queued.append(admit(root,source['id']))
        except ValueError as e:held.append({'source_id':source['id'],'reason':str(e)})
    result={'checked_at':now(),'admission':queued,'held':held,'execution':work(root),'state':status(root)}
    target=root/'assurance/last-tick.json';temp=target.with_suffix('.tmp');temp.write_text(json.dumps(result,indent=2));temp.replace(target);return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('action',choices=['tick','status','admit','retrieve','work']);p.add_argument('--root',type=Path,required=True);p.add_argument('--subject');a=p.parse_args()
    fn={'tick':lambda:tick(a.root),'status':lambda:status(a.root),'admit':lambda:admit(a.root,a.subject),'retrieve':lambda:retrieve(a.root,a.subject),'work':lambda:work(a.root)}
    try:print(json.dumps(fn[a.action](),indent=2,allow_nan=False))
    except Exception as e:print(json.dumps({'state':'FAILED_CLOSED','reason':str(e)}));raise SystemExit(2)
