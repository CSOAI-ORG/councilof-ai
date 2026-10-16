#!/usr/bin/env python3
"""Interop-conformance probe for QUEUED_FOR_MILL rows in D1 gspc-layer0.
Per subject: a real MCP `initialize` then `tools/list` against its public remote endpoint (plain HTTP, $0).
Writes MEASURED (handshake answered: protocolVersion, tool count, sha of tools/list) or UNREACHABLE, or
NO_PUBLIC_ENDPOINT, into measurement_queue + interop_probe_results. Results stay unsigned and unpublished.
No model/provider calls are made, so spend is 0; the ledger row records that and the cap is still checked."""
import json, os, sys, hashlib, datetime, urllib.request, urllib.error
A = os.environ["CLOUDFLARE_ACCOUNT_ID"]; DB = os.environ.get("GSPC_LAYER0_DB", "62a2008b-00bb-4df9-be01-3a18f9c0859d")
TOK = os.environ["CLOUDFLARE_API_TOKEN"]; LIMIT = int(os.environ.get("PROBE_LIMIT", "200"))
CAP = float(os.environ.get("SPEND_CAP_USD", "91.6")); FLOOR = float(os.environ.get("SPEND_STOP_LEFT_USD", "5"))
PROBE_VERSION = "interop-probe-v0.1 (MCP 2025-06-18 initialize + tools/list, 15s timeout)"
now = lambda: datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def q(sql, params=None):
    b = {"sql": sql, **({"params": params} if params is not None else {})}
    r = urllib.request.Request(f"https://api.cloudflare.com/client/v4/accounts/{A}/d1/database/{DB}/query",
        data=json.dumps(b).encode(), method="POST", headers={"Authorization": "Bearer " + TOK, "content-type": "application/json"})
    out = json.load(urllib.request.urlopen(r, timeout=120))
    if not out.get("success"): raise SystemExit(f"D1 error: {out.get('errors')}")
    return out["result"][0]["results"]

def rpc(url, method, params, rid, sid=None):
    h = {"content-type": "application/json", "accept": "application/json, text/event-stream", "user-agent": "gspc-interop-probe/0.1"}
    if sid: h["mcp-session-id"] = sid
    body = {"jsonrpc": "2.0", "method": method, **({"id": rid} if rid is not None else {}), "params": params}
    r = urllib.request.urlopen(urllib.request.Request(url, data=json.dumps(body).encode(), headers=h, method="POST"), timeout=15)
    raw = r.read(2_000_000).decode("utf-8", "replace"); sid = r.headers.get("mcp-session-id") or sid
    if rid is None: return None, sid
    if "text/event-stream" in (r.headers.get("content-type") or ""):
        for line in raw.splitlines():
            if line.startswith("data:"):
                try:
                    m = json.loads(line[5:].strip())
                    if m.get("id") == rid: return m, sid
                except ValueError: pass
        return None, sid
    return json.loads(raw), sid

def probe(url):
    try:
        init, sid = rpc(url, "initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                         "clientInfo": {"name": "gspc-interop-probe", "version": "0.1"}}, 1)
        if not init or "result" not in init: return "UNREACHABLE", {"stage": "initialize", "error": (init or {}).get("error")}
        rpc(url, "notifications/initialized", {}, None, sid)
        tl, _ = rpc(url, "tools/list", {}, 2, sid)
        res = init["result"]
        d = {"protocolVersion": res.get("protocolVersion"), "serverInfo": res.get("serverInfo"),
             "tools_list_ok": bool(tl and "result" in tl)}
        if d["tools_list_ok"]:
            tools = tl["result"].get("tools", [])
            d["tool_count"] = len(tools)
            d["tools_sha256"] = hashlib.sha256(json.dumps(sorted(t.get("name", "") for t in tools)).encode()).hexdigest()
        else: d["tools_list_error"] = (tl or {}).get("error")
        return "MEASURED", d
    except urllib.error.HTTPError as e: return "UNREACHABLE", {"http": e.code}
    except Exception as e: return "UNREACHABLE", {"error": type(e).__name__ + ": " + str(e)[:200]}

def main():
    q("CREATE TABLE IF NOT EXISTS interop_probe_results (subject_key TEXT, ts TEXT, endpoint TEXT, outcome TEXT, detail TEXT, probe_version TEXT, signed TEXT DEFAULT 'false', published TEXT DEFAULT 'false')")
    q("CREATE TABLE IF NOT EXISTS queue_kv (key TEXT PRIMARY KEY, value TEXT)")
    spent = float((q("SELECT value FROM queue_kv WHERE key='spend_usd'") or [{"value": 0}])[0]["value"] or 0)
    if CAP - spent <= FLOOR: print(f"stop: ${CAP-spent:.2f} left"); return
    rows = q(f"SELECT m.subject_key, t.raw FROM measurement_queue m JOIN tools t ON t.key=m.subject_key WHERE m.status='QUEUED_FOR_MILL' AND m.axes LIKE '%interop-conformance%' ORDER BY m.priority LIMIT {LIMIT}")
    tally = {}
    for r in rows:
        try: raw = json.loads(r["raw"] or "{}")
        except ValueError: raw = {}
        url = (raw.get("remotes") or "").split()[0] if raw.get("remotes") else ""
        if not url.startswith("https://"):
            out, d = "NO_PUBLIC_ENDPOINT", {"reason": "no https remote in listing"}
        else:
            out, d = probe(url)
        tally[out] = tally.get(out, 0) + 1
        ts = now()
        q("INSERT INTO interop_probe_results(subject_key,ts,endpoint,outcome,detail,probe_version) VALUES(?,?,?,?,?,?)",
          [r["subject_key"], ts, url, out, json.dumps(d)[:4000], PROBE_VERSION])
        q("UPDATE measurement_queue SET status=?, last_checked=?, note=? WHERE subject_key=?",
          [out, ts, "interop probe; unsigned, unpublished", r["subject_key"]])
    q("INSERT OR REPLACE INTO queue_kv VALUES('spend_usd', ?)", [str(spent + 0.0)])
    q("INSERT INTO queue_runs(ts,kind,picked,detail) VALUES(?,?,?,?)", [now(), "mill_interop", len(rows), json.dumps({"tally": tally, "spend_usd": 0.0})])
    print(json.dumps({"picked": len(rows), "tally": tally, "spend_usd": 0.0}))

if __name__ == "__main__": main()
