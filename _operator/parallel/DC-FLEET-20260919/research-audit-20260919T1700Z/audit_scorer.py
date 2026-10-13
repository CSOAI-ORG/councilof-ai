"""Synthetic, offline checks of research-scorer semantics; no order or API client."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys

SOURCE = Path('/Users/nicholas/clawd/councilof-ai-work/condor/condor')
sys.path.insert(0, str(SOURCE))
from gspc_swarm import CostEstimate, RiskState, Side, TradeIntent, score_swarm

AT = dt.datetime(2026, 9, 19, 17, 0, tzinfo=dt.timezone.utc)
def intent(source, group, **changes):
    fields = dict(source=source, asset='SYNTHETIC', side=Side.BUY,
        horizon_seconds=60, expected_gross_edge_bps=100, confidence=.9,
        sigma_bps=10, correlation_group=group, evidence_ids=['synthetic-only'],
        observed_at=AT)
    fields.update(changes)
    return TradeIntent(**fields)

cases = {
    'risk_state_omitted': [intent('a','group_a'), intent('b','group_b')],
    'same_evidence_two_group_labels': [intent('a','group_a'), intent('b','group_b')],
    'stale_observations': [intent('a','group_a', observed_at=AT-dt.timedelta(days=365)),
                           intent('b','group_b', observed_at=AT-dt.timedelta(days=365))],
    'different_forecast_horizons': [intent('a','group_a'), intent('b','group_b',horizon_seconds=86400)],
    'missing_evidence': [intent('a','group_a',evidence_ids=[]), intent('b','group_b',evidence_ids=[])],
}
results = {}
for name, signals in cases.items():
    verdict = score_swarm(signals, CostEstimate(entry_fee_bps=5, exit_fee_bps=5))
    results[name] = {'research_allowed_flag': verdict.allowed,
        'blockers': verdict.blockers, 'group_label_count': verdict.independent_groups,
        'interpretation': 'Research output only; not a funded-order authorization'}
control = score_swarm(cases['risk_state_omitted'], CostEstimate(), RiskState(kill_switch=True))
results['explicit_kill_switch_control'] = {'research_allowed_flag': control.allowed,
    'blockers': control.blockers}
assert control.allowed is False and 'kill_switch' in control.blockers
report = {'as_of': dt.datetime.now(dt.timezone.utc).isoformat(),
    'scope': 'Pure scorer with synthetic fixtures; no live execution or service changes',
    'source_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
        for p in (SOURCE/'gspc_swarm').glob('*.py')},
    'cases': results, 'actual_orders_sent': 0,
    'conclusion': 'An allowed research verdict alone does not establish freshness, '
        'empirical independence, measured risk state, evidence presence or matched horizons.'}
print(json.dumps(report, indent=2, sort_keys=True, allow_nan=False))
