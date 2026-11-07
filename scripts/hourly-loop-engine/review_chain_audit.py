#!/usr/bin/env python3
"""Read-only audit of the existing loop report and review queue. Never executes work.

Checks local content integrity and handoff consistency, not publisher identity,
source truth, approval, signatures, completed reviews, or customer acceptance.
"""
from __future__ import annotations
import argparse
import collections
import fcntl
import hashlib
import json
from pathlib import Path
from typing import Any

REVISION = 'csoai.review-chain/0.1'
MAX_REPORT = 8 * 1024 * 1024
MAX_QUEUE = 16 * 1024 * 1024
MAX_LINE = 65536

class AuditError(ValueError):
    pass

def canonical(value: Any) -> bytes:
    return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode('utf-8')

def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()

def require(condition: bool, code: str) -> None:
    if not condition: raise AuditError(code)

def hex64(value: Any) -> bool:
    return isinstance(value,str) and len(value)==64 and all(c in '0123456789abcdef' for c in value)

def integer(value: Any) -> bool:
    return type(value) is int and value>=0

def no_duplicates(pairs):
    result={}
    for key,value in pairs:
        require(key not in result,'DUPLICATE_JSON_KEY');result[key]=value
    return result

def strict_json(raw: bytes):
    try:
        return json.loads(raw,object_pairs_hook=no_duplicates,parse_constant=lambda _: (_ for _ in ()).throw(AuditError('NONFINITE_JSON')))
    except (UnicodeError,json.JSONDecodeError) as exc:
        raise AuditError('INVALID_JSON') from exc

def read_bounded(path: Path, maximum: int) -> bytes:
    with path.open('rb') as source: data=source.read(maximum+1)
    require(len(data)<=maximum,'INPUT_TOO_LARGE');return data

def merkle_root(digests):
    level=[bytes.fromhex(x) for x in digests]
    if not level:return sha(b'')
    while len(level)>1:
        if len(level)%2:level.append(level[-1])
        level=[hashlib.sha256(level[i]+level[i+1]).digest() for i in range(0,len(level),2)]
    return level[0].hex()

def graph(manifest):
    require(isinstance(manifest,dict) and isinstance(manifest.get('loops'),list),'INVALID_MANIFEST')
    loops=manifest['loops'];require(len(loops)==40,'LOOP_COUNT')
    by_id={};parents={}
    for row in loops:
        require(isinstance(row,dict) and isinstance(row.get('id'),str),'INVALID_LOOP')
        ident=row['id'];require(ident not in by_id,'DUPLICATE_LOOP')
        deps=row.get('depends_on',[])
        require(isinstance(deps,list) and all(isinstance(x,str) for x in deps),'INVALID_DEPENDENCIES')
        require(len(deps)==len(set(deps)) and all(x in by_id for x in deps),'INVALID_TOPOLOGY')
        by_id[ident]=row;parents[ident]=set(deps)
    require('H-40' in by_id,'SUMMARY_MISSING')
    handoffs=manifest.get('review_handoffs',{})
    require(isinstance(handoffs,dict),'INVALID_HANDOFFS')
    for parent,children in handoffs.items():
        require(parent in by_id and isinstance(children,list),'INVALID_HANDOFF')
        require(all(isinstance(x,str) and x in by_id and x!=parent for x in children),'INVALID_HANDOFF_TARGET')
        require(len(children)==len(set(children)),'DUPLICATE_HANDOFF')
        for child in children:parents[child].add(parent)
    remaining={k:set(v) for k,v in parents.items()};resolved=set()
    while remaining:
        ready=[k for k,v in remaining.items() if v<=resolved]
        require(bool(ready),'HANDOFF_CYCLE')
        for k in ready:resolved.add(k);remaining.pop(k)
    identity=sha(canonical({'revision':REVISION,'parents':{k:sorted(v) for k,v in parents.items()},'actions':{k:v.get('deep_action') for k,v in by_id.items()}}))
    return by_id,parents,identity

def audit_review_chain(report: Any, queue: Any, manifest: Any) -> dict:
    require(isinstance(report,dict) and report.get('schema')=='csoai.hourly-loop-run/0.1','INVALID_REPORT_SCHEMA')
    require(report.get('execution')=='disabled' and report.get('publication')=='disabled','REPORT_AUTHORITY_MISMATCH')
    require(report.get('scheduler')=='existing-standing-cycle','SCHEDULER_MISMATCH')
    require(hex64(report.get('content_hash')) and sha(canonical({k:v for k,v in report.items() if k!='content_hash'}))==report['content_hash'],'REPORT_DIGEST_MISMATCH')
    definitions,parents,graph_id=graph(manifest)
    receipts=report.get('receipts');require(isinstance(receipts,list) and len(receipts)==40,'RECEIPT_COUNT')
    by_id={}
    for row in receipts:
        require(isinstance(row,dict) and row.get('id') in definitions and row['id'] not in by_id,'RECEIPT_ID_MISMATCH')
        require(row.get('execution_authority')=='none' and row.get('publication_authority')=='none','RECEIPT_AUTHORITY_MISMATCH')
        require(row.get('state') in ('OBSERVED','INCONCLUSIVE') and hex64(row.get('fingerprint')),'INVALID_RECEIPT_STATE')
        require(hex64(row.get('receipt_hash')) and sha(canonical({k:v for k,v in row.items() if k!='receipt_hash'}))==row['receipt_hash'],'RECEIPT_DIGEST_MISMATCH')
        by_id[row['id']]=row
    require([r['id'] for r in receipts]==[r['id'] for r in manifest['loops']],'RECEIPT_ORDER_MISMATCH')
    require(type(report.get('loop_count')) is int and report['loop_count']==len(receipts),'REPORTED_LOOP_COUNT_MISMATCH')
    for field,predicate in [('observed_loops',lambda r:r['state']=='OBSERVED'),('inconclusive_loops',lambda r:r['state']!='OBSERVED'),('changed_loops',lambda r:r.get('delta')=='CHANGED')]:
        require(integer(report.get(field)) and report[field]==sum(predicate(r) for r in receipts),'REPORTED_COUNT_MISMATCH')
    summary=by_id['H-40'];leaves=[r['receipt_hash'] for r in receipts if r['id']!='H-40'];root=merkle_root(leaves)
    require(summary.get('leaf_count')==len(leaves) and summary.get('hourly_merkle_root')==root==report.get('hourly_merkle_root'),'MERKLE_BINDING_MISMATCH')
    for row in receipts:
        expected={dep:by_id[dep]['fingerprint'] for dep in definitions[row['id']].get('depends_on',[])}
        require(row.get('dependencies')==expected,'SOURCE_DEPENDENCY_MISMATCH')
        require(row.get('dependency_states')=={dep:by_id[dep]['state'] for dep in expected},'DEPENDENCY_STATE_MISMATCH')
        probes=row.get('probes');require(isinstance(probes,list) and all(isinstance(x,dict) for x in probes),'INVALID_PROBES')
        material={'id':row['id'],'dependencies':expected,'probes':[
          {'source':probe.get('source'),'state':probe.get('state'),
           'sha256':probe.get('signed_content_id') if probe.get('identity_rule')=='verified_corrections_signed_body_v1' else probe.get('sha256'),
           'http':probe.get('http'),'etag':None if probe.get('identity_rule')=='verified_corrections_signed_body_v1' else probe.get('etag')}
          for probe in probes]}
        require(sha(canonical(material))==row['fingerprint'],'FINGERPRINT_MISMATCH')
    chain=report.get('review_chain');require(isinstance(chain,dict) and chain.get('schema')==REVISION,'CHAIN_NOT_PRESENT')
    require(chain.get('graph_id')==graph_id,'GRAPH_ID_MISMATCH')
    require(all(chain.get(k)=='disabled' for k in ['execution','publication','payment']),'CHAIN_AUTHORITY_MISMATCH')
    jobs=chain.get('jobs');require(isinstance(jobs,list) and len(jobs)<=39,'INVALID_JOB_ARRAY')
    require(integer(chain.get('planned')) and chain['planned']==len(jobs),'PLANNED_COUNT_MISMATCH')
    require(integer(chain.get('new')) and integer(chain.get('already_queued')) and chain['new']+chain['already_queued']==len(jobs),'NEW_COUNT_MISMATCH')
    require(chain['new']==report.get('deep_candidates_created'),'CREATED_COUNT_MISMATCH')
    require(isinstance(queue,list),'INVALID_QUEUE');lookup=collections.defaultdict(list)
    for row in queue:
        require(isinstance(row,dict) and isinstance(row.get('candidate_id'),str),'INVALID_QUEUE_RECORD')
        lookup[row['candidate_id']].append(row)
    require(all(isinstance(j,dict) and isinstance(j.get('loop_id'),str) for j in jobs),'INVALID_JOB')
    all_jobs_by_loop={j['loop_id']:j for j in jobs}
    require(len(all_jobs_by_loop)==len(jobs),'DUPLICATE_JOB_LOOP')
    by_job={};jobs_by_loop={};ready=[];waiting=[]
    for job in jobs:
        require(isinstance(job,dict) and isinstance(job.get('candidate_id'),str),'INVALID_JOB')
        cid=job['candidate_id'];ident=job.get('loop_id')
        require(cid not in by_job and ident in definitions and ident!='H-40' and ident not in jobs_by_loop,'DUPLICATE_OR_INVALID_JOB_ID')
        require(job.get('schema')=='csoai.deep-measurement-candidate/0.1' and job.get('chain_revision')==REVISION and job.get('graph_id')==graph_id,'JOB_CONTRACT_MISMATCH')
        require(job.get('state')=='QUEUED_INTERNAL_REVIEW' and all(job.get(k)=='not_performed' for k in ['execution','publication','payment','signing']) and job.get('model_training')=='not_authorized' and job.get('cost_authorized') is None,'JOB_AUTHORITY_MISMATCH')
        require(job.get('action')==definitions[ident].get('deep_action'),'JOB_ACTION_MISMATCH')
        source=by_id[ident]
        require(source['state']=='OBSERVED' and job.get('source_receipt_hash')==source['receipt_hash'] and job.get('source_fingerprint')==source['fingerprint'],'JOB_SOURCE_MISMATCH')
        causes=job.get('trigger_transitions');require(isinstance(causes,dict) and bool(causes),'EMPTY_TRIGGERS')
        require(all(k in by_id and hex64(v) and v==by_id[k].get('transition_id') for k,v in causes.items()),'INVALID_TRIGGER')
        work=sha(canonical({'graph':graph_id,'loop':ident,'action':job['action'],'source':source['fingerprint'],'causes':causes}))
        require(job.get('work_key')==work and cid==work[:24],'WORK_ID_MISMATCH')
        expected_sources={key:by_id[key]['fingerprint'] for key in sorted(parents[ident])}
        require(all(by_id[key]['state']=='OBSERVED' for key in expected_sources),'UPSTREAM_SOURCE_NOT_OBSERVED')
        require(job.get('source_dependencies')==expected_sources,'JOB_DEPENDENCY_MISMATCH')
        expected_jobs=[all_jobs_by_loop[parent]['candidate_id'] for parent in sorted(parents[ident]) if parent in all_jobs_by_loop]
        require(all(cid in by_job for cid in expected_jobs),'REVIEW_ORDER_MISMATCH')
        require(job.get('depends_on_candidate_ids')==expected_jobs,'PARENT_REVIEW_MISMATCH')
        readiness='WAITING_FOR_UPSTREAM_REVIEW' if expected_jobs else 'READY_FOR_REVIEW'
        require(job.get('readiness')==readiness,'READINESS_MISMATCH')
        stored=lookup[cid];require(len(stored)==1,'QUEUE_RECORD_MISSING_OR_DUPLICATED')
        require(canonical(stored[0])==canonical(job),'QUEUE_REPORT_MISMATCH')
        by_job[cid]=job;jobs_by_loop[ident]=job
        item={key:job[key] for key in ['candidate_id','loop_id','action','readiness','depends_on_candidate_ids','source_receipt_hash']}
        (ready if not expected_jobs else waiting).append(item)
    return {'schema':'csoai.review-chain-audit/0.1','state':'LOCAL_HANDOFF_INTEGRITY_VALID','report_content_hash':report['content_hash'],
      'observed_at':report.get('observed_at'),'graph_id':graph_id,'receipts_checked':len(receipts),'jobs_checked':len(jobs),
      'ready_for_review':ready,'waiting_for_upstream_review':waiting,'queue_records':len(queue),
      'legacy_queue_records':sum(r.get('chain_revision')!=REVISION for r in queue),
      'completion':{'reviews_completed':None,'work_executed':False,'buyer_acceptance':False},
      'scope':'Exact retained local report, graph and queue handoff consistency only; not source truth, signature authentication, approved execution or completed review.',
      'new_network_reads':0,'queue_writes':0,'scheduler_changes':0}

def audit_paths(state: Path, manifest_path: Path) -> dict:
    # Use the existing lock read-only; no mkdir, new queue, migration or baseline write.
    with (state/'engine.lock').open('r') as lock:
        fcntl.flock(lock,fcntl.LOCK_SH|fcntl.LOCK_NB)
        report_raw=read_bounded(state/'latest.json',MAX_REPORT)
        manifest_raw=read_bounded(manifest_path,MAX_REPORT)
        queue_raw=read_bounded(state/'deep-candidates.jsonl',MAX_QUEUE)
        records=[]
        for line in queue_raw.splitlines():
            if not line.strip():continue
            require(len(line)<=MAX_LINE,'QUEUE_LINE_TOO_LARGE');records.append(strict_json(line))
        result=audit_review_chain(strict_json(report_raw),records,strict_json(manifest_raw))
        result['input_sha256']={'report':sha(report_raw),'manifest':sha(manifest_raw),'queue':sha(queue_raw)}
        return result

def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state',type=Path,default=Path(__file__).resolve().parents[2]/'data/hourly-loops')
    parser.add_argument('--manifest',type=Path,default=Path(__file__).with_name('loops.json'))
    args=parser.parse_args()
    try:result=audit_paths(args.state,args.manifest)
    except (AuditError,OSError,TypeError,KeyError,ValueError) as exc:
        print(json.dumps({'schema':'csoai.review-chain-audit/0.1','state':'HOLD_UNCHECKABLE','reason':str(exc)[:200],'new_network_reads':0,'queue_writes':0}));return 2
    print(json.dumps(result,indent=2,sort_keys=True));return 0

if __name__=='__main__':raise SystemExit(main())
