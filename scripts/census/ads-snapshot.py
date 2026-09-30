#!/usr/bin/env python3
"""Verbatim snapshot of the public ARD listing behind the Cisco AI Catalog.
GET https://ai-catalog.outshift.io/v1/agents?page_size=100&page_token=N (unauthenticated).
Each page is stored byte-for-byte with its sha256; each record gets a sha256 over
canonical JSON (sort_keys, compact). Polite: 1 request / 1.2 s, 30 s timeout, UA names us."""
import json, hashlib, time, urllib.request, urllib.error, os, sys, datetime
BASE="https://ai-catalog.outshift.io/v1/agents"
UA="councilof.ai-measurement/1.0 (+https://councilof.ai; read-only census of public ARD records)"
OUT=sys.argv[1] if len(sys.argv)>1 else "/workspace/lanes/agntcy-catalog-20260928/snapshot"
os.makedirs(OUT+"/pages",exist_ok=True)
def get(u):
    for attempt in range(4):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":UA,"Accept":"application/json"}),timeout=30)
            return r.status,r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429,500,502,503,504): time.sleep(5*(attempt+1)); continue
            return e.code,e.read()
        except Exception as e:
            time.sleep(5*(attempt+1))
    return 0,b""
started=datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
tok=""; n=0; pages=[]; recs={}; order=[]; dup=0; totals=[]
while True:
    u=BASE+"?page_size=100"+("&page_token="+tok if tok else "")
    s,b=get(u)
    if s!=200: print("FAIL",u,s,b[:200]); break
    fn="%s/pages/page_%04d.json"%(OUT,n); open(fn,"wb").write(b)
    j=json.loads(b); totals.append(j.get("totalCount"))
    pages.append({"n":n,"url":u,"bytes":len(b),"sha256":hashlib.sha256(b).hexdigest(),"results":len(j.get("results",[])),"totalCount":j.get("totalCount")})
    for r in j.get("results",[]):
        rid=r.get("identifier")
        if rid in recs: dup+=1; continue
        recs[rid]=r; order.append(rid)
    tok=j.get("nextPageToken") or ""
    n+=1
    print(n,len(recs),tok,flush=True)
    if not tok: break
    time.sleep(1.2)
finished=datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
with open(OUT+"/records.jsonl","w") as f:
    for rid in order:
        c=json.dumps(recs[rid],sort_keys=True,separators=(",",":"),ensure_ascii=False)
        f.write(json.dumps({"identifier":rid,"sha256_canonical":hashlib.sha256(c.encode()).hexdigest(),"record":recs[rid]},ensure_ascii=False)+"\n")
rb=open(OUT+"/records.jsonl","rb").read()
man={"source":BASE,"method":"GET page_size=100, offset page_token, unauthenticated; pages stored verbatim","user_agent":UA,
 "started":started,"finished":finished,"pages":pages,"totalCount_seen":sorted(set(t for t in totals if t is not None)),
 "unique_records":len(recs),"duplicate_rows_across_pages":dup,
 "records_jsonl_sha256":hashlib.sha256(rb).hexdigest(),
 "pages_concat_sha256":hashlib.sha256("".join(p["sha256"] for p in pages).encode()).hexdigest(),
 "record_hash_rule":"sha256 of json.dumps(record, sort_keys=True, separators=(\",\",\":\"), ensure_ascii=False) UTF-8"}
json.dump(man,open(OUT+"/MANIFEST.json","w"),indent=1)
print("DONE",len(recs),dup,totals[:1],totals[-1:])
