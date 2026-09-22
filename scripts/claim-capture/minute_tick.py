#!/usr/bin/env python3
"""Minute-resolution due-job dispatcher. Idle ticks make ZERO external requests."""
import datetime as dt, fcntl, json, os, subprocess, sys, time
from pathlib import Path
BASE=Path(__file__).resolve().parent;STATE=BASE/'state';PERIOD=4*3600

def save(path,obj):
 temp=path.with_suffix('.tmp');temp.write_text(json.dumps(obj,indent=2)+'\n');os.replace(temp,path)
def main():
 now=time.time();lock=(STATE/'minute-dispatch.lock').open('w')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:return 0
 p=STATE/'minute-dispatch.json';d=json.loads(p.read_text()) if p.exists() else {'next_due_epoch':now}
 d['last_tick_utc']=dt.datetime.now(dt.timezone.utc).isoformat();d['idle_ticks_do_not_fetch']=True
 if now<float(d.get('next_due_epoch',0)):save(p,d);return 0
 d.update(last_started_utc=d['last_tick_utc'],next_due_epoch=now+PERIOD,status='RUNNING');save(p,d)
 try:
  with (STATE/'minute-dispatch.log').open('ab') as log:
   r=subprocess.run(['/bin/sh',str(BASE/'run_daily.sh')],stdout=log,stderr=subprocess.STDOUT,timeout=850)
  d['exit_code']=r.returncode;d['status']='COMPLETED' if r.returncode==0 else 'FAILED_OR_HELD'
 except subprocess.TimeoutExpired:d['exit_code']=124;d['status']='TIMEOUT'
 # Failure retries stay bounded at the normal period; never evade throttles.
 d['last_finished_utc']=dt.datetime.now(dt.timezone.utc).isoformat();save(p,d)
 print(json.dumps({k:d[k] for k in ['status','exit_code','next_due_epoch']}));return d['exit_code']
if __name__=='__main__':sys.exit(main())
