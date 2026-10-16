#!/usr/bin/env python3
"""mcp-reachability: a pre-axis census (DISCOVERED grid). It never feeds the interop-conformance
score or n, or any other axis. Absence is never a failure.

For each QUEUED_FOR_CENSUS row in D1 gspc-layer0 with a listed public https endpoint, it sends only:
  initialize -> notifications/initialized -> tools/list
No tools/call, resources or prompts. No credentials, cookies or auth headers of any kind.
Labels: RESPONDED | UNREACHABLE | TIMEOUT | PROTOCOL_ERROR | AUTH_REQUIRED | NO_PUBLIC_ENDPOINT.
Politeness: at most 1 in-flight request per host, a global rate cap, an honest User-Agent naming CSOAI
with a contact URL, an opt-out deny list (scripts/mcp_reachability_denylist.txt), at most 1 retry.
Every row stores the sha256 of this file (the method sha). Results are unsigned and unpublished.
No model or provider calls: spend is $0 (still checked against the ledger cap)."""
import datetime, hashlib, json, os, socket, sys, threading, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

METHOD = "mcp-reachability-census v0.2"
METHOD_SHA = hashlib.sha256(open(__file__, "rb").read()).hexdigest()
UA = "CSOAI-mcp-reachability-census/0.2 (+https://councilof.ai/contact; opt-out: https://councilof.ai/contact)"
PROTO = "2025-06-18"
TIMEOUT_S = float(os.environ.get("CENSUS_TIMEOUT_S", "15"))
RATE = float(os.environ.get("CENSUS_GLOBAL_RPS", "4"))
WORKERS = int(os.environ.get("CENSUS_WORKERS", "8"))
LIMIT = int(os.environ.get("CENSUS_LIMIT", "200"))
CAP = float(os.environ.get("SPEND_CAP_USD", "91.6")); FLOOR = float(os.environ.get("SPEND_STOP_LEFT_USD", "5"))
A = os.environ["CLOUDFLARE_ACCOUNT_ID"]; TOK = os.environ["CLOUDFLARE_API_TOKEN"]
DB = os.environ.get("GSPC_LAYER0_DB", "62a2008b-00bb-4df9-be01-3a18f9c0859d")
DENY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mcp_reachability_denylist.txt")
now = lambda: datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def q(sql, params=None):
    b = {"sql": sql, **({"params": params} if params is not None else {})}
    r = urllib.request.Request(f"https://api.cloudflare.com/client/v4/accounts/{A}/d1/database/{DB}/query",
        data=json.dumps(b).encode(), method="POST", headers={"Authorization": "Bearer " + TOK, "content-type": "application/json"})
    out = json.load(urllib.request.urlopen(r, timeout=120))
    if not out.get("success"): raise SystemExit(f"D1 error: {out.get('errors')}")
    return out["result"][0]["results"]

class Bucket:  # global rate cap
    def __init__(s, rps): s.gap, s.next, s.lock = 1.0 / rps, 0.0, threading.Lock()
    def take(s):
        with s.lock:
            t = max(time.monotonic(), s.next); s.next = t + s.gap
        time.sleep(max(0.0, t - time.monotonic()))
BUCKET = Bucket(RATE)

OPENER = urllib.request.build_opener()  # no cookie jar, no auth handlers, no credentials

class Fail(Exception):
    def __init__(s, label, detail): s.label, s.detail = label, detail

def rpc(url, method, params, rid, sid=None):
    h = {"content-type": "application/json", "accept": "application/json, text/event-stream", "user-agent": UA}
    if sid: h["mcp-session-id"] = sid
    if method != "initialize": h["mcp-protocol-version"] = PROTO
    body = {"jsonrpc": "2.0", "method": method, "params": params, **({"id": rid} if rid is not None else {})}
    BUCKET.take()
    try:
        r = OPENER.open(urllib.request.Request(url, data=json.dumps(body).encode(), headers=h, method="POST"), timeout=TIMEOUT_S)
    except urllib.error.HTTPError as e:
        if e.code in (401, 403) or e.headers.get("www-authenticate"):
            raise Fail("AUTH_REQUIRED", {"stage": method, "http": e.code})
        if rid is None and e.code in (202, 204, 404, 405):  # notification ack variations
            return None, sid
        raise Fail("UNREACHABLE" if e.code >= 500 or e.code in (404, 410) else "PROTOCOL_ERROR", {"stage": method, "http": e.code})
    except (socket.timeout, TimeoutError) as e:
        raise Fail("TIMEOUT", {"stage": method})
    except urllib.error.URLError as e:
        if isinstance(e.reason, (socket.timeout, TimeoutError)): raise Fail("TIMEOUT", {"stage": method})
        raise Fail("UNREACHABLE", {"stage": method, "error": str(e.reason)[:200]})
    except (ConnectionError, OSError) as e:
        raise Fail("UNREACHABLE", {"stage": method, "error": type(e).__name__})
    sid = r.headers.get("mcp-session-id") or sid
    if rid is None: return None, sid
    try: raw = r.read(2_000_000).decode("utf-8", "replace")
    except (socket.timeout, TimeoutError): raise Fail("TIMEOUT", {"stage": method, "while": "read"})
    msg = None
    if "text/event-stream" in (r.headers.get("content-type") or ""):
        for line in raw.splitlines():
            if line.startswith("data:"):
                try:
                    m = json.loads(line[5:].strip())
                    if isinstance(m, dict) and m.get("id") == rid: msg = m; break
                except ValueError: pass
    else:
        try: msg = json.loads(raw)
        except ValueError: msg = None
    if not isinstance(msg, dict): raise Fail("PROTOCOL_ERROR", {"stage": method, "error": "no JSON-RPC response"})
    if "error" in msg: raise Fail("PROTOCOL_ERROR", {"stage": method, "jsonrpc_error": str(msg["error"])[:300]})
    if "result" not in msg: raise Fail("PROTOCOL_ERROR", {"stage": method, "error": "no result"})
    return msg, sid

def census_once(url):
    init, sid = rpc(url, "initialize", {"protocolVersion": PROTO, "capabilities": {},
                    "clientInfo": {"name": "csoai-mcp-reachability-census", "version": "0.2"}}, 1)
    res = init["result"]; pv = res.get("protocolVersion")
    if not isinstance(pv, str):
        raise Fail("PROTOCOL_ERROR", {"stage": "initialize", "requested": PROTO, "returned": pv})
    rpc(url, "notifications/initialized", {}, None, sid)
    try:
        tl, _ = rpc(url, "tools/list", {}, 2, sid)
    except Fail as f:
        if f.label == "PROTOCOL_ERROR": f.detail.update({"requested": PROTO, "returned": pv})
        raise
    tools = tl["result"].get("tools")
    if not isinstance(tools, list):
        raise Fail("PROTOCOL_ERROR", {"stage": "tools/list", "requested": PROTO, "returned": pv, "error": "tools not a list"})
    canon = json.dumps(sorted(tools, key=lambda t: str(t.get("name", "")) if isinstance(t, dict) else ""), sort_keys=True, separators=(",", ":"))
    return "RESPONDED", {"protocolVersion": pv, "requested": PROTO, "version_match": pv == PROTO,
                         "tool_count": len(tools), "tools_canonical_sha256": hashlib.sha256(canon.encode()).hexdigest(),
                         "serverInfo": res.get("serverInfo")}

def census(url):
    for attempt in (1, 2):  # at most 1 retry, only for transient outcomes
        try:
            lab, d = census_once(url); d["attempts"] = attempt; return lab, d
        except Fail as f:
            if attempt == 1 and f.label in ("TIMEOUT", "UNREACHABLE"): continue
            f.detail["attempts"] = attempt; return f.label, f.detail

def endpoint(raw):
    for u in (raw.get("remotes") or "").split():
        if u.startswith("https://"): return u
    return ""

def main():
    deny = set()
    if os.path.exists(DENY):
        deny = {l.strip().lower() for l in open(DENY) if l.strip() and not l.startswith("#")}
    spent = float((q("SELECT value FROM queue_kv WHERE key='spend_usd'") or [{"value": 0}])[0]["value"] or 0)
    if CAP - spent <= FLOOR: print(f"stop: ${CAP-spent:.2f} left"); return
    rows = q(f"SELECT m.subject_key, t.raw FROM measurement_queue m JOIN tools t ON t.key=m.subject_key "
             f"WHERE m.status='QUEUED_FOR_CENSUS' AND m.census='mcp-reachability' ORDER BY m.priority LIMIT {LIMIT}")
    jobs, out = {}, []
    for r in rows:
        try: raw = json.loads(r["raw"] or "{}")
        except ValueError: raw = {}
        url = endpoint(raw); host = urllib.parse.urlparse(url).hostname or ""
        if not url:
            out.append((r["subject_key"], now(), "", "NO_PUBLIC_ENDPOINT", {"reason": "no https endpoint listed"}))
        elif host.lower() in deny or any(host.lower().endswith("." + d) for d in deny):
            out.append((r["subject_key"], now(), url, None, {"opted_out": True}))
        else:
            jobs.setdefault(host, []).append((r["subject_key"], url))
    lock = threading.Lock()
    def run_host(items):  # one host, strictly sequential => <=1 in-flight request per host
        for key, url in items:
            lab, d = census(url)
            with lock: out.append((key, now(), url, lab, d))
    with ThreadPoolExecutor(WORKERS) as ex: list(ex.map(run_host, jobs.values()))
    tally = {}
    res_rows = [o for o in out if o[3]]
    for i in range(0, len(res_rows), 10):
        ch = res_rows[i:i + 10]
        q("INSERT INTO census_results(subject_key,ts,endpoint,label,detail,method,method_sha256) VALUES " + ",".join(["(?,?,?,?,?,?,?)"] * len(ch)),
          [v for k, ts, u, lab, d in ch for v in (k, ts, u, lab, json.dumps(d, default=str)[:4000], METHOD, METHOD_SHA)])
    for k, ts, u, lab, d in out:
        st = lab or "OPTED_OUT"; tally[st] = tally.get(st, 0) + 1
        q("UPDATE measurement_queue SET status=?, last_checked=?, method_sha256=?, attempts=attempts+1 WHERE subject_key=?", [st, ts, METHOD_SHA, k])
    q("INSERT OR REPLACE INTO queue_kv VALUES('spend_usd', ?)", [str(spent)])
    q("INSERT INTO queue_runs(ts,kind,picked,detail) VALUES(?,?,?,?)",
      [now(), "census_mcp_reachability", len(rows), json.dumps({"tally": tally, "method_sha256": METHOD_SHA, "spend_usd": 0.0})])
    print(json.dumps({"picked": len(rows), "tally": tally, "method_sha256": METHOD_SHA}))

if __name__ == "__main__": main()
