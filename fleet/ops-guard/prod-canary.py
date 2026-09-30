#!/usr/bin/env python3
"""prod-canary.py -- councilof.ai production canary (ops-guard lane, 2026-09-28). Oracle cron */10.

Two public reads, no token, no cookie, nothing written anywhere but this host:
  1. POST https://councilof.ai/mcp/free  JSON-RPC tools/list
     (Accept: application/json, text/event-stream; the reply is SSE, the JSON is on the `data:` line)
     -> len(result.tools) must equal EXPECT_TOOLS (default 12).
  2. GET  https://councilof.ai/root.json -> rolling-root health.
     The historic high-water count is retained, but small legitimate churn is allowed. A regression is a
     material drop beyond MAX_ROOT_DROP_PCT or a root older than MAX_ROOT_AGE_H.
Log ~/lanes/logs/prod-canary.log:
  REGRESSION  a value check failed, or the same endpoint failed to answer on 2 runs in a row
  ERROR       one failed fetch (a single network blip is not called a regression)
  RECOVERED   first passing run after a REGRESSION
  HIGH_WATER  the root.json historic high-water count was raised
  OK          one heartbeat line per hour (the run in minutes 00-09)
Every run also rewrites ~/fleet/prod_canary.json. Exit 0 pass, 2 regression, 1 fetch error.
"""
import json, math, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone

HOME = os.path.expanduser("~")
LOG = os.path.join(HOME, "lanes/logs/prod-canary.log")
STATE = os.path.join(HOME, "lanes/state/prod-canary.json")
OUT = os.path.join(HOME, "fleet/prod_canary.json")
BASE = os.environ.get("CANARY_BASE", "https://councilof.ai")
EXPECT_TOOLS = int(os.environ.get("EXPECT_TOOLS", "12"))
MAX_ROOT_DROP_PCT = float(os.environ.get("MAX_ROOT_DROP_PCT", "5"))
MAX_ROOT_AGE_H = float(os.environ.get("MAX_ROOT_AGE_H", "36"))
UA = "CSOAI-ops-canary/0.1 (+https://councilof.ai; public reads only)"
TIMEOUT = 25


def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def evaluate_root(value, as_of, high_water, now):
    """Rolling root: allow small count churn, reject material drops and stale/future roots."""
    high_water = int(high_water if high_water is not None else value)
    min_count = max(1, math.ceil(high_water * (1.0 - MAX_ROOT_DROP_PCT / 100.0)))
    try:
        observed = datetime.fromisoformat(as_of.replace("Z", "+00:00"))
        if observed.tzinfo is None:
            observed = observed.replace(tzinfo=timezone.utc)
        age_h = (now - observed.astimezone(timezone.utc)).total_seconds() / 3600.0
    except Exception:
        return False, min_count, None
    fresh = -0.25 <= age_h <= MAX_ROOT_AGE_H
    return value >= min_count and fresh, min_count, age_h


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
            high_water = st.get("root_floor")
            if high_water is None:  # first run: live value becomes the historic high-water mark
                st["root_floor"] = high_water = r["value"]
                st["root_floor_set_at"] = iso(t)
                lines.append("%s HIGH_WATER root_card_count set to %d (as_of=%s)" % (iso(t), high_water, r["as_of"]))
            ok, min_count, age_h = evaluate_root(r["value"], r["as_of"], high_water, t)
            want = ">= %d (within %.1f%% of high-water %d) and age <= %.1fh" % (min_count, MAX_ROOT_DROP_PCT, high_water, MAX_ROOT_AGE_H)
            age_txt = "unparseable" if age_h is None else "%.2f" % age_h
            extra = "as_of=%s age_h=%s merkle=%s" % (r["as_of"], age_txt, r["merkle_root"])
            if ok and r["value"] > high_water:
                lines.append("%s HIGH_WATER root_card_count raised %d -> %d (as_of=%s)" % (iso(t), high_water, r["value"], r["as_of"]))
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
        lines.append("%s OK mcp_tools=%s root_card_count=%s high_water=%s max_drop_pct=%.1f root_as_of=%s"
                     % (iso(t), m["observed"], rt["observed"], st.get("root_floor"), MAX_ROOT_DROP_PCT, rt.get("as_of")))
    if lines:
        with open(LOG, "a") as fh:
            fh.write("\n".join(lines) + "\n")
    st["last_run"] = iso(t)
    json.dump(st, open(STATE + ".tmp", "w"), indent=1); os.replace(STATE + ".tmp", STATE)
    out = {"at": iso(t), "base": BASE, "status": {0: "PASS", 1: "FETCH_ERROR", 2: "REGRESSION"}[rc],
           "checks": results, "root_floor": st.get("root_floor"), "root_floor_set_at": st.get("root_floor_set_at"),
           "root_policy": {"mode": "rolling-head", "max_drop_pct": MAX_ROOT_DROP_PCT, "max_age_h": MAX_ROOT_AGE_H},
           "expect_tools": EXPECT_TOOLS, "note": "public reads only; no token; writes nothing outside this host"}
    json.dump(out, open(OUT + ".tmp", "w"), indent=1); os.replace(OUT + ".tmp", OUT)
    return rc


if __name__ == "__main__":
    sys.exit(main())
