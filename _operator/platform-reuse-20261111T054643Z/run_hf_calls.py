"""Bounded calls to the existing CPU research tools; no deployment or weight writes."""
from pathlib import Path
import hashlib,json,time,urllib.request
from datetime import datetime,timezone
from huggingface_hub import HfApi
from huggingface_hub.utils import build_hf_headers
ROOT=Path(__file__).resolve().parent
HOST='https://nicholastempleman-meok-hf-runtime.hf.space'
REPO='Nicholastempleman/meok-hf-runtime'
FEATURES=[[0,0,0,1,.3,.4,.3,0,1,1,0],[.3,.4,.3,0,.3,.4,.3,1,.5,1,.25],[.2,.5,.3,0,.2,.5,.3,0,0,1,.5],[0,0,0,1,.3,.4,.3,1,.125,0,.75]]
PLAN={'purpose':'Live CPU process-prediction/cache execution and cross-platform replay','features':FEATURES,'predictor_modes':[True,False],'memory_seeds':[17,29],'memory_repeat':80,'negative_cases':['one_feature','negative_seed'],'model_training':False,'gpu_job_created':False}
(ROOT/'hf-frozen-protocol.json').write_text(json.dumps(PLAN,indent=2)+'\n')
api=HfApi();before=api.space_info(REPO).sha
headers=build_hf_headers(token=True);headers['Content-Type']='application/json'
def call(label,name,data):
    start=time.perf_counter();entry={'label':label,'api':name,'input':data}
    try:
        req=urllib.request.Request(HOST+'/gradio_api/call/'+name,data=json.dumps({'data':data}).encode(),headers=headers,method='POST')
        with urllib.request.urlopen(req,timeout=30) as r:ticket=json.load(r)
        event='';answer=None;state=None
        req=urllib.request.Request(HOST+'/gradio_api/call/'+name+'/'+ticket['event_id'],headers=headers)
        with urllib.request.urlopen(req,timeout=45) as r:
            count=0
            for line in r:
                count+=len(line)
                if count>1048576:raise ValueError('RESPONSE_LIMIT')
                text=line.decode().strip()
                if text.startswith('event:'):event=text[6:].strip()
                elif text.startswith('data:') and event in ('complete','error'):
                    answer=json.loads(text[5:].strip());state=event;break
        if state is None:raise ValueError('NO_COMPLETION')
        entry.update(state=state,response=answer)
        if state=='complete' and isinstance(answer,list) and answer and isinstance(answer[0],str):
            try:entry['parsed']=json.loads(answer[0])
            except ValueError:pass
    except Exception as exc:entry.update(state='TRANSPORT_ERROR',error_type=type(exc).__name__,http_status=getattr(exc,'code',None))
    entry['wall_seconds']=time.perf_counter()-start
    (ROOT/(label+'.json')).write_text(json.dumps(entry,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'label':label,'state':entry['state'],'wall_seconds':entry['wall_seconds'],'parsed':entry.get('parsed',{}) if name=='lab_memory_venturi' else {'keys':list(entry.get('parsed',{}))}}),flush=True)
    return entry
results=[call('hf-status-before','lab_status',[])]
for mode in PLAN['predictor_modes']:
    for i,x in enumerate(FEATURES):results.append(call(f'hf-predict-{i}-{int(mode)}','lab_predict_process',[json.dumps(x),mode]))
results.append(call('hf-predict-invalid','lab_predict_process',['[0]',True]))
for seed in PLAN['memory_seeds']:results.append(call('hf-memory-'+str(seed),'lab_memory_venturi',[seed,80]))
results.append(call('hf-memory-invalid','lab_memory_venturi',[-1,80]))
results.append(call('hf-status-after','lab_status',[]))
after=api.space_info(REPO).sha
receipt={'at':datetime.now(timezone.utc).isoformat(),'source_before':before,'source_after':after,'source_unchanged':before==after,'results':results,'gpu_provisioned':False,'training':False,'gspc_admitted':False}
(ROOT/'hf-live-results.json').write_text(json.dumps(receipt,indent=2,allow_nan=False)+'\n')
print(json.dumps({'COMPLETE':True,'calls':len(results),'source_before':before,'source_after':after,'source_unchanged':before==after}),flush=True)
