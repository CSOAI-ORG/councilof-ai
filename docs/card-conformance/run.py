#!/usr/bin/env python3
"""CSOAI card conformance corpus runner — stdlib only, imports no CSOAI code.
  python run.py            run both suites; exit 0 iff every case matches expected
  python run.py --verify   verify corpus bytes against MANIFEST.json
Anyone can clone this directory, run one command, and check CSOAI's card format
against the same fixtures the reference publishes. Conforming here means conforming
to the published fixtures, not to any CSOAI service."""
import json,os,sys,hashlib,importlib.util
HERE=os.path.dirname(os.path.abspath(__file__))
def load(mod,path):
    s=importlib.util.spec_from_file_location(mod,path); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
def verify():
    man=json.load(open(os.path.join(HERE,"MANIFEST.json"))); bad=0; h=hashlib.sha256()
    for rel,dig in sorted(man["files"].items()):
        b=open(os.path.join(HERE,rel),"rb").read(); got="sha256:"+hashlib.sha256(b).hexdigest()
        if got!=dig: print(f"  MISMATCH {rel}"); bad+=1
        h.update(b)
    cd="sha256:"+h.hexdigest()
    ok = bad==0 and cd==man["corpusDigest"]
    print(f"  MANIFEST {'OK' if ok else 'FAIL'}: {len(man['files'])} files, corpusDigest {cd}")
    return 0 if ok else 1
def run():
    c1=load("c1",os.path.join(HERE,"card_v0","_check_independent.py"))
    c2=load("c2",os.path.join(HERE,"card_set_v0","_check_independent.py"))
    fails=0
    for f in sorted(os.listdir(os.path.join(HERE,"card_v0"))):
        if f.startswith("_") or not f.endswith(".json"): continue
        d=json.load(open(os.path.join(HERE,"card_v0",f))); got=c1.check(d["entry"])
        ok = got["conforms"]==d["expect"]["conforms"] and set(got["failed"])==set(d["expect"]["failed"])
        print(f"  [{'OK' if ok else 'XX'}] card_v0/{d['name']}: {got}"); fails+=0 if ok else 1
    for f in sorted(os.listdir(os.path.join(HERE,"card_set_v0"))):
        if f.startswith("_") or not f.endswith(".json"): continue
        d=json.load(open(os.path.join(HERE,"card_set_v0",f))); got=c2.check_set(d["index"])
        ok = got["conform"]==d["expect"]["conform"] and set(got["gaps"])==set(d["expect"]["gaps"])
        print(f"  [{'OK' if ok else 'XX'}] card_set_v0/{d['name']}: {got}"); fails+=0 if ok else 1
    print(f"  {'PASS' if fails==0 else 'FAIL'}: {fails} mismatch(es)")
    return 0 if fails==0 else 1
sys.exit(verify() if "--verify" in sys.argv else run())
