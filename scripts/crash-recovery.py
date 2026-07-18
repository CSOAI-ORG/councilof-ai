#!/usr/bin/env python3
"""
CRASH RECOVERY MANAGER v2.0
Monitors, saves state, auto-heals crashed services, enables recovery after crashes
"""

import json
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

RECOVERY_DIR = Path("/Users/nicholas/clawd/recovery")
STATE_FILE = RECOVERY_DIR / "current-state.json"
SERVICES_FILE = RECOVERY_DIR / "services.json"
PROGRESS_FILE = RECOVERY_DIR / "progress.json"
CHECKPOINT_FILE = RECOVERY_DIR / "checkpoint.json"
ALERT_FILE = RECOVERY_DIR / "alerts.log"

RECOVERY_DIR.mkdir(exist_ok=True)

SERVICE_CONFIGS = {
    "meok-api": {
        "port": 3200,
        "start_cmd": "cd /Users/nicholas/clawd/meok && /opt/homebrew/bin/python3.11 -m uvicorn api.server:app --host 0.0.0.0 --port 3200",
        "depends_on": ["postgres", "redis"],
        "health_endpoint": "http://localhost:3200/health",
    },
    "sov3-mcp": {
        "port": 3101,
        # Server is a FastAPI app; running under gunicorn+uvicorn.workers with 2 workers.
        # The plain `python3 -u sovereign-mcp-server.py` (uvicorn) uses PORT env var (default 3100)
        # so the --port flag is ignored — must set PORT=3101. Venv is required (sklearn, asyncpg, etc.).
        # Match the working proc_50175a382f68 launch: gunicorn + uvicorn workers, port 3101.
        # 2026-06-15 05:28Z: confirmed gunicorn PIDs 82282/82643/82644 serving live traffic; MCP
        # initialize returns 200 with proper JSON-RPC + serverInfo. venv recreated 05:21Z.
        # 2026-06-15 18:00Z: WORM_GUARD_ENFORCE=1 + SECURITY_BRAIN_ENFORCE=1 flipped on after Phase-1
        # log-only soak. SOV3 task task_f4e66284. W1+W2+W8 green; 4 SOV3 tools verified pass.
        "start_cmd": "cd /Users/nicholas/clawd/sovereign-temple && PORT=3101 HOST=0.0.0.0 WORM_GUARD_ENFORCE=1 SECURITY_BRAIN_ENFORCE=1 SECURITY_BRAIN_VETO_PAYMENT=0 OPENROUTER_API_KEY=***\",",
        "depends_on": ["postgres", "redis"],
        "health_endpoint": "http://localhost:3101/health",
    },
    "meok-ui": {
        "port": 3000,
        "start_cmd": "cd /Users/nicholas/clawd/meok/ui && npm run dev",
        "depends_on": [],
        "health_endpoint": "http://localhost:3000/",
    },
    "postgres": {
        "port": 5432,
        "start_cmd": "pg_ctl -D /opt/homebrew/var/postgresql@15 start",
        "check_func": "check_postgres",
    },
    "redis": {
        "port": 6379,
        "start_cmd": "redis-server --daemonize yes",
        "check_func": "check_redis",
    },
    "ollama": {
        "port": 11434,
        "start_cmd": "ollama serve",
        "check_func": "check_ollama",
    },
    "farm-vision": {
        "port": 8888,
        "start_cmd": "cd /Users/nicholas/clawd/meok/farm-vision && python3 -m http.server 8888",
        "depends_on": [],
    },
    "hindsight": {
        "port": 8765,
        "start_cmd": "/bin/zsh /Users/nicholas/.hindsight/start.sh",
        "depends_on": ["ollama"],
        "health_endpoint": "http://localhost:8765/v1/default/banks/meok-empire/stats",
    },
    "ensemble-loop": {
        "process_pattern": "ensemble_engine.py loop",
        "start_cmd": "cd /Users/nicholas/clawd/sovereign-temple && exec /Users/nicholas/clawd/sovereign-temple/.venv/bin/python3 -u ensemble_engine.py loop >> /tmp/ensemble_engine.log 2>&1",
        "depends_on": ["sov3-mcp", "hindsight"],
    },
}

RECOVERY_DIR.mkdir(exist_ok=True)


def log_alert(message: str, level: str = "INFO") -> None:
    """Log an alert to the alert file"""
    timestamp = datetime.now(timezone.utc).isoformat() + "Z"
    with open(ALERT_FILE, "a") as f:
        f.write(f"[{timestamp}] [{level}] {message}\n")


def auto_heal_service(service_name: str) -> bool:
    """Attempt to automatically heal a crashed service"""
    config = SERVICE_CONFIGS.get(service_name)
    if not config:
        log_alert(f"No config for {service_name}", "WARN")
        return False

    log_alert(f"Attempting auto-heal for {service_name}...", "WARN")

    # Check dependencies first
    for dep in config.get("depends_on", []):
        dep_config = SERVICE_CONFIGS.get(dep)
        if not dep_config:
            log_alert(f"Dependency {dep} has no config, skipping...", "WARN")
            continue
        dep_status = get_service_status(dep_config["port"])
        if dep_status["status"] != "running":
            log_alert(f"Dependency {dep} not running, starting first...", "WARN")
            auto_heal_service(dep)
            time.sleep(2)

    # Start the service
    try:
        if "docker" in config:
            subprocess.run(["docker", "start", config["docker"]], check=True)
            log_alert(f"Started docker container: {config['docker']}", "INFO")
        else:
            subprocess.Popen(
                config["start_cmd"],
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
            log_alert(f"Started service: {service_name}", "INFO")

        time.sleep(3)

        # Verify it started (process-based services have no port)
        if "process_pattern" in config:
            status = check_process(config["process_pattern"])
        elif "port" in config:
            status = get_service_status(config["port"])
        else:
            status = {"status": "running"}
        if status["status"] == "running":
            log_alert(f"✅ {service_name} auto-healed successfully!", "INFO")
            return True
        else:
            log_alert(f"❌ {service_name} auto-heal failed", "ERROR")
            return False
    except Exception as e:
        log_alert(f"Error healing {service_name}: {e}", "ERROR")
        return False


def check_and_heal() -> dict:
    """Check all services and auto-heal any that are down"""
    services = get_all_services()
    healed = []
    failed = []

    for name, info in services.items():
        if info.get("status") == "stopped":
            if auto_heal_service(name):
                healed.append(name)
            else:
                failed.append(name)

    return {"healed": healed, "failed": failed}


def check_process(pattern: str) -> dict:
    """Check if a background process matching pattern is running"""
    try:
        result = subprocess.run(
            ["pgrep", "-f", pattern], capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            return {"status": "running", "pid": result.stdout.split()[0]}
    except Exception:
        pass
    return {"status": "stopped", "pid": None}


def get_service_status(port: int) -> dict:
    """Check if a service is running on port"""
    try:
        result = subprocess.run(
            ["lsof", "-i", f":{port}"], capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout:
            lines = result.stdout.strip().split("\n")
            pid = lines[1].split()[1] if len(lines) > 1 else None
            return {"status": "running", "pid": pid}
    except Exception:
        pass
    return {"status": "stopped", "pid": None}


def check_postgres() -> dict:
    """Check PostgreSQL status — use lsof (always in PATH)"""
    try:
        result = subprocess.run(
            ["lsof", "-i", ":5432", "-sTCP:LISTEN"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            return {"status": "running", "location": "local"}
    except Exception:
        pass
    return {"status": "stopped", "location": None}


def check_redis() -> dict:
    """Check Redis status — use python socket (always available)"""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        result = s.connect_ex(('127.0.0.1', 6379))
        s.close()
        if result == 0:
            return {"status": "running", "location": "local"}
    except Exception:
        pass
    return {"status": "stopped", "location": None}


def check_ollama() -> dict:
    """Check Ollama status (tries both ports)"""
    for port in [11434, 11435]:
        try:
            result = subprocess.run(
                ["lsof", "-i", f":{port}"], capture_output=True, timeout=5
            )
            if result.returncode == 0:
                return {"status": "running", "port": port}
        except Exception:
            pass
    return {"status": "stopped", "port": None}


def save_checkpoint(label: str, data: dict) -> None:
    """Save a named checkpoint with progress data"""
    checkpoint = {
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "label": label,
        "data": data,
    }
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump(checkpoint, f, indent=2)
    print(f"💾 Checkpoint saved: {label}")


def load_checkpoint() -> Optional[dict]:
    """Load last checkpoint if exists"""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE) as f:
            return json.load(f)
    return None


def save_progress(key: str, value: any) -> None:
    """Save incremental progress"""
    progress = {}
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            progress = json.load(f)

    progress[key] = {"value": value, "timestamp": datetime.now(timezone.utc).isoformat() + "Z"}

    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)


def _resolve_check(func_name: str):
    """Resolve a check function by name, allowing forward references."""
    if func_name is None:
        return None
    fn = globals().get(func_name)
    if callable(fn):
        return fn
    log_alert(f"Unknown check_func: {func_name}", "WARN")
    return None


def _status_for(config: dict) -> dict:
    """Resolve status using explicit check_func, port, or process pattern."""
    cf = config.get("check_func")
    if cf is not None:
        fn = _resolve_check(cf)
        if fn:
            return fn()
    if "process_pattern" in config:
        return check_process(config["process_pattern"])
    if "port" in config:
        return get_service_status(config["port"])
    return {"status": "unknown"}


def get_all_services() -> dict:
    """Get status of all critical services"""
    services = {
        "meok-api": _status_for(SERVICE_CONFIGS["meok-api"]),
        "sov3-mcp": _status_for(SERVICE_CONFIGS["sov3-mcp"]),
        "meok-ui": _status_for(SERVICE_CONFIGS["meok-ui"]),
        "postgres": _status_for(SERVICE_CONFIGS["postgres"]),
        "redis": _status_for(SERVICE_CONFIGS["redis"]),
        "ollama": _status_for(SERVICE_CONFIGS["ollama"]),
        "weaviate": get_service_status(8080),
        "neo4j": get_service_status(7474),
        "farm-vision": get_service_status(8888),
        "hindsight": get_service_status(8765),
        "ensemble-loop": check_process("ensemble_engine.py loop"),
    }

    with open(SERVICES_FILE, "w") as f:
        json.dump(
            {"timestamp": datetime.now(timezone.utc).isoformat() + "Z", "services": services},
            f,
            indent=2,
        )

    return services


def save_session_state() -> None:
    """Save current session state"""
    state = {
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "hostname": os.uname().nodename,
        "user": os.environ.get("USER", "unknown"),
    }

    try:
        result = subprocess.run(
            ["tmux", "list-sessions"], capture_output=True, text=True
        )
        state["tmux_sessions"] = result.stdout.strip() if result.returncode == 0 else ""
    except Exception:
        pass

    try:
        result = subprocess.run(
            ["pgrep", "-f", "opencode"], capture_output=True, text=True
        )
        state["opencode_pids"] = result.stdout.strip() if result.stdout else ""
    except Exception:
        pass

    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def print_status() -> None:
    """Print current service status"""
    services = get_all_services()
    print("\n📊 Service Status:")
    print("-" * 40)

    emoji = {"running": "✅", "stopped": "❌"}
    for name, info in services.items():
        status = info.get("status", "unknown")
        print(f"  {emoji.get(status, '⚪')} {name}: {status}")
        if status == "running" and info.get("pid"):
            print(f"      PID: {info['pid']}")

    print("-" * 40)

    # Show last checkpoint
    checkpoint = load_checkpoint()
    if checkpoint:
        print(
            f"\n📍 Last checkpoint: {checkpoint['label']} ({checkpoint['timestamp']})"
        )

    # Show progress
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            progress = json.load(f)
        if progress:
            print(f"\n📈 Progress saved: {len(progress)} items")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        cmd = sys.argv[1]

        if cmd == "status":
            print_status()
        elif cmd == "checkpoint":
            label = sys.argv[2] if len(sys.argv) > 2 else "manual"
            save_checkpoint(label, {"manual": True})
        elif cmd == "progress":
            key = sys.argv[2] if len(sys.argv) > 2 else "test"
            value = sys.argv[3] if len(sys.argv) > 3 else "done"
            save_progress(key, value)
        elif cmd == "save":
            get_all_services()
            save_session_state()
            print("✅ State saved")
        elif cmd == "heal":
            print("🔧 Running auto-heal...")
            result = check_and_heal()
            print(f"   Healed: {result['healed']}")
            print(f"   Failed: {result['failed']}")
        elif cmd == "monitor":
            auto_heal = "--auto-heal" in sys.argv
            print(f"🔄 Starting continuous monitoring... (Ctrl+C to stop)")
            if auto_heal:
                print("   Auto-heal: ENABLED")
            while True:
                get_all_services()
                save_session_state()
                print_status()
                if auto_heal:
                    result = check_and_heal()
                    if result["healed"]:
                        print(f"   🔧 Auto-healed: {result['healed']}")
                time.sleep(300)  # 5 minutes
    else:
        print_status()
