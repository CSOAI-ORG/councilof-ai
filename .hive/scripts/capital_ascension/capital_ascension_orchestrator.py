#!/usr/bin/env python3
"""capital_ascension_orchestrator.py — regenerate all Series A fundraising artifacts.

Runs the data moat dossier, provisional patents, LOIs, investor tracker, pitch
deck, and CRM. Intended to be scheduled weekly so investor materials stay fresh.
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
SCRIPT_DIR = ROOT / ".hive" / "scripts" / "capital_ascension"
LOG = ROOT / ".hive" / "logs" / "capital_ascension_orchestrator.log"
PYTHON = "/Users/nicholas/clawd/sovereign-temple/.venv/bin/python3"

STEPS = [
    ("data-moat-dossier", [PYTHON, str(SCRIPT_DIR / "data_moat_dossier.py")]),
    ("provisional-patent-drafter", [PYTHON, str(SCRIPT_DIR / "provisional_patent_drafter.py")]),
    ("loi-generator", [PYTHON, str(SCRIPT_DIR / "loi_generator.py")]),
    ("investor-warmup-tracker", [PYTHON, str(SCRIPT_DIR / "investor_warmup_tracker.py")]),
    ("pitch-deck-generator", [PYTHON, str(SCRIPT_DIR / "pitch_deck_generator.py")]),
    ("investor-crm", [PYTHON, str(SCRIPT_DIR / "investor_crm.py")]),
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
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=120)
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
    LOG.write_text(f"# Capital Ascension Orchestrator {datetime.now(timezone.utc).isoformat()}\n", encoding="utf-8")
    results = [run_step(name, cmd) for name, cmd in STEPS]
    ok = sum(1 for r in results if r["ok"])
    summary = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "ok": ok,
        "failed": len(results) - ok,
        "steps": results,
    }
    report = ROOT / ".hive" / "logs" / "capital_ascension_orchestrator.json"
    report.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(f"CAPITAL ASCENSION COMPLETE: {ok}/{len(results)} steps OK")


if __name__ == "__main__":
    main()
