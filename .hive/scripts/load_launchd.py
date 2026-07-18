#!/usr/bin/env python3
"""load_launchd.py — install and load Hive launchd agents.

Copies generated plists from .hive/launchd/ to ~/Library/LaunchAgents/,
unloads any previously-loaded versions, frees occupied ports for service agents,
and loads them fresh.
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import yaml

ROOT = Path("/Users/nicholas/clawd")
SOURCE = ROOT / ".hive" / "launchd"
TARGET = Path.home() / "Library" / "LaunchAgents"
CONFIG = ROOT / ".hive" / "config.yaml"


def run(args: list[str], check: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, capture_output=True, text=True, check=check)


def is_loaded(label: str) -> bool:
    r = run(["launchctl", "list", label])
    return r.returncode == 0


def unload(label: str) -> None:
    if is_loaded(label):
        run(["launchctl", "unload", str(TARGET / f"{label}.plist")], check=False)


def load(label: str) -> None:
    run(["launchctl", "load", "-w", str(TARGET / f"{label}.plist")], check=False)


def kill_port(port: int) -> None:
    try:
        pids = run(["lsof", "-ti", f"tcp:{port}"]).stdout.strip()
        if pids:
            for pid in pids.split():
                run(["kill", "-9", pid], check=False)
    except Exception:
        pass


def load_service(label: str, port: int | None) -> None:
    if port:
        kill_port(port)
    unload(label)
    load(label)


def main() -> None:
    config = yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    services = {svc["name"]: svc for svc in config.get("services", [])}

    TARGET.mkdir(parents=True, exist_ok=True)
    for plist in sorted(SOURCE.glob("*.plist")):
        label = plist.stem
        dest = TARGET / plist.name
        print(f"Installing {label} ...")
        shutil.copy2(plist, dest)

        # Service agents own a port; free it first so launchd can bind.
        for svc_name, svc in services.items():
            if label == f"ai.csoai.{svc_name.lower().replace('_', '-')}":
                load_service(label, svc.get("port"))
                break
        else:
            unload(label)
            load(label)

        status = "loaded" if is_loaded(label) else "NOT loaded"
        print(f"  -> {status}")


if __name__ == "__main__":
    main()
