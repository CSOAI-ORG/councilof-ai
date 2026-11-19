"""Replay the real pinned predictor, optionally compare a bounded public edge preview.
No training, no secrets, no hidden paid model provider, no GSPC admission.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,math,platform,statistics,time,urllib.request,urllib.error,urllib.parse,sys
from datetime import datetime,timezone
from response_contract import decode,validate_prediction
ROOT=Path(__file__).resolve().parent
WEIGHTS='9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b'
TOLERANCE=1e-12
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):return None
OPENER=urllib.request.build_opener(NoRedirect)
def h(b):return hashlib.sha256(b).hexdigest()
def get(url,maximum):
    with OPENER.open(urllib.request.Request(url,headers={'User-Agent':'CSOAI-cross-runtime-replay/1'}),timeout=25) as r:
        data=r.read(maximum+1)
    if len(data)>maximum:raise ValueError('Source response bound exceeded')
    return data

def run(label,out,edge_url=None,remote_dev_proxy=False):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    lock=json.loads((ROOT/'source-lock.json').read_text());vendor=out/'verified-inputs';vendor.mkdir(exist_ok=True)
    for name,record in lock['files'].items():
        if '/' in name or '\\' in name:raise ValueError('Unexpected vendor path')
        local=ROOT/'vendor'/name
        data=local.read_bytes() if local.exists() else get(record['url'],300000)
        if h(data)!=record['sha256']:raise ValueError('Source digest mismatch: '+name)
        (vendor/name).write_bytes(data)
    spec=importlib.util.spec_from_file_location('verified_process_predictor',vendor/'predict.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    model=module.ProcessPredictor(vendor/'weights.json',WEIGHTS)
    rows=[json.loads(x) for x in (vendor/'test.jsonl').read_text().splitlines()]
    assert len(rows)==560 and len({r['episode'] for r in rows})==70
    start=time.perf_counter();pred=[model.predict(r['features']) for r in rows];compute=time.perf_counter()-start
    errors=[abs(v-t) for r,p in zip(rows,pred) for v,t in zip(p['prediction'],r['target'])]
    report={'schema':'csoai.cross-runtime-replay/1','label':label,'state':'LOCAL_MODEL_REPLAY_PASSED','at':datetime.now(timezone.utc).isoformat(),'python':platform.python_version(),'platform':platform.platform(),'model_sha256':WEIGHTS,'input_sha256':h((vendor/'test.jsonl').read_bytes()),'source_space_revision':lock['source_revision'],'rows':560,'episodes':70,'local_model_evaluations':560,'local_compute_seconds':compute,'local_constrained_mae':sum(errors)/len(errors),'local_worst_component_error':max(errors),'edge':{'state':'NOT_REQUESTED'},'signed':False,'new_training':False,'GSPC_admitted':False,'limitations':['Public synthetic test-bank replay, not a new blind benchmark.','Runtime parity is not real-world correctness or general intelligence.','No energy measurement, quantum/photonic execution or large-language-model training.']}
    ledger=[];requests=0;deadline=time.monotonic()+240
    def edge(path,body=None,model_pin=WEIGHTS,method=None):
        nonlocal requests
        if requests>=82 or time.monotonic()>deadline:raise TimeoutError('Fixed remote request/time budget reached')
        requests+=1
        headers={'User-Agent':'CSOAI-cross-runtime-replay/1','Content-Type':'application/json','X-Model-SHA256':model_pin}
        req=urllib.request.Request(edge_url.rstrip('/')+path,data=body,headers=headers,method=method)
        begin=time.perf_counter()
        try:r=OPENER.open(req,timeout=15)
        except urllib.error.HTTPError as e:r=e
        with r:raw=r.read(64001);status=r.status;digest=r.headers.get('x-content-sha256');ray=r.headers.get('cf-ray')
        elapsed=time.perf_counter()-begin
        if len(raw)>64000 or digest!=h(raw):raise ValueError('Edge body limit or exact-byte digest mismatch')
        data=decode(raw);ledger.append({'request':requests,'path':path,'status':status,'seconds':elapsed,'response_sha256':digest,'request_sha256':h(body) if body is not None else None,'cf_ray_present':bool(ray)})
        return status,data
    try:
        if edge_url:
            u=urllib.parse.urlsplit(edge_url)
            public_ok=u.scheme=='https' and u.hostname and u.hostname.endswith('.workers.dev') and not any([u.username,u.password,u.query,u.fragment]) and u.path in ('','/')
            local_ok=remote_dev_proxy is True and edge_url=='http://127.0.0.1:9191'
            if not (public_ok or local_ok):raise ValueError('Expected explicit public workers.dev root, or the expressly enabled existing local remote-development proxy on port9191')
            code,health=edge('/health');assert code==200 and health['state']=='RESEARCH_PREVIEW' and health['weights_sha256']==WEIGHTS
            max_delta=0.0;checked=0;batch_rows=8;network_start=time.perf_counter()
            for offset in range(0,len(rows),batch_rows):
                subset=rows[offset:offset+batch_rows];body=json.dumps([r['features'] for r in subset],separators=(',',':'),allow_nan=False).encode()
                code,result=edge('/v1/predict',body);assert code==200 and result['input_sha256']==h(body) and result['weights_sha256']==WEIGHTS and result['rows']==len(subset)
                assert not any(result[k] for k in ['signed','persisted','authorises_execution','gspc_admitted','cosmos_loaded'])
                qualified=validate_prediction(result,body,[r['features'] for r in subset],pred[offset:offset+len(subset)])
                assert qualified['verified_rows']==len(subset)
                for j,item in enumerate(result['outputs']):
                    for key,refkey in [('constrained','prediction'),('raw','raw_prediction')]:
                        assert len(item[key])==4 and all(type(v) in (int,float) and math.isfinite(v) for v in item[key])
                        for actual,expected in zip(item[key],pred[offset+j][refkey]):max_delta=max(max_delta,abs(actual-expected));assert abs(actual-expected)<=TOLERANCE
                    checked+=1
            assert checked==len(rows),'Incomplete output coverage cannot pass'
            negative=[];good=rows[0]['features'];booleans=list(good);booleans[0]=True
            cases=[('wrong_pin',json.dumps([good]).encode(),'0'*64,409,'MODEL_PIN_REQUIRED_OR_MISMATCH'),('bad_json',b'[',WEIGHTS,400,'INVALID_JSON'),('boolean',json.dumps([booleans]).encode(),WEIGHTS,422,'FEATURE_CONTRACT'),('empty_batch',b'[]',WEIGHTS,400,'BATCH_RANGE'),('too_many',json.dumps([good]*9).encode(),WEIGHTS,400,'BATCH_RANGE'),('over_size',b' '*8193,WEIGHTS,413,'BODY_TOO_LARGE')]
            for name,body,pin,want,reason in cases:
                code,data=edge('/v1/predict',body,pin);assert code==want and data.get('error')==reason and 'outputs' not in data;negative.append(name)
            recovery_body=json.dumps([good]).encode()
            code,recovery=edge('/v1/predict',recovery_body);assert code==200
            validate_prediction(recovery,recovery_body,[good],[pred[0]])
            report['edge']={'state':'CLOUDFLARE_REMOTE_DEV_PARITY_PASSED' if remote_dev_proxy else 'CLOUDFLARE_PARITY_AND_REFUSALS_PASSED','transport_mode':'WRANGLER_REMOTE_DEVELOPMENT_PROXY' if remote_dev_proxy else 'PUBLIC_PREVIEW_URL','url':edge_url,'rows_compared':checked,'raw_and_constrained_values_compared':checked*8,'including_exact_rule_values_verified':checked*12,'strict_response_completion_checked':True,'requests':requests,'max_absolute_difference':max_delta,'tolerance':TOLERANCE,'negative_controls':negative,'recovery_after_refusal':True,'end_to_end_request_wall_seconds':time.perf_counter()-network_start,'response_digest_checks':requests,'cf_ray_present_count':sum(x['cf_ray_present'] for x in ledger),'preview_expires_at':health['limits']['expires_at'],'remote_GSPC_admission':False,'timing_scope':'Sequential HTTP wall-time including transport/verification, not a provider-kernel latency or throughput benchmark.'}
            report['state']='CROSS_RUNTIME_PARITY_PASSED'
    except Exception as e:
        report['state']='FAILED';report['failure']={'type':type(e).__name__,'message':str(e)[:350],'requests_completed':requests};raise
    finally:
        report['finished_at']=datetime.now(timezone.utc).isoformat()
        (out/'report.json').write_text(json.dumps(report,indent=2,allow_nan=False)+'\n')
        (out/'request-ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
        (out/'predictions.jsonl').write_text(''.join(json.dumps({'episode':r['episode'],'tick':r['tick'],'raw':p['raw_prediction'],'constrained':p['prediction']},separators=(',',':'),allow_nan=False)+'\n' for r,p in zip(rows,pred)))
    print(json.dumps(report),flush=True);return report

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--label',required=True);parser.add_argument('--out',default='results');parser.add_argument('--edge-url');a=parser.parse_args();run(a.label,a.out,a.edge_url)
