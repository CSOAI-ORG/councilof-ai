import json,re,html,sys
rec=json.load(open(sys.argv[1])); c=rec["capsules"][0]
def text(i):
    t=open(f"evidence/{i}.bin","rb").read().decode("utf-8","replace")
    t=re.sub(r"<script.*?</script>"," ",t,flags=re.S); t=html.unescape(re.sub(r"<[^>]+>"," ",t))
    t=t.replace("’","'").replace("‘","'").replace("“",'"').replace("”",'"').replace("—","-").replace("–","-")
    return re.sub(r"\s+"," ",t)
bad=0;n=0
qs=[(q[0],q[1]) for e in c["observed"]["events"] for q in e["quotes"]]+[(v[0],v[1]) for k in c["observed"]["conflicts"] for v in k["variants"] if v[0]=="S10" or "five-day" in v[1]]
for i,q in qs:
    n+=1; qq=re.sub(r"\s+"," ",q)
    ok = qq in text(i)
    if not ok: bad+=1; print("MISSING",i,q)
print(f"{n-bad}/{n} quotes found verbatim in the fetched bytes")
