"""sov33_paths.py — ONE canonical sovereign state dir, honoring SOV33_SIGIL_DIR.

37 modules hardcoded `~/.sovereign` (which doesn't exist and isn't writable in the sandbox), so their
state-writes silently failed — the real reason memory/consolidation/flywheel never populated. This is the
shared resolver: import `SOV_DIR` / `sov_path(name)` instead of hardcoding a home path. Env-first, safe fallback.
"""
import os
from pathlib import Path

def sov_dir():
    d = os.environ.get("SOV33_SIGIL_DIR") or str(Path.home() / ".sovereign")
    p = Path(d)
    try:
        p.mkdir(parents=True, exist_ok=True)
    except Exception:
        p = Path(os.environ.get("TMPDIR", "/tmp")) / "sov33_sigil"
        p.mkdir(parents=True, exist_ok=True)
    return p

SOV_DIR = sov_dir()
def sov_path(name): return SOV_DIR / name

if __name__ == "__main__":
    print("SOV_DIR:", SOV_DIR, "| writable:", os.access(SOV_DIR, os.W_OK))
