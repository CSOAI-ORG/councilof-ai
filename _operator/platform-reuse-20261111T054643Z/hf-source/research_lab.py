"""Bounded MEOK research tools: learned process inference, geometry and evidence.
Uses the existing process checkpoint and GSPC schema. No actions or training authority.
"""
from __future__ import annotations
import hashlib, importlib.util, json, math, time, uuid
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'lab_assets'
VERSION = '2026-11-10.1'
WEIGHTS_SHA = '9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b'
MODEL_REVISION = '90d6aa6c87629b9f4296142ba2019247b51686c4'

def parse_json(text: str, maximum: int = 131072):
    if not isinstance(text, str) or len(text.encode()) > maximum:
        raise ValueError('Input must be bounded UTF-8 JSON')
    def reject(value):
        raise ValueError('Nonfinite JSON value rejected: ' + value)
    def unique(pairs):
        out = {}
        for k, v in pairs:
            if k in out: raise ValueError('Duplicate JSON key')
            out[k] = v
        return out
    return json.loads(text, parse_constant=reject, object_pairs_hook=unique)

def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()

@lru_cache(maxsize=1)
def components():
    lock = json.loads((ASSETS / 'manifest.json').read_text())
    for name, sha in lock['files_sha256'].items():
        if hashlib.sha256((ASSETS / name).read_bytes()).hexdigest() != sha:
            raise ValueError('Research asset integrity mismatch: ' + name)
    def load(name, filename):
        spec = importlib.util.spec_from_file_location(name, ASSETS / filename)
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        return module
    predictor = load('meok_process_predictor', 'predict.py').ProcessPredictor(ASSETS / 'weights.json', WEIGHTS_SHA)
    return predictor, load('meok_reused_gspc_event', 'event.py'), lock

def record_call(tool: str, inputs, outputs) -> dict:
    _, event, _ = components()
    return event.build(
        subject={'kind': 'model_run' if tool == 'predict_process' else 'sandbox_run',
                 'locator': 'urn:meok:research-call:' + str(uuid.uuid4())},
        claim={'text': 'The named research function returned the hash-bound output for the supplied input.',
               'source_sha256': hashlib.sha256(event.jcs(inputs)).hexdigest(),
               'read_at': datetime.now(timezone.utc).isoformat()},
        method={'id': 'meok-hf-research/' + tool, 'version': VERSION, 'holder': 'csoai',
                'code_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        declared={'input_sha256': hashlib.sha256(event.jcs(inputs)).hexdigest()},
        observed={'output_sha256': hashlib.sha256(event.jcs(outputs)).hexdigest()},
        state='PARTIAL', value=None,
        limits=['Unsigned execution record, not independent verification of prediction truth.',
                'No production GSPC admission, action authorisation, signing or training occurs.',
                'Response records are not durably archived by this research tool.'])

def lab_status() -> dict:
    """Read the installed research model, geometry tools and observed axis snapshot status."""
    predictor, _, lock = components()
    report = json.loads((ASSETS / 'cosmos_adapter_report.json').read_text())
    return {'version': VERSION, 'process_model': 'csoai/meok-process-world-v0',
            'process_model_revision': MODEL_REVISION, 'process_weights_sha256': predictor.sha256,
            'domain': 'synthetic procurement transitions only', 'parameters': 980,
            'gspc_snapshot': lock['axis_snapshot'],
            'cosmos_adapter': {'job': 'csoai/6af283e79737d9a9e08ecbaa',
                'actual_updates': report['actual_updates'], 'before_correct': report['before_correct'],
                'after_correct': report['after_correct'], 'n': report['heldout_rows'],
                'majority_count': sum(x['expected'] == 'HOLD' for x in report['after']),
                'admission': 'REJECTED_FOR_PROMOTION_CONSTANT_HOLD_OUTPUT', 'loaded_into_serving_model': False},
            'photonic_hardware': False, 'quantum_hardware': False, 'external_action_authority': False,
            'memory_persistence': 'none; export returned records explicitly',
            'proof_scope': 'Research tools; not a general world model or whole-system certification'}

def predict_process(features_json: str, constrained: bool = True) -> dict:
    """Run the pinned 980-parameter MEOK process model on 11 synthetic state features.

    Args:
        features_json: JSON list in the feature order provided by the published model card.
        constrained: Apply the existing simplex and synthetic-expiry constraints.
    """
    if type(constrained) is not bool: raise ValueError('constrained must be boolean')
    x = parse_json(features_json, 4096)
    predictor, _, _ = components()
    start = time.perf_counter()
    answer = predictor.predict(x, constrained)
    if not all(math.isfinite(v) for v in answer['prediction'] + answer['raw_prediction']):
        raise ValueError('Nonfinite model output')
    answer['compute_seconds'] = time.perf_counter() - start
    answer['evidence_event'] = record_call('predict_process', {'features': x, 'constrained': constrained}, answer.copy())
    return answer

def image_moments(pixels_json: str, width: int = 8, height: int = 8) -> dict:
    """Compute intensity-weighted image geometry, not intelligence or lossless compression.

    Args:
        pixels_json: Row-major list of nonnegative finite pixel intensities up to 255.
        width: Image width, integer from 1 to 64.
        height: Image height, integer from 1 to 64.
    """
    if type(width) is not int or type(height) is not int or not 1 <= width <= 64 or not 1 <= height <= 64:
        raise ValueError('Width and height must be integers in 1..64')
    p = parse_json(pixels_json)
    if not isinstance(p, list) or len(p) != width * height or any(type(v) not in (int, float) or not math.isfinite(v) or not 0 <= v <= 255 for v in p):
        raise ValueError('Expected width*height finite pixels in 0..255; booleans rejected')
    mass = sum(p)
    if mass <= 0: raise ValueError('Centroid is undefined for zero intensity')
    cx = sum((i % width) * v for i, v in enumerate(p)) / mass
    cy = sum((i // width) * v for i, v in enumerate(p)) / mass
    mu20 = sum((i % width - cx)**2 * v for i, v in enumerate(p))
    mu02 = sum((i // width - cy)**2 * v for i, v in enumerate(p))
    mu11 = sum((i % width - cx) * (i // width - cy) * v for i, v in enumerate(p))
    trace = (mu20 + mu02) / mass
    disc = math.sqrt(max(0.0, ((mu20-mu02)/mass)**2 + 4*(mu11/mass)**2))
    answer = {'intensity_sum': mass, 'centroid': [cx, cy], 'Ix': mu02, 'Iy': mu20, 'Iz': mu20+mu02,
        'mu11': mu11, 'normalised_covariance': [[mu20/mass, mu11/mass], [mu11/mass, mu02/mass]],
        'eigenvalues': [(trace+disc)/2, max(0.0, (trace-disc)/2)],
        'units': 'intensity times pixel-distance squared; not a structural area measurement',
        'lossless': False, 'label_or_semantics_inferred': False}
    answer['evidence_event'] = record_call('image_moments', {'pixels': p, 'width': width, 'height': height}, answer.copy())
    return answer

def compact_root(records_json: str) -> dict:
    """Build a bounded content-addressed view without pretending it stores the referenced data.

    Args:
        records_json: JSON list of at most 128 observations/predictions, each with a kind field.
    """
    records = parse_json(records_json)
    if not isinstance(records, list) or not 1 <= len(records) <= 128:
        raise ValueError('Expected 1..128 records')
    allowed = {'observation', 'prediction', 'action_proposal', 'outcome', 'correction', 'measurement'}
    if any(not isinstance(r, dict) or r.get('kind') not in allowed for r in records):
        raise ValueError('Every record must declare its valid kind; predictions are not observations')
    blobs = [canonical(r) for r in records]
    hashes = [hashlib.sha256(b).hexdigest() for b in blobs]
    index = canonical(hashes)
    root = {'schema': 'meok.experimental-index-root/1', 'records': len(records),
        'index_sha256': hashlib.sha256(index).hexdigest(), 'child_prefix': hashes[:8],
        'record_kinds': sorted({r['kind'] for r in records}), 'complete_data_in_root': False,
        'originals_stored': False, 'index_stored': False, 'authority': 'none'}
    raw = canonical(root)
    if len(raw) > 3072: raise ValueError('Root exceeds 3 KiB')
    return {'root': root, 'root_bytes': len(raw), 'external_index_bytes': len(index),
            'referenced_record_bytes': sum(map(len, blobs)), 'root_plus_index_plus_records_bytes': len(raw)+len(index)+sum(map(len, blobs)),
            'record_sha256': hashes, 'lossless_data_in_root': False,
            'warning': 'An index is not compression of all content; neither root nor objects are persisted here.'}

def axis_snapshot(axis: str = 'all') -> dict:
    """Read the retained canonical GSPC axis snapshot; this does not run an axis measurement.

    Args:
        axis: Exact published axis identifier, or all for the available identifiers.
    """
    if not isinstance(axis, str) or len(axis) > 100: raise ValueError('Invalid axis name')
    _, _, lock = components()
    board = json.loads((ASSETS / 'axes.json').read_text())
    axes = board['axes']
    rows = list(axes.values()) if isinstance(axes, dict) else axes
    names = [r.get('axis', r.get('name', r.get('id'))) for r in rows]
    if axis == 'all': result = {'axis_names': names, 'count': len(names), 'totals': board.get('totals')}
    else:
        if axis not in names: raise ValueError('Unknown axis; call with all to inspect available identifiers')
        result = {'axis': rows[names.index(axis)]}
    return {**result, 'snapshot': lock['axis_snapshot'], 'new_measurement_performed': False,
            'model_count_claim': False, 'trust': 'Retained canonical response; signature not independently reverified by this wrapper.'}


def dependency_impact(edges_json: str, changed_json: str) -> dict:
    """Find every descendant affected by changed sources in a bounded dependency DAG.

    Args:
        edges_json: JSON list of [source, dependent] identifier pairs, at most 2048.
        changed_json: JSON list of changed identifiers. No records or files are mutated.
    """
    edges = parse_json(edges_json)
    changed = parse_json(changed_json, 16384)
    def valid_id(s): return isinstance(s, str) and 0 < len(s) <= 128
    if not isinstance(edges, list) or len(edges) > 2048 or any(not isinstance(e, list) or len(e) != 2 or not all(valid_id(s) for s in e) for e in edges):
        raise ValueError('Expected bounded source/dependent edge pairs')
    if not isinstance(changed, list) or len(changed) > 128 or not all(valid_id(s) for s in changed):
        raise ValueError('Expected bounded changed identifier list')
    nodes = set(changed) | {v for e in edges for v in e}
    if len(nodes) > 512: raise ValueError('Graph exceeds 512 nodes')
    children = {n: set() for n in nodes}; indegree = dict.fromkeys(nodes, 0)
    for a, b in edges:
        if b not in children[a]: children[a].add(b); indegree[b] += 1
    queue = sorted(n for n in nodes if indegree[n] == 0); count = 0
    while queue:
        a = queue.pop(); count += 1
        for b in children[a]:
            indegree[b] -= 1
            if indegree[b] == 0: queue.append(b)
    if count != len(nodes): raise ValueError('Dependency graph must be acyclic')
    affected = set(changed); pending = list(changed)
    while pending:
        for b in children[pending.pop()]:
            if b not in affected: affected.add(b); pending.append(b)
    return {'changed': sorted(set(changed)), 'affected_including_changed': sorted(affected),
            'unaffected': sorted(nodes-affected), 'transitive': True, 'records_mutated': False,
            'graph_sha256': hashlib.sha256(canonical(sorted(set(tuple(e) for e in edges)))).hexdigest(),
            'limit': 'Known declared dependencies only; no inferred hidden causal relationships.'}


def photonic_cpu_probe(seed: int = 17) -> dict:
    """Run bounded numerical checks through the official Q.ANT CPU backend, not optical hardware.

    Args:
        seed: Integer 0..10000 selecting fixed-size random inputs. No hardware provisioning.
    """
    if type(seed) is not int or not 0 <= seed <= 10000: raise ValueError('seed must be an integer in 0..10000')
    import numpy as np
    from qant_cpu_loader import load
    qa,qg = load()
    from ml_dtypes import bfloat16
    from importlib.metadata import version
    rng = np.random.default_rng(seed)
    x = rng.uniform(-.5,.5,(8,16)).astype(bfloat16)
    w = rng.uniform(-.5,.5,(12,16)).astype(bfloat16)
    start = time.perf_counter()
    plain = qa.linear_fprop(x,w).astype(np.float32)
    wh = qg.upload(w,data_role=qg.DataRole.Weights)
    reused = qa.linear_fprop_preloaded_weights(x,wh).astype(np.float32)
    xh = qg.upload(x,data_role=qg.DataRole.Features)
    yh = qg.allocate(8,12,data_role=qg.DataRole.Features)
    qa.linear_fprop_preloaded(xh,wh,yh)
    managed = qg.download(yh).astype(np.float32)
    reference = x.astype(np.float32) @ w.astype(np.float32).T
    relative_l2 = float(np.linalg.norm(plain-reference)/max(np.linalg.norm(reference),1e-12))
    answer = {'backend':'QANT_OFFICIAL_CPU_BACKEND','sdk_version':version('qant-native-computing-toolkit'),
        'seed':seed,'shape':[8,12],'relative_l2_vs_float32':relative_l2,
        'finite':bool(np.isfinite(plain).all() and np.isfinite(reused).all() and np.isfinite(managed).all()),
        'reused_weights_match':bool(np.array_equal(plain,reused)),
        'managed_memory_matches':bool(np.array_equal(plain,managed)),
        'within_declared_0_03_tolerance':relative_l2<.03,
        'cpu_probe_seconds':time.perf_counter()-start,
        'photonic_processor_accessed':False,'quantum_processor_accessed':False,
        'physical_speed_or_energy_advantage_measured':False,
        'output_sha256':hashlib.sha256(plain.tobytes()).hexdigest(),
        'limit':'Small CPU software compatibility probe, not physical noise/calibration, visual reasoning or a hardware benchmark.'}
    answer['evidence_event']=record_call('photonic_cpu_probe',{'seed':seed,'shape':[8,16,12]},answer.copy())
    return answer
