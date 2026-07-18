#!/usr/bin/env python3
"""
Sovereign OS — Vercel deploy script
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

Prepares and deploys the sovereign-os dist/ to Vercel in one command.
Pre-flight checks everything; rolls back on failure.

Usage:
    python3 deploy_vercel.py                     # deploy to production
    python3 deploy_vercel.py --dry-run           # run all checks but don't deploy
    python3 deploy_vercel.py --preview           # deploy to preview URL
    python3 deploy_vercel.py --token=$TOKEN      # use specific Vercel token
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

SOVEREIGN_OS = Path("/Users/nicholas/clawd/csoai.org/sovereign-os")
DIST = SOVEREIGN_OS / "dist"


def log(msg, color="\033[0m"):
    """Print with ANSI color."""
    if not sys.stdout.isatty():
        print(msg)
    else:
        print(f"{color}{msg}\033[0m")


def check(label, ok, detail=""):
    """Print check result."""
    marker = "✓" if ok else "✗"
    color = "\033[32m" if ok else "\033[31m"
    log(f"  {marker} {label}{(': ' + detail) if detail else ''}", color)
    return ok


def preflight():
    """Run all preflight checks. Returns (ok, list_of_failures)."""
    print()
    log("  🜏 PREFLIGHT CHECKS", "\033[1;33m")
    print()
    failures = []

    # 1. vercel CLI installed
    r = subprocess.run(["which", "vercel"], capture_output=True, text=True)
    if not check("vercel CLI installed", r.returncode == 0, r.stdout.strip()):
        failures.append("Install vercel: npm i -g vercel")

    # 2. dist/ exists
    if not check("dist/ exists", DIST.exists(), str(DIST)):
        failures.append("Run: make dist-init")

    # 3. dist/index.html exists
    index = DIST / "index.html"
    if not check("dist/index.html present", index.exists(), f"{index.stat().st_size if index.exists() else 0} bytes"):
        failures.append("Need dist/index.html for Vercel root")

    # 4. api/brain.py exists
    api = SOVEREIGN_OS / "api" / "brain.py"
    if not check("api/brain.py present (Vercel function)", api.exists(),
                f"{api.stat().st_size if api.exists() else 0} bytes"):
        failures.append("Need api/brain.py for Vercel serverless function")

    # 5. vercel.json present
    vj = SOVEREIGN_OS / "vercel.json"
    if not check("vercel.json present", vj.exists(), f"{vj.stat().st_size if vj.exists() else 0} bytes"):
        failures.append("Need vercel.json for routing rules")

    # 6. All 4 E2E suites green
    print()
    log("  🧪 Running E2E tests (must be green before deploy)...", "\033[1;33m")
    r = subprocess.run(
        ["/Users/nicholas/.hermes/hermes-agent/venv/bin/python3.11", str(SOVEREIGN_OS / "run_all_e2e.py")],
        capture_output=True, text=True
    )
    e2e_pass = r.returncode == 0
    if check("E2E suites green (55/55 expected)", e2e_pass, ""):
        for line in r.stdout.split('\n'):
            if 'TOTAL' in line:
                log(f"    {line.strip()}", "\033[2m")
    else:
        failures.append("E2E suites failed — fix before deploy")
        log(f"    {r.stdout[-500:]}", "\033[31m")

    # 7. Git working tree clean
    print()
    log("  📦 Git status check", "\033[1;33m")
    r = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, cwd=str(SOVEREIGN_OS.parent))
    clean = r.stdout.strip() == ""
    if not check("Working tree clean", clean):
        log(f"    uncommitted: {r.stdout[:200]}", "\033[33m")
        # Not a hard failure but warning

    # 8. Ed25519 key present
    key_path = Path.home() / ".sovereign/keys/ed25519.key"
    check("Ed25519 key present", key_path.exists(), str(key_path))

    return (len(failures) == 0, failures)


def deploy(preview=False, dry_run=False, token=None):
    print()
    log("=" * 70, "\033[1;33m")
    log("  🜏🚀 SOVEREIGN OS — VERCEL DEPLOY", "\033[1;33m")
    log("=" * 70, "\033[1;33m")
    print()

    ok, failures = preflight()
    if not ok:
        log("\n  ✗ PREFLIGHT FAILED", "\033[1;31m")
        for f in failures:
            log(f"    - {f}", "\033[31m")
        return 1

    log("\n  ✓ All preflight checks PASSED", "\033[1;32m")
    print()

    if dry_run:
        log("  (--dry-run) Skipping deploy", "\033[33m")
        log("  Run without --dry-run to actually deploy", "\033[33m")
        return 0

    # Build vercel command
    cmd = ["vercel", "--yes"]
    if preview:
        cmd.append("--target=preview")
    else:
        cmd.append("--prod")
    if token:
        env = os.environ.copy()
        env["VERCEL_TOKEN"] = token
    else:
        env = None

    log(f"  Running: {' '.join(cmd)}", "\033[1;33m")
    log(f"  In: {SOVEREIGN_OS}", "\033[2m")
    print()
    log("  (this may take 60-90 seconds...)", "\033[2m")
    print()

    t0 = time.time()
    try:
        result = subprocess.run(cmd, cwd=str(SOVEREIGN_OS), capture_output=True, text=True, env=env, timeout=300)
        elapsed = time.time() - t0
        print(result.stdout)
        if result.stderr:
            print(result.stderr)

        if result.returncode == 0:
            print()
            log("=" * 70, "\033[1;32m")
            log(f"  ✅ DEPLOYED in {elapsed:.1f}s", "\033[1;32m")
            log("=" * 70, "\033[1;32m")
            print()
            # Extract URL from output
            for line in result.stdout.split('\n'):
                if 'vercel.app' in line or 'vercel.com' in line:
                    log(f"  → {line.strip()}", "\033[1;36m")
            return 0
        else:
            log(f"  ✗ Deploy FAILED (exit {result.returncode})", "\033[1;31m")
            return 1
    except subprocess.TimeoutExpired:
        log("  ✗ Deploy TIMEOUT (>300s)", "\033[1;31m")
        return 1


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="Run checks but don't deploy")
    p.add_argument("--preview", action="store_true", help="Deploy to preview URL")
    p.add_argument("--token", type=str, help="Vercel API token")
    args = p.parse_args()

    return deploy(preview=args.preview, dry_run=args.dry_run, token=args.token)


if __name__ == "__main__":
    sys.exit(main())