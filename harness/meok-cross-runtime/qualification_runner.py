"""Offline release gate. Never reuse pre-existing PASS files; no accounts or network needed."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,tempfile,time
FILES=['worker.mjs','weights-text.mjs','replay.py','response_contract.py','test-worker.mjs','test_response_contract.py','source-lock.json','vendor/core.mjs','vendor/predict.py','vendor/weights.json','vendor/test.jsonl','vendor/LICENSE','vendor/NOTICE','completion/legacy-replay.py','completion/legacy_false_pass_probe.py']

def qualify(root,negative_noop=False):
    root=Path(root).resolve();source_hashes={n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in FILES};start=time.perf_counter()
    with tempfile.TemporaryDirectory(prefix='meok-cross-runtime-gate-') as tmp:
        d=Path(tmp)
        for n in FILES:
            target=d/n;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((root/n).read_bytes())
        assert not (d/'node-tests.json').exists() and not (d/'completion/response-contract-tests.json').exists()
        if negative_noop:(d/'test-worker.mjs').write_text('// Intentional no-op regression control.\n')
        commands=[['node','test-worker.mjs'],[sys.executable,'-B','test_response_contract.py'],[sys.executable,'-B','completion/legacy_false_pass_probe.py']]
        logs=[]
        for command in commands:
            p=subprocess.run(command,cwd=d,capture_output=True,text=True,timeout=45)
            if p.returncode:raise RuntimeError('Contract process failed: '+command[-1]+'\n'+p.stderr[-1200:])
            logs.append({'command':command[-1],'exit':p.returncode,'output_sha256':hashlib.sha256((p.stdout+p.stderr).encode()).hexdigest()})
        # A zero-exit runner that did not produce its own fresh result cannot pass.
        node=json.loads((d/'node-tests.json').read_text());responses=json.loads((d/'completion/response-contract-tests.json').read_text());legacy=json.loads((d/'completion/legacy-false-pass-proof.json').read_text())
        if node['state']!='PASS' or node['contract_checks']!=25 or node['retained_rows']!=560 or node['batches']!=70 or node['max_handler_difference']!=0:raise ValueError('Node gate count/result mismatch')
        if responses['state']!='STRICT_RESPONSE_CONTRACT_PASSED' or responses['negative_cases']!=40 or len(responses['cases'])!=40 or responses['retained_rows_verified']!=560 or responses['scalar_values_verified']!=6720:raise ValueError('Response gate count/result mismatch')
        if legacy['state']!='PRIOR_FALSE_PASS_REPRODUCED_AND_NEW_CONTRACT_REFUSES' or legacy['legacy_actual_compared_rows']!=0 or legacy['new_rejection']!='ACTUAL_OUTPUT_COUNT':raise ValueError('Discriminating negative control did not execute')
    return {'state':'FRESH_OFFLINE_QUALIFICATION_PASSED','node_contracts':25,'response_rejections':40,'retained_rows':560,'legacy_false_pass_reproduced':True,'fresh_output_files_required':True,'preexisting_PASS_records_copied':False,'network_requests_requested':0,'model_training':False,'elapsed_seconds':time.perf_counter()-start,'source_sha256':source_hashes,'commands':logs}

if __name__=='__main__':
    root=Path(__file__).resolve().parent
    report=qualify(root)
    try:qualify(root,negative_noop=True)
    except FileNotFoundError:report['no_op_runner_rejected']=True
    else:raise AssertionError('A no-op test runner was accepted')
    output=root/'completion/fresh-qualification.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
