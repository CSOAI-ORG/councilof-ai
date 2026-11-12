"""Additive, synthetic-only memory tools for the existing private MEOK lab.
No live user memory, production defaults or authority records are modified.
"""
from __future__ import annotations
import hashlib
import json
import math
import tempfile
import time
from pathlib import Path
from memory_venturi import HostContext, WorkerIdentity, SourceState, Request, RevisionBoundCache, Refused, canonical, digest
from memory_experiments import lab_memory_venturi


def process_replay() -> dict:
    """Exercise the existing real 980-parameter predictor through exact result reuse."""
    from research_lab import components, MODEL_REVISION, WEIGHTS_SHA
    predictor, _, _ = components()
    source = {'weights': SourceState(WEIGHTS_SHA, True), 'fixture': SourceState('synthetic-replay-1', True)}
    access = {'allowed': True}
    worker = WorkerIdentity('csoai/meok-process-world-v0', MODEL_REVISION, 'not-tokenised-tabular',
        'no-adapter', digest(Path(__file__).read_bytes()), 'fixed-tabular-input',
        'deterministic-fp64', 'finite-simplex-and-weight-pin-v1')
    ctx = HostContext('synthetic-only', 'owned-lab-runner', 'no-actions', time.time()+60)
    features = [
        [0,0,0,1,.3,.4,.3,0,1,1,0],
        [.3,.4,.3,0,.3,.4,.3,1,.5,1,.25],
        [.2,.5,.3,0,.2,.5,.3,0,0,1,.5],
        [0,0,0,1,.3,.4,.3,1,.125,0,.75],
    ]
    computations = 0; events = []; initial = []
    def compute(body, pins):
        nonlocal computations
        computations += 1
        return canonical(predictor.predict(json.loads(body), True))
    def verify(raw):
        data = json.loads(raw); values = data.get('prediction')
        return (data.get('weights_sha256') == WEIGHTS_SHA and data.get('authorises_execution') is False
            and isinstance(values, list) and len(values)==4 and all(type(v) in (int,float) and math.isfinite(v) and 0<=v<=1 for v in values)
            and abs(sum(values)-1)<1e-8)
    start = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix='meok-derived-cache-') as directory:
        cache = RevisionBoundCache(str(Path(directory)/'derived.sqlite'),
            resolve=lambda c, ids: {s:source[s] for s in ids},
            authorise=lambda c, ids: access['allowed'])
        try:
            for phase in ['initial', 'unchanged-repeat', 'source-revision-changed']:
                if phase=='source-revision-changed':source['fixture']=SourceState('synthetic-replay-2', True)
                for index,x in enumerate(features):
                    result = cache.run(ctx, Request(canonical(x),('weights','fixture'),worker),compute=compute,verify=verify)
                    if phase=='initial':initial.append(result['payload'])
                    events.append({'phase':phase,'fixture':index,'state':result['state'],
                        'output_equal_to_initial':result['payload']==initial[index],
                        'output_sha256':result['payload_sha256']})
            access['allowed']=False
            try:
                cache.run(ctx,Request(canonical(features[0]),('weights','fixture'),worker),compute=compute,verify=verify)
                refusal='FAILED_OPEN'
            except Refused as exc:refusal=str(exc)
        finally:cache.close()
    return {'model':'csoai/meok-process-world-v0','model_revision':MODEL_REVISION,
        'weights_sha256':WEIGHTS_SHA,'actual_neural_evaluations':computations,'request_attempts':13,
        'exact_cache_hits':sum(e['state']=='REUSED_RESULT' for e in events),
        'access_revocation':refusal,'events':events,'whole_loop_seconds':time.perf_counter()-start,
        'scope':'Real small neural predictor on synthetic inputs; not Cosmos or physical dynamics.',
        'model_quality_remeasured':False,'cross_request_user_memory_retained':False,
        'cache_directory_deleted_after_run':True}


def targeted_invalidation_replay() -> dict:
    """Five bounded synthetic controls, executed by the installed cache implementation.

    Source revision deliberately stays constant: explicit dependency invalidation
    must not depend on a coincidentally changed source hash to prevent stale reuse.
    This is not a real-user source/permission integration or a latency benchmark.
    """
    ctx = HostContext('synthetic-only', 'owned-lab-runner', 'no-actions', 1000.0)
    worker = WorkerIdentity(*(['targeted-invalidation-fixture'] * 8))
    req = Request(b'fixed-task', ('source',), worker)
    rows = []
    with tempfile.TemporaryDirectory(prefix='meok-impact-check-') as directory:
        for case in ['during-compute', 'during-hit', 'unrelated-source', 'other-tenant', 'fresh-after-invalidation']:
            cache = RevisionBoundCache(str(Path(directory)/(case+'.sqlite')),
                resolve=lambda c, ids: {x:SourceState('unchanged-r1', True) for x in ids},
                authorise=lambda c, ids: True, clock=lambda:100.0)
            def execute(compute=None, verify=None):
                return cache.run(ctx, req, compute=compute or (lambda b,p:b'{}'),
                    verify=verify or (lambda payload:payload==b'{}'))
            def invalidate(source='source', tenant='synthetic-only'):
                return cache.invalidate_from_impact(tenant=tenant, affected=(source,), truncated=False)
            try:
                expected = 'FRESH_RESULT'
                if case=='during-compute':
                    expected='INVALIDATED_DURING_COMPUTE'
                    def compute(body,pins):
                        invalidate();return b'{}'
                    result=execute(compute=compute)['state']
                elif case=='during-hit':
                    execute();expected='INVALIDATED_DURING_LOOKUP'
                    def verify(payload):
                        invalidate();return True
                    result=execute(verify=verify)['state']
                elif case=='unrelated-source':
                    execute();invalidate(source='unrelated');expected='REUSED_RESULT';result=execute()['state']
                elif case=='other-tenant':
                    execute();invalidate(tenant='different-tenant');expected='REUSED_RESULT';result=execute()['state']
                else:
                    old=execute()['cache_key'];invalidate();current=execute();result=current['state']
                    if old==current['cache_key']:result='OLD_GENERATION_REUSED'
            except Refused as exc:
                result=str(exc)
            finally:
                count=cache.count();cache.close()
            passed=result==expected and (count==0 if case in ['during-compute','during-hit'] else count==1)
            rows.append({'case':case,'expected':expected,'observed':result,'stored_results':count,'passed':passed})
    return {'state':'DECLARED_CONTROLS_PASSED' if all(x['passed'] for x in rows) else 'CONTROL_FAILURE',
        'cases':rows,'cache_source_sha256':digest(Path(__file__).with_name('memory_venturi.py').read_bytes()),
        'source_revision_changes':0,'real_user_authorisation':False,'temporary_directory_removed':True,
        'provider_calls':0,'cross_process_atomicity_claimed':False,
        'scope':'Explicit invalidation before the final check; no guarantee about events after that check.'}


def memory_rehearsal(seed: int = 17, reuse_percent: int = 80) -> dict:
    """Compare bounded memory policies and replay the existing trained process predictor.

    Args:
        seed: Integer 0..10000 selecting synthetic corrections and repeated queries.
        reuse_percent: Integer 50..95 selecting nominal repeated queries.
    """
    from research_lab import record_call
    # Validate first, before accessing assets or creating a cache.
    comparison = lab_memory_venturi(seed, reuse_percent)
    answer = {'cache_experiment':comparison,'trained_process_replay':process_replay(),
        'targeted_invalidation':targeted_invalidation_replay(),
        'memory_backend':'temporary derived SQLite, destroyed after this rehearsal',
        'production_routes_changed':False,'training_performed':False,
        'llm_inference_calls':0,'canonical_gspc_admission':False,
        'limitations':['Trusted callbacks are fixtures here, not real-user authentication.',
            'Production adoption still needs the authoritative source/version and access adapter.',
            'Cached output is not cached action permission, and a hash is not a correctness proof.']}
    answer['evidence_event'] = record_call('memory_venturi_rehearsal',
        {'seed':seed,'reuse_percent':reuse_percent},answer.copy())
    return answer
