#!/usr/bin/env python3
"""data_budget_guard.py — enforce a disk budget for Hive harvested datasets.

Deletes oldest files (by mtime) in .hive/data/ when the total exceeds the
configured budget. If S3 offloading is enabled, older files are uploaded before
deletion (placeholder until boto3/awscli is configured).
"""
from __future__ import annotations

import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
REPORT = ROOT / ".hive" / "logs" / "data_budget_guard.json"


def load_config() -> dict[str, Any]:
    try:
        return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


def enforce() -> dict[str, Any]:
    cfg = load_config().get("data_policy", {})
    budget_gb = float(cfg.get("budget_gb", 10))
    data_dir = ROOT / cfg.get("path", ".hive/data/")
    retention_days = int(cfg.get("retention_days", 30))
    budget_bytes = budget_gb * 1024 * 1024 * 1024

    data_dir.mkdir(parents=True, exist_ok=True)
    files = [p for p in data_dir.rglob("*") if p.is_file()]
    total = sum(p.stat().st_size for p in files)

    deleted: list[str] = []
    if total > budget_bytes:
        # Sort oldest first
        files.sort(key=lambda p: p.stat().st_mtime)
        while files and total > budget_bytes:
            oldest = files.pop(0)
            size = oldest.stat().st_size
            try:
                oldest.unlink()
                total -= size
                deleted.append(str(oldest.relative_to(ROOT)))
            except Exception as exc:
                print(f"Could not delete {oldest}: {exc}")

    # Clean files older than retention regardless of budget
    cutoff = datetime.now(timezone.utc).timestamp() - retention_days * 86400
    expired = [p for p in data_dir.rglob("*") if p.is_file() and p.stat().st_mtime < cutoff]
    for p in expired:
        try:
            p.unlink()
            deleted.append(str(p.relative_to(ROOT)))
        except Exception as exc:
            print(f"Could not delete expired {p}: {exc}")

    # Remove empty directories
    for p in sorted(data_dir.rglob("*"), reverse=True):
        if p.is_dir() and not any(p.iterdir()):
            try:
                p.rmdir()
            except Exception:
                pass

    final_bytes = sum(p.stat().st_size for p in data_dir.rglob("*") if p.is_file())
    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "budget_gb": budget_gb,
        "used_gb": round(final_bytes / (1024 ** 3), 3),
        "used_mb": round(final_bytes / (1024 ** 2), 2),
        "deleted": deleted,
        "deleted_count": len(deleted),
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Data budget: {report['used_gb']} GB used / {budget_gb} GB budget, {len(deleted)} files pruned")
    return report


def main() -> None:
    enforce()


if __name__ == "__main__":
    main()
