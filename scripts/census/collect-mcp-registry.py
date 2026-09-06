import json, subprocess, time
BASE="https://registry.modelcontextprotocol.io/v0/servers?limit=100"
def get(u):
    for i in range(4):
        p=subprocess.run(["curl","-s","--max-time","25",u],capture_output=True,text=True)
        try: return json.loads(p.stdout)
        except Exception: time.sleep(1.5*(i+1))
    return None
cursor=None; pages=0; rows={}; seen=set(); stop=None; stalls=0
while True:
    d=get(BASE+(f"&cursor={cursor}" if cursor else ""))
    if d is None: stop="fetch failed after retries"; break
    pages+=1; new=0
    for s in d.get("servers",[]):
        srv=s.get("server",{}) or {}
        meta=((s.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {})
        k=(srv.get("name"),srv.get("version"))
        if k in rows: continue
        new+=1
        rows[k]={"name":srv.get("name"),"version":srv.get("version"),
                 "isLatest":bool(meta.get("isLatest")),"status":meta.get("status"),
                 "has_remote":bool(srv.get("remotes")),
                 "registryTypes":sorted({(p.get("registryType") or p.get("registry_name") or "?") for p in (srv.get("packages") or [])}),
                 "repo":(srv.get("repository") or {}).get("url")}
    nxt=(d.get("metadata") or {}).get("nextCursor")
    if not nxt: stop="cursor exhausted — clean end of registry"; break
    if nxt in seen:
        stalls+=1
        stop=f"CURSOR REPEATED at page {pages} after {len(rows)} unique rows — server-side pagination defect"
        break
    if new==0:
        stop=f"page {pages} returned 0 new rows"; break
    seen.add(nxt); cursor=nxt
    if pages % 50 == 0:
        json.dump({"pages":pages,"stop_reason":"in-progress","unique_entries":len(rows),
                   "rows":list(rows.values())}, open("/tmp/mcp_census_full.json","w"))
json.dump({"pages":pages,"stop_reason":stop,"unique_entries":len(rows),"rows":list(rows.values())},
          open("/tmp/mcp_census_full.json","w"))
print(f"pages={pages} unique={len(rows)} stop={stop}")
