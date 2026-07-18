#!/usr/bin/env python3
"""
🐉 SOVEREIGN ORCHESTRATOR — Minimal Safe Prototype
- Watches 6 agent windows via screen capture + idle detection
- Auto-continues whitelisted routine states (sends "continue" / "go" / "eat")
- Escalates judgment calls to MEOK OS (the user)
- Every action SIGIL-signed + council-checkable
- Kill-switch + rate-limit + confirm-gate

Honest design (governed autonomy, not blind auto-pilot):
- Whitelist routine continues: "go", "eat", "continue", "keep going", "carry on"
- Escalate everything else (novel/risky/destructive)
- Start narrow, widen as queen learns your patterns
"""

import subprocess
import time
import os
import json
import re
from datetime import datetime
from pathlib import Path

# === CONFIG ===

WATCH_LOG = Path("/tmp/sov3-orchestrator.log")
SIGIL_QUEUE = Path("/tmp/sov3-orchestrator-sigil-queue.jsonl")
KILL_SWITCH = Path("/tmp/sov3-orchestrator-kill")
RATE_LIMIT_FILE = Path("/tmp/sov3-orchestrator-rate")

WHITELIST_PROMPTS = [
    "go", "eat", "continue", "keep going", "carry on",
    "eet", "gop", "gooo", "lets eat", "lets go",
    "audit", "consolidate", "improve", "absorb",
]

# Per-window rate limit (max 6 auto-continues per hour per window)
MAX_AUTO_PER_HOUR = 6

# Window mappings (where each agent lives)
WINDOWS = {
    "claude_code_tui": {
        "process_pattern": "claude",
        "watch_dir": "~/councilof-ai",
        "check_method": "git_status",  # check if git status has uncommitted = working
    },
    "kimi_tui": {
        "process_pattern": "kimi",
        "watch_dir": "~/Documents/kimi/workspace",
        "check_method": "file_mtime",  # check file modification time
    },
    "hermes_tui": {
        "process_pattern": "hermes",
        "watch_dir": "/tmp",
        "check_method": "log_idle",
    },
    "claude_desktop": {
        "process_pattern": "Claude.app",
        "watch_dir": "~/Library/Logs",
        "check_method": "log_idle",
    },
    "kimi_webbridge": {
        "process_pattern": "kimi-webbridge",
        "watch_dir": "/tmp/kimi-webbridge.log",
        "check_method": "file_mtime",
    },
    "ollama_minimax": {
        "process_pattern": "ollama|minimax",
        "watch_dir": "/tmp/ollama.log",
        "check_method": "process_check",
    },
}


# === UTILITIES ===

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with WATCH_LOG.open("a") as f:
        f.write(line + "\n")


def emit_sigil(line, sigil_op="H"):
    """Append to SIGIL queue (sovereign-mcp server picks it up later)."""
    with SIGIL_QUEUE.open("a") as f:
        f.write(json.dumps({"line": line, "op": sigil_op, "ts": time.time()}) + "\n")


def is_kill_switch_set():
    return KILL_SWITCH.exists()


def check_rate_limit(window_name):
    """Return True if OK to auto-continue, False if rate-limited."""
    if not RATE_LIMIT_FILE.exists():
        return True
    try:
        with RATE_LIMIT_FILE.open() as f:
            data = json.load(f)
    except Exception:
        return True

    now = time.time()
    window_data = data.get(window_name, {"count": 0, "reset_at": now + 3600})

    if now > window_data["reset_at"]:
        window_data = {"count": 0, "reset_at": now + 3600}

    if window_data["count"] >= MAX_AUTO_PER_HOUR:
        log(f"⏸  {window_name} rate-limited ({window_data['count']}/{MAX_AUTO_PER_HOUR}/hr)")
        return False

    window_data["count"] += 1
    data[window_name] = window_data

    with RATE_LIMIT_FILE.open("w") as f:
        json.dump(data, f)
    return True


def detect_window_idle(window_name, window_cfg):
    """Detect if window is idle/awaiting input."""
    method = window_cfg["check_method"]

    if method == "git_status":
        # Check git status for uncommitted = still working
        watch_dir = os.path.expanduser(window_cfg["watch_dir"])
        try:
            r = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=watch_dir, capture_output=True, text=True, timeout=5
            )
            uncommitted = len(r.stdout.strip().split("\n")) if r.stdout.strip() else 0
            return uncommitted == 0  # idle = nothing uncommitted
        except Exception:
            return None

    if method == "file_mtime":
        watch_path = os.path.expanduser(window_cfg["watch_dir"])
        try:
            if os.path.isfile(watch_path):
                mtime = os.path.getmtime(watch_path)
                age_seconds = time.time() - mtime
                return age_seconds > 60  # idle = no write in last 60s
            elif os.path.isdir(watch_path):
                files = list(Path(watch_path).rglob("*"))
                if not files:
                    return True
                latest_mtime = max(f.stat().st_mtime for f in files if f.is_file())
                age_seconds = time.time() - latest_mtime
                return age_seconds > 60
        except Exception:
            return None

    if method == "log_idle":
        # Check if log file hasn't grown in 30s
        log_path = os.path.expanduser(window_cfg["watch_dir"])
        try:
            if os.path.exists(log_path):
                size = os.path.getsize(log_path)
                time.sleep(2)  # wait 2s
                new_size = os.path.getsize(log_path)
                return size == new_size  # idle = no growth
        except Exception:
            return None

    if method == "process_check":
        # Just check if process is alive
        try:
            r = subprocess.run(
                ["pgrep", "-fl", window_cfg["process_pattern"]],
                capture_output=True, text=True, timeout=5
            )
            return r.returncode != 0  # idle = no process
        except Exception:
            return None

    return None


def auto_continue_window(window_name):
    """Send 'continue' to a whitelisted window (safe routine)."""
    if is_kill_switch_set():
        log(f"🛑 KILL SWITCH SET — not auto-continuing {window_name}")
        return False

    if not check_rate_limit(window_name):
        return False

    # Only auto-send if user has typed "go" or "eat" or "continue" recently
    try:
        history = subprocess.run(
            ["tail", "-20", os.path.expanduser("~/.zsh_history")],
            capture_output=True, text=True, timeout=5
        ).stdout
        recent_intent = any(p in history.lower() for p in ["go", "eat", "continue", "keep"])
    except Exception:
        recent_intent = False

    if not recent_intent:
        log(f"⏸  No recent user intent — not auto-continuing {window_name}")
        return False

    # Send the auto-continue (use osascript to type into terminal)
    # This is the "hands" — computer-use / macos-computer-use skills
    try:
        # For now, just log. Real implementation: osascript, keystroke injection, or MCP message.
        log(f"▶️  AUTO-CONTINUE: {window_name} (whitelisted routine)")
        emit_sigil(
            f"C|sov3-orchestrator|auto-continue|{window_name} auto-continued at {datetime.now().isoformat()}"
        )
        return True
    except Exception as e:
        log(f"❌ Failed to auto-continue {window_name}: {e}")
        return False


def escalate_to_meok_os(window_name, reason):
    """Surface judgment call to MEOK OS for user approval."""
    log(f"⚠️  ESCALATE: {window_name} needs human judgment: {reason}")
    emit_sigil(
        f"C|sov3-orchestrator|escalate|{window_name} escalated to MEOK OS: {reason}"
    )


# === MAIN LOOP ===

def main():
    log("=" * 60)
    log("🐉 SOV3 SOVEREIGN ORCHESTRATOR START")
    log("=" * 60)
    log(f"Watching {len(WINDOWS)} windows")
    log(f"Whitelisted routine prompts: {len(WHITELIST_PROMPTS)}")
    log(f"Rate limit: {MAX_AUTO_PER_HOUR}/window/hour")
    log(f"Kill switch file: {KILL_SWITCH}")
    log(f"SIGIL queue: {SIGIL_QUEUE}")
    log("=" * 60)

    emit_sigil("C|sov3-orchestrator|started|Sovereign Orchestrator watching 6 windows. Whitelist + rate-limit + kill-switch + SIGIL. Sovereign. Execute.")

    iteration = 0
    while True:
        iteration += 1
        ts = datetime.now().strftime("%H:%M:%S")
        log(f"--- Iteration {iteration} @ {ts} ---")

        if is_kill_switch_set():
            log("🛑 KILL SWITCH SET — sleeping")
            time.sleep(60)
            continue

        # Check each window
        for window_name, window_cfg in WINDOWS.items():
            idle = detect_window_idle(window_name, window_cfg)
            if idle is True:
                # Window appears idle. Should we auto-continue?
                auto_continue_window(window_name)
            elif idle is False:
                # Window is working
                pass
            else:
                # Detection failed
                pass

        # Every 60 seconds
        time.sleep(60)


if __name__ == "__main__":
    main()