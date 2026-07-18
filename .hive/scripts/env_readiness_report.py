#!/usr/bin/env python3
"""env_readiness_report.py — consolidated readiness report for revenue-critical env vars.

Checks .env files, shell environment, and Vercel-linked status for the keys that
unblock revenue (MEOK_MASTER_API_KEY, STRIPE keys, SMTP, etc.).
"""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
REPORT = ROOT / ".hive" / "logs" / "env_readiness_report.json"


def load_config() -> dict[str, Any]:
    try:
        return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}

REQUIRED = [
    {"key": "MEOK_MASTER_API_KEY", "blocks": "Stripe checkout, Pro keystone, 4 paywalled MCPs, attestation Pro tier", "sensitive": True},
    {"key": "STRIPE_PUBLISHABLE_KEY", "blocks": "Frontend Stripe checkout", "sensitive": True},
    {"key": "STRIPE_SECRET_KEY", "blocks": "Backend Stripe API calls", "sensitive": True},
    {"key": "STRIPE_WEBHOOK_SECRET", "blocks": "Stripe webhook verification", "sensitive": True},
    {"key": "OPENAI_API_KEY", "blocks": "OpenAI model calls", "sensitive": True},
    {"key": "ANTHROPIC_API_KEY", "blocks": "Anthropic model calls", "sensitive": True},
    {"key": "SMTP_HOST", "blocks": "Email notifications", "sensitive": False},
    {"key": "SMTP_USER", "blocks": "Email sender identity", "sensitive": False},
    {"key": "SMTP_PASSWORD", "blocks": "Email authentication", "sensitive": True},
    {"key": "FROM_EMAIL", "blocks": "Email from address", "sensitive": False},
    {"key": "BUFFER_ACCESS_TOKEN", "blocks": "Automated social publishing", "sensitive": True},
]


def find_env_files(root: Path) -> list[Path]:
    files = []
    ignore = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", ".next"}
    for p in root.rglob("*"):
        if p.is_dir() or any(part in ignore for part in p.parts):
            continue
        name = p.name.lower()
        if name.startswith(".env") or name.endswith(".env"):
            files.append(p)
    return sorted(files)


def parse_env_file(path: Path) -> dict[str, str]:
    values = {}
    try:
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                values[k.strip()] = v.strip().strip('"').strip("'")
    except Exception:
        pass
    return values


def is_placeholder(value: str) -> bool:
    value = value.strip()
    if not value:
        return True
    return bool(re.search(r"REPLACE_WITH|placeholder|<.*>|your_", value, re.I))


def main() -> None:
    config = load_config()
    publish_cfg = config.get("publish_loop", {})
    buffer_enabled = publish_cfg.get("buffer", {}).get("enabled", False)
    webbridge_enabled = publish_cfg.get("webbridge", {}).get("enabled", False)

    env_files = find_env_files(ROOT)
    all_values: dict[str, list[str]] = defaultdict(list)
    for path in env_files:
        for k, v in parse_env_file(path).items():
            all_values[k].append((str(path.relative_to(ROOT)), v))

    results = []
    for req in REQUIRED:
        key = req["key"]
        env_value = os.environ.get(key, "")
        file_hits = all_values.get(key, [])
        real_file_values = [(p, v) for p, v in file_hits if not is_placeholder(v)]

        status = "missing"
        location = None
        if env_value and not is_placeholder(env_value):
            status = "env"
            location = "shell environment"
        elif real_file_values:
            status = "file"
            location = real_file_values[0][0]
        elif file_hits:
            status = "placeholder"
            location = file_hits[0][0]

        # Buffer is optional if Buffer integration is disabled or WebBridge is enabled.
        if key == "BUFFER_ACCESS_TOKEN" and (not buffer_enabled or webbridge_enabled) and status in ("missing", "placeholder"):
            status = "optional"

        results.append({**req, "status": status, "location": location})

    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "env_files_scanned": len(env_files),
        "keys": results,
        "blocked": [r["key"] for r in results if r["status"] in ("missing", "placeholder")],
        "optional": [r["key"] for r in results if r["status"] == "optional"],
        "ready": [r["key"] for r in results if r["status"] in ("env", "file")],
    }

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Env readiness: {len(report['ready'])}/{len(REQUIRED)} keys ready")
    if report["blocked"]:
        print("Blocked:", ", ".join(report["blocked"]))
    for r in results:
        icon = "✅" if r["status"] in ("env", "file") else ("⚪" if r["status"] == "optional" else "❌")
        print(f"  {icon} {r['key']}: {r['status']} ({r['location'] or 'nowhere'})")


if __name__ == "__main__":
    main()
