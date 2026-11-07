"""Bounded launcher for the reviewed source observer; no additional inference."""
from pathlib import Path
import subprocess, sys, json, datetime
root = Path(__file__).resolve().parent
try:
    run = subprocess.run([sys.executable, str(root / "living_observatory.py"), "due", "--state", str(root / "state")], capture_output=True, text=True, timeout=180)
    result = {"checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "exit_code": run.returncode, "stdout": run.stdout[-50000:], "stderr": run.stderr[-1000:]}
except subprocess.TimeoutExpired:
    result = {"checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "state": "EXECUTION_TIMEOUT", "limit_seconds": 180}
p = root / "state/launcher-latest.json"
tmp = p.with_suffix(".tmp")
tmp.write_text(json.dumps(result, indent=2))
tmp.replace(p)
