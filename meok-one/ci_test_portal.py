#!/usr/bin/env python3
import sys, urllib.request, json, time
BASE = "http://localhost:7777"
def call(path, method="GET", body=None, token=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    if body: req.add_header("Content-Type", "application/json")
    if token: req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode())
    except Exception as e: return {"error": str(e)}
passed = []
def p(name, ok):
    passed.append(ok)
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
r = call("/portal/health")
p("Health", r.get("status") == "ok")
ts = int(time.time())
user = f"ci_{ts}"
r = call("/portal/signup", "POST", {"username": user, "password": "ci"})
p("Signup", "sovereign_id" in r)
r = call("/portal/login", "POST", {"username": user, "password": "ci"})
p("Login", "session_token" in r)
token = r.get("session_token")
r = call("/portal/profile", token=token)
p("Profile", r.get("username") == user)
r = call("/portal/submit", "POST", {"query": "CI test"}, token=token)
p("Submit 1-brain", r.get("mode") == "1-brain")
r = call("/portal/submit/4brain", "POST", {"query": "CI 4brain"}, token=token)
p("Submit 4-brain", r.get("consensus", {}).get("n_voters") == 12)
r = call("/portal/submit/4x4x3", "POST", {"query": "CI 4x4x3"}, token=token)
p("Submit 4x4x3", r.get("consensus", {}).get("n_voters") == 48)
r = call("/portal/history", token=token)
p("History", r.get("total_runestones", 0) >= 3)
print(f"  TOTAL: {sum(passed)}/{len(passed)}")
sys.exit(0 if all(passed) else 1)
