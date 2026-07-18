#!/usr/bin/env python3
"""service_healer.py — probe critical services and restart the dead ones.

Reads service definitions from .hive/config.yaml, probes each endpoint, and
restarts any service that is down or misbehaving. Uses consecutive-failure
strikes and restart cooldowns to avoid fighting with launchd during startup.
"""
from __future__ import annotations

import json
import os
import subprocess
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from hive_notify import notify

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
LOG = ROOT / ".hive" / "logs" / "healer.log"
STATE = ROOT / ".hive" / "healer_state.json"

STRIKES_BEFORE_RESTART = 3
RESTART_COOLDOWN_SECONDS = 60


def load_config() -> dict[str, Any]:
    try:
        import yaml

        return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


def log(msg: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")
    print(msg)


def load_state() -> dict[str, Any]:
    default = {"last_restarts": {}, "strikes": {}}
    if STATE.exists():
        try:
            data = json.loads(STATE.read_text(encoding="utf-8"))
            return {**default, **data}
        except Exception:
            pass
    return default


def save_state(state: dict[str, Any]) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def probe(svc: dict[str, Any], retries: int = 1) -> bool:
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(svc["url"], method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status == 200
        except Exception:
            if attempt < retries:
                time.sleep(0.5)
    return False


def kill_port_listeners(port: int) -> None:
    try:
        pids = subprocess.check_output(["lsof", "-ti", f"tcp:{port}"], text=True).strip()
        if pids:
            for pid in pids.split():
                subprocess.run(["kill", "-9", pid], check=False)
    except subprocess.CalledProcessError:
        pass


def restart(svc: dict[str, Any]) -> bool:
    cmd = svc.get("restart_command", "").strip()
    if not cmd:
        log(f"{svc['name']}: DOWN — no restart command configured")
        return False

    log(f"{svc['name']}: restarting…")
    kill_port_listeners(svc["port"])
    time.sleep(0.5)

    workdir = svc.get("working_dir") or str(ROOT)
    env = os.environ.copy()
    for k, v in svc.get("env", {}).items():
        env[k] = str(v)

    subprocess.Popen(cmd, shell=True, cwd=workdir, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return True


def should_restart(name: str, ok: bool, state: dict[str, Any]) -> bool:
    strikes: dict[str, int] = state.setdefault("strikes", {})
    last_restarts: dict[str, float] = state.setdefault("last_restarts", {})

    if ok:
        strikes[name] = 0
        return False

    strikes[name] = strikes.get(name, 0) + 1
    if strikes[name] < STRIKES_BEFORE_RESTART:
        log(f"{name}: DOWN (strike {strikes[name]}/{STRIKES_BEFORE_RESTART})")
        return False

    last = last_restarts.get(name, 0)
    if time.time() - last < RESTART_COOLDOWN_SECONDS:
        log(f"{name}: DOWN (restart cooldown active)")
        return False

    return True


def main() -> None:
    config = load_config()
    services = config.get("services", [])
    state = load_state()

    log(f"Healer run: checking {len(services)} services")
    for svc in services:
        ok = probe(svc, retries=1)
        if ok:
            state["strikes"][svc["name"]] = 0
            log(f"{svc['name']}: OK")
            continue

        if not should_restart(svc["name"], ok, state):
            continue

        if restart(svc):
            state["strikes"][svc["name"]] = 0
            state["last_restarts"][svc["name"]] = datetime.now(timezone.utc).timestamp()
            notify(
                f"Healer restarted {svc['name']}",
                f"Service {svc['name']} was down and has been restarted.\nURL: {svc['url']}",
                level="warning",
            )
            time.sleep(2)

    save_state(state)
    log("Healer run complete")


if __name__ == "__main__":
    main()
