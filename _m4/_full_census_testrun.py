#!/usr/bin/env python3
"""Full census pytest run across ALL *-mcp in the local mcp-marketplace mirror.

Phase 6 of the autonomous work-ahead plan. Re-runnable:
  cd ~/clawd && python3 _m4/_full_census_testrun.py
"""
import json
import subprocess
import sys
import time
from pathlib import Path

MARKETPLACE = Path.home() / "clawd" / "mcp-marketplace"
OUT = Path.home() / "clawd" / "DEPTH_AUDIT_FULL_CENSUS_2026-06-27.json"
PER_MCP_TIMEOUT = 20  # seconds
MAX_PARALLEL = 8


def find_test_target(slug_path: Path) -> tuple[list[str], str]:
    """Return (argv-suffix to pass to pytest, label) for an MCP dir."""
    tests_dir = slug_path / "tests"
    if tests_dir.is_dir() and (any(tests_dir.glob("test_*.py")) or any(tests_dir.glob("*_test.py"))):
        return ["tests/"], "tests/"
    roots = list(slug_path.glob("test_*.py")) + list(slug_path.glob("*_test.py"))
    if roots:
        return [r.name for r in roots], "root"
    for sub in slug_path.iterdir():
        if sub.is_dir() and sub.name not in {"__pycache__", "node_modules", ".git", ".venv", "venv", "dist", "build", ".eggs"}:
            for cand in sub.glob("test_*.py"):
                return [str(cand.relative_to(slug_path))], f"{sub.name}/"
    return [], "no-tests"


def run_one(slug: str, timeout: int = PER_MCP_TIMEOUT) -> dict:
    path = MARKETPLACE / slug
    if not path.is_dir():
        return {"slug": slug, "status": "missing", "tests": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0, "duration_s": 0.0, "label": ""}
    targets, label = find_test_target(path)
    if not targets:
        return {"slug": slug, "status": "no-tests", "tests": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0, "duration_s": 0.0, "label": label}
    started = time.time()
    try:
        # Use a fresh env for each subprocess to prevent env-var leakage
        # between MCPs (this was the source of the oscal-generator test-pollution
        # in census v2 — passing the parent's env leaked MEOK_API_KEY etc. into
        # later subprocesses). We keep PATH, HOME, LANG, LC_ALL so the subprocess
        # can find binaries and the user's locale, but reset the rest.
        import os
        clean_env = {k: v for k, v in os.environ.items() if k in ("PATH", "HOME", "LANG", "LC_ALL", "USER", "SHELL", "TMPDIR")}
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "--tb=line", "-q", "--no-header",
             "-p", "no:cacheprovider",
             *[str(path / t) for t in targets]],
            capture_output=True, text=True, timeout=timeout, cwd=str(path),
            env=clean_env,
        )
        duration = time.time() - started
        out = (proc.stdout or "") + "\n" + (proc.stderr or "")
        summary_line = ""
        for src in [proc.stdout or "", proc.stderr or ""]:
            for line in src.splitlines()[::-1]:
                if " in " in line and ("passed" in line or "failed" in line or "error" in line):
                    if "%]" in line:
                        continue
                    summary_line = line.strip()
                    break
            if summary_line:
                break
        import re
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
            "duration_s": round(duration, 2), "label": label, "summary": summary_line,
        }
    except subprocess.TimeoutExpired:
        return {"slug": slug, "status": "timeout", "tests": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0, "duration_s": float(timeout), "label": label}
    except Exception as e:
        return {"slug": slug, "status": f"error:{type(e).__name__}", "tests": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0, "duration_s": round(time.time() - started, 2), "label": label}


def main():
    # Get the full list of *-mcp dirs
    all_slugs = sorted(d.name for d in MARKETPLACE.iterdir() if d.is_dir() and d.name.endswith("-mcp"))
    print(f"Full census: {len(all_slugs)} MCPs", flush=True)

    results = []
    t0 = time.time()
    fail_count = 0
    for i, slug in enumerate(all_slugs, 1):
        r = run_one(slug)
        results.append(r)
        if r["status"] == "fail":
            fail_count += 1
        if i % 25 == 0 or i == len(all_slugs):
            print(f"  ... {i}/{len(all_slugs)} done ({fail_count} fails so far)", flush=True)

    wall = time.time() - t0
    by_status = {}
    for r in results:
        by_status.setdefault(r["status"], 0)
        by_status[r["status"]] += 1
    aggregate = {
        "census_size": len(all_slugs),
        "by_status": by_status,
        "total_tests_collected": sum(r["tests"] for r in results),
        "total_passed": sum(r["passed"] for r in results),
        "total_failed": sum(r["failed"] for r in results),
        "total_errors": sum(r["errors"] for r in results),
        "total_skipped": sum(r["skipped"] for r in results),
        "wall_clock_s": round(wall, 1),
        "honesty_note": f"Full census of the local mcp-marketplace mirror ({len(all_slugs)} MCPs). Each MCP tested with 20s timeout, sequential. Pass rate is computed only on MCPs that have actual tests (not file-presence).",
    }
    out = {"aggregate": aggregate, "results": results}
    OUT.write_text(json.dumps(out, indent=2))

    # Print summary
    print()
    print("=== FULL CENSUS AGGREGATE ===")
    for k, v in aggregate.items():
        if k != "results":
            print(f"  {k}: {v}")
    if aggregate["total_tests_collected"] > 0:
        pr = 100 * aggregate["total_passed"] / aggregate["total_tests_collected"]
        print(f"  pass_rate: {pr:.1f}%")
    # Show failing MCPs
    fails = [r for r in results if r["status"] == "fail"]
    if fails:
        print()
        print(f"=== {len(fails)} FAILING MCPs ===")
        for r in fails:
            print(f"  {r['slug']:45s} pass={r['passed']:3d} fail={r['failed']:3d} dur={r['duration_s']:.1f}s")
    print(f"\nWrote: {OUT}")


if __name__ == "__main__":
    main()
