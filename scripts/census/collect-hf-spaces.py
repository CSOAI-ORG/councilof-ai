import json, subprocess, re, time, sys
TOK=subprocess.run(["hf","auth","token"],capture_output=True,text=True).stdout.strip()
url="https://huggingface.co/api/spaces?search=mcp&limit=100"
rows=[]; pages=0; pages_valid=0; stop=None
while url and pages<400:
    p=subprocess.run(["curl","-s","--max-time","30","-D","/tmp/hdr.txt",
                      "-H",f"Authorization: Bearer {TOK}",url],capture_output=True,text=True)
    pages+=1
    try: d=json.loads(p.stdout)
    except Exception: stop=f"page {pages}: body is not complete JSON"; break
    if not isinstance(d,list): stop=f"page {pages}: not a list of spaces (error object?)"; break
    pages_valid+=1
    for s in d:
        rows.append({"id":s.get("id"),"likes":s.get("likes"),"sdk":s.get("sdk"),
                     "private":s.get("private"),"tags":(s.get("tags") or [])[:6]})
    hdr=open("/tmp/hdr.txt").read()
    m=re.search(r'<([^>]+)>;\s*rel="next"',hdr)
    url=m.group(1) if m else None
    time.sleep(0.1)
# fail closed (2026-09-25): EXHAUSTED only if the walk ended on "no rel=next" with every page valid
if stop is None and url: stop=f"page cap 400 hit with a next link outstanding"
state="EXHAUSTED" if (stop is None and pages_valid==pages and pages>0) else ("PARTIAL" if rows else "FAILED")
json.dump({"pages":pages,"pages_valid":pages_valid,"read_state":state,"stop_reason":stop or "no rel=next link: upstream end","rows":rows},open("/tmp/hf_spaces_census.json","w"))
print(f"pages={pages} spaces={len(rows)} read_state={state}")
