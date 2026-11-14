#!/usr/bin/env python3
"""Portable, offline inspection of existing private source-consistency deliveries.
No execution of bundled code, network, payment, signing, new measurement or public upload.
A self-consistent packet does NOT authenticate its issuer. Supply an independently obtained
expected packet digest and request ID when continuity with an earlier receipt matters.
"""
from __future__ import annotations
import argparse,hashlib,io,json,re,sqlite3,stat,zipfile
from pathlib import Path

HEX=re.compile(r'^[0-9a-f]{64}$')
FILES={'request.json','delivery.json','observation.json','source.body','method.py','observer.py'}
LIMIT=2_000_000
ROW_KEYS={'gspc-board':('axes','axis'),'xrpl-register':('assets','sha256'),'swift-register':('rows','id'),'gpai-notices':('cards','id'),'humanoid-deployments':('rows','id'),'stablecoin-index':('assets','id'),'stablecoin-supply':('rows','asset_id'),'lab-artifacts':('rows','org'),'mcp-registry':('servers','id'),'regulatory-adapters':('authority_adapters','id')}

def digest(raw:bytes)->str:return hashlib.sha256(raw).hexdigest()
def canonical(value)->bytes:return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=True,allow_nan=False).encode()
def strict_json(raw:bytes):
    if len(raw)>LIMIT:raise ValueError('JSON_SIZE_LIMIT')
    def unique(pairs):
        result={}
        for key,value in pairs:
            if key in result:raise ValueError('DUPLICATE_JSON_KEY')
            result[key]=value
        return result
    return json.loads(raw.decode('utf-8'),object_pairs_hook=unique,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('NONFINITE_JSON')))
def must(condition,message):
    if not condition:raise ValueError(message)
def hash_id(value):must(isinstance(value,str) and HEX.fullmatch(value),'INVALID_DIGEST_OR_REQUEST_ID');return value

def inspect_members(members:dict[str,bytes],expected_request_id:str|None=None)->dict:
    must(set(members)==FILES,'PACKET_MEMBER_SET')
    q,d,o=(strict_json(members[x]) for x in ['request.json','delivery.json','observation.json'])
    must(all(isinstance(v,dict) for v in [q,d,o]),'OBJECT_REQUIRED')
    must(q.get('schema')=='csoai.private-source-request/0.1' and q.get('method')=='source-consistency/1','REQUEST_SCHEMA')
    expected_fields={'schema','source_id','source_sha256','method','method_sha256','request_id','observer_source_sha256','observer_receipt_sha256','source_url','source_as_of','admitted_at','authority','budget','publication'}
    must(set(q)==expected_fields,'UNRECOGNISED_REQUEST_CONFIGURATION')
    must(q['authority']=='OWNER_AUTHORISED_PRIVATE_SOURCE_CONSISTENCY_ONLY' and q['publication']=='PRIVATE_UNSIGNED','REQUEST_AUTHORITY_OVERCLAIM')
    must(q['budget']=={'new_paid_requests':0,'inference':0,'wallet_actions':0} and all(type(v) is int for v in q['budget'].values()),'UNEXPECTED_EXECUTION_BUDGET')
    rid=hash_id(q.get('request_id'))
    if expected_request_id is not None:must(rid==hash_id(expected_request_id),'EXPECTED_REQUEST_MISMATCH')
    identity={k:q[k] for k in ['schema','source_id','source_sha256','method','method_sha256']}
    must(digest(canonical(identity))==rid,'REQUEST_SCOPE_MISMATCH')
    for key,name in [('source_sha256','source.body'),('method_sha256','method.py'),('observer_source_sha256','observer.py'),('observer_receipt_sha256','observation.json')]:
        must(digest(members[name])==hash_id(q.get(key)),'REQUEST_'+key.upper()+'_MISMATCH')
    must(d.get('schema')=='csoai.private-evidence-delivery/0.1','DELIVERY_SCHEMA')
    for key in ['request_id','source_sha256','method_sha256','observer_receipt_sha256']:
        must(d.get(key)==q.get(key),'DELIVERY_'+key.upper()+'_MISMATCH')
    must(d.get('request_scope_sha256')==rid,'DELIVERY_SCOPE_MISMATCH')
    must(o.get('source_sha256')==q['observer_source_sha256'],'OBSERVER_SOURCE_MISMATCH')
    must(o.get('state') in ('OBSERVED','PARTIAL') and isinstance(o.get('sources'),list),'OBSERVER_STATE')
    source=[r for r in o['sources'] if isinstance(r,dict) and r.get('id')==q['source_id']]
    must(len(source)==1,'AMBIGUOUS_OBSERVER_SOURCE');source=source[0]
    must(source.get('state')!='UNAVAILABLE' and source.get('body_sha256')==q['source_sha256'] and source.get('url')==q['source_url'],'OBSERVER_SUBJECT_BINDING')
    must(source.get('source_as_of')==q.get('source_as_of'),'SOURCE_DATE_MISMATCH')
    data=strict_json(members['source.body']);must(isinstance(data,dict),'SOURCE_OBJECT_REQUIRED')
    result=d.get('measurement');must(isinstance(result,dict),'MEASUREMENT_REQUIRED')
    must(result.get('scope')=='RETAINED_SOURCE_STRUCTURE_AND_IDENTITY_CONSISTENCY' and result.get('instrument')==q['method'],'INSTRUMENT_MISMATCH')
    count=None;states={};unit=None
    if q['source_id'] in ROW_KEYS:
        unit,field=ROW_KEYS[q['source_id']];rows=data.get(unit);must(isinstance(rows,list),'SOURCE_COLLECTION_REQUIRED')
        ids=set()
        for row in rows:
            must(isinstance(row,dict),'ROW_OBJECT_REQUIRED');value=row.get(field)
            must(type(value) in (str,int) and str(value)!='','RECORD_ID_REQUIRED');identity=str(value)
            must(identity not in ids,'DUPLICATE_RECORD_ID');ids.add(identity)
            status=row.get('state',row.get('status','NOT_RECORDED'));status=status if isinstance(status,str) else 'UNRECOGNISED_STATE';states[status]=states.get(status,0)+1
        count=len(rows)
        must(source.get('observed_collection_count')==count,'OBSERVER_COUNT_MISMATCH')
    must(result.get('record_count')==count and result.get('record_unit')==unit,'DELIVERY_RECORD_COUNT_MISMATCH')
    must(result.get('recorded_state_counts')==states,'DELIVERY_STATE_TALLY_MISMATCH')
    must(result.get('unique_record_ids') is (True if unit else None),'DELIVERY_IDENTITY_FLAG')
    declared=next((data[k] for k in ['asset_count','universe_asset_count','n'] if k in data),None)
    if declared is not None:must(type(declared) is int and declared>=0,'INVALID_DECLARED_COUNT')
    agrees=count==declared if count is not None and declared is not None else None
    must(result.get('declared_count')==declared and result.get('declared_count_agrees') is agrees,'DECLARED_COUNT_MISMATCH')
    must(result.get('source_as_of')==q.get('source_as_of'),'DELIVERY_DATE_MISMATCH')
    must(result.get('model_performance')=='NOT_ASSESSED' and result.get('organisation_compliance')=='NOT_ASSESSED','ASSESSMENT_OVERCLAIM')
    must(result.get('chain_state_verified') is False and result.get('signatures_verified') is False,'VERIFICATION_OVERCLAIM')
    must(d.get('signature') is None and d.get('signature_state')=='NOT_SIGNED' and d.get('root_state')=='NOT_ROOTED' and d.get('witness_state')=='NOT_WITNESSED','AUTHENTICATION_OVERCLAIM')
    must(d.get('paid') is False and d.get('public') is False,'PAYMENT_OR_PUBLICATION_OVERCLAIM')
    return {'state':'SELF_CONSISTENT_SOURCE_PACKET','request_id':rid,'source_id':q['source_id'],'source_url':q['source_url'],'source_as_of':q.get('source_as_of'),'records_recounted':count,'recorded_state_counts_recounted':states,'delivery_sha256':digest(members['delivery.json']),'source_sha256':q['source_sha256'],'method_sha256':q['method_sha256'],'observation_sha256':q['observer_receipt_sha256'],'full_request_record_sha256':digest(members['request.json']),'publisher_authenticated':False,'code_executed':False,'new_measurements':0,'signatures_verified':False,'chain_state_verified':False,'scope':'Byte/scope checks and independent recount of retained source metadata. Upstream measured states are reported labels, not measurements made by this verifier.'}

def encode_packet(members:dict[str,bytes])->bytes:
    result=inspect_members(members)
    manifest={'schema':'csoai.inspection-packet/1','request_id':result['request_id'],'files':{k:{'sha256':digest(v),'bytes':len(v)} for k,v in sorted(members.items())},'authority':'PRIVATE_UNSIGNED_SOURCE_CONSISTENCY_ONLY','code_execution':'NEVER_REQUIRED','issuer_authentication':'NOT_ESTABLISHED'}
    output=io.BytesIO()
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as z:
        for name,body in sorted({**members,'manifest.json':canonical(manifest)}.items()):
            must(len(body)<=LIMIT,'MEMBER_SIZE_LIMIT');info=zipfile.ZipInfo(name,date_time=(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100600<<16;z.writestr(info,body)
    return output.getvalue()

def verify_packet(raw:bytes,expected_request_id:str|None=None,expected_packet_sha256:str|None=None)->dict:
    must(len(raw)<=4_000_000,'ARCHIVE_SIZE_LIMIT');sha=digest(raw)
    if expected_packet_sha256 is not None:must(sha==hash_id(expected_packet_sha256),'EXPECTED_PACKET_DIGEST_MISMATCH')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        infos=z.infolist();names=[i.filename for i in infos]
        must(len(names)==len(set(names))==7 and set(names)==FILES|{'manifest.json'},'ZIP_MEMBER_SET')
        must(sum(i.file_size for i in infos)<=8_000_000,'ZIP_TOTAL_SIZE_LIMIT')
        for item in infos:must(item.file_size<=LIMIT and not item.flag_bits&1 and not stat.S_ISLNK(item.external_attr>>16),'UNSAFE_ZIP_MEMBER')
        content={i.filename:z.read(i) for i in infos}
    manifest=strict_json(content.pop('manifest.json'));must(isinstance(manifest,dict) and manifest.get('schema')=='csoai.inspection-packet/1','MANIFEST_SCHEMA')
    must(set(manifest.get('files',{}))==FILES,'MANIFEST_MEMBER_SET')
    for name,body in content.items():must(manifest['files'][name]=={'bytes':len(body),'sha256':digest(body)},'MANIFEST_DIGEST_MISMATCH')
    report=inspect_members(content,expected_request_id);must(manifest.get('request_id')==report['request_id'],'MANIFEST_REQUEST_MISMATCH')
    report.update(packet_sha256=sha,expected_packet_digest_matched=expected_packet_sha256 is not None,expected_request_id_matched=expected_request_id is not None)
    return report

def export_existing(root:Path,request_id:str,destination:Path)->dict:
    hash_id(request_id);root=root.resolve();db=root/'assurance/queue.sqlite';must(db.is_file() and not db.is_symlink(),'MISSING_QUEUE')
    connection=sqlite3.connect('file:'+db.as_posix()+'?mode=ro',uri=True);connection.row_factory=sqlite3.Row
    try:row=connection.execute('SELECT request,state,result_sha FROM jobs WHERE id=?',(request_id,)).fetchone()
    finally:connection.close()
    must(row is not None and row['state']=='DELIVERED_UNSIGNED','DELIVERED_REQUEST_REQUIRED');q=strict_json(row['request'].encode());delivery_sha=hash_id(row['result_sha'])
    paths={'delivery.json':root/'assurance/deliveries'/(delivery_sha+'.json'),'observation.json':root/'state/receipts'/(hash_id(q['observer_receipt_sha256'])+'.json'),'source.body':root/'state/blobs'/(hash_id(q['source_sha256'])+'.body'),'method.py':root/'assurance_delivery.py','observer.py':root/'living_observatory.py'}
    members={'request.json':canonical(q)}
    for name,path in paths.items():
        must(path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(root) and path.stat().st_size<=LIMIT,'MISSING_OR_UNSAFE_SOURCE');members[name]=path.read_bytes()
    must(digest(members['delivery.json'])==delivery_sha,'STORED_DELIVERY_DIGEST_MISMATCH')
    raw=encode_packet(members);report=verify_packet(raw,request_id,digest(raw));destination.mkdir(parents=True,exist_ok=True)
    target=destination/('inspection-'+request_id+'.zip')
    if target.exists():must(target.is_file() and not target.is_symlink() and target.read_bytes()==raw,'EXISTING_EXPORT_DIFFERS')
    else:
        with target.open('xb') as f:f.write(raw)
    must(target.read_bytes()==raw,'EXPORT_READBACK_MISMATCH')
    return {**report,'export_path':str(target),'bytes':len(raw),'operation':'EXPORTED_EXISTING_RETAINED_EVIDENCE','new_execution':False}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    e=sub.add_parser('export');e.add_argument('--root',type=Path,required=True);e.add_argument('--request-id',required=True);e.add_argument('--out',type=Path,required=True)
    v=sub.add_parser('verify');v.add_argument('packet',type=Path);v.add_argument('--expected-request-id');v.add_argument('--expected-sha256')
    a=p.parse_args()
    try:
        result=export_existing(a.root,a.request_id,a.out) if a.command=='export' else verify_packet(a.packet.read_bytes(),a.expected_request_id,a.expected_sha256)
        print(json.dumps(result,indent=2,allow_nan=False))
    except (OSError,ValueError,KeyError,TypeError,zipfile.BadZipFile) as error:
        print(json.dumps({'state':'REJECTED_OR_UNCHECKABLE','reason':str(error),'issuer_authenticated':False}));raise SystemExit(2)
