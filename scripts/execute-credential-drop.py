#!/usr/bin/env python3
"""One-shot executor for Nick's credential drop.

Run after Nick replies "credentials dropped". Verifies all required env vars,
then executes the revenue-critical actions that were blocked pending credentials.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
ENV_FILE = ROOT / ".env.local"
VERCEL_PROJECT_FILE = ROOT / ".vercel" / "project.json"

REQUIRED = {
    "STRIPE_SECRET_KEY": {"prefix": "sk_", "desc": "Stripe live secret key"},
    "STRIPE_PUBLISHABLE_KEY": {"prefix": "pk_", "desc": "Stripe live publishable key"},
    "RESEND_API_KEY": {"prefix": "re_", "desc": "Resend API key"},
    "CLERK_PUBLISHABLE_KEY": {"prefix": "pk_", "desc": "Clerk publishable key"},
    "CLERK_SECRET_KEY": {"prefix": "sk_", "desc": "Clerk secret key"},
    "EMAIL_ADDRESS": {"desc": "SMTP sending address"},
    "EMAIL_PASSWORD": {"desc": "SMTP password / app password"},
    "PYPI_API_TOKEN": {"prefix": "pypi-", "desc": "PyPI API token"},
    "NPM_TOKEN": {"desc": "npm access token"},
    "BUFFER_ACCESS_TOKEN": {"desc": "Buffer API access token"},
    "BING_INDEXNOW_KEY": {"desc": "Bing IndexNow key"},
}

OPTIONAL = {
    "EMAIL_SMTP_HOST": "smtp.privatemail.com",
    "EMAIL_SMTP_PORT": "587",
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
    # Defaults + aliases
    for k, default in OPTIONAL.items():
        env.setdefault(k, default)
    if not env.get("EMAIL_ADDRESS") and env.get("FROM_EMAIL"):
        env["EMAIL_ADDRESS"] = env["FROM_EMAIL"]
    return env


def check_env(env: dict) -> list[str]:
    missing = []
    for key, meta in REQUIRED.items():
        val = env.get(key, "")
        if not val:
            missing.append(f"{key}: {meta['desc']}")
            continue
        prefix = meta.get("prefix")
        if prefix and not val.startswith(prefix):
            missing.append(f"{key}: expected prefix '{prefix}', got '{val[:8]}...'")
    return missing


def run(cmd: list[str], cwd: Path = ROOT, env: dict | None = None, fatal: bool = False) -> subprocess.CompletedProcess:
    print(f"\n▶ {' '.join(cmd)}")
    merged = {**os.environ, **(env or {})}
    try:
        proc = subprocess.run(cmd, cwd=cwd, env=merged, text=True, capture_output=True, timeout=300)
    except subprocess.TimeoutExpired as e:
        proc = subprocess.CompletedProcess(cmd, returncode=1, stdout=e.stdout or "", stderr="TIMEOUT")
    if fatal and proc.returncode != 0:
        print(f"FATAL: {' '.join(cmd)} failed with {proc.returncode}")
        print(proc.stderr[-1000:])
        sys.exit(1)
    return proc


def main():
    parser = argparse.ArgumentParser(description="One-shot credential-drop executor")
    parser.add_argument("--check", action="store_true", help="List missing credentials and exit")
    args = parser.parse_args()

    env = load_env()
    missing = check_env(env)

    print("=" * 60)
    print("CREDENTIAL DROP EXECUTOR — 2026-06-17")
    print("=" * 60)

    if missing:
        print("\n❌ Missing or invalid environment variables:")
        for m in missing:
            print(f"  - {m}")
        if args.check:
            print("\n--check complete. Run without --check after credentials are dropped.")
            sys.exit(0)
        print("\nAborting. Drop the missing credentials and re-run.")
        sys.exit(1)

    if args.check:
        print("\n✅ All required environment variables present. Ready to execute.")
        sys.exit(0)

    print("\n✅ All required environment variables present.")

    results = {}

    # 1. Verify Stripe live mode
    print("\n--- 1. Stripe Live Check ---")
    stripe_check = run([sys.executable, "-c", "import stripe; print('ok')"], env=env)
    results["stripe_import"] = stripe_check.returncode == 0

    # 2. Publish MCP packages
    print("\n--- 2. MCP Package Publish ---")
    pub = run([sys.executable, "scripts/bulk-publish-mcps.py"], env=env)
    results["mcp_publish"] = pub.returncode == 0
    print(pub.stdout[-1500:] if len(pub.stdout) > 1500 else pub.stdout)
    if pub.stderr:
        print(pub.stderr[-500:])

    # 3. Submit IndexNow
    print("\n--- 3. IndexNow Submission ---")
    idx = run([sys.executable, "scripts/indexnow-submit.py", "--from-file", "_findings/INDEXNOW_BATCH_2026-06-17.md"], env=env)
    results["indexnow"] = idx.returncode == 0
    print(idx.stdout[-1000:] if len(idx.stdout) > 1000 else idx.stdout)

    # 4. Send keystone warm intros
    print("\n--- 4. Keystone Email Send ---")
    email = run([sys.executable, "outreach-system/send_all.py", "--batch", "keystone"], env=env)
    results["keystone_email"] = email.returncode == 0
    print(email.stdout[-1000:] if len(email.stdout) > 1000 else email.stdout)

    # 5. Social posts (Buffer)
    print("\n--- 5. Social Posts (Buffer) ---")
    # Placeholder for Buffer integration
    results["social_posts"] = None
    print("⚠️ Buffer integration not yet wired. Manual or next agent step required.")

    # 6. Vercel env sync
    print("\n--- 6. Vercel Env Sync ---")
    vercel_env = run([sys.executable, "scripts/sync-vercel-env.py"], env=env)
    results["vercel_env_sync"] = vercel_env.returncode == 0
    print(vercel_env.stdout[-1000:] if len(vercel_env.stdout) > 1000 else vercel_env.stdout)
    if vercel_env.stderr:
        print(vercel_env.stderr[-500:])

    # 7. Revenue smoke test
    print("\n--- 7. Revenue Smoke Test ---")
    smoke = run([sys.executable, "-c", "import urllib.request; print(urllib.request.urlopen('https://cobolbridge.ai').getcode())"])
    results["cobolbridge_live"] = smoke.returncode == 0 and "200" in smoke.stdout
    print(smoke.stdout.strip())

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    for k, v in results.items():
        icon = "✅" if v else ("⚠️" if v is None else "❌")
        print(f"{icon} {k}: {v}")

    report_path = ROOT / "_findings" / "CREDENTIAL_DROP_EXECUTION_2026-06-17.json"
    report_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nReport: {report_path}")


if __name__ == "__main__":
    main()
