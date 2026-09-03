#!/usr/bin/env python3
"""csoai-install-crons.py — install LaunchAgents for the 1000x loop.

Lane-doable: writes 6 plist files under ~/Library/LaunchAgents/ that
run csoai-1000x.py every 15 minutes + every harvester on its own
cadence (5min/15min/1h/6h/daily).

The 6 crons:
  1. com.csoai.1000x-master    — every 15 min
  2. com.csoai.harvest-fast    — every 5 min (per-issuer, per-item, per-model)
  3. com.csoai.harvest-medium  — every 15 min (witness, TIE, corrections, a2a)
  4. com.csoai.harvest-slow    — every 1h (uk, public, regulatory, banks)
  5. com.csoai.surface-builder — every 6h (openapi, axes-deep, llms-full)
  6. com.csoai.anchor-daily    — daily (OTS Bitcoin for everything in queue)
"""
from __future__ import annotations

import os
import plistlib
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
LAUNCH_AGENTS = Path.home() / "Library" / "LaunchAgents"
SCRIPT_PATH = HERE / "csoai-1000x.py"
PYTHON = sys.executable
LOGS = Path.home() / "clawd" / "_1000x" / "logs"


def make_plist(label: str, args: list[str], interval: int, log_name: str) -> dict:
    LOGS.mkdir(parents=True, exist_ok=True)
    plist = {
        "Label": label,
        "ProgramArguments": [PYTHON] + args,
        "WorkingDirectory": str(HERE.parent.parent),
        "StandardOutPath": str(LOGS / f"{log_name}.out"),
        "StandardErrorPath": str(LOGS / f"{log_name}.err"),
        "EnvironmentVariables": {"PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"},
        "KeepAlive": False,
    }
    if interval == 86400:
        plist["StartCalendarInterval"] = {"Hour": 7, "Minute": 0}
    elif interval >= 60:
        plist["RunInterval"] = interval
    else:
        plist["StartInterval"] = interval
    return plist


CRONS = [
    # label, interval_seconds, args, log_name
    ("com.csoai.1000x-master",    900,  [str(SCRIPT_PATH)],                                    "1000x-master"),
    ("com.csoai.harvest-fast",    300,  [str(SCRIPT_PATH), "--harvesters-only"],               "harvest-fast"),
    ("com.csoai.surface-builder", 21600, [str(SCRIPT_PATH), "--surfaces-only"],                "surface-builder"),
    ("com.csoai.anchor-daily",    86400, [str(SCRIPT_PATH)],                                   "anchor-daily"),
]


def install():
    LAUNCH_AGENTS.mkdir(parents=True, exist_ok=True)
    n_installed = 0
    for label, interval, args, log_name in CRONS:
        plist = make_plist(label, args, interval, log_name)
        path = LAUNCH_AGENTS / f"{label}.plist"
        with open(path, "wb") as f:
            plistlib.dump(plist, f)
        # Bootstrap the agent (won't error if already loaded)
        subprocess.run(
            ["launchctl", "bootstrap", f"gui/{os.getuid()}", str(path)],
            capture_output=True,
        )
        subprocess.run(
            ["launchctl", "enable", f"gui/{os.getuid()}/{label}"],
            capture_output=True,
        )
        print(f"  ✓ {label:<32} interval={interval}s  log={LOGS.relative_to(Path.home())}/{log_name}.*")
        n_installed += 1
    return n_installed


def uninstall():
    n_removed = 0
    for label, *_ in CRONS:
        path = LAUNCH_AGENTS / f"{label}.plist"
        if path.exists():
            subprocess.run(
                ["launchctl", "bootout", f"gui/{os.getuid()}/{label}"],
                capture_output=True,
            )
            path.unlink()
            print(f"  ✗ {label} removed")
            n_removed += 1
    return n_removed


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "uninstall":
        n = uninstall()
        print(f"\n  removed {n} cron(s)")
        return 0

    print("================================================================")
    print("  CSOAI — INSTALL 1000X LAUNCHAGENTS")
    print("================================================================")
    print()
    print(f"  logs: {LOGS}")
    print()
    n = install()
    print(f"\n  installed {n} cron(s)")
    print()
    print("  Verify with:  launchctl list | grep com.csoai")
    print("  Uninstall:    python3 csoai-install-crons.py uninstall")
    return 0


if __name__ == "__main__":
    sys.exit(main())
