#!/usr/bin/env python3
"""Batch-build all 488 local MCPs in the mirror.

This is the M4-lane pre-flight: prove all 488 packages can build to wheel+sdist
WITHOUT owner-keys. Once owner sets PYPI_TOKEN, `twine upload dist/*` ships them all.

Re-runnable. Outputs a per-MCP build status.
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

MARKETPLACE = Path.home() / "clawd" / "mcp-marketplace"
OUT = Path.home() / "clawd" / "BATCH_BUILD_REPORT_2026-06-27.json"
PER_MCP_TIMEOUT = 30


def build_one(slug: str, timeout: int = PER_MCP_TIMEOUT) -> dict:
    path = MARKETPLACE / slug
    if not path.is_dir():
        return {"slug": slug, "status": "missing", "wheel": False, "sdist": False, "duration_s": 0.0}
    if not (path / "pyproject.toml").is_file():
        return {"slug": slug, "status": "no-pyproject", "wheel": False, "sdist": False, "duration_s": 0.0}
    started = time.time()
    try:
        # Clean previous build artifacts
        for sub in ("dist", "build"):
            p = path / sub
            if p.exists():
                import shutil
                shutil.rmtree(p, ignore_errors=True)
        for egg in path.glob("*.egg-info"):
            if egg.is_dir():
                import shutil
                shutil.rmtree(egg, ignore_errors=True)
        # --no-isolation: skip the per-package venv. The meek-* MCPs declare
        # `requires = ["hatchling"]` but venv build isolation falls back to
        # setuptools.build_meta which isn't installed in the build env.
        # With --no-isolation we use the parent Python's packages (hatchling
        # is installed globally) and the build succeeds.
        proc = subprocess.run(
            [sys.executable, "-m", "build", "--no-isolation"],
            capture_output=True, text=True, timeout=timeout, cwd=str(path),
        )
        duration = time.time() - started
        wheel = any(path.glob("dist/*.whl"))
        sdist = any(path.glob("dist/*.tar.gz"))
        if proc.returncode == 0 and wheel and sdist:
            return {"slug": slug, "status": "pass", "wheel": True, "sdist": True, "duration_s": round(duration, 2)}
        elif proc.returncode != 0:
            return {"slug": slug, "status": "build-fail", "wheel": wheel, "sdist": sdist, "duration_s": round(duration, 2), "stderr_tail": proc.stderr[-200:]}
        else:
            return {"slug": slug, "status": "incomplete", "wheel": wheel, "sdist": sdist, "duration_s": round(duration, 2)}
    except subprocess.TimeoutExpired:
        return {"slug": slug, "status": "timeout", "wheel": False, "sdist": False, "duration_s": float(timeout)}
    except Exception as e:
        return {"slug": slug, "status": f"error:{type(e).__name__}", "wheel": False, "sdist": False, "duration_s": round(time.time() - started, 2)}


def main():
    all_slugs = sorted(d.name for d in MARKETPLACE.iterdir() if d.is_dir() and d.name.endswith("-mcp"))
    print(f"Batch build: {len(all_slugs)} MCPs", flush=True)

    results = []
    t0 = time.time()
    for i, slug in enumerate(all_slugs, 1):
        r = build_one(slug)
        results.append(r)
        if i % 25 == 0 or i == len(all_slugs):
            pass_count = sum(1 for r in results if r["status"] == "pass")
            fail_count = sum(1 for r in results if r["status"] in ("build-fail", "timeout", "error", "incomplete"))
            print(f"  ... {i}/{len(all_slugs)}  pass={pass_count}  fail={fail_count}", flush=True)

    wall = time.time() - t0
    by_status = {}
    for r in results:
        by_status.setdefault(r["status"], 0)
        by_status[r["status"]] += 1
    aggregate = {
        "census_size": len(all_slugs),
        "by_status": by_status,
        "wheels_built": sum(1 for r in results if r["wheel"]),
        "sdists_built": sum(1 for r in results if r["sdist"]),
        "wall_clock_s": round(wall, 1),
        "honesty_note": "Batch build of all *-mcp in the local mirror via `python -m build`. No PYPI_TOKEN needed. Pre-flight for the owner-gated `twine upload` step.",
    }
    out = {"aggregate": aggregate, "results": results}
    OUT.write_text(json.dumps(out, indent=2))
    print()
    print("=== BATCH BUILD AGGREGATE ===")
    for k, v in aggregate.items():
        if k != "results":
            print(f"  {k}: {v}")
    fails = [r for r in results if r["status"] in ("build-fail", "timeout", "error", "incomplete")]
    if fails:
        print()
        print(f"=== {len(fails)} NOT-PASSING MCPs ===")
        for r in fails[:30]:
            print(f"  {r['slug']:45s} {r['status']:12s} dur={r.get('duration_s', 0):.1f}s")
    print(f"\nWrote: {OUT}")


if __name__ == "__main__":
    main()
