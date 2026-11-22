from pathlib import Path
import json,hashlib,time,importlib.util
import hf_discover as x
from datetime import datetime,timezone
R=Path.cwd();contract=json.loads((R/'hf-contract.json').read_text());assert x.i.sha==contract['revision']
spec=importlib.util.spec_from_file_location('predictor',R/'vendor/predict.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);model=m.ProcessPredictor(R/'vendor/weights.json','9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b')
rows=[json.loads(z) for z in (R/'vendor/test.jsonl').read_text().splitlines()];pred=[model.predict(r['features']) for r in rows]
worst=max(range(len(rows)),key=lambda i:max(abs(a-b) for a,b in zip(pred[i]['prediction'],rows[i]['target'])))
indices=sorted(set([0,1,7,8,31,63,127,191,255,319,383,447,511,559,worst]));reports=[];started=datetime.now(timezone.utc).isoformat()
event_spec=importlib.util.spec_from_file_location('canonical_event',R/'event-reference.py');event_builder=importlib.util.module_from_spec(event_spec);event_spec.loader.exec_module(event_builder)
r=x.rpc('initialize',{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'meok-cross-runtime-live','version':'1.0'}},1);x.headers['MCP-Protocol-Version']=r['result']['protocolVersion'];x.rpc('notifications/initialized',ident=None)
worst_delta=0;event_valid=0
for count,index in enumerate(indices,2):
 answer=x.rpc('tools/call',{'name':'meok_hf_runtime_predict_process','arguments':{'features_json':json.dumps(rows[index]['features']),'constrained':True}},count)
 assert not answer.get('error') and not answer['result'].get('isError');payload=json.loads(answer['result']['content'][0]['text']);event=payload.pop('evidence_event')
 canonical=event_builder.jcs(payload);assert event_builder.validate(event)==[];assert hashlib.sha256(canonical).hexdigest()==event['observed']['output_sha256'];event_valid+=1
 assert event['state']=='PARTIAL' and event['signature'] is None and not payload['authorises_execution'] and not payload['gspc_admitted']
 delta=max(abs(a-b) for key in ['prediction','raw_prediction'] for a,b in zip(payload[key],pred[index][key]));assert delta<=1e-12;worst_delta=max(delta,worst_delta)
 reports.append({'row':index,'max_delta':delta,'prediction':payload['prediction'],'raw_prediction':payload['raw_prediction'],'response_value_sha256':event['observed']['output_sha256'],'event_id':event['event_id']})
negatives=[]
for offset,features in enumerate([[],[True]+rows[0]['features'][1:]],100):
 reply=x.rpc('tools/call',{'name':'meok_hf_runtime_predict_process','arguments':{'features_json':json.dumps(features),'constrained':True}},offset)
 assert reply.get('error') or reply.get('result',{}).get('isError');negatives.append({'case':'wrong_dimensions' if not features else 'boolean_feature','refused':True})
reply=x.rpc('tools/call',{'name':'meok_hf_runtime_predict_process','arguments':{'features_json':json.dumps(rows[0]['features']),'constrained':True}},110);assert not reply.get('error') and not reply['result'].get('isError')
assert x.a.space_info(x.i.id).sha==contract['revision']
result={'state':'LIVE_HF_SMALL_MODEL_PARITY_PASSED','space_revision':contract['revision'],'started_at':started,'finished_at':datetime.now(timezone.utc).isoformat(),'selected_rows':indices,'selection':'Predeclared spread plus worst constrained row from the already-public bank; not a blind test','rows_compared':len(indices),'max_absolute_difference':worst_delta,'tolerance':1e-12,'unsigned_output_digest_verifications':event_valid,'records':reports,'negative_controls':negatives,'recovery_passed':True,'source_before_after_equal':True,'gpu_or_cosmos_calls':0,'weights_updated':False,'gspc_admitted':False,'account_authenticated':True,'professional_or_human_approval_verified':False}
(R/'hf-live-parity.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='records'}),flush=True)
