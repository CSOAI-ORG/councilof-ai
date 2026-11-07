"""Offline metadata and synthetic scorecard inspection; no runtime mutation."""
import hashlib
import importlib.util
import json
from pathlib import Path
import yaml
ROOT=Path('/Users/nicholas/clawd/councilof-ai-work/condor')
source=ROOT/'scripts/paper_scorecard.py'
spec=importlib.util.spec_from_file_location('reviewed_scorecard',source)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
fixture=[{'execution':'disabled','symbol':'SYNTHETIC','net_return_bps':5,
          'profitable_after_estimated_cost':True},
         {'execution':'disabled','symbol':'SYNTHETIC','profitable_after_estimated_cost':True}]
score=module.score(fixture)
profiles=[]
for path in sorted((ROOT/'agents').glob('*/strategies/*/strategy.md')):
    _,front,_=path.read_text().split('---',2)
    config=yaml.safe_load(front).get('default_config',{})
    limits=config.get('risk_limits',{})
    profiles.append({'path':str(path.relative_to(ROOT)),
        'execution_mode':config.get('execution_mode'),
        'limits':{k:limits[k] for k in ('max_position_size_quote','max_open_executors',
            'max_leverage','max_drawdown_pct','shutdown_drawdown_pct') if k in limits}})
report={'scope':'Static defaults and synthetic scorecard, not active sessions',
    'strategy_definition_count':len(profiles),
    'dry_run_default_count':sum(p['execution_mode']=='dry_run' for p in profiles),
    'profiles':profiles,
    'scorecard_counterexample':{'fixture_rows':len(fixture),
        'valid_numeric_outcomes':1,'reported_win_rate':score['cost_adjusted_win_rate'],
        'interpretation':'Missing-return row is included in numerator but not denominator'},
    'paper_scorecard_source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'real_orders_sent':0,'runtime_settings_changed':False}
print(json.dumps(report,indent=2,sort_keys=True,allow_nan=False))
