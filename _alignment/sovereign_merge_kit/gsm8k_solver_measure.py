import json,urllib.request,re,time
from datetime import datetime,timezone
url="https://raw.githubusercontent.com/openai/grade-school-math/master/grade_school_math/data/test.jsonl"
data=[json.loads(l) for l in urllib.request.urlopen(url,timeout=30).read().decode().splitlines() if l.strip()][:50]
def gate(m,tier):
    for _ in range(2):
        try:
            b=json.dumps({"message":m,"tier":tier,"register":"solver"}).encode()
            t=json.load(urllib.request.urlopen(urllib.request.Request("https://os.meok.ai/api/chat",data=b,headers={"Content-Type":"application/json"}),timeout=50)).get("response","")
            if t: return t
        except Exception: time.sleep(0.5)
    return ""
def gold(a):
    m=re.search(r"####\s*(-?[\d,]+)",a); return m.group(1).replace(",","") if m else None
def parse(t):
    m=re.findall(r"ANSWER:\s*\$?(-?[\d,]+(?:\.\d+)?)",t,re.I)
    if m: return m[-1].replace(",","")
    xs=re.findall(r"-?\d[\d,]*\.?\d*",(t or "").replace(",",""))   # fallback
    return xs[-1] if xs else None
res={}
for tier in ["small","large"]:
    c=noans=0
    for ex in data:
        r=gate(ex["question"],tier); p=parse(r)
        if "ANSWER:" not in r.upper(): noans+=1
        if p==gold(ex["answer"]): c+=1
        time.sleep(0.12)
    res[tier]={"gsm8k":round(c/len(data),3),"n":len(data),"correct":c,"no_answer_line":noans}
    print(tier,res[tier],flush=True)
out={"method":"solver register (deployed) + ANSWER-parse, n=50, gold-graded","results":res,
     "run_ts":datetime.now(timezone.utc).isoformat(),
     "honest":"the HONEST deployed GSM8K number after the solver-register fix (replaces the retracted 0.90 artifact)."}
json.dump(out,open("gsm8k_solver_results.json","w"),indent=2); print("DONE",json.dumps(res))
