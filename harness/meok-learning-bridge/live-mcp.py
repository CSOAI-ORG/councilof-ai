"""Account-authenticated live MCP acceptance on synthetic learning data only."""
from pathlib import Path
from huggingface_hub import HfApi,get_token,hf_hub_url
from huggingface_hub.utils import build_hf_headers
from datetime import datetime,timezone
import urllib.request,json,time,hashlib,types
ROOT=Path(__file__).parent;api=HfApi();deployment=json.loads((ROOT/'deployment.json').read_text());repo=deployment['space'];expected='9d6ea388ceb1793dae9426495a95c795d3c91cfb'
info=api.space_info(repo);runtime=api.get_space_runtime(repo)
assert info.sha==expected and info.private and runtime.stage=='RUNNING' and runtime.raw.get('sha')==expected,'Exact deployed runtime not ready'
url=info.host+'/gradio_api/mcp/';headers={'Authorization':'Bearer '+get_token(),'Content-Type':'application/json','Accept':'application/json, text/event-stream'}
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect);next_id=1

def rpc(method,params=None,notification=False):
    global next_id
    body={'jsonrpc':'2.0','method':method};ident=None
    if not notification:ident=next_id;next_id+=1;body['id']=ident
    if params is not None:body['params']=params
    req=urllib.request.Request(url,data=json.dumps(body).encode(),headers=headers,method='POST')
    with opener.open(req,timeout=40) as response:
        if response.headers.get('Mcp-Session-Id'):headers['Mcp-Session-Id']=response.headers['Mcp-Session-Id']
        raw=response.read(2000001)
    if len(raw)>2000000:raise ValueError('MCP response bound exceeded')
    if not raw:return None
    text=raw.decode()
    if text.lstrip().startswith('{'):return json.loads(text)
    for block in text.replace('\r\n','\n').split('\n\n'):
        data='\n'.join(x[5:].lstrip() for x in block.splitlines() if x.startswith('data:'))
        if data:
            value=json.loads(data)
            if value.get('id')==ident:return value
    raise ValueError('Missing RPC response')

record={'state':'STARTING','space':repo,'revision_before':expected,'started_at':datetime.now(timezone.utc).isoformat(),'model_or_gpu_calls_requested':0,'public_hitl_posts':0,'training_requested':False,'calls':[]};payloads={}
try:
    init=rpc('initialize',{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'meok-learning-readback','version':'0.1'}})
    protocol=init['result']['protocolVersion'];headers['MCP-Protocol-Version']=protocol;record['protocol']=protocol;rpc('notifications/initialized',notification=True)
    tools=rpc('tools/list',{})['result']['tools'];record['tools']=[t['name'] for t in tools];record['learning_tool_schemas']={t['name']:t.get('inputSchema') for t in tools if 'academy_' in t['name']}
    def name(suffix):
        found=[t['name'] for t in tools if t['name'].endswith('_'+suffix) or t['name']==suffix]
        if len(found)!=1:raise ValueError('Tool identity ambiguous or missing: '+suffix)
        return found[0]
    raw=urllib.request.urlopen(urllib.request.Request(hf_hub_url(repo,'lab_assets/event.py',repo_type='space',revision=expected),headers=build_hf_headers(token=True)),timeout=20).read(100000)
    assert hashlib.sha256(raw).hexdigest()=='144c6a36d462e21283ab9b34a6469bb32c75021da56133813d5a848412270533'
    event_module=types.ModuleType('retained_event');exec(compile(raw,'retained_event.py','exec'),event_module.__dict__)
    def call(label,suffix,args,refuse=False):
        t=time.monotonic();answer=rpc('tools/call',{'name':name(suffix),'arguments':args});elapsed=time.monotonic()-t
        error=bool(answer.get('error') or answer.get('result',{}).get('isError'))
        if refuse:
            assert error,'Expected refusal'
            record['calls'].append({'case':label,'tool':name(suffix),'expected_refusal':True,'refused':True,'seconds':elapsed});return None
        if error:
            record['failed_tool_response']=answer
            raise ValueError('Unexpected tool error: '+suffix)
        text='\n'.join(c['text'] for c in answer['result']['content'] if c.get('type')=='text');payload=json.loads(text);payloads[label]=payload
        entry={'case':label,'tool':name(suffix),'returned':True,'seconds':elapsed}
        if 'evidence_event' in payload:
            copy=dict(payload);event=copy.pop('evidence_event');assert event_module.validate(event)==[]
            assert hashlib.sha256(event_module.jcs(copy)).hexdigest()==event['observed']['output_sha256']
            entry.update(event_schema_valid=True,event_output_hash_verified=True,signature_present=event.get('signature') is not None)
        if 'boundaries' in payload:assert not any(payload['boundaries'].values())
        record['calls'].append(entry);return payload
    cat=call('catalogue','academy_catalogue',{});assert cat['canonical_axis_count']==34 and cat['source_stage_count']==170
    rev=cat['registry_revision'];context={'axis':'claim-maintenance','industry':'ai-software'}
    lesson=call('lesson','academy_lesson',context);assert lesson['registry_revision']==rev
    original=json.loads((ROOT/'learning_assets/source-reading-checks.json').read_text());correct=next(m['correct_option'] for m in original if m['axis']=='claim-maintenance')
    reading=call('reading','academy_reading',{**context,'answer':correct,'registry_revision':rev});assert reading['correct'] and reading['xp']==0
    args={**context,'case_id':'xp-not-authority','answer':'A','registry_revision':rev}
    wrong=call('wrong-practice','academy_attempt',args);assert wrong['educational_xp']==0
    args['answer']='D';right=call('correct-practice','academy_attempt',args);assert right['educational_xp']==10 and right['training_candidate']['rows_exported_for_training']==0
    repeat=call('repeat-practice','academy_attempt',args);assert repeat['educational_xp']==10
    call('stale-revision','academy_attempt',{**args,'registry_revision':'0'*64},True)
    call('unmapped-context','academy_attempt',{**args,'axis':'reserve-attestation','industry':'ai-software'},True)
    call('unknown-axis','academy_lesson',{'axis':'invented','industry':'ai-software'},True)
    chain=call('correction','academy_correction',context);assert chain['stale_revision_rejected'] and not chain['human_review_performed']
    status=call('retained-runtime-status','lab_status',{});assert not status['cosmos_adapter']['loaded_into_serving_model']
    after=api.space_info(repo).sha;assert after==expected;record['revision_after']=after
    record.update(state='LIVE_MCP_LEARNING_ACCEPTANCE_PASSED',registry_revision=rev,axis_count=34,source_stages=170,industry_contexts=8,public_human_decision_posts=0,real_learner_count=0,professional_competence_measured=False,model_training_performed=False,scope='Automated synthetic interaction tests; no actual human learner outcome, staffed reviewer, public incident disclosure or model-weight update.')
except Exception as exc:
    record.update(state='LIVE_ACCEPTANCE_FAILED',error_type=type(exc).__name__,http_status=getattr(exc,'code',None),error=str(exc)[:350])
finally:
    record['finished_at']=datetime.now(timezone.utc).isoformat()
    (ROOT/'live-mcp.json').write_text(json.dumps(record,indent=2)+'\n');(ROOT/'live-payloads.json').write_text(json.dumps(payloads,indent=2)+'\n')
    print(json.dumps(record),flush=True)
