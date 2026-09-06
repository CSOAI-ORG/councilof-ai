import json, subprocess, re, time
TOK=subprocess.run(["hf","auth","token"],capture_output=True,text=True).stdout.strip()
def page_all(base):
    url=base; rows=[]; pages=0
    while url and pages<60:
        p=subprocess.run(["curl","-s","-D","/tmp/hdr2.txt","--max-time","30",
                          "-H",f"Authorization: Bearer {TOK}",url],capture_output=True,text=True)
        try: d=json.loads(p.stdout)
        except Exception: break
        pages+=1; rows.extend(d)
        hdr=open("/tmp/hdr2.txt").read()
        m=re.search(r'<([^>]+)>;\s*rel="next"',hdr)
        url=m.group(1) if m else None
        time.sleep(0.05)
    return pages, rows
def lic(tags):
    for t in tags or []:
        if isinstance(t,str) and t.startswith("license:"): return t.split(":",1)[1]
    return None
out={}
for kind,base in [("model","https://huggingface.co/api/models?search=mcp&limit=100&full=false"),
                  ("dataset","https://huggingface.co/api/datasets?search=mcp&limit=100&full=false")]:
    pages,rows=page_all(base)
    out[kind]={"pages":pages,"rows":[{"id":r.get("id"),"likes":r.get("likes"),
        "downloads":r.get("downloads"),"license":lic(r.get("tags")),
        "pipeline":r.get("pipeline_tag"),"private":r.get("private")} for r in rows]}
    print(f"{kind}s: pages={pages} rows={len(rows)}")
json.dump(out,open("/tmp/hf_mcp_census.json","w"))
import collections
for k in out:
    c=collections.Counter(r["license"] or "UNSTATED" for r in out[k]["rows"])
    print(f"  {k} licences:", dict(c.most_common(6)))
