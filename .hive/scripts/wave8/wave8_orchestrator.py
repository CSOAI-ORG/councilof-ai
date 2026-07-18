#!/usr/bin/env python3
"""wave8_orchestrator.py — run all Wave 8 offensive intelligence scripts.

Schedulable via launchd; regenerates Horus reports, Mamba readiness, DAO
scaffold, RobotMCP spec, and gaming compliance artifacts.
"""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
SCRIPT_DIR = ROOT / ".hive" / "scripts" / "wave8"
LOG = ROOT / ".hive" / "logs" / "wave8_orchestrator.log"
PYTHON = "/Users/nicholas/clawd/sovereign-temple/.venv/bin/python3"

STEPS = [
    ("horus-osint", [PYTHON, str(SCRIPT_DIR / "horus_osint.py")]),
    ("mamba3-readiness", [PYTHON, str(SCRIPT_DIR / "mamba3_readiness.py")]),
    ("dao-scaffold", [PYTHON, str(SCRIPT_DIR / "dao_scaffold.py")]),
    ("robotmcp-bridge", [PYTHON, str(SCRIPT_DIR / "robotmcp_bridge.py")]),
    ("gaming-compliance", [PYTHON, str(SCRIPT_DIR / "meok_gaming_compliance.py")]),
]


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    line = f"[{ts}] {msg}"
    print(line)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def run_step(name: str, cmd: list[str]) -> dict[str, Any]:
    log(f"START {name}")
    try:
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=180)
        ok = r.returncode == 0
        if not ok:
            log(f"FAIL {name}: rc={r.returncode} stderr={r.stderr[:500]}")
        else:
            log(f"OK {name}")
        return {"name": name, "ok": ok}
    except Exception as exc:
        log(f"ERROR {name}: {exc}")
        return {"name": name, "ok": False}


def main() -> None:
    LOG.write_text(f"# Wave 8 Orchestrator {datetime.now(timezone.utc).isoformat()}\n", encoding="utf-8")
    results = [run_step(name, cmd) for name, cmd in STEPS]
    ok = sum(1 for r in results if r["ok"])
    summary = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "ok": ok,
        "failed": len(results) - ok,
        "steps": results,
    }
    report = ROOT / ".hive" / "logs" / "wave8_orchestrator.json"
    report.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(f"WAVE 8 COMPLETE: {ok}/{len(results)} steps OK")


if __name__ == "__main__":
    main()
