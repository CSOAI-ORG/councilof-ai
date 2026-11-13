from huggingface_hub import HfApi,get_token
from pathlib import Path
import urllib.request,json
R=Path(__file__).parent;a=HfApi();i=a.space_info('Nicholastempleman/meok-hf-runtime');r=a.get_space_runtime(i.id)
assert i.private and r.stage=='RUNNING' and r.raw.get('sha')==i.sha
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect);headers={'Authorization':'Bearer '+get_token(),'Content-Type':'application/json','Accept':'application/json, text/event-stream'};url=i.host+'/gradio_api/mcp/'
def rpc(method,params=None,ident=1):
 body={'jsonrpc':'2.0','method':method}
 if params is not None:body['params']=params
 if ident is not None:body['id']=ident
 req=urllib.request.Request(url,data=json.dumps(body).encode(),headers=headers,method='POST')
 with opener.open(req,timeout=30) as response:
  if response.headers.get('Mcp-Session-Id'):headers['Mcp-Session-Id']=response.headers['Mcp-Session-Id']
  raw=response.read(300001)
 assert len(raw)<=300000
 if not raw:return None
 text=raw.decode()
 if text.lstrip().startswith('{'):return json.loads(text)
 for block in text.replace('\r\n','\n').split('\n\n'):
  data='\n'.join(x[5:].lstrip() for x in block.splitlines() if x.startswith('data:'))
  if data:
   value=json.loads(data)
   if value.get('id')==ident:return value
 raise ValueError('No matching RPC response')
if __name__=='__main__':
 init=rpc('initialize',{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'meok-cross-runtime-readonly','version':'1.0'}},1);headers['MCP-Protocol-Version']=init['result']['protocolVersion'];rpc('notifications/initialized',ident=None)
 tools=rpc('tools/list',{},2)['result']['tools'];selected=[t for t in tools if t['name'].endswith('_predict_process') or t['name'].endswith('_lab_status')]
 record={'space':i.id,'revision':i.sha,'hardware':r.hardware,'protocol':headers['MCP-Protocol-Version'],'selected_tool_contracts':selected,'inference_submitted':False};(R/'hf-contract.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record),flush=True)
