"""Reproduce an acceptance gap in the exact previous client with a local false server.
No HTTP requests are made; a simulated response is never counted as real inference.
"""
from pathlib import Path
import json,hashlib,importlib.util,urllib.parse,contextlib,io,sys
R=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(R))
from response_contract import decode,validate_prediction,ContractError,WEIGHTS
raw=(R/'completion/legacy-replay.py').read_bytes();assert hashlib.sha256(raw).hexdigest()=='25310a41e5db8701354adb02992c153536c634e746d4b5fce31a42c59e9dd01e'
spec=importlib.util.spec_from_file_location('legacy_client',R/'completion/legacy-replay.py');old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old);old.ROOT=R
class Response:
    def __init__(self,code,value):
        self.status=code;self.raw=json.dumps(value,separators=(',',':'),allow_nan=False).encode();self.headers={'x-content-sha256':hashlib.sha256(self.raw).hexdigest()}
    def __enter__(self):return self
    def __exit__(self,*args):return False
    def read(self,limit):return self.raw[:limit]
class FakeEdge:
    def open(self,request,timeout):
        path=urllib.parse.urlsplit(request.full_url).path
        if path=='/health':return Response(200,{'state':'RESEARCH_PREVIEW','weights_sha256':WEIGHTS,'limits':{'expires_at':'2026-11-12T00:00:00Z'}})
        if request.headers.get('X-model-sha256')!=WEIGHTS:return Response(409,{'error':'MODEL_PIN_REQUIRED_OR_MISMATCH'})
        raw=request.data
        if len(raw)>8192:return Response(413,{'error':'BODY_TOO_LARGE'})
        try:rows=json.loads(raw)
        except json.JSONDecodeError:return Response(400,{'error':'INVALID_JSON'})
        if not 1<=len(rows)<=8:return Response(400,{'error':'BATCH_RANGE'})
        if any(type(v) is bool for row in rows for v in row):return Response(422,{'error':'FEATURE_CONTRACT'})
        return Response(200,{'schema':'csoai.process-cross-runtime/1','state':'SYNTHETIC_PREDICTIONS_ONLY','weights_sha256':WEIGHTS,'input_sha256':hashlib.sha256(raw).hexdigest(),'rows':len(rows),'outputs':[],'limits':{'max_input_bytes':8192,'max_rows':8,'expires_at':'2026-11-12T00:00:00Z'},'signed':False,'persisted':False,'authorises_execution':False,'gspc_admitted':False,'cosmos_loaded':False})
old.OPENER=FakeEdge();capture=io.StringIO()
with contextlib.redirect_stdout(capture):result=old.run('SIMULATED-empty-output-negative-control',R/'completion/legacy-false-pass','https://fixture.workers.dev')
assert result['state']=='CROSS_RUNTIME_PARITY_PASSED' and result['edge']['rows_compared']==0
# The exact same byte-consistent empty response is rejected by the hardened validator.
row=json.loads((R/'vendor/test.jsonl').read_text().splitlines()[0]);body=json.dumps([row['features']]).encode()
req=urllib.request.Request('https://fixture.workers.dev/v1/predict',data=body,headers={'X-Model-SHA256':WEIGHTS});response=old.OPENER.open(req,15)
try:validate_prediction(decode(response.raw),body,[row['features']],[{'raw_prediction':[0,0,0,0],'prediction':[0,0,0,1]}])
except ContractError as e:reason=str(e)
else:raise AssertionError('Hardened client accepted empty output')
report={'state':'PRIOR_FALSE_PASS_REPRODUCED_AND_NEW_CONTRACT_REFUSES','legacy_source_sha256':hashlib.sha256(raw).hexdigest(),'legacy_reported_state':result['state'],'legacy_actual_compared_rows':0,'legacy_expected_bank_rows':560,'new_rejection':reason,'actual_provider_calls':0,'simulated_responses':True,'historical_successful_runs_reclassified':False,'scope':'The client could accept a self-hashed response with a correct declared count but an empty outputs array. Historical recorded successful runs explicitly compared560rows; this probe does not negate those runs.'}
(R/'completion/legacy-false-pass-proof.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
