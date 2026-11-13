"""Actual pinned-model reference and adversarial response tests, without provider calls."""
from pathlib import Path
import copy,hashlib,importlib.util,json,math
from response_contract import validate_prediction,decode,exact_rule,ContractError,WEIGHTS,EXPIRY
R=Path(__file__).parent
spec=importlib.util.spec_from_file_location('original_predictor',R/'vendor/predict.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
model=p.ProcessPredictor(R/'vendor/weights.json',WEIGHTS)
rows=[json.loads(s) for s in (R/'vendor/test.jsonl').read_text().splitlines()]

def fixture(features):
    refs=[model.predict(x) for x in features];body=json.dumps(features,separators=(',',':'),allow_nan=False).encode()
    out={'schema':'csoai.process-cross-runtime/1','state':'SYNTHETIC_PREDICTIONS_ONLY','weights_sha256':WEIGHTS,'input_sha256':hashlib.sha256(body).hexdigest(),'rows':len(features),'outputs':[{'raw':r['raw_prediction'],'constrained':r['prediction'],'exact_synthetic_rule':exact_rule(x),'expiry_rule_applied':x[8]<=0} for x,r in zip(features,refs)],'limits':{'max_input_bytes':8192,'max_rows':8,'expires_at':EXPIRY},'signed':False,'persisted':False,'authorises_execution':False,'gspc_admitted':False,'cosmos_loaded':False}
    return out,body,refs

def run():
    cases=[];x=[rows[7]['features'],rows[8]['features']];good,body,refs=fixture(x)
    def negative(label,fn):
        try:fn()
        except ContractError as e:cases.append({'case':label,'state':'REFUSED','reason':str(e)});return
        raise AssertionError('Accepted false response: '+label)
    def altered(label,change):
        bad=copy.deepcopy(good);change(bad)
        negative(label,lambda:validate_prediction(bad,body,x,refs))
    altered('empty_outputs_with_claimed_rows',lambda d:d.update(outputs=[]))
    altered('short_outputs',lambda d:d.update(outputs=d['outputs'][:1]))
    altered('extra_outputs',lambda d:d['outputs'].append(copy.deepcopy(d['outputs'][0])))
    altered('wrong_declared_rows',lambda d:d.update(rows=1))
    altered('float_row_count',lambda d:d.update(rows=2.0))
    altered('missing_schema',lambda d:d.pop('schema'))
    altered('wrong_schema',lambda d:d.update(schema='other'))
    altered('wrong_state',lambda d:d.update(state='VERIFIED'))
    altered('wrong_model_pin',lambda d:d.update(weights_sha256='0'*64))
    altered('wrong_request_pin',lambda d:d.update(input_sha256='0'*64))
    for flag in ['signed','persisted','authorises_execution','gspc_admitted','cosmos_loaded']:
        altered(flag+'_true',lambda d,k=flag:d.update({k:True}))
        altered(flag+'_zero_is_not_false',lambda d,k=flag:d.update({k:0}))
    altered('missing_output_field',lambda d:d['outputs'][0].pop('raw'))
    altered('false_extra_authority',lambda d:d.update(approved=True))
    altered('missing_vector_value',lambda d:d['outputs'][0]['raw'].pop())
    altered('boolean_output',lambda d:d['outputs'][0]['raw'].__setitem__(0,True))
    altered('nan_output',lambda d:d['outputs'][0]['raw'].__setitem__(0,float('nan')))
    altered('infinite_output',lambda d:d['outputs'][0]['raw'].__setitem__(0,float('inf')))
    altered('wrong_output_value',lambda d:d['outputs'][0]['raw'].__setitem__(0,d['outputs'][0]['raw'][0]+.01))
    altered('wrong_expiry_rule',lambda d:d['outputs'][0].update(expiry_rule_applied=not d['outputs'][0]['expiry_rule_applied']))
    altered('integer_expiry_rule',lambda d:d['outputs'][0].update(expiry_rule_applied=int(d['outputs'][0]['expiry_rule_applied'])))
    altered('wrong_rule_output',lambda d:d['outputs'][0].update(exact_synthetic_rule=[1.,0.,0.,0.]))
    altered('wrong_expiry_limit',lambda d:d['limits'].update(expires_at='2099-01-01T00:00:00Z'))
    altered('relaxed_batch_limit',lambda d:d['limits'].update(max_rows=100))
    altered('boolean_batch_limit',lambda d:d['limits'].update(max_rows=True))
    for label,raw in [('duplicate_key',b'{"rows":2,"rows":0}'),('invalid_utf8',b'\xff'),('nonfinite_constant',b'{"x":NaN}'),('bad_json',b'['),('oversize',b' '*64001)]:negative(label,lambda raw=raw:decode(raw))
    # Self-consistent hashing cannot repair an incomplete semantic result.
    false=copy.deepcopy(good);false['outputs']=[];raw=json.dumps(false,separators=(',',':')).encode();assert hashlib.sha256(raw).hexdigest()==hashlib.sha256(raw).hexdigest()
    negative('self_hashed_empty_result_still_rejected',lambda:validate_prediction(decode(raw),body,x,refs))
    valid=validate_prediction(good,body,x,refs);assert valid['verified_rows']==2 and valid['verified_scalar_values']==24
    one,b,r=fixture([rows[0]['features']]);one['rows']=True
    negative('boolean_single_row_count',lambda:validate_prediction(one,b,[rows[0]['features']],r))
    verified=0;worst=0.
    for offset in range(0,len(rows),8):
        xs=[r['features'] for r in rows[offset:offset+8]];d,b,reference=fixture(xs);out=validate_prediction(d,b,xs,reference);verified+=out['verified_rows'];worst=max(worst,out['max_absolute_difference'])
    assert verified==560
    report={'state':'STRICT_RESPONSE_CONTRACT_PASSED','negative_cases':len(cases),'cases':cases,'valid_batch_control':True,'retained_rows_verified':verified,'scalar_values_verified':verified*12,'max_absolute_difference':worst,'real_network_requests':0,'model_weights_changed':False,'scope':'Semantic response validation against actual pinned-model references; not a new model-quality evaluation.'}
    (R/'completion/response-contract-tests.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='cases'}),flush=True);return report
if __name__=='__main__':run()
