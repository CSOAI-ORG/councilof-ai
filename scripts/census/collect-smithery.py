import json, subprocess, time
rows={}; page=1; total=None; pages=0
while True:
    u=f"https://registry.smithery.ai/servers?page={page}&pageSize=100"
    p=subprocess.run(["curl","-s","--max-time","30",u],capture_output=True,text=True)
    try: d=json.loads(p.stdout)
    except Exception: break
    pg=d.get("pagination") or {}
    total=pg.get("totalCount",total)
    servers=d.get("servers") or []
    if not servers: break
    pages+=1
    for s in servers:
        rows[s.get("qualifiedName") or s.get("id")]={
            "qualifiedName":s.get("qualifiedName"),"displayName":s.get("displayName"),
            "verified":s.get("verified"),"useCount":s.get("useCount"),
            "remote":s.get("remote"),"isDeployed":s.get("isDeployed"),"unlisted":s.get("unlisted")}
    if page>=(pg.get("totalPages") or 0): break
    page+=1; time.sleep(0.05)
json.dump({"pages":pages,"declared_total":total,"unique":len(rows),"rows":list(rows.values())},
          open("/tmp/smithery_census.json","w"))
print(f"pages={pages} declared_total={total} unique={len(rows)}")
