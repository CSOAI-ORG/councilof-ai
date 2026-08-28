import json, subprocess, glob, os, sys, tempfile
sys.path.insert(0, "/tmp/rfcv/lib/python3.14/site-packages")
from rfc8785 import dumps as jcs_py
JS = "import c from 'canonicalize'; import fs from 'node:fs'; process.stdout.write(c(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))))"
open("/tmp/jcslib/jcs_lib.mjs","w").write(JS)
def strip(d): return {k:v for k,v in d.items() if k not in ("signature","signer","signed","sig_input","content_id")}
files = sorted(glob.glob("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/interop/*.json")
             + glob.glob("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/signed/*.json")
             + glob.glob("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/signals/*.json"))[:50]
agree=total=0; fails=[]
for f in files:
    try:
        d=json.load(open(f)); body=strip(d) if isinstance(d,dict) else d
        py=jcs_py(body); js=subprocess.run(["node","/tmp/jcslib/jcs_lib.mjs",f],capture_output=True,text=True,cwd="/tmp/jcslib").stdout.strip()
        total+=1
        if py==js: agree+=1
        else: fails.append((os.path.basename(f), f"len {len(py)}/{len(js)}"))
    except Exception as e: fails.append((os.path.basename(f), str(e)[:40]))
# edge floats
edge={"zero":0.0,"negzero":-0.0,"one":1.0,"big":1e21,"small":1e-7,"dec":0.1,"nested":{"z":[1,2.0,"a"],"a":{"b":-0.0,"c":1e21}}}
ef="/tmp/jcslib/edge.json"; json.dump(edge,open(ef,"w")); total+=1
py,js=jcs_py(edge),subprocess.run(["node","/tmp/jcslib/jcs_lib.mjs",ef],capture_output=True,text=True,cwd="/tmp/jcslib").stdout.strip()
if py==js: agree+=1
else: fails.append(("edge-floats", f"{py[:50]} vs {js[:50]}"))
print(f"LIBRARY AGREEMENT: {agree}/{total} ({100.0*agree/total:.1f}%)")
for n,w in fails[:8]: print("  FAIL",n,w)
