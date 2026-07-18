#!/usr/bin/env python3
"""day_orchestrator.py — run the full-day auto-mode sequence for the Hive.

This script is the manual/auto entry point for a daily sovereignty sprint:
health, quality, data, funding, outreach, publishing, and status sealing.
Each step logs to stdout and to .hive/logs/day_orchestrator.log.
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
SCRIPT_DIR = ROOT / ".hive" / "scripts"
LOG = ROOT / ".hive" / "logs" / "day_orchestrator.log"
PYTHON = "/Users/nicholas/clawd/sovereign-temple/.venv/bin/python3"

STEPS = [
    ("service-healer", [PYTHON, str(SCRIPT_DIR / "service_healer.py")]),
    ("quality-manager", [PYTHON, str(SCRIPT_DIR / "quality_manager.py")]),
    ("remediation-generator", [PYTHON, str(SCRIPT_DIR / "remediation_generator.py")]),
    ("test-fleet-manager", [PYTHON, str(SCRIPT_DIR / "test_fleet_manager.py")]),
    ("env-readiness-report", [PYTHON, str(SCRIPT_DIR / "env_readiness_report.py")]),
    ("secrets-inventory", [PYTHON, str(SCRIPT_DIR / "secrets_inventory.py")]),
    ("synthetic-data-factory", [PYTHON, str(SCRIPT_DIR / "synthetic_data_factory.py"), "--count", "1000"]),
    ("cc0-harvester", [PYTHON, str(SCRIPT_DIR / "cc0_harvester.py")]),
    ("government-data-downloader", [PYTHON, str(SCRIPT_DIR / "government_data_downloader.py")]),
    ("grant-application-bot", [PYTHON, str(SCRIPT_DIR / "grant_application_bot.py")]),
    ("nano-creator-seeder", [PYTHON, str(SCRIPT_DIR / "nano_creator_seeder.py")]),
    ("affiliate-tracker", [PYTHON, str(SCRIPT_DIR / "affiliate_tracker.py")]),
    ("publish-manager", [PYTHON, str(SCRIPT_DIR / "publish_manager.py")]),
    ("agent-card-generator", [PYTHON, str(SCRIPT_DIR / "agent_card_generator.py")]),
    ("quorum-sensor", [PYTHON, str(SCRIPT_DIR / "quorum_sensor.py")]),
]

# Long-running steps need more than the default 5 minutes.
STEP_TIMEOUTS: dict[str, int] = {
    "government-data-downloader": 1800,  # 30 min for multi-GB datasets
}


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
        timeout = STEP_TIMEOUTS.get(name, 300)
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
        ok = r.returncode == 0
        if not ok:
            log(f"FAIL {name}: rc={r.returncode} stderr={r.stderr[:500]}")
        else:
            log(f"OK {name}")
        return {"name": name, "ok": ok, "stdout": r.stdout[-1000:], "stderr": r.stderr[-500:]}
    except subprocess.TimeoutExpired:
        log(f"TIMEOUT {name}")
        return {"name": name, "ok": False, "stdout": "", "stderr": "timeout"}
    except Exception as exc:
        log(f"ERROR {name}: {exc}")
        return {"name": name, "ok": False, "stdout": "", "stderr": str(exc)}


def main() -> None:
    LOG.write_text(f"# Day orchestrator run {datetime.now(timezone.utc).isoformat()}\n", encoding="utf-8")
    results = []
    for name, cmd in STEPS:
        results.append(run_step(name, cmd))

    ok = sum(1 for r in results if r["ok"])
    summary = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "ok": ok,
        "failed": len(results) - ok,
        "steps": [{"name": r["name"], "ok": r["ok"]} for r in results],
    }
    report = ROOT / ".hive" / "logs" / "day_orchestrator.json"
    report.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(f"DAY COMPLETE: {ok}/{len(results)} steps OK")


if __name__ == "__main__":
    main()
