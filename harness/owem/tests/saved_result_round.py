"""Coliseum operator qualification, not a production gateway. Python 3.10+.

route uses the original OOWM classifier. work runs on a named, operator-selected
host, checking ONE previously published specimen in a private lab directory.
receive checks the response against the original request and the receiver's
independent copy. The caller, not a JSON field, must establish transport identity.
No sockets, credentials, model calls or live H.I.M. task submission. A missing
or unacknowledged transport is never a successful result.
"""
from __future__ import annotations
import argparse, datetime, hashlib, json, os, re, secrets, sqlite3, stat, sys, time, uuid
from pathlib import Path

PIN = '41c2959f4b7d7149e348c48391721e4e3ea450fa59c620d56f74dd2685aea318'
SIZE = 1428
WORKER = 'owem.gov.saved-record-check'
NAMED = 'public-governance-example'
GATEWAY_SHA = '7ae3e3618d74e7b95c8160905bfd443f16574bd71adeb2caeda5a6431c0a4eac'
TTL = 1800
KEYS = {'request_id', 'worker', 'artifact', 'expected_sha256', 'expected_bytes', 'issued_s', 'expires_s', 'nonce'}
class Refusal(ValueError): pass

def require(value, msg):
    if not value: raise Refusal(msg)

def digest(b): return hashlib.sha256(b).hexdigest()
def canonical(obj): return json.dumps(obj, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('ascii')

def parse(b):
    def unique(pairs):
        d = {}
        for k,v in pairs:
            require(k not in d, 'duplicate field'); d[k]=v
        return d
    require(len(b) <= 16384, 'large input')
    return json.loads(b.decode('utf-8'), object_pairs_hook=unique)

def bounded(path, limit):
    fd=os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd,'rb') as f:
        st=os.fstat(f.fileno()); require(stat.S_ISREG(st.st_mode) and st.st_size<=limit, 'not a bounded regular file')
        data=f.read(limit+1); require(len(data)<=limit,'file grew'); return data

def validate(job, now=None, fresh=True):
    now=int(time.time()) if now is None else now
    require(isinstance(job,dict) and set(job)==KEYS,'unexpected job shape')
    require(isinstance(job['request_id'],str) and re.fullmatch(r'[a-f0-9]{32}',job['request_id']), 'bad task id')
    require(isinstance(job['nonce'],str) and re.fullmatch(r'[a-f0-9]{32}',job['nonce']), 'bad nonce')
    require(job['worker']==WORKER and job['artifact']==NAMED,'unknown worker or artifact')
    require(job['expected_sha256']==PIN and type(job['expected_bytes']) is int and job['expected_bytes']==SIZE,'unexpected expectation')
    start,end=job['issued_s'],job['expires_s']; require(type(start) is int and type(end) is int and end-start==TTL,'invalid validity window')
    if fresh: require(start<=now<end,'request not current')

def route(gateway):
    code=bounded(gateway,64*1024); require(digest(code)==GATEWAY_SHA,'review gateway revision before using it')
    ns={'__name__':'approved_oowm_classifier'}; exec(compile(code,str(gateway),'exec'),ns)
    axes=ns['classify']('gov: check this saved government measurement result')
    require(axes and axes[0]=='gov','no qualified route')
    t=int(time.time()); return {'request_id':uuid.uuid4().hex,'worker':WORKER,'artifact':NAMED,'expected_sha256':PIN,'expected_bytes':SIZE,'issued_s':t,'expires_s':t+TTL,'nonce':secrets.token_hex(16)}

def work(job, private_dir):
    validate(job); private_dir=Path(private_dir); info=private_dir.lstat()
    require(stat.S_ISDIR(info.st_mode) and info.st_uid==os.getuid() and info.st_mode&0o077==0,'owner-only lab directory required')
    db=private_dir/'round.sqlite3'; require(not db.is_symlink(),'symlink database refused')
    h=digest(canonical(job)); rid=job['request_id']; c=sqlite3.connect(db,timeout=4,isolation_level=None)
    try:
        c.execute('CREATE TABLE IF NOT EXISTS results(task TEXT PRIMARY KEY, binding TEXT NOT NULL, reply BLOB, checksum TEXT)'); c.execute('BEGIN IMMEDIATE')
        row=c.execute('SELECT binding,reply,checksum FROM results WHERE task=?',(rid,)).fetchone()
        if row:
            require(row[0]==h,'request ID rebound'); c.execute('COMMIT')
            if row[1] is None: return {'state':'OUTCOME_UNKNOWN','request_id':rid,'worker':WORKER,'new_execution':False}
            require(digest(row[1])==row[2],'retained result damaged'); return {'receipt':parse(row[1]),'new_execution':False}
        c.execute('INSERT INTO results VALUES(?,?,NULL,NULL)',(rid,h)); c.execute('COMMIT')
        # A crash here leaves a reservation. Never repeat under this identifier.
        try:
            b=bounded(private_dir/'governance-card.json',65536); seen=digest(b); n=len(b)
            state='MATCH' if seen==PIN and n==SIZE else 'MISMATCH'
        except (OSError,Refusal): seen=None; n=None; state='UNREADABLE'
        receipt={'request_id':rid,'worker':WORKER,'request_sha256':h,'observed_sha256':seen,'bytes':n,'state':state,'observed_s':int(time.time())}
        data=canonical(receipt); c.execute('UPDATE results SET reply=?,checksum=? WHERE task=? AND binding=?',(data,digest(data),rid,h)); return {'receipt':receipt,'new_execution':True}
    finally:c.close()

def receive(job, response, file, *, transport_worker, now=None):
    now=int(time.time()) if now is None else now; validate(job,now)
    require(transport_worker==WORKER,'no qualified channel identity'); local=bounded(file,65536)
    require(digest(local)==PIN and len(local)==SIZE,'receiver reference not the retained artifact')
    if response is None: return {'request_id':job['request_id'],'state':'NO_WORKER_REPLY','saved_file_readable':True,'worker_complete':False,'message':'No worker reply. The saved result is still readable.'}
    if isinstance(response,dict) and response.get('state')=='OUTCOME_UNKNOWN':
        require(response.get('request_id')==job['request_id'] and response.get('worker')==WORKER,'unknown-outcome correlation failed')
        return {'request_id':job['request_id'],'state':'OUTCOME_UNKNOWN','saved_file_readable':True,'worker_complete':False,'message':'Outcome unknown; check this task ID. Do not retry automatically.'}
    require(isinstance(response,dict) and isinstance(response.get('receipt'),dict) and type(response.get('new_execution')) is bool,'bad response')
    r=response['receipt'];require(r.get('request_id')==job['request_id'] and r.get('worker')==WORKER and r.get('request_sha256')==digest(canonical(job)),'wrong task, worker or request binding')
    t=r.get('observed_s');require(type(t) is int and job['issued_s']<=t<job['expires_s'] and t<=now,'invalid observation time')
    state=r.get('state'); n=r.get('bytes'); seen=r.get('observed_sha256');require(state in ('MATCH','MISMATCH','UNREADABLE'),'unknown worker state')
    if state=='UNREADABLE':require(n is None and seen is None,'invalid unreadable observation')
    else:
        require(type(n) is int and 0<=n<=65536 and isinstance(seen,str) and re.fullmatch('[0-9a-f]{64}',seen),'invalid worker observation')
        require((state=='MATCH')==(n==SIZE and seen==PIN),'contradictory worker result')
    return {'request_id':job['request_id'],'worker':WORKER,'state':state,'saved_file_readable':True,'worker_complete':state=='MATCH','bytes':n,'observed_sha256':seen,'replayed':not response['new_execution'],'message':{'MATCH':'The worker and receiver found the expected saved bytes.','MISMATCH':'Worker bytes differ from the saved reference.','UNREADABLE':'The worker could not read its copy; the saved reference remains readable.'}[state]}

def main():
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    sub.add_parser('route').add_argument('gateway',type=Path);sub.add_parser('work').add_argument('private_dir',type=Path)
    q=sub.add_parser('receive');q.add_argument('job',type=Path);q.add_argument('file',type=Path);q.add_argument('--transport-worker',required=True);q.add_argument('--no-reply',action='store_true')
    a=p.parse_args()
    if a.command=='route':out=route(a.gateway)
    elif a.command=='work':out=work(parse(sys.stdin.buffer.read(16385)),a.private_dir)
    else:out=receive(parse(bounded(a.job,16384)),None if a.no_reply else parse(sys.stdin.buffer.read(16385)),a.file,transport_worker=a.transport_worker)
    print(json.dumps(out,sort_keys=True));return 0 if out.get('state','MATCH')=='MATCH' else 3
if __name__=='__main__':
    try:sys.exit(main())
    except (ValueError,OSError,sqlite3.Error,RecursionError) as e:print(json.dumps({'state':'REFUSED','reason':str(e)[:160],'worker_complete':False}));sys.exit(2)
