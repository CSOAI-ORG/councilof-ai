#!/usr/bin/env python3
"""Bulk publish MCP packages to PyPI, npm, and MCP registries.

Reads package lists from command line or defaults to flagship batches staged in
~/clawd/_findings/MCP_PUBLISH_BATCH_2026-06-17.md.

Usage:
    python3 bulk-publish-mcps.py --pypi --npm --registries --dry-run
    python3 bulk-publish-mcps.py --pypi --dry-run  # test PyPI builds only
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
FINDINGS = ROOT / "_findings"

# Default flagship PyPI packages
DEFAULT_PYPI_PACKAGES = [
    ROOT / "meok-annex-iii-impact-mcp",
    ROOT / "meok-eu-code-of-practice-mcp",
    ROOT / "meok-compliance-passport-mcp",
    ROOT / "meok-ai-psych-vuln-audit-mcp",
    ROOT / "openchronicle-mcp",
]

# Default npm packages (local paths)
DEFAULT_NPM_PACKAGES = [
    ROOT / "mcp-marketplace" / "agent-commerce-payments-mcp",
    ROOT / "mcp-marketplace" / "ai-self-audit-mcp",
    ROOT / "mcp-marketplace" / "agent-orchestrator-mcp",
    ROOT / "mcp-marketplace" / "agent-negotiation-mcp",
    ROOT / "mcp-marketplace" / "agent-delegation-mcp",
]

# Registry submissions (uses submit-all-mcps.py data)
REGISTRY_SCRIPT = ROOT / "submit-all-mcps.py"


def run(cmd: list[str], cwd: Path | None = None, env: dict | None = None) -> tuple[int, str]:
    merged = os.environ.copy()
    if env:
        merged.update(env)
    result = subprocess.run(cmd, cwd=cwd, env=merged, capture_output=True, text=True)
    return result.returncode, (result.stdout + result.stderr).strip()


def publish_pypi(package_dir: Path, dry_run: bool) -> dict:
    result = {"package": package_dir.name, "path": str(package_dir), "steps": []}

    if not (package_dir / "pyproject.toml").exists():
        result["status"] = "skipped"
        result["reason"] = "no pyproject.toml"
        return result

    # Clean dist
    dist = package_dir / "dist"
    if dist.exists():
        for f in dist.iterdir():
            f.unlink()

    # Build
    code, out = run([sys.executable, "-m", "build"], cwd=package_dir)
    result["steps"].append({"build": {"code": code, "output": out[-500:]}})
    if code != 0:
        result["status"] = "build_failed"
        return result

    if dry_run:
        result["status"] = "dry_run_ok"
        return result

    # Upload
    code, out = run([sys.executable, "-m", "twine", "upload", "dist/*"], cwd=package_dir)
    result["steps"].append({"upload": {"code": code, "output": out[-500:]}})
    result["status"] = "published" if code == 0 else "upload_failed"
    return result


def publish_npm(package_dir: Path, dry_run: bool) -> dict:
    result = {"package": package_dir.name, "path": str(package_dir), "steps": []}

    if not (package_dir / "package.json").exists():
        result["status"] = "skipped"
        result["reason"] = "no package.json"
        return result

    if dry_run:
        # Validate packability without network install
        code, out = run(["npm", "publish", "--dry-run", "--access", "public"], cwd=package_dir)
        result["steps"].append({"dry_run": {"code": code, "output": out[-500:]}})
        result["status"] = "dry_run_ok" if code == 0 else "dry_run_failed"
        return result

    # Live publish path: install, build (best effort), publish
    code, out = run(["npm", "install"], cwd=package_dir)
    result["steps"].append({"npm_install": {"code": code, "output": out[-300:]}})
    if code != 0:
        result["status"] = "install_failed"
        return result

    code, out = run(["npm", "run", "build"], cwd=package_dir)
    result["steps"].append({"build": {"code": code, "output": out[-300:]}})

    code, out = run(["npm", "publish", "--access", "public"], cwd=package_dir)
    result["steps"].append({"publish": {"code": code, "output": out[-500:]}})
    result["status"] = "published" if code == 0 else "publish_failed"
    return result


def submit_registries(dry_run: bool) -> dict:
    result = {"script": str(REGISTRY_SCRIPT), "status": "skipped"}
    if not REGISTRY_SCRIPT.exists():
        result["reason"] = "submit-all-mcps.py not found"
        return result

    if dry_run:
        result["status"] = "dry_run_ok"
        return result

    code, out = run([sys.executable, str(REGISTRY_SCRIPT)])
    result["code"] = code
    result["output"] = out[-1000:]
    result["status"] = "submitted" if code == 0 else "failed"
    return result


def main():
    parser = argparse.ArgumentParser(description="Bulk publish MCP packages")
    parser.add_argument("--pypi", action="store_true", help="Publish PyPI packages")
    parser.add_argument("--npm", action="store_true", help="Publish npm packages")
    parser.add_argument("--registries", action="store_true", help="Submit to MCP registries")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without publishing")
    parser.add_argument("--pypi-package", action="append", type=Path, help="Additional PyPI package dir")
    parser.add_argument("--npm-package", action="append", type=Path, help="Additional npm package dir")
    args = parser.parse_args()

    if not (args.pypi or args.npm or args.registries):
        args.pypi = args.npm = args.registries = True

    report = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dry_run": args.dry_run,
        "pypi": [],
        "npm": [],
        "registries": None,
    }

    if args.pypi:
        packages = DEFAULT_PYPI_PACKAGES + (args.pypi_package or [])
        print(f"Publishing {len(packages)} PyPI packages...")
        for pkg in packages:
            print(f"  {pkg.name} ...", end=" ", flush=True)
            res = publish_pypi(pkg, args.dry_run)
            report["pypi"].append(res)
            print(res["status"])

    if args.npm:
        packages = DEFAULT_NPM_PACKAGES + (args.npm_package or [])
        print(f"Publishing {len(packages)} npm packages...")
        for pkg in packages:
            print(f"  {pkg.name} ...", end=" ", flush=True)
            res = publish_npm(pkg, args.dry_run)
            report["npm"].append(res)
            print(res["status"])

    if args.registries:
        print("Submitting to MCP registries...")
        report["registries"] = submit_registries(args.dry_run)
        print(report["registries"]["status"])

    report_path = FINDINGS / f"MCP_PUBLISH_REPORT_{time.strftime('%Y-%m-%d')}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nReport: {report_path}")

    failed = sum(1 for r in report["pypi"] + report["npm"] if r.get("status", "").endswith("failed"))
    if failed:
        print(f"Failures: {failed}")
        sys.exit(1)


if __name__ == "__main__":
    main()
