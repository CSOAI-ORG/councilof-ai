"""Pure research join gate. No network, code loading, state mutation or authority.
Combines compatible categorical predictions only. Not an authentication service.
"""
from __future__ import annotations
import copy
import datetime as dt
import hashlib
import json
import math
import re
from typing import Any

HEX=re.compile(r'^[0-9a-f]{64}$')
MAX_BYTES=65536
MAX_COMPONENTS=16
FIELDS={'component_id','revision','result_sha256','task_id','input_sha256','label_schema',
        'probabilities','evidence_kind','state','source_snapshot','dependency_root',
        'valid_until','dependencies_complete','fault_domain'}

def stamp(value: str) -> dt.datetime:
    if not isinstance(value,str) or len(value)>40:raise ValueError('INVALID_TIME')
    try:out=dt.datetime.fromisoformat(value.replace('Z','+00:00'))
    except ValueError:raise ValueError('INVALID_TIME') from None
    if out.tzinfo is None or out.utcoffset() is None:raise ValueError('OFFSET_REQUIRED')
    return out.astimezone(dt.timezone.utc)

def number(v: Any) -> bool:
    if type(v) not in (int,float):return False
    try:return math.isfinite(v)
    except (OverflowError,ValueError):return False

def digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':'),
                          ensure_ascii=True,allow_nan=False).encode()).hexdigest()

def loads(raw: bytes) -> Any:
    if not isinstance(raw,bytes) or len(raw)>MAX_BYTES:raise ValueError('SIZE_BOUND')
    def pairs(items):
        out={}
        for k,v in items:
            if k in out:raise ValueError('DUPLICATE_JSON_KEY')
            out[k]=v
        return out
    def reject(_):raise ValueError('NONFINITE_JSON')
    try:out=json.loads(raw,object_pairs_hook=pairs,parse_constant=reject)
    except (UnicodeError,RecursionError):raise ValueError('INVALID_JSON') from None
    # JSON 1e999 bypasses parse_constant but must also be rejected.
    def finite(v):
        if isinstance(v,float) and not math.isfinite(v):raise ValueError('NONFINITE_JSON')
        if isinstance(v,dict):
            for x in v.values():finite(x)
        if isinstance(v,list):
            for x in v:finite(x)
    finite(out)
    return out

def join(receipts: list[dict], context: dict, *, now: str,
         weights: list[float]|None=None, min_probability: float=.55,
         min_margin: float=.10) -> dict:
    """Caller supplies pinned context and declared weighting, never test labels.
    Source digests bind supplied references, not their truth or source custodian.
    Explicit complete dependency state is required; a truncated walk is not complete.
    """
    clock=stamp(now)
    if not isinstance(context,dict) or set(context)!={'task_id','input_sha256','label_schema','source_snapshot','dependency_root'}:
        raise ValueError('CONTEXT_SHAPE')
    if not isinstance(receipts,list) or not 1<=len(receipts)<=MAX_COMPONENTS:raise ValueError('COMPONENT_BOUND')
    labels=context['label_schema']
    if not isinstance(labels,list) or not 2<=len(labels)<=256 or any(not isinstance(x,str) or not x or len(x)>80 for x in labels) or len(set(labels))!=len(labels):raise ValueError('LABEL_SCHEMA')
    for k in ['input_sha256','dependency_root']:
        if not isinstance(context[k],str) or not HEX.fullmatch(context[k]):raise ValueError('CONTEXT_DIGEST')
    if not isinstance(context['task_id'],str) or not context['task_id'] or len(context['task_id'])>200:raise ValueError('TASK_ID')
    if stamp(context['source_snapshot'])>clock:raise ValueError('FUTURE_SOURCE')
    for v in [min_probability,min_margin]:
        if not number(v) or not 0<=v<=1:raise ValueError('THRESHOLD')
    if weights is None:weights=[1.0]*len(receipts)
    if not isinstance(weights,list) or len(weights)!=len(receipts) or any(not number(w) or w<=0 for w in weights):raise ValueError('WEIGHTS')
    try:total=math.fsum(weights)
    except OverflowError:raise ValueError('WEIGHTS') from None
    if not math.isfinite(total):raise ValueError('WEIGHTS')
    normalized=[w/total for w in weights]
    seen_components=set();seen_results=set();scores=[];domains=[];refs=[]
    for r in receipts:
        if not isinstance(r,dict) or set(r)!=FIELDS:raise ValueError('RECEIPT_SHAPE')
        for field in ['component_id','revision','fault_domain']:
            if not isinstance(r[field],str) or not r[field] or len(r[field])>256:raise ValueError('IDENTITY')
        if r['component_id'] in seen_components:raise ValueError('DUPLICATE_COMPONENT')
        if not HEX.fullmatch(r['revision']):raise ValueError('UNPINNED_REVISION')
        if not isinstance(r['result_sha256'],str) or not HEX.fullmatch(r['result_sha256']):raise ValueError('RESULT_DIGEST')
        if r['result_sha256'] in seen_results:raise ValueError('DUPLICATE_RESULT')
        for k,v in context.items():
            if r[k]!=v:raise ValueError('CONTEXT_MISMATCH_'+k.upper())
        if r['evidence_kind']!='PREDICTION' or r['state']!='COMPLETE':raise ValueError('INCOMPLETE_OR_INCOMPATIBLE_EVIDENCE')
        if r['dependencies_complete'] is not True:raise ValueError('DEPENDENCIES_INCOMPLETE')
        if stamp(r['valid_until'])<=clock:raise ValueError('EXPIRED_RESULT')
        p=r['probabilities']
        if not isinstance(p,list) or len(p)!=len(labels) or any(not number(x) or not 0<=x<=1 for x in p):raise ValueError('PROBABILITIES')
        if abs(math.fsum(p)-1)>1e-8:raise ValueError('PROBABILITY_MASS')
        scores.append(p);seen_components.add(r['component_id']);seen_results.add(r['result_sha256']);domains.append(r['fault_domain'])
        refs.append({'component_id':r['component_id'],'revision':r['revision'],'result_sha256':r['result_sha256']})
    mixed=[math.fsum(w*p[j] for w,p in zip(normalized,scores)) for j in range(len(labels))]
    order=sorted(range(len(labels)),key=lambda j:(-mixed[j],j));best,second=order[:2]
    tied=abs(mixed[best]-mixed[second])<=1e-12
    abstain=tied or mixed[best]<min_probability or mixed[best]-mixed[second]<min_margin
    out={'kind':'COMPATIBLE_PREDICTION_JOIN_REVIEW','method':'weighted-output-mixture/1',
         'state':'ABSTAIN' if abstain else 'PREDICTION_NOT_OBSERVED',
         'label':None if abstain else labels[best],'probabilities':mixed,
         'context':copy.deepcopy(context),'observed_at':now,'inputs':refs,
         'normalized_weights':normalized,
         'declared_fault_domains':len(set(domains)),
         'independence_status':'NOT_ESTABLISHED','calibration_status':'NOT_ESTABLISHED',
         'authority_status':'NOT_EVALUATED','authorises_execution':False,
         'gspc_admitted':False,'signature_state':'UNSIGNED','replies':'HELD'}
    out['review_sha256']=digest(out)
    return out
