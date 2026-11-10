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
        'memory_backend':'temporary derived SQLite, destroyed after this rehearsal',
        'production_routes_changed':False,'training_performed':False,
        'llm_inference_calls':0,'canonical_gspc_admission':False,
        'limitations':['Trusted callbacks are fixtures here, not real-user authentication.',
            'Production adoption still needs the authoritative source/version and access adapter.',
            'Cached output is not cached action permission, and a hash is not a correctness proof.']}
    answer['evidence_event'] = record_call('memory_venturi_rehearsal',
        {'seed':seed,'reuse_percent':reuse_percent},answer.copy())
    return answer
