#!/usr/bin/env python3
"""Run pytest across a curated high-value MCP sample and capture per-MCP pass/fail counts.

Phase A.2 of the autonomous work-ahead plan (CSOAI-ORG, 2026-06-26).

Key fixes vs the first run:
- Pass the tests/ subdir explicitly (or any test file we find), not the package root —
  this is what fixes the 0-tests-collected bug.
- Use --co -q first to discover test count, then run with timeout per file.
- Distinguish "no tests" (exit 5) from "pass" (exit 0 with collected tests).
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

MARKETPLACE = Path.home() / "clawd" / "mcp-marketplace"
SAMPLE = [
    # A2A substrate (20)
    "agent-orchestrator-mcp", "agent-identity-trust-mcp", "agent-x402-paywall-mcp",
    "agent-prompt-injection-firewall-mcp", "agent-policy-enforcement-mcp",
    "agent-incident-relay-mcp", "agent-handoff-certified-mcp", "agent-audit-logger-mcp",
    "agent-rate-limiter-mcp", "agent-mcp-router-mcp", "agent-data-residency-mcp",
    "agent-cost-allocator-mcp", "agent-token-budget-mcp", "agent-content-watermark-mcp",
    "agent-replay-debugger-mcp", "agent-delegation-mcp", "agent-negotiation-mcp",
    "agent-incident-reporter-mcp", "bft-progress-council-mcp",
    "agent-commerce-protocol-mcp",
    # Reg MCPs (article-level depth)
    "eu-ai-act-compliance-mcp", "meok-eu-ai-act-art-26-fria-mcp",
    "meok-eu-ai-act-art-13-ifu-mcp", "meok-cra-annex-iv-classifier-mcp",
    "meok-cra-art14-reporter-mcp", "meok-dora-tlpt-planner-mcp",
    "meok-nis2-de-register-mcp", "meok-nis2-nl-register-mcp", "basel-ai-overlay-mcp",
    "mifid-ii-ai-mcp", "aml-ai-mcp", "dora-nis2-crosswalk-mcp", "dora-compliance-mcp",
    "nis2-compliance-mcp", "gdpr-compliance-ai-mcp", "iso-42001-ai-mcp",
    "hipaa-compliance-mcp", "soc2-compliance-ai-mcp", "pci-dss-mcp", "nist-rmf-ai-mcp",
    "coppa-ferpa-mcp", "owasp-agentic-mcp", "meok-governance-engine-mcp",
    "csoai-governance-crosswalk-mcp", "risk-assessment-mcp", "healthcare-ai-governance-mcp",
    # Crypto / attestation / signing backbone
    "compliance-passport-mcp", "oscal-generator-mcp", "ai-bom-mcp", "bias-detection-mcp",
    "c2pa-watermark-mcp", "meok-coinbase-x402-receipt-mcp", "firmware-attestation-mcp",
    "blockchain-verification-mcp", "blockchain-ai-mcp",
    # Bridges
    "cobol-bridge-mcp", "as400-bridge-mcp", "cics-bridge-mcp", "acord-bridge-mcp",
    "a2a-governance-bridge-mcp", "meok-abci-bridge-mcp", "meok-haulage-governance-bridge-mcp",
    # Top by tool count
    "budget-planner-ai-mcp", "churn-predictor-ai-mcp", "competitor-monitor-ai-mcp",
    "content-calendar-ai-mcp", "care-membrane-mcp",
]


def find_test_target(slug_path: Path) -> tuple[list[str], str]:
    """Return (argv-suffix to pass to pytest, label) for an MCP dir.

    Returns ([], 'no-tests') if we can't find any test file/dir.
    """
    # 1. tests/ subdir
    tests_dir = slug_path / "tests"
    if tests_dir.is_dir() and any(tests_dir.glob("test_*.py")) or any(tests_dir.glob("*_test.py")):
        return ["tests/"], "tests/"
    # 2. test_*.py at root
    roots = list(slug_path.glob("test_*.py")) + list(slug_path.glob("*_test.py"))
    if roots:
        return [r.name for r in roots], "root"
    # 3. any pytest.ini + tests in deeper subdirs (one level)
    for sub in slug_path.iterdir():
        if sub.is_dir() and sub.name not in {"__pycache__", "node_modules", ".git", ".venv", "venv"}:
            for cand in sub.glob("test_*.py"):
                return [str(cand.relative_to(slug_path))], f"{sub.name}/"
    return [], "no-tests"


def run_one(slug: str, timeout: int = 30) -> dict:
    path = MARKETPLACE / slug
    if not path.is_dir():
        return {"slug": slug, "status": "missing", "tests": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0, "duration_s": 0.0}
    targets, label = find_test_target(path)
    if not targets:
        return {"slug": slug, "status": "no-tests", "tests": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0, "duration_s": 0.0}

    started = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "--tb=line", "-q", "--no-header",
             "-p", "no:cacheprovider",
             *[str(path / t) for t in targets]],
            capture_output=True, text=True, timeout=timeout, cwd=str(path),
        )
        duration = time.time() - started
        out = (proc.stdout or "") + "\n" + (proc.stderr or "")
        # Find the summary line — pytest may print "=== 4 passed, 1 skipped in 0.21s ===" (default)
        # or "4 passed, 1 skipped in 0.21s" (-q --no-header). Look in stderr first (pytest -q puts summary there),
        # then stdout. Match the LAST line containing "passed"/"failed" + " in ".
        summary_line = ""
        for src in [proc.stdout or "", proc.stderr or ""]:
            for line in src.splitlines()[::-1]:
                if " in " in line and ("passed" in line or "failed" in line or "error" in line):
                    # Skip pytest's progress lines like "....s   [100%]"
                    if "%]" in line:
                        continue
                    # Skip pytest's "=...=" decorations only if they're not the summary
                    summary_line = line.strip()
                    break
            if summary_line:
                break
        m_p = re.search(r"(\d+)\s+passed", summary_line)
        m_f = re.search(r"(\d+)\s+failed", summary_line)
        m_e = re.search(r"(\d+)\s+error", summary_line)
        m_s = re.search(r"(\d+)\s+skipped", summary_line)
        passed = int(m_p.group(1)) if m_p else 0
        failed = int(m_f.group(1)) if m_f else 0
        errors = int(m_e.group(1)) if m_e else 0
        skipped = int(m_s.group(1)) if m_s else 0
        total = passed + failed + errors + skipped
        if total == 0:
            status = "no-tests"
        elif proc.returncode == 0 and failed == 0 and errors == 0:
            status = "pass"
        else:
            status = "fail"
        return {
            "slug": slug, "status": status, "tests": total,
            "passed": passed, "failed": failed, "errors": errors, "skipped": skipped,
            "duration_s": round(duration, 2), "label": label, "summary": summary_line.strip(),
        }
    except subprocess.TimeoutExpired:
        return {"slug": slug, "status": "timeout", "tests": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0, "duration_s": float(timeout), "label": label}
    except Exception as e:
        return {"slug": slug, "status": f"error:{type(e).__name__}", "tests": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0, "duration_s": round(time.time() - started, 2), "label": label}


def main():
    results = []
    t0 = time.time()
    for slug in SAMPLE:
        r = run_one(slug)
        results.append(r)
        flag = {"pass": "✓", "fail": "✗", "no-tests": "·", "timeout": "⏱", "missing": "?"}.get(r["status"], "!")
        print(f"  {flag} {r['slug']:42s} {r['status']:9s} pass={r['passed']:3d} fail={r['failed']:3d} err={r['errors']:3d} skip={r.get('skipped',0):3d} t={r['tests']:3d} dur={r['duration_s']:5.1f}s {r.get('label','')}", flush=True)
    total_duration = time.time() - t0
    by_status = {}
    for r in results:
        by_status.setdefault(r["status"], 0)
        by_status[r["status"]] += 1
    aggregate = {
        "sample_size": len(results),
        "by_status": by_status,
        "total_tests_collected": sum(r["tests"] for r in results),
        "total_passed": sum(r["passed"] for r in results),
        "total_failed": sum(r["failed"] for r in results),
        "total_errors": sum(r["errors"] for r in results),
        "total_skipped": sum(r.get("skipped", 0) for r in results),
        "wall_clock_s": round(total_duration, 1),
        "honesty_note": "Sample = 67 high-value MCPs (A2A substrate + reg MCPs + signing backbone + bridges + top by tool count). NOT all 369. Sourced from mcp-marketplace local clone. The earlier 'tests = file present' claim is now upgraded to 'tests collected + pass rate' on this sample.",
    }
    out = {"aggregate": aggregate, "results": results}
    out_path = MARKETPLACE.parent / "DEPTH_AUDIT_TESTRUN_2026-06-26.json"
    out_path.write_text(json.dumps(out, indent=2))
    print("\n--- AGGREGATE ---")
    print(json.dumps(aggregate, indent=2))
    print(f"\nWrote: {out_path}")


if __name__ == "__main__":
    main()
