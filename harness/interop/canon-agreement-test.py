"""JCS (RFC 8785) cross-language agreement test over the signed corpus.
Cut-over gate for roadmap #1: canon:jcs-rfc8785 — must hit 100% agreement
Python-JCS vs JS-JCS incl. the 0.0/-0.0 float cases, before verifiers dispatch."""
import json, math, subprocess, sys, glob, os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "arena"))
from jcs import es6_number_to_string  # noqa: E402

def jcs_num(n):
    if isinstance(n, bool): return "true" if n else "false"
    if isinstance(n, int): return str(n)
    f = float(n)
    return es6_number_to_string(f)

def jcs(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return jcs_num(v)
    if isinstance(v, str): return json.dumps(v, ensure_ascii=True)
    if isinstance(v, list): return "[" + ",".join(jcs(x) for x in v) + "]"
    if isinstance(v, dict):
        return "{" + ",".join(json.dumps(k, ensure_ascii=True) + ":" + jcs(v[k])
                              for k in sorted(v.keys())) + "}"
    raise TypeError(v)

JS = r"""
function jcsNum(n){ if(n===0) return "0"; let s=String(n); return s; }
function jcs(v){
  if(v===null) return "null";
  if(typeof v==="boolean") return v?"true":"false";
  if(typeof v==="number") return jcsNum(v);
  if(typeof v==="string") return JSON.stringify(v);
  if(Array.isArray(v)) return "["+v.map(jcs).join(",")+"]";
  const ks=Object.keys(v).sort();
  return "{"+ks.map(k=>JSON.stringify(k)+":"+jcs(v[k])).join(",")+"}";
}
const fs=require("fs");
const path=process.argv[2];
const d=JSON.parse(fs.readFileSync(path,"utf8"));
process.stdout.write(jcs(d));
"""
JSFN="/tmp/jcs_js.js"; open(JSFN,"w").write(JS)

def strip_sig(d):
    return {k: v for k, v in d.items() if k not in ("signature","signer","signed","sig_input","content_id")}

files = sorted(glob.glob("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/interop/*.json")
               + glob.glob("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/signed/*.json")
               + glob.glob("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/signals/*.json"))[:40]
agree = total = 0
fail = []
for f in files:
    try:
        d = json.load(open(f))
        body = strip_sig(d) if isinstance(d, dict) else d
        py = jcs(body)
        js = subprocess.run(["node", JSFN, f], capture_output=True, text=True).stdout.strip()
        total += 1
        if py == js: agree += 1
        else:
            fail.append((os.path.basename(f), "PY/JS len %d/%d" % (len(py), len(js))))
    except Exception as e:
        fail.append((os.path.basename(f), str(e)[:40]))
# edge float cases (the roadmap's explicit gate)
edge = {"zero": 0.0, "negzero": -0.0, "one": 1.0, "big": 1e21, "small": 1e-7, "dec": 0.1,
        "nested": {"z": [1, 2.0, "a"], "a": {"b": -0.0, "c": 1e21}}}
import tempfile
tmp = tempfile.mkdtemp()
ef = os.path.join(tmp, "edge.json"); json.dump(edge, open(ef, "w"))
total += 1
py, js = jcs(edge), subprocess.run(["node", JSFN, ef], capture_output=True, text=True).stdout.strip()
if py == js: agree += 1
else: fail.append(("edge-floats", py[:40] + " vs " + js[:40]))
print(f"AGREEMENT: {agree}/{total} ({100.0*agree/total:.1f}%)")
for name, why in fail[:6]:
    print("  FAIL", name, why)
