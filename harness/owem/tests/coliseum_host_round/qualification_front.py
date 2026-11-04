"""Ephemeral acceptance server for an isolated COPY of H.I.M.; not a private deployment.
The only capability is checking one public specimen with a separate staged worker.
No route to a model, no production admission changes, no user files or secrets.
"""
import argparse,hashlib,http.server,importlib.util,json,os,re,secrets,shlex,socket,subprocess,sys,threading,time,urllib.request
from pathlib import Path
S=Path(__file__).resolve().parent
CORE_SHA='7d8eae6e79df34cc121ce73ebde95d3a86434385211cd636d81841947c558292'
def sha(b):return hashlib.sha256(b).hexdigest()
assert sha((S/'round.py').read_bytes())==CORE_SHA
spec=importlib.util.spec_from_file_location('worker_round',S/'round.py');core=importlib.util.module_from_spec(spec);spec.loader.exec_module(core)
P=argparse.ArgumentParser();P.add_argument('--peer',required=True);P.add_argument('--stage',required=True);opts=P.parse_args()
assert re.fullmatch('[a-z][a-z0-9_]{0,30}@[A-Za-z0-9.-]{1,120}',opts.peer) and re.fullmatch('/(?:private/)?tmp/owned-hive-qual-[a-z0-9_]{6,20}',opts.stage)
ssh=['ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=4','-o','ForwardAgent=no','-o','ClearAllForwardings=yes','-T',opts.peer]
# Fixed pre-dispatch probe INSIDE the authenticated fixture host. Once admitted, any ambiguous
# transport/runner error is unknown; it is never mapped to a retry or a fake success.
remote="""import hashlib,json,sys,os,subprocess,stat
from pathlib import Path
s=Path(sys.argv[1]); j=sys.stdin.buffer.read(16385); q=json.loads(j); prog=s/'round.py'
if not prog.exists():print(json.dumps({'preflight':'WORKER_UNAVAILABLE','request_id':q['request_id'],'binding':hashlib.sha256(j).hexdigest(),'dispatched':False}));sys.exit(0)
if prog.is_symlink() or hashlib.sha256(prog.read_bytes()).hexdigest()!=sys.argv[2]:raise SystemExit(2)
if sys.argv[3]=='lookup':
 import sqlite3,contextlib
 try:
  with contextlib.closing(sqlite3.connect((s/'round.sqlite3').as_uri()+'?mode=ro',uri=True)) as c: row=c.execute('SELECT binding,reply,checksum FROM results WHERE task=?',(q['request_id'],)).fetchone()
 except sqlite3.Error:row=None
 if not row or row[0]!=hashlib.sha256(j).hexdigest() or row[1] is None or hashlib.sha256(row[1]).hexdigest()!=row[2]:print(json.dumps({'state':'OUTCOME_UNKNOWN','worker':q['worker'],'request_id':q['request_id']}));sys.exit(0)
 print(json.dumps({'receipt':json.loads(row[1]),'new_execution':False}));sys.exit(0)
p=subprocess.run([sys.executable,'-IB',str(prog),'work',str(s)],input=j,capture_output=True,timeout=8);sys.stdout.buffer.write(p.stdout);sys.exit(p.returncode)
"""
with urllib.request.urlopen('http://127.0.0.1:8786/',timeout=8) as resp:original=resp.read(1500000)
assert b'openSavedFileBtn' in original
panel='''<section data-qa-round="coliseum" style="display:block;position:relative;max-width:48rem;margin:1rem auto;padding:1.2rem;border:2px solid #166349;background:white;color:#143629;border-radius:12px"><h2>Check a saved result with a worker</h2><p>Coliseum qualification workspace · one historical public record. This does not resume the live studio.</p><button id="qRun" type="button">Check saved result</button> <button id="qReplay" type="button" disabled>Reopen last worker check</button><p id="qStatus" role="status" tabindex="-1">Ready for a check.</p><details><summary>Task and evidence</summary><pre id="qInfo" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></details></section><script>(()=>{const g=id=>document.getElementById(id),run=g('qRun'),again=g('qReplay'),status=g('qStatus');let last=false;async function call(op){run.disabled=again.disabled=true;g('qInfo').textContent='';status.textContent='Checking…';try{let r=await fetch('/qualification/'+op,{method:'POST',headers:{'x-qualification':'__TOKEN__','Content-Type':'application/json'},credentials:'omit',body:'{}'});let v=await r.json();last=!!v.request_id&&v.state!=='OUTCOME_UNKNOWN';status.textContent=v.message||'No previous worker result is available.';g('qInfo').textContent=JSON.stringify(v,null,2);status.dataset.state=v.state;status.focus()}catch(e){status.textContent='No confirmed response; do not retry automatically.';status.dataset.state='UNKNOWN'}finally{run.disabled=false;again.disabled=!last}}run.onclick=()=>call('new');again.onclick=()=>call('last')})();</script>'''
csrf=secrets.token_hex(20);panel=panel.replace('__TOKEN__',csrf);html,n=re.subn(rb'(<main\b[^>]*>)',lambda m:m.group()+panel.encode(),original,count=1,flags=re.I);assert n==1
lock=threading.Lock();state={'job':None};history=[]
class H(http.server.BaseHTTPRequestHandler):
 def log_message(self,*a):pass
 def send(self,code,obj,typ='application/json'):
  b=obj if isinstance(obj,bytes) else json.dumps(obj).encode();self.send_response(code);self.send_header('Content-Type',typ);self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
 def do_GET(self):
  if self.path=='/':return self.send(200,html,'text/html; charset=utf-8')
  return self.send(404,{'state':'NOT_PART_OF_QUALIFICATION'})
 def do_POST(self):
  origin='http://127.0.0.1:'+str(self.server.server_port)
  if self.headers.get('Host')!=origin[7:] or self.headers.get('Origin')!=origin or self.headers.get('x-qualification')!=csrf:return self.send(403,{'state':'REFUSED'})
  if self.path not in ('/qualification/new','/qualification/last') or self.headers.get('Content-Length')!='2' or self.rfile.read(2)!=b'{}':return self.send(400,{'state':'REFUSED'})
  with lock:
   if self.path.endswith('/new'):state['job']=core.route(S/'gateway.py')
   job=state['job']
   if not job:return self.send(409,{'state':'NO_PREVIOUS_REQUEST'})
   binding=sha(core.canonical(job));response=None;uncertain=False
   try:
    p=subprocess.run(ssh+['python3 -IB -c '+shlex.quote(remote)+' '+shlex.quote(opts.stage)+' '+CORE_SHA+' '+('lookup' if self.path.endswith('/last') else 'work')],input=core.canonical(job),capture_output=True,timeout=14)
    if p.returncode or len(p.stdout)>16384:raise ValueError('no valid final reply')
    got=core.parse(p.stdout)
    if got.get('preflight')=='WORKER_UNAVAILABLE':
     assert got.get('request_id')==job['request_id'] and got.get('binding')==binding and got.get('dispatched') is False
    else:response=got
    result=core.receive(job,response,S/'governance-card.json',transport_worker=core.WORKER)
   except (OSError,ValueError,AssertionError,subprocess.SubprocessError):
    uncertain=True;result={'state':'OUTCOME_UNKNOWN','request_id':job['request_id'],'worker_complete':False,'saved_file_readable':sha((S/'governance-card.json').read_bytes())==core.PIN,'message':'Worker outcome unknown. Check the original task; do not retry automatically.'}
   if response is None and not uncertain:result.update({'state':'WORKER_UNAVAILABLE','message':'Worker unavailable; your saved result is still readable.','worker_complete':False})
   # The operator can reopen completed requests. After an ambiguous outcome, no automatic retry is offered.
   if uncertain:state['job']=None
   result['scope']='qualification copy; no production Hive or human approval';record={'time_s':int(time.time()),'operation':self.path,'request':job,'response':response,'result':result};history.append(record);(S/'ui-runs.json').write_text(json.dumps(history,indent=2)+'\n');self.send(200,result)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),H);print('QUALIFICATION_PORT',server.server_port,'live_studio_source_sha256',sha(original),flush=True);server.serve_forever()
