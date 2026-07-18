#!/usr/bin/env python3
"""Disk and log health check for the empire.

Usage:
    python3 scripts/disk-health.py
    python3 scripts/disk-health.py --clean-logs --days 7
"""
from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/Users/nicholas")
REPORT = Path("/Users/nicholas/clawd/_findings/DISK_HEALTH_2026-06-17.json")

LOG_DIRS = [
    ROOT / ".hermes" / "logs",
    ROOT / ".clawdbot" / "logs",
    ROOT / ".kimi" / "logs",
    ROOT / ".hive",
    Path("/tmp"),
]


def get_disk_usage(path: Path) -> dict:
    try:
        total, used, free = shutil.disk_usage(path)
        return {
            "path": str(path),
            "total_gb": round(total / (1024**3), 2),
            "used_gb": round(used / (1024**3), 2),
            "free_gb": round(free / (1024**3), 2),
            "percent_used": round(used / total * 100, 1),
        }
    except Exception as e:
        return {"path": str(path), "error": str(e)}


def get_dir_size(path: Path) -> int:
    total = 0
    try:
        for entry in path.rglob("*"):
            try:
                if entry.is_file():
                    total += entry.stat().st_size
            except (OSError, PermissionError):
                continue
    except (OSError, PermissionError):
        pass
    return total


def find_large_log_dirs(top_n: int = 10) -> list[dict]:
    sizes = []
    for log_dir in LOG_DIRS:
        if not log_dir.exists():
            continue
        size = get_dir_size(log_dir)
        sizes.append({"path": str(log_dir), "size_mb": round(size / (1024**2), 2)})
    sizes.sort(key=lambda x: x["size_mb"], reverse=True)
    return sizes[:top_n]


def main():
    parser = argparse.ArgumentParser(description="Disk health check")
    parser.add_argument("--clean-logs", action="store_true", help="Remove log files older than --days")
    parser.add_argument("--days", type=int, default=7, help="Age threshold for log cleanup")
    args = parser.parse_args()

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "disk_usage": get_disk_usage(ROOT),
        "large_log_dirs": find_large_log_dirs(),
        "cleaned": [],
    }

    if args.clean_logs:
        # Placeholder: list old files without deleting
        print("⚠️ --clean-logs is a dry-run by default. List old files below:")
        # In future, implement safe deletion with trash

    print(f"Disk usage for {ROOT}:")
    du = report["disk_usage"]
    print(f"  Used: {du['used_gb']} GB / {du['total_gb']} GB ({du['percent_used']}%)")
    print(f"  Free: {du['free_gb']} GB")

    print("\nLargest log directories:")
    for d in report["large_log_dirs"]:
        print(f"  {d['path']}: {d['size_mb']} MB")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nReport: {REPORT}")


if __name__ == "__main__":
    main()
