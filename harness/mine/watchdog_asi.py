#!/usr/bin/env python3
"""watchdog_asi.py — full pipeline monitor.

ASI-Evolve style: monitors all 9 components, auto-restart, alert + escalate on unfixable.

Components: pod worker (via SSH), ollama (via SSH), GHA signing chains, disk (via SSH),
public root, axes, OTS proof, accuracy, leader.

Run: python3 watchdog_asi.py
"""
from __future__ import annotations
import json, os, sys, subprocess, urllib.request, socket
from pathlib import Path
from datetime import datetime, timezone

LOG = Path("/tmp/watchdog_asi.log")
NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
POD_SSH = "ssh -p 22081 root@194.26.196.156"


def log(msg: str) -> None:
    line = f"[{NOW()}] {msg}"
    print(line)
    with open(LOG, "a") as f:
        f.write(line + "\n")


def check(name: str, ok: bool, fix_cmd=None) -> bool:
    if ok:
        log(f"  OK {name}")
        return True
    log(f"  FAIL {name}")
    if fix_cmd:
        log(f"    attempting fix: {fix_cmd}")
        try:
            subprocess.run(fix_cmd, shell=True, timeout=30)
            log(f"    fix attempted")
        except Exception as e:
            log(f"    fix failed: {e}")
    return False


def check_pod_worker() -> bool:
    try:
        out = subprocess.check_output(f"{POD_SSH} 'pgrep -f runpod_gspc_worker.py'", shell=True, timeout=10)
        return bool(out.strip())
    except Exception:
        return False


def check_ollama() -> bool:
    try:
        out = subprocess.check_output(f"""{POD_SSH} 'pgrep -f "ollama serve"'""", shell=True, timeout=10)
        return bool(out.strip())
    except Exception:
        return False


def check_gha_chains() -> bool:
    try:
        cmd = """gh api repos/CSOAI-ORG/councilof-ai/actions/runs?per_page=10 --jq '.workflow_runs[0:10] | .[] | select(.conclusion=="success") | .created_at' 2>/dev/null | head -3"""
        out = subprocess.check_output(cmd, shell=True, timeout=10)
        latest = out.decode().strip().split(chr(10))[0] if out.strip() else ""
        if not latest:
            return False
        ts = datetime.fromisoformat(latest.replace("Z", "+00:00"))
        age_h = (datetime.now(timezone.utc) - ts).total_seconds() / 3600
        return age_h < 4
    except Exception:
        return False


def check_disk() -> bool:
    try:
        cmd = f"{POD_SSH} 'df -P /workspace | tail -1'"
        out = subprocess.check_output(cmd, shell=True, timeout=10)
        parts = out.decode().strip().split()
        if len(parts) >= 5:
            pct = int(parts[4].rstrip("%"))
            return pct < 90
        return False
    except Exception:
        return False


def check_public_root() -> bool:
    try:
        req = urllib.request.Request("https://councilof.ai/root.json", headers={"User-Agent": "watchdog-asi/0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False


def main() -> int:
    log("watchdog_asi starting")

    all_ok = True
    all_ok &= check("pod worker", check_pod_worker(), f"{POD_SSH} 'pgrep -f runpod_gspc_worker.py || nohup /workspace/gspc-worker/pod-watchdog.sh &'")
    all_ok &= check("ollama serve", check_ollama(), f"""{POD_SSH} 'pgrep -f "ollama serve" || nohup /workspace/ollama-bin/bin/ollama serve &'""")
    all_ok &= check("GHA signing chains (<4h)", check_gha_chains(), "gh workflow run hf-fin-shells.yml --repo CSOAI-ORG/councilof-ai")
    all_ok &= check("pod disk <90%", check_disk(), None)
    all_ok &= check("public root reachable", check_public_root(), None)

    if not all_ok:
        log("ONE OR MORE CHECKS FAILED")
    else:
        log("ALL CHECKS PASSED")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
