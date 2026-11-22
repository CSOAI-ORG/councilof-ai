"""Exercise the installed Claude Code executable with a synthetic, loopback-only Messages fixture. No cloud model, real GitHub command, or real credentials."""
import datetime,hashlib,http.server,json,os,pathlib,shlex,shutil,subprocess,sys,tempfile,threading,urllib.request
from pathlib import Path
PIN='060bea0631495a4aec1f302a23e47393fe01cc676c109f75a5ac297cd66d98e7'
SOURCE='https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/823f8fd62f760f0d30609d86eebc10300976137f/public/agent-plugin/canonical/scripts/bash-guard.mjs'
CLAUDE=shutil.which('claude'); NODE=shutil.which('node'); assert CLAUDE and NODE
REPORT=Path(__file__).with_name('native-host-receipt.json'); LOG=[]
def j(o):return json.dumps(o,separators=(',',':'))
class Messages(http.server.BaseHTTPRequestHandler):
 def log_message(self,*a):pass
 def do_POST(self):
  n=int(self.headers.get('Content-Length','0'));assert 0<=n<8000000
  d=json.loads(self.rfile.read(n)); p=self.path.split('?')[0]
  if p.endswith('count_tokens'):
   body=b'{"input_tokens":12}';self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
  if p!='/v1/messages':self.send_error(404);return
  messages=d['messages']; last=messages[-1]['content']; previous=isinstance(last,list) and any(isinstance(x,dict) and x.get('type')=='tool_result' for x in last)
  if previous:
   for x in last:
    if x.get('type')=='tool_result':LOG.append({'native_tool_result':x.get('tool_use_id'),'reported_error':x.get('is_error',False),'recorded_guard_reason':'Blocked: merging with --admin' in str(x.get('content'))})
  blocks=([{'type':'text','text':'Fixture complete.'}] if previous else [{'type':'tool_use','id':'toolu_'+kind,'name':'Bash','input':{'command':cmd,'description':'Owned marker in disposable test workspace'}}]);stop='end_turn' if previous else 'tool_use'
  msg={'id':'msg_fixture','type':'message','role':'assistant','model':d['model'],'content':blocks,'stop_reason':stop,'stop_sequence':None,'usage':{'input_tokens':12,'output_tokens':8}}
  if d.get('stream'):
   events=[('message_start',{'message':{**msg,'content':[],'stop_reason':None}})]
   for i,b in enumerate(blocks):
    event,delta=({**b,'input':{}},{'type':'input_json_delta','partial_json':j(b['input'])}) if b['type']=='tool_use' else ({'type':'text','text':''},{'type':'text_delta','text':b['text']})
    events.extend([('content_block_start',{'index':i,'content_block':event}),('content_block_delta',{'index':i,'delta':delta}),('content_block_stop',{'index':i})]);
   events.extend([('message_delta',{'delta':{'stop_reason':stop,'stop_sequence':None},'usage':{'output_tokens':8}}),('message_stop',{})]);raw=''.join('event: '+name+'\ndata: '+j({'type':name,**v})+'\n\n' for name,v in events).encode();typ='text/event-stream'
  else:raw=j(msg).encode();typ='application/json'
  self.send_response(200);self.send_header('Content-Type',typ);self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
with tempfile.TemporaryDirectory(prefix='coliseum-native-') as tmp:
 root=Path(tmp).resolve();home=root/'home';home.mkdir();work=root/'work';work.mkdir(); ownTmp=root/'tmp';ownTmp.mkdir();g=root/'guard.mjs';body=urllib.request.urlopen(SOURCE,timeout=12).read(20000);assert hashlib.sha256(body).hexdigest()==PIN;g.write_bytes(body)
 # Observer wrapper forwards unchanged structured stdout; only event/decision labels are retained.
 wrap=root/'observe.py';trace=root/'hook.ndjson';wrap.write_text('import json,subprocess,sys\nfrom pathlib import Path\ns=sys.stdin.buffer.read(1048576); e=json.loads(s); p=subprocess.run(sys.argv[1:3],input=s,capture_output=True); out=json.loads(p.stdout or b"{}")\nwith open(sys.argv[3],"a") as f:f.write(json.dumps({"event":e.get("hook_event_name"),"tool":e.get("tool_name"),"decision":out.get("hookSpecificOutput",{}).get("permissionDecision","abstain")})+"\\n")\nsys.stdout.buffer.write(p.stdout);sys.exit(p.returncode)\n')
 hook=shlex.join([sys.executable,str(wrap),NODE,str(g),str(trace)]);settings=root/'settings.json';settings.write_text(j({'hooks':{'PreToolUse':[{'matcher':'Bash','hooks':[{'type':'command','command':hook}]}]}}));mcp=root/'mcp.json';mcp.write_text('{"mcpServers":{}}')
 srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),Messages);threading.Thread(target=srv.serve_forever,daemon=True).start();endpoint='http://127.0.0.1:'+str(srv.server_port)
 env={'PATH':os.environ['PATH'],'HOME':str(home),'TMPDIR':str(ownTmp),'CLAUDE_CONFIG_DIR':str(home/'claude'),'SHELL':'/bin/bash','LANG':'en_US.UTF-8','ANTHROPIC_BASE_URL':endpoint,'ANTHROPIC_API_KEY':'synthetic-local-only','CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC':'1','DISABLE_AUTOUPDATER':'1','DISABLE_TELEMETRY':'1','DISABLE_ERROR_REPORTING':'1','HTTP_PROXY':'http://127.0.0.1:1','HTTPS_PROXY':'http://127.0.0.1:1','ALL_PROXY':'http://127.0.0.1:1','NO_PROXY':'127.0.0.1,localhost','CLAUDE_CODE_DISABLE_AUTO_MEMORY':'1'}
 rows=[]
 for kind in ('deny','allow'):
  marker=work/(kind+'.txt'); label='gh pr merge 42 --admin harmless inert text' if kind=='deny' else 'permitted benign marker';cmd='printf %s '+shlex.quote(label)+' > '+shlex.quote(str(marker));start=len(LOG); prev=trace.read_text().splitlines() if trace.exists() else []
  args=[CLAUDE,'-p','Run the one synthetic test action requested by the local fixture.','--model','claude-sonnet-4-6','--system-prompt','Owned local test workspace. Only the fixed marker is in scope.','--tools','Bash','--allowedTools','Bash','--permission-mode','dontAsk','--setting-sources','','--settings',str(settings),'--strict-mcp-config','--mcp-config',str(mcp),'--no-session-persistence','--disable-slash-commands','--output-format','json'];p=subprocess.run(args,cwd=work,env=env,capture_output=True,text=True,timeout=40)
  checked=subprocess.check_output([sys.executable,'-c','from pathlib import Path;import sys,json;p=Path(sys.argv[1]);print(json.dumps({"exists":p.exists(),"correct":p.is_file() and p.read_bytes()==sys.argv[2].encode()}))',str(marker),label],text=True)
  new=[json.loads(l) for l in (trace.read_text().splitlines() if trace.exists() else [])[len(prev):]];result={'case':kind,'host_exit':p.returncode,'hook_events':new,'tool_results':LOG[start:],'observer':json.loads(checked)}; print(result,flush=True)
  if not new:print('harness diagnostic',p.stdout[-1600:],p.stderr[-600:],flush=True)
  rows.append(result)
 srv.shutdown();srv.server_close(); passed=all(x['host_exit']==0 and len(x['hook_events'])==1 and len(x['tool_results'])==1 for x in rows) and rows[0]['hook_events'][0]['decision']=='deny' and rows[0]['tool_results'][0]['recorded_guard_reason'] and not rows[0]['observer']['exists'] and rows[1]['hook_events'][0]['decision']=='abstain' and rows[1]['observer']['correct']
 report={'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'native_client':subprocess.check_output([CLAUDE,'--version'],text=True).strip(),'gate_sha256':PIN,'real_vendor_inference':False,'test_provider':'loopback scripted tool proposals','real_client_real_bash':True,'installed_plugin_claim':False,'cases':rows,'passed':bool(passed)};REPORT.write_text(json.dumps(report,indent=2)+'\n'); print('PASS' if passed else 'NOT QUALIFIED',flush=True);sys.exit(0 if passed else 1)
