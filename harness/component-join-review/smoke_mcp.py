"""Actual finite MCP request/reply test using public synthetic fixtures only."""
import asyncio,copy,datetime,hashlib,json,pathlib,sys
from mcp import ClientSession,StdioServerParameters
from mcp.client.stdio import stdio_client
from test_join_receiver import req
R=pathlib.Path(__file__).resolve().parent
async def main():
    checks=[]
    params=StdioServerParameters(command=sys.executable,args=['-B',str(R/'mcp_receiver.py')])
    async with stdio_client(params) as (read,write):
        async with ClientSession(read,write) as session:
            init=await session.initialize();checks.append({'name':'initialized','ok':bool(init.protocolVersion)})
            names=[x.name for x in (await session.list_tools()).tools]
            checks.append({'name':'single_review_tool','ok':names==['review_specialist_artifacts']})
            request=req()
            now=datetime.datetime.now(datetime.timezone.utc)
            snapshot=(now-datetime.timedelta(minutes=1)).isoformat()
            expiry=(now+datetime.timedelta(minutes=5)).isoformat()
            request.pop('now')
            request['context']['source_snapshot']=snapshot
            for i,text in enumerate(request['artifact_json']):
                payload=json.loads(text);payload['source_snapshot']=snapshot;payload['valid_until']=expiry
                request['artifact_json'][i]=json.dumps(payload)
                request['pins'][i]['result_sha256']=hashlib.sha256(request['artifact_json'][i].encode()).hexdigest()
            good=await session.call_tool('review_specialist_artifacts',{'request_json':json.dumps(request)})
            if good.isError:raise AssertionError('valid request refused')
            output=good.structuredContent
            if output is None:output=json.loads(good.content[0].text)
            checks.append({'name':'valid_join_returned','ok':output['receiver']['join']['label']=='RED'})
            checks.append({'name':'canonical_partial_event','ok':output['event']['schema']=='csoai.evidence-event/0.1' and output['event']['state']=='PARTIAL' and output['event']['value'] is None})
            checks.append({'name':'authority_withheld','ok':output['receiver']['authorises_execution'] is False and output['event']['signature'] is None})
            for name,mutator in [('changed_bytes',lambda x:x['artifact_json'].__setitem__(1,x['artifact_json'][1]+' ')),('stale_dependency',lambda x:x['context'].__setitem__('dependency_root','9'*64))]:
                bad=copy.deepcopy(request);mutator(bad)
                result=await session.call_tool('review_specialist_artifacts',{'request_json':json.dumps(bad)})
                checks.append({'name':name+'_refused','ok':result.isError is True})
            backdated=copy.deepcopy(request);backdated['now']='2000-01-01T00:00:00Z'
            denied=await session.call_tool('review_specialist_artifacts',{'request_json':json.dumps(backdated)})
            checks.append({'name':'request_clock_refused','ok':denied.isError is True})
            checks.append({'name':'receiver_utc_used','ok':output['receiver']['clock_mode']=='RECEIVER_UTC'})
            recovered=await session.call_tool('review_specialist_artifacts',{'request_json':json.dumps(request)})
            checks.append({'name':'valid_request_after_refusal','ok':recovered.isError is False})
    if not all(c['ok'] for c in checks):raise AssertionError(checks)
    receipt={'observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'protocol_version':init.protocolVersion,'checks':checks,'passed':len(checks),'transport':'actual MCP stdio','process_closed':True,'production_registered':False,'model_calls':0,'signature_state':'UNSIGNED'}
    (R/'mcp-receiver-result.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('MCP_RECEIVER_RESULT '+json.dumps(receipt),flush=True)
asyncio.run(main())
