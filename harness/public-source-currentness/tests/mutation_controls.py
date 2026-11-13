"""Three explicit weakened Python guards must fail the original contract vectors."""
import json,pathlib,subprocess,sys,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
source=(ROOT/'src/source_guard.py').read_text()
mutations=[('skip_head_consistency',"if before['revision'] != after['revision']:","if False:"),
 ('ignore_cache_age',"if age is not None and (not integer(age) or age != 0):","if False:"),
 ('skip_byte_digest',"if actual != lock['approved_sha256']:","if False:")]
results=[]
for name,old,new in mutations:
 assert source.count(old)==1, 'Mutation preimage changed'
 with tempfile.TemporaryDirectory() as tmp:
  p=pathlib.Path(tmp);(p/'src').mkdir();(p/'tests').mkdir()
  (p/'src/source_guard.py').write_text(source.replace(old,new))
  for f in ['vectors.json','run_python.py']:(p/'tests'/f).write_bytes((ROOT/'tests'/f).read_bytes())
  run=subprocess.run([sys.executable,'-B',str(p/'tests/run_python.py')],capture_output=True,text=True,timeout=10)
  data=json.loads((p/'results/run-result.json').read_text())
  assert run.returncode==1 and data['status']=='FAILED' and data['failures'], 'Mutant escaped or did not run'
  assert all('error' not in f for f in data['failures']), 'Not intended verdict assertions'
  results.append({'mutation':name,'detected':True,'failed_case_ids':[f['id'] for f in data['failures']]})
print(json.dumps({'mutation_controls':results,'passed':len(results)}))
(ROOT/'results/mutation-controls.json').write_text(json.dumps(results,indent=2)+'\n')
