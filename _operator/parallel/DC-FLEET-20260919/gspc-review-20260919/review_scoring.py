"""Offline review of two frozen scoring modules; no orders or network calls."""
import ast
import datetime as dt
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
import types

HERE = Path(__file__).resolve().parent
manifest = json.loads((HERE/'SOURCE_MANIFEST.json').read_text())
package = types.ModuleType('review_snapshot')
package.__path__ = [str(HERE)]
sys.modules['review_snapshot'] = package
for name in ('models', 'scoring'):
    path = HERE/(name+'.py')
    data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == manifest['sha256'][path.name]
    for node in ast.walk(ast.parse(data)):
        if isinstance(node, ast.Import): raise RuntimeError('Unexpected import')
        if isinstance(node, ast.ImportFrom) and node.module not in {
            '__future__','datetime','enum','typing','pydantic','collections','models'}:
            raise RuntimeError('Unexpected dependency')
    spec = importlib.util.spec_from_file_location('review_snapshot.'+name,path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
from review_snapshot.models import CostEstimate, RiskState, TradeIntent
from review_snapshot.scoring import score_swarm

AT = dt.datetime.now(dt.timezone.utc)
def intent(source, group, **changes):
    values = dict(source=source,correlation_group=group,asset='BTC/USDC',
        side='buy',horizon_seconds=60,expected_gross_edge_bps=100.,confidence=.9,
        sigma_bps=10.,evidence_ids=['synthetic-fixture'],observed_at=AT)
    values.update(changes)
    return TradeIntent(**values)
def pair(**changes):
    return [intent('fixture-a','group-a',**changes),intent('fixture-b','group-b',**changes)]
def safe_number(value):
    return value if math.isfinite(value) else 'NONFINITE'
def evaluate(label, proposals, costs=None, risk=None):
    verdict=score_swarm(proposals,costs if costs is not None else CostEstimate(
        entry_fee_bps=10,exit_fee_bps=10,slippage_bps=5),risk)
    return dict(case=label,scorer_allowed=verdict.allowed,side=verdict.side.value,
        blockers=verdict.blockers,claimed_independent_groups=verdict.independent_groups,
        confidence_label=verdict.calibrated_confidence,
        estimated_cost_bps=safe_number(verdict.estimated_cost_bps),
        net_edge_bps=safe_number(verdict.expected_net_edge_bps),
        real_execution_attempted=False)

cases=[evaluate('synthetic_positive_control',pair(),risk=RiskState()),
    evaluate('missing_cost_components',pair(),costs=CostEstimate(),risk=RiskState()),
    evaluate('missing_risk_state',pair()),
    evaluate('seven_day_old_proposals',pair(observed_at=AT-dt.timedelta(days=7))),
    evaluate('future_dated_proposals',pair(observed_at=AT+dt.timedelta(days=7)))]
cases += [evaluate('missing_evidence',pair(evidence_ids=[])),
    evaluate('same_source_two_self_assigned_groups',[
        intent('one-source','label-a'),intent('one-source','label-b')]),
    evaluate('incompatible_horizons',[
        intent('fixture-a','group-a',horizon_seconds=60),
        intent('fixture-b','group-b',horizon_seconds=86400)]),
    evaluate('nonfinite_expected_edge',pair(expected_gross_edge_bps=float('inf'))),
    evaluate('explicit_kill_switch_control',pair(),risk=RiskState(kill_switch=True)),
    evaluate('explicit_stale_flag_control',pair(),risk=RiskState(stale_data=True)),
    evaluate('known_cost_exceeds_edge_control',pair(),costs=CostEstimate(entry_fee_bps=200))]
low=intent('duplicate-source','group-a',confidence=.1)
high=intent('duplicate-source','group-a',confidence=.9)
other=intent('other-source','group-b',confidence=.9)
cases += [evaluate('duplicate_source_low_first',[low,high,other]),
          evaluate('duplicate_source_high_first',[high,low,other])]
assert not cases[9]['scorer_allowed'], 'kill-switch positive control failed'
assert not cases[10]['scorer_allowed'], 'stale-flag positive control failed'
assert not cases[11]['scorer_allowed'], 'known-cost positive control failed'
report={'schema':'csoai.offline-scorer-review/0.1','observed_at':AT.isoformat(),
    'source_manifest':manifest,'cases':cases,
    'case_count':len(cases),'real_orders':0,'network_calls':0,
    'production_files_modified':False,'source_is_snapshot':True,
    'scope':'Pure score_swarm behaviour, not whole-application exploit or execution proof',
    'next_review':'Validate provenance, freshness, finite inputs, known costs/risk and order invariance; keep scoring separate from authority'}
print(json.dumps(report,indent=2,sort_keys=True,allow_nan=False))
