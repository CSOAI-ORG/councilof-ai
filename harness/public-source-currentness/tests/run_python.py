"""Portable offline source-currentness contract qualification, no remote API calls."""
import copy,datetime,hashlib,json,pathlib,platform,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src'))
from source_guard import assess,validate_lock

def canonical(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
def run():
 rows=json.loads((ROOT/'tests/vectors.json').read_bytes());results=[];failures=[]
 for row in rows:
  before=copy.deepcopy(row)
  try:
   got=assess(row['lock'],row['observation'],row['now_ms'])
   ok=got['state']==row['expected_state'] and got['reason']==row['expected_reason']
   ok=ok and got['execution_authorized'] is False and got['source_truth_established'] is False and got['runtime_deployment_verified'] is False and got['signature'] is None and row==before
   if not ok:failures.append({'id':row['id'],'expected':[row['expected_state'],row['expected_reason']],'got':[got['state'],got['reason']]})
   results.append({'id':row['id'],'result':got})
  except Exception as e:failures.append({'id':row['id'],'error':type(e).__name__});results.append({'id':row['id'],'error':type(e).__name__})
 # Malformed operator configuration must never produce a positive readback.
 cfg=rows[0]['lock'];bad_configs=[]
 for field,value in [('target','attacker'),('repository','other/repo'),('path','../../private'),('approved_revision','main'),('approved_sha256','z'*64),('max_source_bytes',True),('max_source_bytes',65537),('valid_until_ms',True)]:
  c=copy.deepcopy(cfg);c[field]=value;bad_configs.append(c)
 c=copy.deepcopy(cfg);c['authority']=True;bad_configs.append(c)
 config_passed=0
 for c in bad_configs:
  try:validate_lock(c)
  except ValueError:config_passed+=1
  else:failures.append({'operator_lock':'accepted_invalid'})
 outdir=ROOT/'results';outdir.mkdir(exist_ok=True)
 (outdir/'decisions-python.json').write_bytes(canonical(results)+b'\n')
 summary={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'python':platform.python_version(),
  'contract_cases':len(rows),'contract_cases_passed':len(rows)-sum('id'in f for f in failures),
  'invalid_operator_locks':len(bad_configs),'invalid_operator_locks_rejected':config_passed,
  'decision_sha256':hashlib.sha256(canonical(results)).hexdigest(),'fixture_sha256':hashlib.sha256((ROOT/'tests/vectors.json').read_bytes()).hexdigest(),
  'source_sha256':hashlib.sha256((ROOT/'src/source_guard.py').read_bytes()).hexdigest(),
  'status':'PASSED' if not failures else 'FAILED','failures':failures,'network_calls':0,'model_calls':0,'training':False,
  'scope':'Synthetic contract tests, not an independent source-truth or model-performance benchmark'}
 (outdir/'run-result.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
 return 0 if not failures else 1
if __name__=='__main__':sys.exit(run())
