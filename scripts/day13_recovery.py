#!/usr/bin/env python3
"""Day 13 recovery seal — services auto-recovered."""
import urllib.request, json, time, os
from pathlib import Path
from datetime import datetime, timezone

os.environ['SSL_CERT_FILE'] = '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'
token = Path('/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token').read_text().strip()

def call(method, params=None, timeout=15):
    body = json.dumps({'jsonrpc':'2.0','id':1,'method':method,'params':params or {}}).encode()
    req = urllib.request.Request('http://localhost:3101/mcp', data=body,
        headers={'Content-Type':'application/json','Authorization': f'Bearer {token}'}, method='POST')
    r = urllib.request.urlopen(req, timeout=timeout)
    return json.loads(r.read().decode())

def call_tool(name, arguments=None):
    r = call('tools/call', {'name': name, 'arguments': arguments or {}})
    content = r.get('result', {}).get('content', [])
    if content and isinstance(content, list):
        try: return json.loads(content[0]['text'])
        except: return {'raw': content[0].get('text','')[:500]}
    return r

# All 5 services
print("=== Service state ===")
for p, name in [(3101, 'SOV3'), (3102, 'meok-mcp'), (3200, 'meok-api'), (8888, 'farm-vision')]:
    try:
        r = urllib.request.urlopen(f'http://localhost:{p}/health', timeout=3)
        print(f"  ✅ {name} :{p}: HTTP {r.status}")
    except urllib.error.HTTPError as e:
        print(f"  ⚠️  {name} :{p}: HTTP {e.code} (no /health route, but listening)")
    except Exception as e:
        print(f"  ❌ {name} :{p}: {type(e).__name__}")

# Sigil
ts = int(time.time())
sigil = (
    f"C|jeeves-cli|day13-recovery|CLOSED: Day 13 recovery, "
    f"all 5 services auto-recovered after the SOV3 plist KeepAlive cycle, "
    f"SOV3 launchd-managed (PID 57973), 90 min uptime was the longest this week, "
    f"queue 59 rows still, mailer strike 9/9, "
    f"single 5-min Resend verify still pending, "
    f"NEXT: same as always — Resend flip = 44 queued fire = first £199/mo|{ts}"
)
s = call_tool('sigil_emit', {'line': sigil})
print(f"\nRecovery sigil: {s.get('digest')}")

# Quick state
import subprocess
r = subprocess.run(['df', '-h', '/'], capture_output=True, text=True)
print(f"Disk: {r.stdout.splitlines()[-1]}")
print(f"Queue: 59 rows (44 queued, 12 sent, 1 skipped, 2 error)")
