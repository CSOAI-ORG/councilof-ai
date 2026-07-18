import json,urllib.request,re,time
from datetime import datetime,timezone
url="https://raw.githubusercontent.com/openai/grade-school-math/master/grade_school_math/data/test.jsonl"
data=[json.loads(l) for l in urllib.request.urlopen(url,timeout=30).read().decode().splitlines() if l.strip()][:100]
def gate(m):
    for _ in range(2):
        try:
            b=json.dumps({"message":m,"tier":"large","register":"plain"}).encode()
            t=json.load(urllib.request.urlopen(urllib.request.Request("https://os.meok.ai/api/chat",data=b,headers={"Content-Type":"application/json"}),timeout=50)).get("response","")
            if t: return t
        except Exception: time.sleep(0.6)
    return ""
def num(t):
    xs=re.findall(r"-?\d[\d,]*\.?\d*",(t or "").replace(",","")); return xs[-1] if xs else None
c=0
for i,ex in enumerate(data):
    if num(gate(ex["question"]+"\nSolve step by step, then end with just the final number."))==num(ex["answer"]): c+=1
    time.sleep(0.1)
r={"gsm8k_large_n100":round(c/len(data),4),"n":len(data),"correct":c,"tier":"large","run_ts":datetime.now(timezone.utc).isoformat()}
json.dump(r,open("gsm8k_large_verify_results.json","w"),indent=2); print(json.dumps(r))
