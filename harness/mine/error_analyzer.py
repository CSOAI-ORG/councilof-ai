#!/usr/bin/env python3
"""error_analyzer.py — ASI-Evolve: cross-harness error analysis.

Reads all harness logs, categorizes errors by type, finds patterns.
Proposes fixes for the most common ones.
"""
from __future__ import annotations
import json, os, sys, re
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/error_analyzer_state.json")

LOG_PATHS = [
    "/tmp/card_miner_asi.log",
    "/tmp/evolve_banks_asi.log",
    "/tmp/self_correct_asi.log",
    "/tmp/watchdog_asi_v2.log",
    "/tmp/meta_improve.log",
    "/tmp/a2a_mcp_harness_asi.log",
    "/tmp/eth_x402_harness_asi.log",
    "/tmp/skill_installer.log",
    "/tmp/discovery_learner.log",
    "/tmp/signing_queue.log",
    "/tmp/corrections_engine.log",
    "/tmp/auto_publish_asi.log",
    "/tmp/cost_controller.log",
]

ERROR_PATTERNS = [
    (r"(\w+Error)\b", "exception"),
    (r"Exception", "exception"),
    (r"FAIL", "test_failure"),
    (r"ERROR", "error"),
    (r"Traceback", "traceback"),
    (r"timeout", "timeout"),
    (r"404", "not_found"),
    (r"500", "server_error"),
    (r"503", "service_unavailable"),
    (r"ConnectionError", "connection"),
    (r"TimeoutError", "timeout"),
    (r"ImportError", "import"),
    (r"ModuleNotFoundError", "import"),
    (r"No such file", "filesystem"),
    (r"Permission denied", "permission"),
]

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "error_counts": {}, "by_log": {}, "proposed_fixes": []}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve error analyzer: {metrics.get('total_errors', 0)} errors across {len(metrics.get('by_log', {}))} logs.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"errors-{subject.replace('/', '-').replace(':', '-').replace('.', '-')[:60]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname

def analyze():
    error_counts = Counter()
    by_log = {}
    total_errors = 0
    for log_path in LOG_PATHS:
        try:
            log_name = os.path.basename(log_path).replace(".log", "")
            if not os.path.exists(log_path):
                continue
            with open(log_path) as f:
                lines = f.readlines()[-200:]
            log_errors = Counter()
            for line in lines:
                for pattern, label in ERROR_PATTERNS:
                    if re.search(pattern, line):
                        log_errors[label] += 1
                        error_counts[label] += 1
                        total_errors += 1
                        break
            if log_errors:
                by_log[log_name] = dict(log_errors)
        except Exception:
            pass
    return total_errors, dict(error_counts), by_log

def propose_fixes(error_counts):
    fixes = []
    for label, count in error_counts.items():
        if count == 0:
            continue
        if label == "timeout":
            fixes.append("Add timeout retries with exponential backoff")
        elif label == "connection":
            fixes.append("Wrap network calls in retry decorators")
        elif label == "not_found":
            fixes.append("Add existence checks before operations")
        elif label == "import":
            fixes.append("Add skill_installer run before dependent harnesses")
        elif label == "permission":
            fixes.append("Verify file permissions in setup")
        elif label == "server_error" and count > 2:
            fixes.append("Escalate server errors to operator")
        elif label == "exception" and count > 5:
            fixes.append("Add exception logging with traceback")
    return fixes

def main():
    state = load_state()
    state["runs"] += 1
    print(f"[{NOW()}] error_analyzer starting — run #{state['runs']}")
    total, counts, by_log = analyze()
    fixes = propose_fixes(counts)
    state["error_counts"] = counts
    state["by_log"] = by_log
    state["proposed_fixes"] = fixes
    save_state(state)
    write_card(
        f"errors-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measurement.errors.analyzed",
        {
            "total_errors": total,
            "error_counts": counts,
            "by_log": by_log,
            "proposed_fixes": fixes,
            "miner_version": "asi-evolve-2",
            "note": "Cross-harness error analysis. 13 logs scanned. Auto-proposes fixes.",
        },
    )
    print(f"[{NOW()}] error_analyzer done: {total} errors, {len(fixes)} fixes proposed")
    return 0

if __name__ == "__main__":
    sys.exit(main())
