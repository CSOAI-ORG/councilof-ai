"""Fresh source qualification; never copies a previous result file as evidence."""
from pathlib import Path
import hashlib,json,shutil,subprocess,sys,tempfile,time

FILES=['memory_venturi.py','memory_ui_tools.py','memory_experiments.py','test_memory_venturi.py','test_targeted_invalidation.py','test_memory_adoption.py']
BASE_SHA='9f2249277c9897788844fe02b8397180e8383dcb4ef381490b39a65410aa4a37'

def run(root=None):
    root=Path(root or Path(__file__).parent);started=time.monotonic()
    baseline=(root/'adoption-20261112'/'upstream-memory_venturi.py').read_bytes()
    if hashlib.sha256(baseline).hexdigest()!=BASE_SHA:raise ValueError('Baseline source changed')
    runner='''import io,json,unittest,sys
suite=unittest.TestLoader().loadTestsFromNames(['test_memory_venturi','test_targeted_invalidation','test_memory_adoption'])
count=suite.countTestCases()
assert count==53,('Expected all53methods',count)
result=unittest.TextTestRunner(verbosity=2).run(suite)
assert result.testsRun==53 and result.wasSuccessful()
print('ADOPTION_SUITE_JSON='+json.dumps({'ran':result.testsRun,'failures':len(result.failures),'errors':len(result.errors)}))
'''
    with tempfile.TemporaryDirectory(prefix='meok-adoption-fresh-') as directory:
        dst=Path(directory)
        for name in FILES:shutil.copyfile(root/name,dst/name)
        p=subprocess.run([sys.executable,'-B','-c',runner],cwd=dst,capture_output=True,text=True,timeout=45)
        if p.returncode:raise RuntimeError('Fresh candidate suite failed:\n'+p.stdout+p.stderr)
        # Actual baseline fails the in-flight acceptance case with the same frozen test.
        (dst/'memory_venturi.py').write_bytes(baseline)
        old=subprocess.run([sys.executable,'-B','-m','unittest','-v','test_memory_adoption.MemoryAdoptionTests.test_no_stale_result_retained_in_race_controls'],cwd=dst,capture_output=True,text=True,timeout=20)
        if not(old.returncode and 'AssertionError' in old.stderr and "'FRESH_RESULT' != 'INVALIDATED_DURING_COMPUTE'" in old.stderr):raise AssertionError('Pinned upstream negative control did not fail at intended assertion')
    result={'state':'FRESH_ADOPTION_QUALIFICATION_PASSED','methods':53,'existing_methods':34,'targeted_invalidation_methods':12,'live_diagnostic_methods':7,'old_cache_intended_assertion_failed':True,'source_sha256':{name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in FILES},'baseline_sha256':BASE_SHA,'candidate_log_sha256':hashlib.sha256((p.stdout+p.stderr).encode()).hexdigest(),'negative_log_sha256':hashlib.sha256((old.stdout+old.stderr).encode()).hexdigest(),'wall_seconds':time.monotonic()-started,'network_calls':0,'model_training':False,'real_user_authentication':False}
    print(json.dumps(result),flush=True)
    return result

if __name__=='__main__':run()
