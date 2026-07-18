#!/usr/bin/env python3
"""Sync critical env vars to Vercel projects.

Works around `vercel projects list` returning zero by iterating known project dirs.

Usage:
    python3 scripts/sync-vercel-env.py --dry-run
    python3 scripts/sync-vercel-env.py
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
ENV_FILE = ROOT / ".env.local"

# project_dir -> list of env var names
TARGETS = {
    "csoai-org-v2": [
        "MEOK_MASTER_API_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "RESEND_API_KEY",
        "CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
    ],
    "meok": [
        "MEOK_MASTER_API_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "RESEND_API_KEY",
        "CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
    ],
    "meok-attestation-api": [
        "MEOK_MASTER_API_KEY",
        "STRIPE_WEBHOOK_SECRET",
    ],
    "cobolbridge-deploy": [
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_COBOl_BRIDGE_PRICE_ID",
    ],
}


def load_env() -> dict:
    env = dict(os.environ)
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                env.setdefault(k, v)
    return env


def set_env(project_dir: Path, name: str, value: str, dry_run: bool) -> dict:
    cmd = ["vercel", "env", "add", name, "production", "--yes"]
    if dry_run:
        return {"project": project_dir.name, "var": name, "action": "dry_run", "ok": True}
    try:
        proc = subprocess.run(
            cmd,
            cwd=project_dir,
            input=f"{value}\n",
            text=True,
            capture_output=True,
            timeout=60,
        )
        ok = proc.returncode == 0 or "already exists" in proc.stderr.lower()
        return {
            "project": project_dir.name,
            "var": name,
            "action": "set",
            "ok": ok,
            "stdout": proc.stdout[-200:] if proc.stdout else "",
            "stderr": proc.stderr[-200:] if proc.stderr else "",
        }
    except Exception as e:
        return {"project": project_dir.name, "var": name, "action": "set", "ok": False, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Sync env vars to Vercel projects")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be synced")
    args = parser.parse_args()

    env = load_env()
    results = []

    print("=" * 60)
    print("Vercel Env Sync")
    print("=" * 60)
    print(f"Dry run: {args.dry_run}\n")

    for project_name, var_names in TARGETS.items():
        project_dir = ROOT / project_name
        if not (project_dir / ".vercel" / "project.json").exists():
            print(f"⚠️  {project_name}: not a linked Vercel project, skipping")
            continue

        print(f"\n📦 {project_name}")
        for name in var_names:
            value = env.get(name)
            if not value:
                print(f"   ❌ {name}: not set in env")
                results.append({"project": project_name, "var": name, "ok": False, "error": "not set"})
                continue
            if args.dry_run:
                print(f"   ⏳ {name}: would set ({value[:4]}...)")
            else:
                print(f"   🔧 {name}: setting...")
            res = set_env(project_dir, name, value, args.dry_run)
            results.append(res)
            if args.dry_run:
                continue
            if res["ok"]:
                print(f"   ✅ {name}: ok")
            else:
                print(f"   ⚠️  {name}: {res.get('stderr', res.get('error', 'failed'))}")

    ok = sum(1 for r in results if r.get("ok"))
    total = len(results)
    print(f"\nDone — {ok}/{total} operations successful")


if __name__ == "__main__":
    main()
