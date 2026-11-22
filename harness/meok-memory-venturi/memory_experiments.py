"""Reproducible cache-correctness/whole-job comparison over synthetic read-only work.
No LLM, network or hardware-acceleration performance is inferred from this test.
"""
from __future__ import annotations
import hashlib, json, random, time, statistics
from dataclasses import replace
from memory_venturi import *

WORKER=WorkerIdentity('fixture-worker','m1','t1','a1','rt1','p1','deterministic','json-v1')

def fixture_output(body: bytes, revision: str, iterations: int=1000) -> bytes:
    # A real deterministic CPU computation, not a sleep or invented API latency.
    key=hashlib.pbkdf2_hmac('sha256',body,revision.encode(),iterations).hex()
    return canonical({'revision':revision,'request_sha256':digest(body),'result':key})

def trace(seed: int, reuse: float, n=120):
    rng=random.Random(seed); unique=max(4,int(n*(1-reuse))); queries=[f'q-{i}'.encode() for i in range(unique)]
    states={f's{i}':SourceState('r1',True) for i in range(4)}; rows=[]; allowed=True
    for i in range(n):
        event=None
        if i==n//3:states['s0']=SourceState('r2',True);event=('s0',False)
        if i==n//2:states['s2']=SourceState('r2',True);event=('s2',True)
        if i==2*n//3:states['s1']=SourceState('r1',False);event=('s1',False)
        if i==3*n//4:allowed=False
        if i==3*n//4+4:allowed=True
        body=queries[i] if i<unique else rng.choice(queries)
        source='s'+str(int(body.decode().split('-')[1])%4);s=states[source]
        expect=fixture_output(body,s.revision) if allowed and s.current else None
        rows.append({'body':body,'source':source,'states':states.copy(),'allowed':allowed,'event':event,'expected':expect})
    return rows

def run_variant(rows, strategy):
    live={'states':{},'allowed':True};calls=0;unsafe={};hits=0;accepted=0;refused=0;stale=0;latencies=[];invalidated=0
    cache=RevisionBoundCache(':memory:',resolve=lambda c,ids:{x:live['states'][x] for x in ids},authorise=lambda c,ids:live['allowed'])
    ctx=HostContext('synthetic','tester','p1',time.time()+3600)
    def compute(body,pins):
        nonlocal calls
        calls+=1;return fixture_output(body,next(iter(pins.values())))
    start=time.perf_counter()
    for row in rows:
        t=time.perf_counter();live.update(states=row['states'],allowed=row['allowed'])
        if strategy=='revision_eager' and row['event']:
            src,cut=row['event'];invalidated+=cache.invalidate_from_impact(tenant='synthetic',affected=(src,),truncated=cut)['invalidated']
        request=Request(row['body'],(row['source'],),WORKER)
        got=None
        try:
            if strategy=='always_fresh':
                if not live['allowed']:raise Refused('ACCESS_DENIED')
                s=live['states'][row['source']]
                if not s.current:raise Refused('SOURCE_NOT_CURRENT')
                got=compute(row['body'],{row['source']:s.revision})
            elif strategy=='query_only_unsafe':
                if not live['allowed']:raise Refused('ACCESS_DENIED')
                key=row['body']
                if key in unsafe:got=unsafe[key];hits+=1
                else:
                    s=live['states'][row['source']]
                    if not s.current:raise Refused('SOURCE_NOT_CURRENT')
                    got=compute(row['body'],{row['source']:s.revision});unsafe[key]=got
            else:
                out=cache.run(ctx,request,compute=compute,verify=lambda b:isinstance(json.loads(b).get('result'),str))
                got=out['payload'];hits+=out['state']=='REUSED_RESULT'
            accepted+=1
            if got!=row['expected']:stale+=1
        except Refused:refused+=1
        latencies.append(time.perf_counter()-t)
    elapsed=time.perf_counter()-start;cache.close()
    correct=accepted-stale
    return {'strategy':strategy,'requests':len(rows),'provider_computations':calls,'cache_hits':hits,'accepted':accepted,
            'stale_or_forbidden_returns':stale,'refused':refused,'correct_accepted':correct,'eager_invalidations':invalidated,
            'wall_seconds':elapsed,'p50_seconds':statistics.median(latencies),
            'p95_seconds':sorted(latencies)[int(.95*(len(latencies)-1))],
            'seconds_per_correct_accepted':elapsed/correct if correct else None}

def run_grid():
    rows=[]
    for seed in [7,17,29]:
        for reuse in [.5,.8,.95]:
            schedule=trace(seed,reuse)
            for strategy in ['always_fresh','query_only_unsafe','revision_lazy','revision_eager']:
                rows.append({'seed':seed,'nominal_reuse':reuse,**run_variant(schedule,strategy)})
    return {'scope':'Synthetic read-only deterministic CPU work, not a model/hardware benchmark',
            'method':'Predeclared 3 seeds x 3 reuse levels x 4 policies; 120 requests each; source corrections, retirement, permission withdrawal and truncated impact',
            'traces':9,'variant_runs':len(rows),'request_evaluations':sum(r['requests'] for r in rows),
            'provider':'PBKDF2-SHA256 1000 iterations, real CPU computation',
            'timing_boundary':'Whole policy loop including access, source resolution, key construction, SQLite, verification and provider work; excludes fixture generation',
            'rows':rows,'random_seed_reproducible':True,'production_savings_claimed':False}

def lab_memory_venturi(seed: int=17, reuse_percent: int=80) -> dict:
    """Run a bounded synthetic comparison of four cache policies; no private data is read.

    Args:
        seed: Integer 0..10000 selecting a synthetic request trace.
        reuse_percent: Integer 50..95 controlling nominal repeated requests.
    """
    if type(seed) is not int or not 0<=seed<=10000:raise ValueError('seed must be 0..10000')
    if type(reuse_percent) is not int or not 50<=reuse_percent<=95:raise ValueError('reuse_percent must be 50..95')
    schedule=trace(seed,reuse_percent/100)
    rows=[run_variant(schedule,s) for s in ['always_fresh','query_only_unsafe','revision_lazy','revision_eager']]
    return {'version':VERSION,'scope':'SYNTHETIC_CACHE_REHEARSAL','rows':rows,
            'actual_model_calls':0,'production_cache_changed':False,'private_data_read':False,'training':False,
            'warning':'A hit reuses output bytes, not authority. Callback authentication and source truth remain host responsibilities; timings are CPU fixtures, not Cosmos speedups.'}

if __name__=='__main__':print(json.dumps(run_grid(),indent=2))
