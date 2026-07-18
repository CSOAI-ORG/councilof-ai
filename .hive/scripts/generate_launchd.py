#!/usr/bin/env python3
"""generate_launchd.py — render launchd plists from .hive/config.yaml."""
from __future__ import annotations

import os
import plistlib
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
LAUNCHD_DIR = ROOT / ".hive" / "launchd"
AGENTS_DIR = Path.home() / "Library" / "LaunchAgents"


def load_config() -> dict[str, Any]:
    import yaml

    return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}


def service_plist(svc: dict[str, Any]) -> dict[str, Any]:
    cmd = svc.get("restart_command", "").strip()
    if not cmd:
        raise ValueError(f"Service {svc['name']} has no restart_command")

    # If the command already begins with "cd <dir> &&", use that dir and exec the rest.
    m = re.match(r"cd\s+(\S+)\s+&&\s+(.*)", cmd, re.DOTALL)
    if m:
        workdir, rest = m.groups()
        shell_cmd = f"cd {workdir} && exec {rest}"
    else:
        workdir = svc.get("working_dir", str(ROOT))
        shell_cmd = f"cd {workdir} && exec {cmd}"

    label = f"ai.csoai.{svc['name'].lower().replace('_', '-')}"
    plist: dict[str, Any] = {
        "Label": label,
        "ProgramArguments": ["/bin/bash", "-c", shell_cmd],
        "WorkingDirectory": str(ROOT),
        "RunAtLoad": True,
        "KeepAlive": True,
        "ThrottleInterval": 10,
        "StandardOutPath": str(ROOT / ".hive" / "logs" / f"{label}.stdout.log"),
        "StandardErrorPath": str(ROOT / ".hive" / "logs" / f"{label}.stderr.log"),
    }
    env = svc.get("env")
    if env:
        plist["EnvironmentVariables"] = {k: str(v) for k, v in env.items()}
    return plist


PYTHON = "/Users/nicholas/clawd/sovereign-temple/.venv/bin/python3"


def automation_plist(name: str, script: Path, interval: int) -> dict[str, Any]:
    label = f"ai.csoai.{name}"
    return {
        "Label": label,
        "ProgramArguments": [PYTHON, str(script)],
        "WorkingDirectory": str(ROOT),
        "RunAtLoad": True,
        "StartInterval": interval,
        "StandardOutPath": str(ROOT / ".hive" / "logs" / f"{label}.stdout.log"),
        "StandardErrorPath": str(ROOT / ".hive" / "logs" / f"{label}.stderr.log"),
    }


def write_plist(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as f:
        plistlib.dump(data, f)


def dashboard_plist() -> dict[str, Any]:
    label = "ai.csoai.hive-dashboard"
    return {
        "Label": label,
        "ProgramArguments": ["/usr/bin/python3", "-m", "http.server", "3800"],
        "WorkingDirectory": str(ROOT),
        "RunAtLoad": True,
        "KeepAlive": True,
        "StandardOutPath": str(ROOT / ".hive" / "logs" / f"{label}.stdout.log"),
        "StandardErrorPath": str(ROOT / ".hive" / "logs" / f"{label}.stderr.log"),
    }


def main() -> None:
    config = load_config()
    LAUNCHD_DIR.mkdir(parents=True, exist_ok=True)

    written = []
    # Dashboard server keepalive
    dp = LAUNCHD_DIR / "ai.csoai.hive-dashboard.plist"
    write_plist(dp, dashboard_plist())
    written.append(dp.name)

    for svc in config.get("services", []):
        if not svc.get("restart_command"):
            continue
        label = f"ai.csoai.{svc['name'].lower().replace('_', '-')}"
        path = LAUNCHD_DIR / f"{label}.plist"
        write_plist(path, service_plist(svc))
        written.append(path.name)

    script_dir = ROOT / ".hive" / "scripts"
    jobs = [
        ("hive-sensor", script_dir / "hive_sensor.py", 900),
        ("service-healer", script_dir / "service_healer.py", 300),
        ("quality-manager", script_dir / "quality_manager.py", 3600),
        ("publish-manager", script_dir / "publish_manager.py", 1800),
        ("remediation-generator", script_dir / "remediation_generator.py", 21600),
        ("test-fleet-manager", script_dir / "test_fleet_manager.py", 86400),
        ("secrets-inventory", script_dir / "secrets_inventory.py", 21600),
        ("quorum-sensor", script_dir / "quorum_sensor.py", 300),
        ("agent-card-generator", script_dir / "agent_card_generator.py", 86400),
        ("env-readiness-report", script_dir / "env_readiness_report.py", 21600),
        ("nano-creator-seeder", script_dir / "nano_creator_seeder.py", 86400),
        ("government-data-downloader", script_dir / "government_data_downloader.py", 604800),
        ("synthetic-data-factory", script_dir / "synthetic_data_factory.py", 86400),
        ("affiliate-tracker", script_dir / "affiliate_tracker.py", 86400),
        ("cc0-harvester", script_dir / "cc0_harvester.py", 604800),
        ("grant-application-bot", script_dir / "grant_application_bot.py", 604800),
        ("data-budget-guard", script_dir / "data_budget_guard.py", 86400),
        ("capital-ascension-orchestrator", script_dir / "capital_ascension" / "capital_ascension_orchestrator.py", 604800),
        ("wave8-orchestrator", script_dir / "wave8" / "wave8_orchestrator.py", 604800),
    ]
    for name, script, interval in jobs:
        label = f"ai.csoai.{name}"
        path = LAUNCHD_DIR / f"{label}.plist"
        write_plist(path, automation_plist(name, script, interval))
        written.append(path.name)

    print(f"Generated {len(written)} plists in {LAUNCHD_DIR}:")
    for n in written:
        print(f"  - {n}")


if __name__ == "__main__":
    main()
