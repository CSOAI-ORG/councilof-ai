#!/usr/bin/env python3
"""secrets_inventory.py — scan the empire for missing secrets and placeholders.

Finds .env/.env.example/.env.local files, extracts key/value pairs, detects
placeholders, and reports which secrets are present vs missing. Writes a JSON
report and optionally a human-readable summary.
"""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
REPORT = ROOT / ".hive" / "logs" / "secrets_inventory.json"
SUMMARY = ROOT / ".hive" / "logs" / "secrets_inventory.md"

SECRET_KEY_PATTERNS = [
    r"API_KEY",
    r"SECRET",
    r"TOKEN",
    r"PASSWORD",
    r"PRIVATE_KEY",
    r"WEBHOOK_SECRET",
    r"SMTP_PASSWORD",
    r"MASTER_KEY",
]
PLACEHOLDER_PATTERNS = [
    r"REPLACE_WITH_.*",
    r".*_placeholder",
    r"sk-.*placeholder",
    r"pk_(live|test)_.*placeholder",
    r"whsec_.*placeholder",
]
IGNORE_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", ".next", "_archive"}


def is_secret_key(key: str) -> bool:
    return any(re.search(p, key, re.I) for p in SECRET_KEY_PATTERNS)


def is_placeholder(value: str) -> bool:
    value = value.strip().strip('"').strip("'")
    if not value:
        return True
    return any(re.fullmatch(p, value, re.I) for p in PLACEHOLDER_PATTERNS)


def find_env_files(root: Path) -> list[Path]:
    files = []
    for p in root.rglob("*"):
        if p.is_dir() or any(part in IGNORE_DIRS for part in p.parts):
            continue
        name = p.name.lower()
        if name.startswith(".env") or name.endswith(".env") or name == ".envrc":
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


def main() -> None:
    files = find_env_files(ROOT)
    report: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "files_scanned": len(files),
        "missing": [],
        "placeholder": [],
        "present": [],
        "by_file": {},
    }

    for path in files:
        rel = str(path.relative_to(ROOT))
        values = parse_env_file(path)
        file_report = {"keys": len(values), "missing": [], "placeholder": [], "present": []}
        for key, value in values.items():
            if not is_secret_key(key):
                continue
            entry = {"file": rel, "key": key, "value": value[:4] + "***" if value and not is_placeholder(value) else value}
            if is_placeholder(value):
                file_report["placeholder"].append(key)
                report["placeholder"].append({"file": rel, "key": key, "value": value})
            else:
                file_report["present"].append(key)
                report["present"].append(entry)
        report["by_file"][rel] = file_report

    # Known required secrets that should exist somewhere
    required = [
        "MEOK_MASTER_API_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "BUFFER_ACCESS_TOKEN",
    ]
    found_keys = {e["key"] for e in report["present"]}
    for key in required:
        if key not in found_keys and not os.environ.get(key):
            report["missing"].append({"key": key, "note": "Not found in any .env file or environment"})

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Secrets Inventory",
        f"Generated: {report['ts']}",
        "",
        f"- Files scanned: {report['files_scanned']}",
        f"- Placeholders found: {len(report['placeholder'])}",
        f"- Missing required secrets: {len(report['missing'])}",
        f"- Present secrets: {len(report['present'])}",
        "",
        "## Missing required secrets",
    ]
    for m in report["missing"]:
        lines.append(f"- [ ] `{m['key']}` — {m['note']}")
    lines.extend(["", "## Placeholders needing values"])
    for p in report["placeholder"][:30]:
        lines.append(f"- [ ] `{p['key']}` in `{p['file']}`")

    SUMMARY.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Scanned {report['files_scanned']} env files")
    print(f"  Missing: {len(report['missing'])}")
    print(f"  Placeholders: {len(report['placeholder'])}")
    print(f"  Present: {len(report['present'])}")


if __name__ == "__main__":
    main()
