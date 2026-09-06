import json, subprocess, re, time, sys
TOK=subprocess.run(["hf","auth","token"],capture_output=True,text=True).stdout.strip()
url="https://huggingface.co/api/spaces?search=mcp&limit=100"
rows=[]; pages=0
while url and pages<400:
    p=subprocess.run(["curl","-s","--max-time","30","-D","/tmp/hdr.txt",
                      "-H",f"Authorization: Bearer {TOK}",url],capture_output=True,text=True)
    try: d=json.loads(p.stdout)
    except Exception: break
    pages+=1
    for s in d:
        rows.append({"id":s.get("id"),"likes":s.get("likes"),"sdk":s.get("sdk"),
                     "private":s.get("private"),"tags":(s.get("tags") or [])[:6]})
    hdr=open("/tmp/hdr.txt").read()
    m=re.search(r'<([^>]+)>;\s*rel="next"',hdr)
    url=m.group(1) if m else None
    time.sleep(0.1)
json.dump({"pages":pages,"rows":rows},open("/tmp/hf_spaces_census.json","w"))
print(f"pages={pages} spaces={len(rows)}")
