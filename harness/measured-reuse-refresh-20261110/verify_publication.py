"""Check this published study, optionally replay it in fresh scratch. Standard library only.

This is a consistency/reader-acceptance check, not a signer, grader, authorizer,
model evaluator or production readiness verdict. Historical evidence is never overwritten.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
from decimal import Decimal

STUDY = 'csoai.measured-reuse.refresh-retain.20261110.r06'
SIZES = (64, 512, 4096)
ARMS = ('direct', 'selective', 'bypass', 'refresh_retain')
PHASES = ('cold', 'unchanged', 'sparse', 'dense1', 'dense2', 'stable_after_dense',
          'stable_again', 'task_change', 'stable_after_task', 'stable_task_again')
INPUTS = ('baseline/memory_venturi.py', 'baseline/test_memory_venturi.py',
          'candidate/test_refresh_retain.py', 'prepare.py', 'run_experiment.py',
          'qualification.log', 'refresh_retain.patch', 'results/development_correction.json',
          'results/history_totals.csv', 'results/summary.json')

class Rejected(ValueError):
    """A violated publication or reproduction contract."""

def require(condition: bool, reason: str) -> None:
    if not condition:
        raise Rejected(reason)

def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def local(root: Path, relative: str) -> Path:
    path = root / relative
    require(not Path(relative).is_absolute() and '..' not in Path(relative).parts, 'UNSAFE_PATH')
    require(path.resolve().is_relative_to(root.resolve()) and not path.is_symlink(), 'UNSAFE_PATH')
    return path

def check_history(summary: dict, csv_text: str) -> dict:
    require(summary.get('study_id') == STUDY, 'WRONG_STUDY')
    for k, n in {'unit_tests_passed':49, 'existing_unit_tests':34, 'new_unit_tests':15,
                 'histories':36, 'timed_batches':1440, 'explicit_history_assertions':576,
                 'sources_per_batch':16, 'histories_per_size':12}.items():
        require(type(summary.get(k)) is int and summary[k] == n, 'WRONG_COUNT:' + k)
    for key in ('gspc_admitted', 'training', 'live_runtime_changes'):
        require(summary.get(key) is False, 'INVALID_SCOPE:' + key)
    require(summary.get('model') == 'NONE' and summary.get('authorization') == 'SYNTHETIC_CALLBACKS_ONLY', 'INVALID_SCOPE')
    require(summary.get('energy') == summary.get('monetary_cost') == 'UNKNOWN', 'UNMEASURED_COST_CLAIM')
    require(summary.get('records_per_source') == list(SIZES) and summary.get('phases') == list(PHASES), 'WRONG_DESIGN')
    rows = list(csv.DictReader(io.StringIO(csv_text)))
    expected = {(s,h) for s in SIZES for h in range(12)}
    seen = set(); totals = {s:{a:0 for a in ARMS} for s in SIZES}
    try:
        for row in rows:
            key = int(row['records_per_source']), int(row['history'])
            require(key in expected and key not in seen, 'DUPLICATE_OR_UNKNOWN_HISTORY')
            seen.add(key)
            for a in ARMS:
                value = int(row[a+'_total_ns'])
                require(value >= 0, 'NEGATIVE_TIME')
                totals[key[0]][a] += value
    except (KeyError, TypeError) as exc:
        raise Rejected('MALFORMED_CSV') from exc
    require(seen == expected, 'MISSING_HISTORY')
    published = summary.get('total_ms_including_setup', [])
    require(len(published)==3 and {r['records'] for r in published} == set(SIZES), 'MISSING_TOTAL')
    for row in published:
        for a in ARMS:
            require(Decimal(str(row[a])) == Decimal(totals[row['records']][a])/Decimal(1000000), 'TOTAL_MISMATCH')
    ratios = summary['conditional_4096_speed_ratios']
    for label,a in [('bypass_over_refresh','bypass'), ('selective_over_refresh','selective')]:
        actual = totals[4096][a]/totals[4096]['refresh_retain']
        require(abs(ratios[label]['ratio']-actual) <= 1e-12, 'RATIO_MISMATCH')
    return {'history_rows':len(rows), 'reconciled_totals':12, 'historical_timing_unchanged':True}

def check_sources(root: Path) -> dict:
    pins = json.loads((root/'publication-pins.json').read_text())['files']
    require(set(pins) == set(INPUTS), 'PIN_COVERAGE_CHANGED')
    for name, digest in pins.items():
        path = local(root,name)
        require(path.is_file(), 'MISSING_INPUT:' + name)
        require(sha(path.read_bytes()) == digest, 'INPUT_CHANGED:' + name)
    summary = json.loads(local(root,'results/summary.json').read_text())
    for field,name in [('baseline_sha256','baseline/memory_venturi.py'), ('runner_sha256','run_experiment.py')]:
        require(summary[field] == pins[name], 'SUMMARY_SOURCE_MISMATCH')
    report = check_history(summary,local(root,'results/history_totals.csv').read_text())
    return {**report, 'pinned_inputs':len(pins), 'candidate_sha256':summary['candidate_sha256']}

def check_suite(result: dict) -> None:
    require(result.get('discovered') == 49 and result.get('tests_run') == 49, 'INCOMPLETE_UNIT_SUITE')
    for k in ('errors','failures','skipped','expected_failures','unexpected_successes'):
        require(type(result.get(k)) is int and result[k] == 0, 'UNIT_SUITE_NOT_CLEAN:' + k)

def check_report_identity(data: dict) -> None:
    protocol=data.get('protocol',{})
    require(protocol.get('identity')==STUDY,'REPLAY_IDENTITY')
    for field, expected in {
        'baseline_sha256':'9f2249277c9897788844fe02b8397180e8383dcb4ef381490b39a65410aa4a37',
        'candidate_sha256':'a0332c36471bf2b726ee00bdcac7733d7b98e2991954b6beb61b6b103e635e69',
        'runner_sha256':'9fbd5e72a2062880367e718d4dfbf61f4a0fe3bee8c3322124719975ed25376c'}.items():
        require(protocol.get(field)==expected,'REPLAY_SOURCE_PIN:'+field)
    require(protocol.get('record_counts')==list(SIZES) and protocol.get('arms')==list(ARMS)
            and protocol.get('phases')==list(PHASES),'REPLAY_DESIGN')
    require(protocol.get('histories_per_size')==12 and protocol.get('sources_per_batch')==16,'REPLAY_DESIGN')
    rows=data.get('summary',[])
    require(len(rows)==3 and {r['records'] for r in rows}==set(SIZES),'REPLAY_SUMMARY_COVERAGE')

def check_replay(out: Path) -> dict:
    data=json.loads((out/'results.json').read_text())
    check_report_identity(data)
    require(json.loads((out/'frozen_protocol.json').read_text())==data['protocol'],'FREEZE_MISMATCH')
    require(data.get('batches')==1440 and data.get('histories')==36 and data.get('history_checks')==576,'REPLAY_COUNT_MISMATCH')
    require(data.get('model_calls')==0 and data.get('training') is False and data.get('gspc_admitted') is False,'REPLAY_SCOPE')
    fixtures=json.loads((out/'fixture_manifest.json').read_text()); require(len(fixtures)==192,'FIXTURE_COUNT')
    oracle={}
    for f in fixtures:
        p=local(out,f['path']); raw=p.read_bytes()
        require(sha(raw)==f['sha256'],'FIXTURE_BYTES_CHANGED')
        rows=raw.decode('cp037').splitlines(); total=0
        for row in rows:
            require(len(row)==20 and row[6] in '+-' and row[19] in 'AI' and row[:6].isdigit() and row[7:19].isdigit(),'FIXTURE_LAYOUT')
            if row[19]=='A': total += int(row[6:19])
        require(str(total)==f['sum_cents'],'FIXTURE_ORACLE_MISMATCH')
        require(f['path'] not in oracle,'DUPLICATE_FIXTURE'); oracle[f['path']]=str(total).encode()
    expected_hashes={}
    for s in SIZES:
        versions=[0]*16
        for phase in PHASES:
            changed=2 if phase=='sparse' else 14 if phase in ('dense1','dense2') else 0
            for i in range(changed):versions[i]+=1
            hashes=[sha(oracle[f'fixtures/n{s}-s{i}-v{versions[i]}.cp037']) for i in range(16)]
            expected_hashes[s,phase]=sha(json.dumps(hashes,separators=(',',':')).encode())
    expected={(s,h,p,a) for s in SIZES for h in range(12) for p in PHASES for a in ARMS};seen=set()
    totals={(s,h,a):0 for s in SIZES for h in range(12) for a in ARMS}
    setup_seen=set()
    for row in data['setup']:
        key=row['size'],row['history'],row['arm'];require(key in totals and key not in setup_seen,'INVALID_SETUP')
        require(type(row['setup_ns']) is int and row['setup_ns']>=0,'INVALID_SETUP_TIME')
        setup_seen.add(key);totals[key]+=row['setup_ns']
    require(setup_seen==set(totals),'MISSING_SETUP')
    for row in data['raw']:
        key=row['size'],row['history'],row['phase'],row['arm'];s,h,p,a=key
        require(key in expected and key not in seen,'INVALID_BATCH_ID');seen.add(key)
        require(row['outputs_sha256']==expected_hashes[s,p],'REPLAY_OUTPUT_MISMATCH')
        require(type(row['elapsed_ns']) is int and row['elapsed_ns']>=0,'INVALID_BATCH_TIME')
        require(row['authorization_checks']==32,'AUTHORIZATION_CHECK_COUNT')
        if a=='direct' or p in ('cold','task_change'): calls=16
        elif p=='sparse': calls=2
        elif p in ('dense1','dense2'): calls=14 if a=='selective' else 16
        elif a=='bypass' and p=='stable_after_dense': calls=14
        elif a=='bypass' and p=='stable_after_task': calls=16
        else:calls=0
        require(row['compute_calls']==calls,'COMPUTATION_COUNT')
        require(row['hits']==(0 if a=='direct' else 16-calls),'HIT_COUNT')
        totals[s,h,a]+=row['elapsed_ns']
    require(seen==expected,'MISSING_BATCH')
    for row in data['summary']:
        s=row['records']
        for a in ARMS:
            actual=sum(totals[s,h,a] for h in range(12))/1e6
            require(abs(row['total_ms'][a]-actual)<1e-9,'REPLAY_TOTAL_MISMATCH')
    return {'batches_checked':len(seen),'fixtures_checked':len(fixtures),'replayed_history_assertions':576,
            'timing_result':'new host observation; historical timing values were not replaced'}

UNIT_DRIVER = '''import sys,unittest,json
sys.path.insert(0,sys.argv[1])
suite=unittest.defaultTestLoader.discover(sys.argv[1],pattern="test_*.py")
n=suite.countTestCases();r=unittest.TextTestRunner(verbosity=2).run(suite)
report=dict(discovered=n,tests_run=r.testsRun,errors=len(r.errors),failures=len(r.failures),skipped=len(r.skipped),expected_failures=len(r.expectedFailures),unexpected_successes=len(r.unexpectedSuccesses))
open(sys.argv[2],"w").write(json.dumps(report,indent=2)+"\\n")
sys.exit(0 if r.wasSuccessful() else 1)
'''

def replay(root: Path, output: Path) -> dict:
    require(not output.exists(),'OUTPUT_EXISTS')
    require(not output.resolve().is_relative_to(root.resolve()),'OUTPUT_INSIDE_SOURCE')
    output.mkdir(parents=True); scratch=output/'source';scratch.mkdir()
    for name in INPUTS:
        target=scratch/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(local(root,name),target)
    # No profile, token or provider environment is passed to the local child processes.
    env={'LC_ALL':'C.UTF-8','PYTHONHASHSEED':'0','PYTHONOPTIMIZE':'0'}
    def call(label,args):
        start=time.perf_counter();r=subprocess.run([sys.executable,'-I',*args],cwd=scratch,env=env,capture_output=True,text=True,timeout=90)
        (output/(label+'.log')).write_text(r.stdout+r.stderr)
        require(r.returncode==0,'COMMAND_FAILED:'+label)
        return time.perf_counter()-start
    wall={};wall['prepare']=call('prepare',['prepare.py'])
    summary=json.loads((scratch/'results/summary.json').read_text())
    require(sha((scratch/'candidate/memory_venturi.py').read_bytes())==summary['candidate_sha256'],'CANDIDATE_CHANGED')
    wall['unit_tests']=call('unit_tests',['-c',UNIT_DRIVER,str(scratch/'candidate'),str(output/'unit_result.json')])
    unit=json.loads((output/'unit_result.json').read_text());check_suite(unit)
    wall['benchmark']=call('benchmark',['run_experiment.py',str(output/'run')])
    checked=check_replay(output/'run')
    return {'unit_suite':unit,**checked,'command_wall_seconds':wall,'model_calls':0,'training':False,'gspc_admitted':False,'production_authority':'NONE','cost':'UNKNOWN','energy':'UNKNOWN'}

def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parent)
    parser.add_argument('--replay',type=Path,help='Fresh output directory outside this source tree')
    args=parser.parse_args()
    try:
        result={'study':STUDY,'historical':check_sources(args.root)}
        if args.replay:
            result['fresh_replay']=replay(args.root,args.replay.resolve())
            (args.replay/'acceptance.json').write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps(result,indent=2));return 0
    except (Rejected,OSError,ValueError,KeyError,TypeError,subprocess.TimeoutExpired) as exc:
        print(json.dumps({'status':'FAIL','reason':str(exc),'gspc_admitted':False}));return 1

if __name__=='__main__':raise SystemExit(main())
