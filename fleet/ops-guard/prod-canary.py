#!/usr/bin/env python3
"""prod-canary.py -- councilof.ai production canary (ops-guard lane, 2026-09-28). Oracle cron */10.

Two public reads, no token, no cookie, nothing written anywhere but this host:
  1. POST https://councilof.ai/mcp/free  JSON-RPC tools/list
     (Accept: application/json, text/event-stream; the reply is SSE, the JSON is on the `data:` line)
     -> len(result.tools) must equal EXPECT_TOOLS (default 12).
  2. GET  https://councilof.ai/root.json -> card_count must be >= the floor.
     The floor is the card_count read live when the canary was installed, raised (never lowered) to any higher
     value it later observes; lowering it is an owner decision (edit ~/lanes/state/prod-canary.json by hand).
Log ~/lanes/logs/prod-canary.log:
  REGRESSION  a value check failed, or the same endpoint failed to answer on 2 runs in a row
  ERROR       one failed fetch (a single network blip is not called a regression)
  RECOVERED   first passing run after a REGRESSION
  FLOOR       the root.json floor was raised
  OK          one heartbeat line per hour (the run in minutes 00-09)
Every run also rewrites ~/fleet/prod_canary.json. Exit 0 pass, 2 regression, 1 fetch error.
"""
import json, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone

HOME = os.path.expanduser("~")
LOG = os.path.join(HOME, "lanes/logs/prod-canary.log")
STATE = os.path.join(HOME, "lanes/state/prod-canary.json")
OUT = os.path.join(HOME, "fleet/prod_canary.json")
BASE = os.environ.get("CANARY_BASE", "https://councilof.ai")
EXPECT_TOOLS = int(os.environ.get("EXPECT_TOOLS", "12"))
UA = "CSOAI-ops-canary/0.1 (+https://councilof.ai; public reads only)"
TIMEOUT = 25


def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(url, data=None, headers=None):
    h = {"User-Agent": UA, "Cache-Control": "no-cache"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h, method="POST" if data else "GET")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.status, r.read(4 * 1024 * 1024).decode("utf-8", "replace")


def check_mcp():
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}).encode()
    st, txt = fetch(BASE + "/mcp/free", data=body,
                    headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream"})
    data = [ln[5:].strip() for ln in txt.splitlines() if ln.startswith("data:")]
    doc = json.loads(data[-1]) if data else json.loads(txt)
    tools = doc["result"]["tools"]
    return {"http": st, "value": len(tools), "names": sorted(t.get("name", "?") for t in tools)}


def check_root():
    st, txt = fetch(BASE + "/root.json")
    d = json.loads(txt)
    return {"http": st, "value": int(d["card_count"]), "as_of": d.get("as_of"),
            "merkle_root": (d.get("merkle_root") or "")[:16]}


def main():
    t = datetime.now(timezone.utc)
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    try:
        st = json.load(open(STATE))
    except Exception:  # noqa: BLE001
        st = {}
    st.setdefault("fail_streak", {})
    st.setdefault("regressed", {})
    lines, results, rc = [], {}, 0
    for name, fn in (("mcp_tools", check_mcp), ("root_card_count", check_root)):
        try:
            r = fn()
            st["fail_streak"][name] = 0
        except Exception as e:  # noqa: BLE001 - network, HTTP, parse: all are "no answer"
            n = st["fail_streak"].get(name, 0) + 1
            st["fail_streak"][name] = n
            msg = "%s: %s" % (type(e).__name__, str(e)[:160].replace("\n", " "))
            results[name] = {"ok": False, "error": msg, "fail_streak": n}
            if n >= 2:
                lines.append("%s REGRESSION check=%s reason=no_answer_%d_runs %s" % (iso(t), name, n, msg))
                st["regressed"][name] = True
                rc = 2
            else:
                lines.append("%s ERROR check=%s %s" % (iso(t), name, msg))
                rc = max(rc, 1)
            continue
        if name == "mcp_tools":
            ok = r["value"] == EXPECT_TOOLS
            want = "== %d" % EXPECT_TOOLS
            extra = "names=%s" % ",".join(r["names"]) if not ok else ""
        else:
            floor = st.get("root_floor")
            if floor is None:  # first run: the live value becomes the floor
                st["root_floor"] = floor = r["value"]
                st["root_floor_set_at"] = iso(t)
                lines.append("%s FLOOR root_card_count floor set to %d (live at install, as_of=%s)" % (iso(t), floor, r["as_of"]))
            ok = r["value"] >= floor
            want = ">= %d" % floor
            extra = "as_of=%s merkle=%s" % (r["as_of"], r["merkle_root"])
            if ok and r["value"] > floor:
                lines.append("%s FLOOR root_card_count floor raised %d -> %d (as_of=%s)" % (iso(t), floor, r["value"], r["as_of"]))
                st["root_floor"] = r["value"]
                st["root_floor_set_at"] = iso(t)
        results[name] = {"ok": ok, "observed": r["value"], "expected": want, "http": r["http"]}
        if name == "root_card_count":
            results[name]["as_of"] = r["as_of"]
        if not ok:
            lines.append("%s REGRESSION check=%s observed=%s expected %s %s" % (iso(t), name, r["value"], want, extra))
            st["regressed"][name] = True
            rc = 2
        elif st["regressed"].pop(name, None):
            lines.append("%s RECOVERED check=%s observed=%s expected %s" % (iso(t), name, r["value"], want))
    if rc == 0 and t.minute < 10:
        m, rt = results["mcp_tools"], results["root_card_count"]
        lines.append("%s OK mcp_tools=%s root_card_count=%s floor=%s root_as_of=%s"
                     % (iso(t), m["observed"], rt["observed"], st.get("root_floor"), rt.get("as_of")))
    if lines:
        with open(LOG, "a") as fh:
            fh.write("\n".join(lines) + "\n")
    st["last_run"] = iso(t)
    json.dump(st, open(STATE + ".tmp", "w"), indent=1); os.replace(STATE + ".tmp", STATE)
    out = {"at": iso(t), "base": BASE, "status": {0: "PASS", 1: "FETCH_ERROR", 2: "REGRESSION"}[rc],
           "checks": results, "root_floor": st.get("root_floor"), "root_floor_set_at": st.get("root_floor_set_at"),
           "expect_tools": EXPECT_TOOLS, "note": "public reads only; no token; writes nothing outside this host"}
    json.dump(out, open(OUT + ".tmp", "w"), indent=1); os.replace(OUT + ".tmp", OUT)
    return rc


if __name__ == "__main__":
    sys.exit(main())
