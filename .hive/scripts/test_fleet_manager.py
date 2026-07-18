#!/usr/bin/env python3
"""test_fleet_manager.py — run and aggregate all configured test suites.

Reads the test_fleet section of .hive/config.yaml, executes each suite,
parses pass/fail/error counts, and writes a JSON report.
"""
from __future__ import annotations

import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
CONFIG = ROOT / ".hive" / "config.yaml"
LOG = ROOT / ".hive" / "logs" / "test_fleet_manager.log"


def load_config() -> dict[str, Any]:
    try:
        import yaml

        return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


def log(msg: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")
    print(msg)


def run(cmd: str, cwd: Path, timeout: int) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired as e:
        return subprocess.CompletedProcess(args=cmd, returncode=-2, stdout=e.stdout or "", stderr="TIMEOUT")
    except Exception as e:
        return subprocess.CompletedProcess(args=cmd, returncode=-1, stdout="", stderr=str(e))


def parse_pytest(output: str) -> dict[str, int]:
    # e.g. "134 passed in 30.98s" or "18 failed, 76 passed, 8 skipped, 3 xfailed"
    m = re.search(r"(\d+)\s+passed", output)
    passed = int(m.group(1)) if m else 0
    m = re.search(r"(\d+)\s+failed", output)
    failed = int(m.group(1)) if m else 0
    m = re.search(r"(\d+)\s+skipped", output)
    skipped = int(m.group(1)) if m else 0
    m = re.search(r"(\d+)\s+error", output)
    errors = int(m.group(1)) if m else 0
    return {"passed": passed, "failed": failed, "skipped": skipped, "errors": errors}


def parse_unified_e2e(output: str) -> dict[str, int]:
    m = re.search(r"Results:\s+✅\s+(\d+)/(\d+)\s+passed\s+\|\s+❌\s+(\d+)\s+failed", output)
    if m:
        return {"passed": int(m.group(1)), "failed": int(m.group(2)) - int(m.group(1)), "skipped": 0, "errors": 0}
    return {"passed": 0, "failed": 0, "skipped": 0, "errors": 0}


def parse_simple(output: str) -> dict[str, int]:
    # Look for "X/Y tests passed" or "PASS" counts
    m = re.search(r"(\d+)/(\d+)\s+tests?\s+passed", output)
    if m:
        passed = int(m.group(1))
        total = int(m.group(2))
        return {"passed": passed, "failed": total - passed, "skipped": 0, "errors": 0}
    if "passed" in output.lower():
        return parse_pytest(output)
    return {"passed": 0, "failed": 0, "skipped": 0, "errors": 0}


def run_suite(suite: dict[str, Any]) -> dict[str, Any]:
    name = suite["name"]
    path = Path(suite["path"])
    cmd = suite["cmd"]
    timeout = suite.get("timeout", 120)

    if not path.exists():
        return {"name": name, "status": "MISSING", "passed": 0, "failed": 0, "skipped": 0, "errors": 0}

    log(f"Running {name} ...")
    r = run(cmd, path, timeout)
    output = r.stdout + "\n" + r.stderr

    if "pytest" in cmd:
        counts = parse_pytest(output)
    elif "unified_e2e_suite" in cmd:
        counts = parse_unified_e2e(output)
    else:
        counts = parse_simple(output)

    total = counts["passed"] + counts["failed"] + counts["skipped"] + counts["errors"]
    status = "PASS" if r.returncode == 0 and counts["failed"] == 0 and counts["errors"] == 0 else "FAIL"
    if r.returncode == -2:
        status = "TIMEOUT"

    log(f"  {name}: {status} {counts['passed']}/{total} (failed={counts['failed']}, errors={counts['errors']})")
    return {
        "name": name,
        "status": status,
        "returncode": r.returncode,
        "total": total,
        **counts,
        "output_tail": "\n".join(output.splitlines()[-20:]),
    }


def main() -> None:
    config = load_config()
    fleet = config.get("test_fleet", {})
    suites = fleet.get("suites", [])
    report_path = ROOT / fleet.get("report", ".hive/logs/test_fleet_report.json")

    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "suites": [],
        "summary": {"passed": 0, "failed": 0, "skipped": 0, "errors": 0, "total": 0},
    }

    for suite in suites:
        result = run_suite(suite)
        report["suites"].append(result)
        for k in ("passed", "failed", "skipped", "errors", "total"):
            report["summary"][k] += result.get(k, 0)

    passing_suites = sum(1 for s in report["suites"] if s["status"] == "PASS")
    report["summary"]["suites_passed"] = passing_suites
    report["summary"]["suites_total"] = len(report["suites"])
    report["summary"]["pass_rate"] = (
        report["summary"]["passed"] / report["summary"]["total"]
        if report["summary"]["total"] else 0.0
    )

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    log(f"Fleet complete: {passing_suites}/{len(report['suites'])} suites, pass rate {report['summary']['pass_rate']:.2%}")


if __name__ == "__main__":
    main()
