"""
7 Proactive Triggers — for Sovereign Proactive Engine
"""

import time
import subprocess
import os
from datetime import datetime

def trigger_long_session(memory):
    """Long working session (4+ hours)."""
    try:
        r = subprocess.run(
            ["tail", "-200", os.path.expanduser("~/.zsh_history")],
            capture_output=True, text=True, timeout=5
        )
        lines = r.stdout.split('\n')
        hours = set()
        for line in lines:
            if line.startswith(':'):
                try:
                    ts = int(line.split(':')[1].strip())
                    dt = datetime.fromtimestamp(ts)
                    hours.add(dt.strftime('%Y-%m-%d %H'))
                except Exception:
                    pass
        session_hours = len(hours)
        if session_hours >= 4:
            return {
                'trigger': 'long_session',
                'session_hours': session_hours,
                'message': f"You've been at this for ~{session_hours}h. Want me to: (1) Run /healthz (2) Summarise today's SIGILs (3) Save session log?",
                'actions': ['run_healthz', 'summarise_sigils', 'save_session']
            }
    except Exception:
        pass
    return None


def trigger_frequent_pattern(memory):
    """Frequent pattern (5+ same command in last hour)."""
    try:
        r = subprocess.run(
            ["tail", "-200", os.path.expanduser("~/.zsh_history")],
            capture_output=True, text=True, timeout=5
        )
        lines = r.stdout.split('\n')
        now = time.time()
        recent = []
        for line in lines:
            if line.startswith(':'):
                try:
                    ts = int(line.split(':')[1].strip())
                    if (now - ts) < 3600:
                        cmd = line.split(';', 1)[1] if ';' in line else ''
                        recent.append(cmd.split()[0] if cmd.split() else '')
                except Exception:
                    pass
        from collections import Counter
        counter = Counter(recent)
        for cmd, count in counter.most_common(3):
            if count >= 5 and cmd:
                return {
                    'trigger': 'frequent_pattern',
                    'command': cmd,
                    'count': count,
                    'message': f"You've typed '{cmd}' {count} times in last hour. Want me to: (1) Build a one-click button (2) Add to auto-routine (3) Pre-stage the data?",
                    'actions': ['build_button', 'add_routine', 'prestage']
                }
    except Exception:
        pass
    return None


def trigger_idle_windows(memory):
    """Idle windows (2+ idle 5min)."""
    try:
        r = subprocess.run(["pgrep", "-fl", "Claude|kimi|hermes|orchestrator"],
                          capture_output=True, text=True, timeout=5)
        windows = [l for l in r.stdout.split('\n') if l.strip()]
        if len(windows) >= 3:
            return {
                'trigger': 'idle_windows',
                'window_count': len(windows),
                'message': f"{len(windows)} windows active. Want me to: (1) Show summary of each (2) Auto-continue whitelisted (3) Kill unused?",
                'actions': ['summary', 'autocontinue', 'cleanup']
            }
    except Exception:
        pass
    return None


def trigger_backlog(memory):
    """Backlog (20+ unprocessed SIGILs)."""
    try:
        r = subprocess.run(
            ["stat", "-f", "%z", "/tmp/sov3-orchestrator-sigil-queue.jsonl"],
            capture_output=True, text=True, timeout=5
        )
        size = int(r.stdout.strip() or 0)
        if size > 5000:
            count = size // 250
            return {
                'trigger': 'backlog',
                'count': count,
                'message': f"I have ~{count} unprocessed SIGILs. Want me to: (1) Group by category (2) Auto-handle routine (3) Summarise novel?",
                'actions': ['group', 'autoroutine', 'summarise']
            }
    except Exception:
        pass
    return None


def trigger_disk_pressure(memory):
    """Disk > 85%."""
    try:
        r = subprocess.run(["df", "-h", "/"], capture_output=True, text=True, timeout=5)
        for line in r.stdout.split('\n')[1:]:
            if line.strip():
                parts = line.split()
                pct = parts[4].rstrip('%')
                if int(pct) > 85:
                    return {
                        'trigger': 'disk_pressure',
                        'pct': int(pct),
                        'message': f"Disk is at {pct}%. Want me to: (1) Clean /tmp logs (~3GB) (2) Clean Claude cache (~1.6GB) (3) Clean npm cache (~500MB)?",
                        'actions': ['clean_tmp', 'clean_claude', 'clean_npm']
                    }
    except Exception:
        pass
    return None


def trigger_draft_incomplete(memory):
    """Draft 2h+ old."""
    try:
        r = subprocess.run(
            ["find", os.path.expanduser("~/clawd/_alignment"), "-name", "*.md", "-mmin", "-1440"],
            capture_output=True, text=True, timeout=5
        )
        recent = [f for f in r.stdout.split('\n') if f.strip()]
        now = time.time()
        drafts = []
        for f in recent[:20]:
            mtime = os.path.getmtime(f)
            age_hours = (now - mtime) / 3600
            if 2 < age_hours < 24:
                drafts.append((f, age_hours))
        if drafts:
            drafts.sort(key=lambda x: x[1], reverse=True)
            f, age = drafts[0]
            return {
                'trigger': 'draft_incomplete',
                'file': f,
                'age_hours': age,
                'message': f"You started {os.path.basename(f)} {age:.1f}h ago. Want me to: (1) Help finish it (2) Commit draft (3) Move to /scratch?",
                'actions': ['finish', 'commit', 'move']
            }
    except Exception:
        pass
    return None


def trigger_window_anomaly(memory):
    """Window anomaly (busy → idle)."""
    try:
        log_path = "/tmp/sov3-orchestrator.log"
        if not os.path.exists(log_path):
            return None
        with open(log_path) as f:
            lines = f.readlines()[-20:]
        recent_idle = [l for l in lines if 'AUTO-CONTINUE' in l]
        if len(recent_idle) >= 2:
            return {
                'trigger': 'window_anomaly',
                'recent_idle_count': len(recent_idle),
                'message': f"Detected {len(recent_idle)} windows going idle recently. Want me to: (1) Check what each was doing (2) Auto-continue (3) Show the diff?",
                'actions': ['check', 'continue', 'diff']
            }
    except Exception:
        pass
    return None


# All 7 triggers
TRIGGERS = [
    trigger_long_session,
    trigger_frequent_pattern,
    trigger_idle_windows,
    trigger_backlog,
    trigger_disk_pressure,
    trigger_draft_incomplete,
    trigger_window_anomaly,
]