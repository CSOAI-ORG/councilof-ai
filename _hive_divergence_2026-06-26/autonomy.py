#!/usr/bin/env python3
"""POND AUTONOMY — 48-hour execution plan for GCP VM"""
import json, os, sys, time, datetime, subprocess, urllib.request, socket

LOG_DIR = "/tmp/autonomy"
os.makedirs(LOG_DIR, exist_ok=True)

SOV3 = "http://localhost:3101/mcp"
SERVICES = {
    "sov3": {"port": 3101, "name": "SOV3 Q1"},
    "keystone": {"port": 8888, "name": "Keystone"},
    "gateway": {"port": 8889, "name": "Gateway"},
    "olm": {"port": 8890, "name": "OLM Router"},
    "dash": {"port": 8891, "name": "Dashboard"},
}

def log(msg):
    ts = datetime.datetime.now().isoformat()[:19]
    with open(f"{LOG_DIR}/autonomy.log", "a") as f: f.write(f"[{ts}] {msg}\n")
    print(f"[{ts}] {msg}", flush=True)

def check_service(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.settimeout(3)
    ok = s.connect_ex(("127.0.0.1", port)) == 0; s.close(); return ok

def health_check():
    results = {}
    for k, v in SERVICES.items():
        up = check_service(v["port"])
        results[k] = up
        if not up: log(f"  DOWN: {v['name']} (:${v['port']})")
    results["all_ok"] = all(v for k, v in results.items() if k != "all_ok")
    return results

def sov3_call(method, args=None):
    try:
        p = json.dumps({"jsonrpc":"2.0","id":"auto","method":"tools/call","params":{"name":method,"arguments":args or {}}}).encode()
        r = urllib.request.Request(f"{SOV3}/mcp", p, {"Content-Type":"application/json"})
        with urllib.request.urlopen(r, timeout=5) as resp:
            return json.loads(resp.read())
    except: return {"error": "failed"}

def run_mode(mode):
    if mode == "health":
        hc = health_check()
        ups = sum(1 for k in SERVICES if hc.get(k))
        log(f"Health: {ups}/{len(SERVICES)} UP")
        sov3_call("sigil_emit", {"line": f"A|auto|health|{ups}/{len(SERVICES)} UP"})

    elif mode == "state":
        hc = health_check()
        try: disk = subprocess.check_output("df -h / | tail -1", shell=True).decode().strip()
        except: disk = "?"
        log(f"State: {hc['all_ok']} | Disk: {disk}")
        s = {"ts": datetime.datetime.now().isoformat()[:19], "services": hc, "disk": disk}
        json.dump(s, open(f"{LOG_DIR}/state.json","w"))

    elif mode == "snapshot":
        hc = health_check(); log(f"Snapshot: {hc['all_ok']}")
        sov3_call("sigil_emit", {"line": f"A|auto|snapshot|{sum(1 for k in SERVICES if hc.get(k))}/{len(SERVICES)} UP"})

if __name__ == "__main__":
    modes = sys.argv[1:] if len(sys.argv) > 1 else ["health"]
    for m in modes: run_mode(m)
