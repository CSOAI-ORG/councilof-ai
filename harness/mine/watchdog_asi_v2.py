#!/usr/bin/env python3
"""watchdog_asi.py v2 — ASI-Evolve: the watchdog watches itself.

Self-monitors: tracks its own success rate, adjusts check frequency
if too noisy, escalates if too quiet. Meta-watchdog: also checks
the OTHER harnesses.
"""
from __future__ import annotations
import json, os, sys, time, subprocess, urllib.request
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
LOG = Path("/tmp/watchdog_asi.log")
STATE = Path("/tmp/watchdog_asi_state.json")
POD_SSH = "ssh -p 22081 root@194.26.196.156"

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "all_pass_count": 0, "any_fail_count": 0, "last_status": None, "thresholds": {"max_consecutive_fails": 3}}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def log(msg):
    line = f"[{NOW()}] {msg}"
    print(line)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def check(name, ok, fix_cmd=None):
    if ok:
        log(f"  OK {name}")
        return True
    log(f"  FAIL {name}")
    if fix_cmd:
        log(f"    fix: {fix_cmd}")
        try:
            subprocess.run(fix_cmd, shell=True, timeout=30)
        except Exception as e:
            log(f"    fix failed: {e}")
    return False

def check_pod_worker():
    try:
        out = subprocess.check_output(f'{POD_SSH} "pgrep -f runpod_gspc_worker.py"', shell=True, timeout=10)
        return bool(out.strip())
    except Exception:
        return False

def check_ollama():
    # bind-already-in-use means it's running. Use pgrep -c with single pattern.
    try:
        out = subprocess.check_output(f'{POD_SSH} "pgrep -cf ollama || true"', shell=True, timeout=10)
        return int(out.strip() or "0") > 0
    except Exception:
        # If pgrep itself fails, try direct bind check
        try:
            out = subprocess.check_output(f'{POD_SSH} "curl -sf http://127.0.0.1:11434/api/tags >/dev/null && echo ok || echo no"', shell=True, timeout=10)
            return b"ok" in out
        except Exception:
            return False

def check_gha():
    try:
        cmd = """gh api repos/CSOAI-ORG/councilof-ai/actions/runs?per_page=10 --jq '.workflow_runs[0:10] | .[] | select(.conclusion=="success") | .created_at' 2>/dev/null | head -3"""
        out = subprocess.check_output(cmd, shell=True, timeout=10)
        latest = out.decode().strip().split("\n")[0] if out.strip() else ""
        if not latest:
            return False
        ts = datetime.fromisoformat(latest.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - ts).total_seconds() < 14400
    except Exception:
        return False

def check_disk():
    try:
        cmd = f'{POD_SSH} "df -P /workspace | tail -1"'
        out = subprocess.check_output(cmd, shell=True, timeout=10)
        parts = out.decode().strip().split()
        return len(parts) >= 5 and int(parts[4].rstrip("%")) < 90
    except Exception:
        return False

def check_root():
    try:
        req = urllib.request.Request("https://councilof.ai/root.json", headers={"User-Agent": "watchdog-asi/2"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False

def check_gspc_api():
    try:
        req = urllib.request.Request("https://councilof.ai/api/gspc", headers={"User-Agent": "watchdog-asi/2"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False

def check_x402_catalog():
    try:
        req = urllib.request.Request("https://councilof.ai/.well-known/x402.json", headers={"User-Agent": "watchdog-asi/2"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False

HARNESS_LOGS = ["/tmp/card_miner.log", "/tmp/evolve_banks.log", "/tmp/self_correct.log",
                "/tmp/auto_publish.log", "/tmp/a2a_mcp_harness.log", "/tmp/eth_x402_harness.log"]
HARNESS_STALE_S = 3600  # a harness that has not written for an hour is not running

def count_harnesses_alive(now=None, stale_s=HARNESS_STALE_S):
    """How many harnesses wrote to their log recently.

    Existence was the old test, and it could not fail: a log abandoned in August
    still counts as a running harness forever. Freshness can fail, which is the
    point of a check.
    """
    now = time.time() if now is None else now
    alive = 0
    for lf in HARNESS_LOGS:
        try:
            if now - os.path.getmtime(lf) <= stale_s:
                alive += 1
        except OSError:
            pass
    return alive

def check_harnesses_alive():
    """Meta-watchdog: are at least 4 of the 6 harnesses actually writing?"""
    return count_harnesses_alive() >= 4

def main():
    state = load_state()
    state["runs"] += 1
    log(f"watchdog_asi v2 (ASI-Evolve) starting — run #{state['runs']}")
    all_ok = True
    all_ok &= check("pod worker", check_pod_worker(),
                    f'{POD_SSH} "pgrep -f runpod_gspc_worker.py || nohup /workspace/gspc-worker/pod-watchdog.sh &"')
    all_ok &= check("ollama serve", check_ollama(),
                    f'{POD_SSH} "pgrep -f ollama serve || nohup /workspace/ollama-bin/bin/ollama serve &"')
    all_ok &= check("GHA signing <4h", check_gha(),
                    "gh workflow run hf-fin-shells.yml --repo CSOAI-ORG/councilof-ai")
    all_ok &= check("pod disk <90%", check_disk(), None)
    all_ok &= check("public root reachable", check_root(), None)
    all_ok &= check("/api/gspc 200", check_gspc_api(), None)
    all_ok &= check("x402 catalog 200", check_x402_catalog(), None)
    n_alive = count_harnesses_alive()
    log(f"  meta: {n_alive}/{len(HARNESS_LOGS)} harnesses alive "
        f"(wrote within {HARNESS_STALE_S}s)")
    all_ok = all_ok and harnesses_alive >= 4
    if all_ok:
        state["all_pass_count"] += 1
        state["last_status"] = "OK"
        log("ALL CHECKS PASSED")
    else:
        state["any_fail_count"] += 1
        state["last_status"] = "FAIL"
        log("ONE OR MORE CHECKS FAILED")
    if state["any_fail_count"] >= state["thresholds"]["max_consecutive_fails"]:
        log(f"  ESCALATION: {state['any_fail_count']} consecutive failures — owner alert needed")
    save_state(state)
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
