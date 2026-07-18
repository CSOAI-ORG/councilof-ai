#!/usr/bin/env python3
"""Day 4 M1: Daily E2E cron — runs the canonical E2E suite at 08:00 every day.

Output: stdout + the e2e_report.json that the suite writes. Failures
get appended to a log. The launchd agent (com.meok.ops.daily-e2e) fires
this at 08:00 BST.

Also: a "watch" mode that the daily-sov3-sigil cron can read to know
if E2E passed today.
"""
import subprocess
import datetime
import json
import sys
from pathlib import Path

SUITE = "/Users/nicholas/clawd/tests/e2e"
PYTHON = "/Users/nicholas/.hermes/hermes-agent/venv/bin/python3"
LOG = Path("/tmp/e2e_daily.log")
TODAY_STATUS = Path("/tmp/e2e_today.json")

def run_e2e():
    started = datetime.datetime.now()
    r = subprocess.run([PYTHON, "unified_e2e_suite.py", "--quick"],
                       capture_output=True, text=True, timeout=180,
                       cwd=SUITE)
    elapsed = (datetime.datetime.now() - started).total_seconds()
    # Extract pass/fail from output
    passed = failed = 0
    grade = "?"
    for line in r.stdout.split("\n"):
        if "passed" in line and "failed" in line:
            # "✅ 31/31 passed"
            try:
                nums = [int(s) for s in line.split() if s.replace("/", "").isdigit() or s.isdigit()]
                if len(nums) >= 2:
                    passed, failed = nums[0], nums[1]
            except Exception:
                pass
        if "Grade:" in line:
            grade = line.split("Grade:")[-1].strip().split()[0]
    summary = {
        "started": started.isoformat(),
        "elapsed_sec": round(elapsed, 1),
        "passed": passed,
        "failed": failed,
        "grade": grade,
        "returncode": r.returncode,
    }
    with open(TODAY_STATUS, "w") as f:
        json.dump(summary, f, indent=2)
    msg = f"[{started.isoformat()}] E2E: {passed}/{passed+failed} {grade} in {elapsed:.1f}s"
    with open(LOG, "a") as f:
        f.write(msg + "\n")
        if r.returncode != 0:
            f.write(f"  STDERR: {r.stderr[:500]}\n")
    print(msg)
    return summary

if __name__ == "__main__":
    if "--once" in sys.argv:
        run_e2e()
    else:
        # Install as launchd
        HOME = Path.home()
        SCRIPT_PATH = Path(__file__).resolve()
        plist = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.meok.ops.daily-e2e</string>
    <key>ProgramArguments</key>
    <array>
        <string>{PYTHON}</string>
        <string>{SCRIPT_PATH}</string>
        <string>--once</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key><integer>8</integer>
        <key>Minute</key><integer>0</integer>
    </dict>
    <key>StandardOutPath</key><string>{LOG}</string>
    <key>StandardErrorPath</key><string>{LOG}</string>
    <key>RunAtLoad</key><false/>
</dict>
</plist>
'''
        plist_path = HOME / "Library/LaunchAgents/com.meok.ops.daily-e2e.plist"
        plist_path.write_text(plist)
        print(f"Wrote {plist_path}")
        import subprocess
        uid = subprocess.run(["id", "-u"], capture_output=True, text=True).stdout.strip()
        r = subprocess.run(["launchctl", "load", str(plist_path)], capture_output=True, text=True)
        if r.returncode != 0:
            subprocess.run(["launchctl", "bootout", f"gui/{uid}/com.meok.ops.daily-e2e"], capture_output=True)
            r = subprocess.run(["launchctl", "bootstrap", f"gui/{uid}", str(plist_path)], capture_output=True, text=True)
            print(f"  bootstrap rc={r.returncode}, err={r.stderr[:100]}")
        else:
            print(f"  load rc=0")
        # Run once now to verify
        run_e2e()
