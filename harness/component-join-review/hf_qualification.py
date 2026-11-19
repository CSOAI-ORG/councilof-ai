"""Run the local contract tests and replay the existing pinned HF model. No publication."""
import datetime,hashlib,importlib.util,json,math,pathlib,subprocess,sys,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent
run=subprocess.run([sys.executable,'-B','-m','unittest','-v','test_join_contract'],cwd=ROOT,capture_output=True,text=True,timeout=25)
print(run.stdout+run.stderr,flush=True)
if run.returncode:raise SystemExit(run.returncode)
BASE='https://huggingface.co/csoai/meok-process-world-v0/resolve/90d6aa6c87629b9f4296142ba2019247b51686c4/'
DATA='https://huggingface.co/datasets/csoai/meok-process-world-transitions-v0/resolve/4a522537c9eb1522a3aad1432e9626e72e3a2733/test.jsonl'
PINS={'predict.py':'8ff377179cbb897eea88a590036ba906b449a17a3f936d389835090dd58836e6','weights.json':'9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b','test.jsonl':'6349f1e13d5e1952566110d52494d8da3dd4bde7b01bbaffecc28fdb8b66aa9c'}
files={}
for name,pin in PINS.items():
 url=DATA if name=='test.jsonl' else BASE+name
 with urllib.request.urlopen(url,timeout=15) as r:raw=r.read(2097153)
 if len(raw)>2097152 or hashlib.sha256(raw).hexdigest()!=pin:raise ValueError('Pinned public source mismatch: '+name)
 (ROOT/name).write_bytes(raw);files[name]={'sha256':pin,'bytes':len(raw)}
spec=importlib.util.spec_from_file_location('retained_process_predictor',ROOT/'predict.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
m=mod.ProcessPredictor(ROOT/'weights.json',PINS['weights.json'])
rows=[json.loads(s) for s in (ROOT/'test.jsonl').read_text().splitlines() if s.strip()]
errors=[];preds=[]
for row in rows:
 if row['split']!='test':raise ValueError('wrong split')
 out=m.predict(row['features']);p=out['prediction']
 if len(p)!=4 or not all(math.isfinite(v) and 0<=v<=1 for v in p) or abs(sum(p)-1)>1e-8:raise ValueError('invalid predicted proportions')
 if out['authorises_execution'] is not False or out['gspc_admitted'] is not False:raise ValueError('authority boundary')
 errors.extend(abs(a-b) for a,b in zip(p,row['target']))
 preds.append({'episode':row['episode'],'tick':row['tick'],'prediction':p})
negative=[]
for label,features in [('nan',[float('nan')]+[0]*10),('short',[0]*10),('boolean',[True]+[0]*10),('bad_proportions',[1,1,0,0,.3,.3,.4,0,0,0,0]),('outside',[1,0,0,0,.3,.3,.4,0,9,0,0])]:
 try:m.predict(features)
 except (ValueError,TypeError):negative.append(label)
 else:raise AssertionError('negative control escaped '+label)
summary={'observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'QUALIFIED_SCOPED_BUILD','python':sys.version.split()[0],'contract_tests':42,'hf_retained_model_rows_replayed':len(rows),'mean_absolute_error':sum(errors)/len(errors),'max_absolute_error':max(errors),'five_invalid_inputs_rejected':negative,'pins':files,'predictions_sha256':hashlib.sha256(json.dumps(preds,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'training_performed':False,'new_independent_test_cases':0,'production_changed':False,'space_published':False,'signature_state':'UNSIGNED','independent_organisation_acceptance':False,'scope':'Hugging Face CPU build/test and retained synthetic-model replay; not general world-model validation'}
(ROOT/'hf_qualification_result.json').write_text(json.dumps(summary,indent=2)+'\n')
print('QUALIFICATION_RESULT '+json.dumps(summary,sort_keys=True),flush=True)
