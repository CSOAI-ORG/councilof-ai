"""Read-only M2/M4 research reporting. No exchange keys or order interface."""
from __future__ import annotations
import datetime as dt
import hashlib
import http.client
import json
from pathlib import Path
import re
import subprocess
import sys
from paper_metrics import score
UTC = dt.timezone.utc
HERE = Path(__file__).resolve().parent
M2 = Path('/Users/iokfarm/workspace_for_ai/csoai-fleet-observer-20260919')
M4 = Path('/Users/nicholas/clawd/councilof-ai-work/_operator/parallel/DC-FLEET-20260919')
DATA = Path('/Users/nicholas/clawd/councilof-ai-work/condor/data')
PINS = {'watch.py':'46b8172a20faca98a051ceaa7a2e3571f4fc38bc8be144824a8b1b50271f019b',
    'paper_bots.py':'10aa33be989b7c852635f2fe2c8480bf2c74d140ffec40ed10e52b2aa4d1a761',
    'study.json':'36bae2eccf93b07c51363d0623b78c39db14afd867a3262a5bbf14d4405a2ba2'}

def utcnow(): return dt.datetime.now(UTC)
def timestamp(value):
    result=dt.datetime.fromisoformat(str(value).replace('Z','+00:00'))
    if result.tzinfo is None: raise ValueError('timezone required')
    return result.astimezone(UTC)
def reject_constant(value): raise ValueError('nonfinite JSON')
def parse(raw): return json.loads(raw,parse_constant=reject_constant)
def failure(exc): return {'status':'UNCHECKABLE','error_type':type(exc).__name__}

def bounded_bytes(path, limit=16000000):
    with Path(path).open('rb') as stream: raw=stream.read(limit+1)
    if len(raw)>limit: raise ValueError('read bound exceeded')
    return raw

def outcome_summary(raw):
    if len(raw)>8000000: raise ValueError('outcome input bound exceeded')
    rows=[]; malformed=0
    for line in raw.splitlines():
        if not line.strip(): continue
        try: rows.append(parse(line))
        except (ValueError,UnicodeError): malformed+=1
    calculated=score(rows)
    dates=[]
    for row in rows:
        if not isinstance(row,dict) or row.get('execution')!='disabled': continue
        try: dates.append(timestamp(row['resolved_at']))
        except (KeyError,ValueError,TypeError,OverflowError): pass
    return {'status':'OBSERVED','source_bytes':len(raw),
        'source_sha256':hashlib.sha256(raw).hexdigest(),
        'malformed_json_lines':malformed,'recomputed_score':calculated,
        'latest_resolved_at':max(dates).isoformat() if dates else None,
        'reported_horizons_seconds':sorted({r['horizon_seconds'] for r in rows
            if isinstance(r,dict) and type(r.get('horizon_seconds')) is int}),
        'basis':'Reported paper outcomes; fill prices and costs not independently verified',
        'comparability':'Not comparable to the M2 spot-USDC replay as a money contest'}

def http_status(port):
    connection=http.client.HTTPConnection('127.0.0.1',port,timeout=2)
    try:
        connection.request('GET','/')
        return {'http_status':connection.getresponse().status,'scope':'root reachability only'}
    except OSError as exc: return failure(exc)
    finally: connection.close()

def m4_report():
    path=DATA/'gspc-paper-outcomes.jsonl'
    try: outcomes=outcome_summary(bounded_bytes(path,8000000))
    except (OSError,ValueError,TypeError,OverflowError) as exc: outcomes=failure(exc)
    return {'host':'M4','as_of':utcnow().isoformat(),'paper_outcomes':outcomes,
        'condor':http_status(8088),'hummingbot':http_status(8000),
        'live_account_or_executor_state':'NOT_QUERIED',
        'writer_unchanged':True,'authority':'OBSERVATION_ONLY'}

def run_json(command,cwd=None):
    result=subprocess.run(command,cwd=cwd,capture_output=True,text=True,timeout=15)
    if result.returncode or len(result.stdout)>200000:
        raise ValueError('bounded read command failed')
    return parse(result.stdout)

def check_frozen(study):
    for name,expected in PINS.items():
        if hashlib.sha256(bounded_bytes(study/name,1000000)).hexdigest()!=expected:
            raise ValueError('frozen study revision mismatch')

def m2_report():
    study=M2/'measurement-watch-20260919'
    try:
        check_frozen(study)
        paths=sorted(p for p in (study/'receipts').glob('*.json')
            if re.fullmatch(r'[0-9]{8}T[0-9]{12}Z\.json',p.name))
        if not paths: raise ValueError('no retained study receipt')
        path=paths[-1]; raw=bounded_bytes(path)
        receipt=parse(raw); report=receipt['payload']['report']
        checked=run_json(['/opt/homebrew/bin/python3','-B',str(study/'watch.py'),'verify',str(path)],cwd=study)
    except FileNotFoundError:
        return {'status':'UNCHECKABLE','reason':'required study file missing'}
    except (OSError,ValueError,TypeError,KeyError,subprocess.TimeoutExpired) as exc:
        return failure(exc)
    if checked.get('replay')!='MATCH' or bounded_bytes(path)!=raw:
        return {'status':'UNCHECKABLE','reason':'receipt replay or stability check failed'}
    age=(utcnow()-timestamp(report['as_of'])).total_seconds()
    manifest=receipt['payload']['manifest']
    return {'status':'VERIFIED_REPLAY','as_of':report['as_of'],
        'receipt_age_seconds':round(age,1),'receipt_sha256':hashlib.sha256(raw).hexdigest(),
        'phase':report['phase'],'input_rows':report['input_rows'],
        'strategy_groups':report['strategy_groups'],
        'window_start':manifest['started_at'],'window_end':manifest['ends_at'],
        'last_collector_at_capture':report['latest_collector_at'],
        'basis':'Fixed simulator normalized to $10 virtual per case; not funded wallets',
        'live_orders_allowed':False,'next_capture':'Existing hourly study automation; not this dashboard'}

def peer_report():
    command=['/usr/bin/ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes',
        '-o','ConnectTimeout=4','nicholas@NICHOLASs-MacBook-Air-2.local',
        '/opt/homebrew/bin/python3 -B '+str(M4/'research_bridge.py')+' local']
    try: return run_json(command)
    except (OSError,ValueError,TypeError,subprocess.TimeoutExpired) as exc: return failure(exc)

def combined():
    return {'schema':'csoai.fleet-research-readout/0.1','generated_at':utcnow().isoformat(),
        'mode':'READ_ONLY_RESEARCH','m2':m2_report(),'m4':peer_report(),
        'm2_condor_tunnel':http_status(8088),
        'limits':['No funded wallets or trading instructions are created by this reporter',
            'M2 spot-USDC replay and M4 outcome ledger are different experiments',
            'Basis-point totals are not dollar portfolio profits',
            'No automatic winner, parameter tuning or live-trading promotion'],
        'scoring_revision':hashlib.sha256(bounded_bytes(HERE/'paper_metrics.py',1000000)).hexdigest()}

if __name__=='__main__':
    try:
        if sys.argv[1:]==['local'] and Path.home()==Path('/Users/nicholas'):
            result=m4_report()
        elif sys.argv[1:]==['readout'] and Path.home()==Path('/Users/iokfarm'):
            result=combined()
        else: raise ValueError('Only fixed local or readout operations supported')
        print(json.dumps(result,indent=2,sort_keys=True,allow_nan=False))
    except Exception as exc:
        print(json.dumps(failure(exc))); sys.exit(2)
