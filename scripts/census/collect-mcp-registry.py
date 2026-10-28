"""Walk the official MCP registry (all versions), dedupe by (name, version).

Fail closed (fixed 2026-09-25): a response is a page only if it is HTTP 200, complete JSON,
and carries servers[] and metadata{}. Anything else stops the walk as PARTIAL -- an error
object has no nextCursor and used to be recorded as "cursor exhausted - clean end", which is
how the 14 Sep census published enumeration_complete: true after 2 pages. read_state is
written explicitly; see read_state.py. For the cross-catalogue frame use frame.py.

Resume (added 2026-10-22): the full walk outlasts one job, so when $MCP_CKPT is set the walk
checkpoints {cursor, seen, rows, pages} every 10 pages and at exit. A later run that finds a
PARTIAL checkpoint resumes from its cursor; an EXHAUSTED walk deletes the checkpoint so the next
run starts a fresh full walk. A resumed walk reports EXHAUSTED only when the cursor genuinely
runs out; the fail-closed checks and read_state semantics are unchanged.
"""
import json, os, signal, sys, time, urllib.request, urllib.error
BASE="https://registry.modelcontextprotocol.io/v0/servers?limit=100"
UA="CSOAI-census/0.1 (+https://councilof.ai)"
CKPT=os.environ.get("MCP_CKPT") or None
def get(u):
    """-> (page dict, None) or (None, reason). Never returns an error body as a page."""
    last=None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":UA}),timeout=25) as r:
                status, body = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, body = e.code, b""
            if e.code == 429 or e.code >= 500:
                ra=e.headers.get("Retry-After") if e.headers else None
                time.sleep(float(ra) if ra and ra.isdigit() else 5*(i+1)); last=f"HTTP {e.code}"; continue
            return None, f"HTTP {status}"
        except Exception as e:
            last=f"{type(e).__name__}"; time.sleep(1.5*(i+1)); continue
        try: d=json.loads(body)
        except ValueError: last="body is not complete JSON"; time.sleep(1.5*(i+1)); continue
        if not isinstance(d,dict) or not isinstance(d.get("servers"),list) or not isinstance(d.get("metadata"),dict):
            return None, "JSON without servers[] and metadata{} - an error object, not a page"
        return d, None
    return None, f"fetch failed after retries ({last})"
cursor=None; pages=0; pages_valid=0; rows={}; seen=set(); stop=None; state="PARTIAL"; resumed=False
def save_ckpt():
    """Write the walk position atomically. Only a PARTIAL walk is worth resuming."""
    if not CKPT or state!="PARTIAL": return
    os.makedirs(os.path.dirname(CKPT) or ".", exist_ok=True)
    tmp=CKPT+".tmp"
    with open(tmp,"w") as f:
        json.dump({"read_state":"PARTIAL","cursor":cursor,"seen":sorted(seen),"pages":pages,
                   "pages_valid":pages_valid,"rows":list(rows.values())}, f)
    os.replace(tmp,CKPT)
if CKPT and os.path.exists(CKPT):
    try:
        c=json.load(open(CKPT))
        if c.get("read_state")=="PARTIAL" and c.get("cursor"):
            cursor=c["cursor"]; seen=set(c.get("seen") or []); pages=int(c.get("pages") or 0)
            pages_valid=int(c.get("pages_valid") or 0)
            rows={(r.get("name"),r.get("version")):r for r in (c.get("rows") or [])}
            resumed=True
            print(f"resuming from checkpoint: pages={pages} unique={len(rows)}")
    except (ValueError, OSError, TypeError) as e:
        print(f"checkpoint unreadable ({type(e).__name__}); starting a fresh walk")
def _on_signal(signum, frame):
    # The step timeout sends SIGINT/SIGTERM; keep the position before dying.
    global stop
    stop=f"interrupted by signal {signum} at page {pages}"
    save_ckpt(); sys.exit(128+signum)
signal.signal(signal.SIGTERM,_on_signal); signal.signal(signal.SIGINT,_on_signal)
while True:
    pages+=1
    d,err=get(BASE+(f"&cursor={cursor}" if cursor else ""))
    if d is None: stop=f"page {pages}: {err}"; break
    pages_valid+=1; new=0
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
    if not nxt: stop="cursor exhausted — clean end of registry"; state="EXHAUSTED"; break
    if nxt in seen:
        stop=f"CURSOR REPEATED at page {pages} after {len(rows)} unique rows — server-side pagination defect"
        break
    if new==0:
        stop=f"page {pages} returned 0 new rows"; break
    seen.add(nxt); cursor=nxt
    if pages % 10 == 0: save_ckpt()
    if pages % 50 == 0:
        json.dump({"pages":pages,"pages_valid":pages_valid,"stop_reason":"in-progress","read_state":"PARTIAL",
                   "unique_entries":len(rows),"rows":list(rows.values())}, open("/tmp/mcp_census_full.json","w"))
    time.sleep(1.0)
if state!="EXHAUSTED" and not rows: state="FAILED"
if state=="EXHAUSTED":
    if CKPT and os.path.exists(CKPT): os.remove(CKPT)
else:
    save_ckpt()
json.dump({"pages":pages,"pages_valid":pages_valid,"stop_reason":stop,"read_state":state,
           "resumed":resumed,"unique_entries":len(rows),"rows":list(rows.values())},
          open("/tmp/mcp_census_full.json","w"))
print(f"pages={pages} valid={pages_valid} unique={len(rows)} read_state={state} resumed={resumed} stop={stop}")
