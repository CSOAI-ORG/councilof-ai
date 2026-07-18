#!/usr/bin/env python3
"""morning_brief.py — Concise markdown morning briefing.

Collects:
  1. SOV3 coordination status metrics
  2. Top-1 revenue action from next_best_action.py
  3. Disk space usage
  4. Health of 5 critical local services

Output: concise Markdown brief to stdout.
"""

import json
import os
import shlex
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────────
CLAWD = Path.home() / "clawd"
SCRIPTS = CLAWD / "scripts"
ENGINES = CLAWD / "engines"

COORD_SCRIPT = SCRIPTS / "coordination-status.sh"
NBA_SCRIPT = ENGINES / "next_best_action.py"

# ── services ───────────────────────────────────────────────────────────
SERVICES = [
    ("MEOK UI",  3000),
    ("SOV3",     3101),
    ("MEOK MCP", 3102),
    ("MEOK API", 3200),
    ("Farm Vis", 8888),
]


# ── helpers ────────────────────────────────────────────────────────────

def run(cmd: str, timeout: int = 30) -> tuple[str, str, int]:
    """Run a shell command, return (stdout, stderr, returncode)."""
    try:
        p = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=timeout,
        )
        return p.stdout, p.stderr, p.returncode
    except subprocess.TimeoutExpired as e:
        std = e.stdout if isinstance(e.stdout, str) else (e.stdout or b"").decode("utf-8", errors="replace")
        err = e.stderr if isinstance(e.stderr, str) else (e.stderr or b"").decode("utf-8", errors="replace")
        return str(std), str(err) + "\n[TIMEOUT]", 1
    except Exception as e:
        return "", str(e), 1


def bold(s: str) -> str:
    return f"**{s}**"


# ── section 1: coordination status ─────────────────────────────────────

def get_coordination_metrics() -> list[str]:
    """Run coordination-status.sh and pull out key lines."""
    out, err, rc = run(str(COORD_SCRIPT), timeout=45)
    lines = []
    if rc != 0:
        lines.append(f"❌ coordination-status.sh failed (rc={rc})")
        if err.strip():
            lines.append(f"   stderr: {err.strip()[:200]}")
        return lines

    # Extract meaningful lines — skip decorative borders
    for line in out.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("==") and not stripped.startswith("Last check"):
            lines.append(stripped)

    # Fallback if extraction gave nothing useful
    if not lines:
        lines.append("(coordination-status.sh ran but produced no parseable output)")
    return lines


# ── section 2: next best action ───────────────────────────────────────

def get_top_action() -> str:
    """Run next_best_action.py and capture the top-1 recommendation."""
    out, err, rc = run(f"python3 {shlex.quote(str(NBA_SCRIPT))} --top=1", timeout=30)

    # Try to parse the structured output line
    for line in out.splitlines():
        if line.startswith("  Best action:"):
            return line.strip()

    # Fallback: reconstruct from the JSON log
    log_path = ENGINES / "next_best_action.log"
    if log_path.exists():
        try:
            with open(log_path) as f:
                lines = [l.strip() for l in f if l.strip()]
            if lines:
                last = json.loads(lines[-1])
                acts = last.get("recommended_actions", [])
                if acts:
                    a = acts[0]
                    return (
                        f"Best action: #{a['rank']} – {a['name']} "
                        f"(impact={a['impact']}/10, time={a['time_minutes']}min, "
                        f"score={a['impact_per_minute']:.4f}/min)"
                    )
        except (json.JSONDecodeError, OSError):
            pass

    return f"❌ Could not determine top action (rc={rc})"


# ── section 3: disk space ─────────────────────────────────────────────

def get_disk_usage() -> str:
    """Return a one-line summary of df -h for /."""
    out, err, rc = run("df -h /", timeout=10)
    if rc != 0:
        return f"❌ df failed: {err.strip()[:100]}"
    lines = out.strip().splitlines()
    if len(lines) < 2:
        return "❌ Unexpected df output"
    parts = lines[-1].split()
    # Typical layout: Filesystem  Size  Used  Avail  Use%  Mounted
    if len(parts) >= 5:
        return f"{parts[3]} free of {parts[1]} ({parts[4]} used)"
    return lines[-1]  # raw fallback


# ── section 4: service health ─────────────────────────────────────────

def check_services() -> list[tuple[str, int, bool]]:
    """curl each service, return (name, port, alive) list."""
    results = []
    for name, port in SERVICES:
        # Try /api/health first, fall back to /health
        ok = False
        for path in ("/api/health", "/health", "/"):
            out, _, rc = run(
                f"curl -s -o /dev/null -w '%{{http_code}}' --connect-timeout 3 "
                f"http://127.0.0.1:{port}{path}",
                timeout=10,
            )
            if rc == 0 and out.strip().isdigit() and int(out.strip()) < 500:
                ok = True
                break
        results.append((name, port, ok))
    return results


# ── main ──────────────────────────────────────────────────────────────

def main():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(f"# 🌅 Morning Brief — {now}")
    print()

    # ── 1. SOV3 Coordination ──
    print("## 📡 SOV3 Coordination Status")
    print()
    metrics = get_coordination_metrics()
    for m in metrics:
        print(f"  {m}")
    print()

    # ── 2. Top Revenue Action ──
    print("## 🎯 Top Revenue Action")
    print()
    top = get_top_action()
    print(f"  {top}")
    print()

    # ── 3. Disk Space ──
    print("## 💾 Disk Space")
    print()
    disk = get_disk_usage()
    print(f"  {disk}")
    print()

    # ── 4. Service Health ──
    print("## 🖥️  Service Health")
    print()
    services = check_services()
    for name, port, alive in services:
        icon = "✅" if alive else "❌"
        print(f"  {icon}  {name:10s}  :{port}")
    print()

    # ── footer ──
    print("---")
    print(f"_Morning brief generated at {now}_")


if __name__ == "__main__":
    main()
