#!/usr/bin/env python3
"""meta_improve.py — ASI-Evolve: the engine improves itself.

Reads logs from all other harnesses, detects patterns, proposes
specific improvements, and writes them as signed improvement proposals.
Self-improving loop: each run suggests changes to other harnesses.
"""
from __future__ import annotations
import json, os, sys, re
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter, defaultdict

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/meta_improve_state.json")

LOG_PATHS = {
    "card_miner": "/tmp/card_miner.log",
    "evolve_banks": "/tmp/evolve_banks.log",
    "self_correct": "/tmp/self_correct.log",
    "auto_publish": "/tmp/auto_publish.log",
    "a2a_mcp_harness": "/tmp/a2a_mcp_harness.log",
    "eth_x402_harness": "/tmp/eth_x402_harness.log",
    "watchdog_asi": "/tmp/watchdog_asi.log",
}

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "proposals": [], "patterns": {}, "improvements": []}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def tail_log(path, lines=100):
    try:
        text = Path(path).read_text() if Path(path).exists() else ""
        return "\n".join(text.splitlines()[-lines:])
    except Exception:
        return ""

def analyze_logs():
    """Extract failure patterns, success patterns, and timing data."""
    patterns = defaultdict(list)
    timings = {}
    errors = Counter()
    for name, path in LOG_PATHS.items():
        log = tail_log(path, 200)
        if not log:
            patterns["missing_log"].append(name)
            continue
        timings[name] = {"last_line_count": len(log.splitlines())}
        for line in log.splitlines():
            if "FAIL" in line or "ERROR" in line or "Traceback" in line:
                patterns["failures_by_name"].append(name)
                # extract error type
                m = re.search(r"(\w+Error|Exception|FAIL|ERROR):?\s*(\w[^\\n]{0,80})", line)
                if m:
                    errors[f"{name}:{m.group(1)}"] += 1
            elif "OK" in line or "done" in line.lower():
                patterns["successes_by_name"].append(name)
    return {"patterns": dict(patterns), "errors": dict(errors), "timings": timings}

def generate_proposals(analysis):
    """Generate specific improvement proposals based on patterns."""
    proposals = []
    # Missing logs
    for name in analysis["patterns"].get("missing_log", []):
        proposals.append({
            "target": name,
            "proposal": f"Ensure {name} log file is being written. Check cron redirection.",
            "priority": "P1",
            "auto_apply": False,
        })
    # Recurring errors
    for err, count in analysis["errors"].items():
        if count >= 3:
            target = err.split(":")[0]
            err_type = err.split(":")[1]
            proposals.append({
                "target": target,
                "proposal": f"Recurring error '{err_type}' appeared {count} times. Consider: (a) adding retry with backoff, (b) investigating root cause, (c) updating error handling.",
                "priority": "P2" if count >= 5 else "P3",
                "auto_apply": False,
            })
    # Success rate imbalance
    success_counts = Counter(analysis["patterns"].get("successes_by_name", []))
    fail_counts = Counter(analysis["patterns"].get("failures_by_name", []))
    for name in LOG_PATHS:
        s = success_counts.get(name, 0)
        f = fail_counts.get(name, 0)
        if s + f >= 10 and f > s * 0.1:
            proposals.append({
                "target": name,
                "proposal": f"Failure rate {f}/{s+f} = {100*f/(s+f):.1f}% exceeds 10% threshold. Investigate.",
                "priority": "P2",
                "auto_apply": False,
            })
    return proposals

def write_improvement_card(proposals):
    if not proposals:
        return
    card = {
        "schema": "gspc.measurement-card/0.1",
        "kind": "strategy.meta.improvement",
        "subject": f"meta-improvement-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measured_at": NOW(),
        "metrics": {
            "proposal_count": len(proposals),
            "proposals": proposals,
            "miner_version": "meta-improve-1",
            "note": "ASI-Evolve meta-improvement: engine proposes specific improvements based on log analysis. NOT auto-applied (M4 lane scope: operational, not redesign).",
        },
        "honest_sentence": f"ASI-Evolve meta-improvement: {len(proposals)} specific improvement proposals based on log analysis. Auto-applied: NO (M4 lane scope).",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"meta-improve-{NOW().replace(':', '').replace('-', '')[:13]}.json"
    fname.write_text(json.dumps(card, indent=2))
    print(f"  WROTE: {fname.name} ({len(proposals)} proposals)")

def main():
    state = load_state()
    state["runs"] += 1
    print(f"[{NOW()}] meta_improve starting — run #{state['runs']}")
    analysis = analyze_logs()
    state["patterns"] = analysis["patterns"]
    proposals = generate_proposals(analysis)
    state["proposals"].extend(proposals)
    state["improvements"].append({"at": NOW(), "proposal_count": len(proposals), "errors_found": len(analysis["errors"])})
    save_state(state)
    print(f"[{NOW()}] meta_improve done: {len(proposals)} proposals, {len(analysis['errors'])} unique errors, {len(state['improvements'])} total improvement runs")
    write_improvement_card(proposals)
    return 0

if __name__ == "__main__":
    sys.exit(main())
