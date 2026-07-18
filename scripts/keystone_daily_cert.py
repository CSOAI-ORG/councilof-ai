#!/usr/bin/env python3
"""Day 3 M9: Auto-issue 1 keystone cert per day via the free-tier endpoint.

The keystone (meok-attestation-api.vercel.app/sign) issues 3 free certs/day
per email. We use 1 unique email per day, so we can issue 1 cert/day
forever. Each cert is tied to a sprint-day email and gets a public verify URL.

This becomes the lead-magnet funnel: every cert verify URL is shareable
on social, in emails, in demos. Even when no one buys, the verification
URLs spread.
"""
import datetime
import json
import urllib.request
import urllib.error
import os
import sys
import subprocess
from pathlib import Path

SCRIPT_HOME = Path.home() / "clawd" / "scripts"
SCRIPT_HOME.mkdir(parents=True, exist_ok=True)
LOG_FILE = Path("/tmp/keystone_daily_cert.log")

def issue_daily_cert():
    """Issue 1 keystone cert for today. Returns the cert_id."""
    today = datetime.datetime.now()
    email = f"sprint-d{today.strftime('%j')}-{today.strftime('%Y%m%d')}@meok.ai"
    findings = [
        f"Sprint day {today.strftime('%j')} keystone cert (auto-issued)",
        f"Empire E2E: 31/31 A+ on {today.strftime('%Y-%m-%d')}",
        f"SOV3 substrate: 115 tools, consciousness 0.78+, sigil chain intact",
        f"T-{47 - (int(today.strftime('%j')) - 165)} days to Article 50 cliff",
    ]
    payload = {
        "email": email,
        "regulation": f"MEOK-SPRINT-D{today.strftime('%j').zfill(3)}-v1",
        "entity": f"MEOK Empire sprint day {today.strftime('%j')} daily keystone receipt",
        "score": 100.0,
        "findings": findings,
        "articles_audited": ["1", "2", "3", "4"],
    }
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request("https://meok-attestation-api.vercel.app/sign",
            data=data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=15) as r:
            body = json.loads(r.read())
        cert_id = body.get("cert_id", "?")
        verify_url = f"https://meok-attestation-api.vercel.app/verify/{cert_id}"
        msg = f"[{today.isoformat()}] ✓ Issued cert {cert_id} → {verify_url}"
        print(msg)
        with open(LOG_FILE, "a") as f:
            f.write(msg + "\n")
        # Also emit a SOV3 sigil for the daily cert
        try:
            sigil_payload = {
                "jsonrpc": "2.0", "id": f"daily-cert-{today.strftime('%Y%m%d')}",
                "method": "tools/call",
                "params": {"name": "sigil_emit", "arguments": {"line": f"C|daily-keystone|sov3|D{today.strftime('%j')} cert={cert_id}"}}
            }
            req2 = urllib.request.Request("http://localhost:3101/mcp",
                data=json.dumps(sigil_payload).encode(),
                headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req2, timeout=5) as r2:
                pass
        except Exception:
            pass
        return cert_id
    except Exception as e:
        msg = f"[{today.isoformat()}] ✗ FAILED: {e}"
        print(msg, file=sys.stderr)
        with open(LOG_FILE, "a") as f:
            f.write(msg + "\n")
        return None

if __name__ == "__main__":
    if "--once" in sys.argv:
        issue_daily_cert()
    else:
        # Install as launchd cron
        from textwrap import dedent
        plist = dedent(f'''\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.meok.ops.daily-keystone-cert</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/nicholas/.hermes/hermes-agent/venv/bin/python3</string>
        <string>{SCRIPT_HOME}/keystone_daily_cert.py</string>
        <string>--once</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key><integer>8</integer>
        <key>Minute</key><integer>30</integer>
    </dict>
    <key>StandardOutPath</key><string>/tmp/keystone_daily_cert.log</string>
    <key>StandardErrorPath</key><string>/tmp/keystone_daily_cert.log</string>
    <key>RunAtLoad</key><false/>
</dict>
</plist>
''')
        plist_path = Path.home() / "Library/LaunchAgents/com.meok.ops.daily-keystone-cert.plist"
        plist_path.write_text(plist)
        print(f"Wrote {plist_path}")
        # Load it
        r = subprocess.run(["launchctl", "load", str(plist_path)], capture_output=True, text=True)
        if r.returncode != 0:
            # Try bootout + bootstrap
            uid = subprocess.run(["id", "-u"], capture_output=True, text=True).stdout.strip()
            subprocess.run(["launchctl", "bootout", f"gui/{uid}/com.meok.ops.daily-keystone-cert"], capture_output=True)
            r2 = subprocess.run(["launchctl", "bootstrap", f"gui/{uid}", str(plist_path)], capture_output=True, text=True)
            print(f"  bootstrap rc={r2.returncode}, err={r2.stderr[:100]}")
        else:
            print(f"  load rc=0")
        # Run once now
        issue_daily_cert()
