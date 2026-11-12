"""Run the existing measured-reuse suite and hosted-model parity on Kaggle CPU.
Standard library only. Public pinned downloads; no credentials, GPU or model training.
The hosted reference is an observation, not a ground-truth label or quality score.
"""
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
import hashlib, importlib.util, json, math, os, platform, sqlite3, subprocess, sys, time, urllib.request

REPO='https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/'
REPLAY_REV='73990029a6d3321cce2d6cd500e0d931d730da54'
MODEL_REV='49fea7fd9f1fc03af85c32b6b930f722136804ef'
REFERENCE_REV='1ce3624e6dcd13bff2b67cb88ab5a4ffd942992f'
BASE='harness/measured-reuse-refresh-20261110/'
EXTRA_BLOBS={'publication-pins.json':'b921d5d59bbfa4f6d8357c8c23341ff21433bdfe',
 'verify_publication.py':'578ee7958ec42c81b0f73d4ec4bd6eef91f3227b',
 'test_publication.py':'e36e12908e308b9174cb27532e20ea2d5570b671',
 'LICENSE':'8b9c79bf057eed39ac6bdb8cda25f86786aa5967'}
WEIGHTS='9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b'
PREDICTOR='8ff377179cbb897eea88a590036ba906b449a17a3f936d389835090dd58836e6'
ROOT=Path('/kaggle/working') if Path('/kaggle/working').is_dir() else Path.cwd()
OUT=ROOT/'platform-replay'

def sha(raw):return hashlib.sha256(raw).hexdigest()
def blob(raw):return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
def require(ok,reason):
    if not ok:raise ValueError(reason)
def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Council-platform-replay/1'}),timeout=25) as r:
        raw=r.read(300001)
    require(len(raw)<=300000,'SOURCE_SIZE_LIMIT')
    return raw
def write(name,value):
    p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(value,indent=2,allow_nan=False)+'\n')
def command(label,args,cwd):
    t=time.perf_counter()
    r=subprocess.run([sys.executable,'-I',*args],cwd=cwd,
        env={'LC_ALL':'C.UTF-8','PYTHONHASHSEED':'0'},capture_output=True,text=True,timeout=120)
    (OUT/(label+'.log')).write_text(r.stdout+r.stderr)
    require(r.returncode==0,'COMMAND_FAILED:'+label)
    return time.perf_counter()-t

def main():
    OUT.mkdir(exist_ok=False)
    protocol={'study':'csoai.platform-replay.20261111.v1','replay_revision':REPLAY_REV,
      'model_source_revision':MODEL_REV,'reference_revision':REFERENCE_REV,
      'predictor_sha256':PREDICTOR,'weights_sha256':WEIGHTS,'comparison_absolute_tolerance':1e-12,
      'checks':['published-reuse-replay','hosted-process-parity','invalid-input-and-digest-controls'],
      'hypothesis':'The same pinned process predictor reproduces hosted outputs on a second CPU platform.',
      'accuracy_claim':False,'training':False,'gpu_requested':False,'gspc_admission':False,
      'timing_boundary':'Commands include execution and local output writes; download/setup separated; not a serving-speed comparison.',
      'cost':'UNKNOWN','energy':'UNKNOWN'}
    write('frozen_protocol.json',protocol)
    start=time.perf_counter();src=OUT/'source';src.mkdir();downloads=[]
    for name,pin in EXTRA_BLOBS.items():
        raw=fetch(REPO+REPLAY_REV+'/'+BASE+name)
        require(blob(raw)==pin,'GIT_BLOB_MISMATCH:'+name)
        (src/name).write_bytes(raw);downloads.append({'path':name,'sha256':sha(raw),'git_blob':blob(raw)})
    pins=json.loads((src/'publication-pins.json').read_text())['files']
    require(len(pins)==10,'PIN_COUNT')
    def get_input(item):
        name,pin=item
        require(not Path(name).is_absolute() and '..' not in Path(name).parts,'UNSAFE_PIN_PATH')
        raw=fetch(REPO+REPLAY_REV+'/'+BASE+name);require(sha(raw)==pin,'SHA256_MISMATCH:'+name)
        p=src/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
        return {'path':name,'sha256':sha(raw),'git_blob':blob(raw)}
    with ThreadPoolExecutor(max_workers=4) as pool:downloads.extend(pool.map(get_input,pins.items()))
    reference_raw=fetch(REPO+REFERENCE_REV+'/harness/platform-replay-20261111/hf-reference.json')
    reference=json.loads(reference_raw);(OUT/'hf-reference.json').write_bytes(reference_raw)
    require(reference['weights_sha256']==WEIGHTS and reference['predictor_sha256']==PREDICTOR,'REFERENCE_MODEL_PINS')
    require(reference['source_unchanged_during_calls'] is True and len(reference['cases'])==4,'REFERENCE_COVERAGE')
    require(reference['absolute_tolerance']==protocol['comparison_absolute_tolerance'],'TOLERANCE_CHANGED')
    model_dir=OUT/'model';model_dir.mkdir()
    for name,pin in [('predict.py',PREDICTOR),('weights.json',WEIGHTS),('LICENSE',None),('NOTICE',None)]:
        raw=fetch(REPO+MODEL_REV+'/harness/meok-process-lab/'+name)
        if pin:require(sha(raw)==pin,'MODEL_SOURCE_MISMATCH:'+name)
        (model_dir/name).write_bytes(raw);downloads.append({'path':'model/'+name,'sha256':sha(raw)})
    download_seconds=time.perf_counter()-start
    write('download_manifest.json',downloads)
    driver="""import sys,unittest,json
sys.path.insert(0,sys.argv[1]);s=unittest.defaultTestLoader.discover(sys.argv[1],pattern='test_publication.py')
n=s.countTestCases();r=unittest.TextTestRunner(verbosity=2).run(s)
d=dict(discovered=n,tests_run=r.testsRun,errors=len(r.errors),failures=len(r.failures),skipped=len(r.skipped),expected_failures=len(r.expectedFailures),unexpected_successes=len(r.unexpectedSuccesses))
open(sys.argv[2],'w').write(json.dumps(d,indent=2)+'\\n')
sys.exit(0 if n==21 and r.testsRun==21 and r.wasSuccessful() and not r.skipped and not r.expectedFailures and not r.unexpectedSuccesses else 1)
"""
    checker_seconds=command('checker',['-c',driver,str(src),str(OUT/'checker-result.json')],src)
    replay_seconds=command('reader',['verify_publication.py','--replay',str(OUT/'reader-replay')],src)
    acceptance=json.loads((OUT/'reader-replay/acceptance.json').read_text())
    require(acceptance['fresh_replay']['batches_checked']==1440,'MISSING_REPLAY_BATCHES')
    spec=importlib.util.spec_from_file_location('pinned_process',model_dir/'predict.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    predictor=module.ProcessPredictor(model_dir/'weights.json',WEIGHTS)
    rows=[]
    for case in reference['cases']:
        for constrained in (True,False):
            t=time.perf_counter();result=predictor.predict(case['features'],constrained);elapsed=time.perf_counter()-t
            expected=case['constrained'] if constrained else case['raw']
            error=max(abs(a-b) for a,b in zip(result['prediction'],expected))
            raw_error=max(abs(a-b) for a,b in zip(result['raw_prediction'],case['raw']))
            require(len(result['prediction'])==len(expected)==4 and len(result['raw_prediction'])==4,'PREDICTION_SHAPE')
            require(all(math.isfinite(v) for v in result['prediction']+result['raw_prediction']),'NONFINITE_OUTPUT')
            require(error<=protocol['comparison_absolute_tolerance'] and raw_error<=protocol['comparison_absolute_tolerance'],'HOSTED_PARITY_MISMATCH')
            require(result['authorises_execution'] is False and result['gspc_admitted'] is False,'INVENTED_AUTHORITY')
            rows.append({'id':case['id'],'constrained':constrained,'prediction':result['prediction'],
              'raw_prediction':result['raw_prediction'],'exact_numeric_match':result['prediction']==expected and result['raw_prediction']==case['raw'],
              'maximum_absolute_difference':max(error,raw_error),'compute_seconds':elapsed})
    controls=[]
    bads=[('length',[0]),('boolean',[True]+reference['cases'][0]['features'][1:]),
          ('nonfinite',[float('nan')]+reference['cases'][0]['features'][1:]),
          ('invalid_proportions',[.9]+reference['cases'][0]['features'][1:])]
    for name,features in bads:
        try:predictor.predict(features,True)
        except ValueError:controls.append({'case':name,'rejected':True})
        else:raise ValueError('CONTROL_FAILED:'+name)
    try:module.ProcessPredictor(model_dir/'weights.json','0'*64)
    except ValueError:controls.append({'case':'wrong_weight_digest','rejected':True})
    else:raise ValueError('CONTROL_FAILED:wrong_weight_digest')
    report={'study':protocol['study'],'state':'EXECUTED','observed_at':datetime.now(timezone.utc).isoformat(),
      'platform':'KAGGLE' if Path('/kaggle/working').is_dir() else 'LOCAL_VALIDATION',
      'runtime':{'python':sys.version,'platform':platform.platform(),'sqlite':sqlite3.sqlite_version},
      'runner_sha256':sha(Path(__file__).read_bytes()),'protocol_sha256':sha((OUT/'frozen_protocol.json').read_bytes()),
      'reference_sha256':sha(reference_raw),'download_manifest_sha256':sha((OUT/'download_manifest.json').read_bytes()),
      'input_files_verified':len(downloads),'original_checker':json.loads((OUT/'checker-result.json').read_text()),
      'reader_acceptance':acceptance,'process_parity':rows,'negative_controls':controls,
      'download_seconds':download_seconds,'checker_wall_seconds':checker_seconds,'reader_wall_seconds':replay_seconds,
      'model_calls':8,'foundation_model_calls':0,'training':False,'gpu_requested':False,'gspc_admitted':False,
      'actual_human_authorization':False,'cost':'UNKNOWN','energy':'UNKNOWN',
      'scope':'CPU process-model numerical parity and existing synthetic reuse replay; not new task accuracy, independence, safety certification or hardware speedup.'}
    write('run-evidence.json',report)
    files={str(p.relative_to(OUT)):sha(p.read_bytes()) for p in sorted(OUT.rglob('*')) if p.is_file()}
    write('artifact-manifest.json',{'algorithm':'sha256','files':files,'signed':False})
    print(json.dumps({'state':'EXECUTED','platform':report['platform'],'checker_tests':21,'candidate_tests':49,'batches':1440,
        'model_outputs_compared':len(rows),'exact_matches':sum(x['exact_numeric_match'] for x in rows),'negative_controls':len(controls),
        'runner_sha256':report['runner_sha256'],'report_sha256':sha((OUT/'run-evidence.json').read_bytes())},indent=2))

if __name__=='__main__':
    try:main()
    except Exception as exc:
        if OUT.is_dir():write('failure.json',{'state':'FAILED','error_type':type(exc).__name__,'reason':str(exc)[:1000],'training':False,'gspc_admitted':False})
        raise
