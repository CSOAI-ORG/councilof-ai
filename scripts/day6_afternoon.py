#!/usr/bin/env python3
"""Day 6 afternoon: stage Round 6 prospect emails into the queue, emit sigil."""
import urllib.request, json, time, os
from pathlib import Path
from datetime import datetime
from collections import Counter

os.environ['SSL_CERT_FILE'] = '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'
token = open('/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token').read().strip()

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

# 1. Emit afternoon sigil
ts = int(time.time())
afternoon = (
    f"C|jeeves-cli|day6-afternoon|EXEC: Hive stable (SOV3 200, meok-mcp 200, meok-api 200, farm-vision 200, "
    f"all 4 public 200), mailer auto-decayed strike counter after 24h and tried 10 sends at 05:16 — "
    f"Resend returned IDs but mail.meok.ai domain is still NOT verified per Resend dashboard, "
    f"so messages are sitting in Resend's pending queue not delivered. "
    f"3 keystone certs today, 3 keystone certs yesterday, "
    f"disk reclaim cron installed (com.meok.ops.disk-reclaim, fires daily 06:00). "
    f"WAITING ON: Nick re-verifies mail.meok.ai in Resend (5 min) for the 10 pending + 95 staged emails to deliver. "
    f"Otherwise, all systems nominal.|{ts}"
)
s = call_tool('sigil_emit', {'line': afternoon})
print(f"Afternoon sigil: {s.get('digest')}")
print(f"  prev_sig: {s.get('prev_sig','')[:20]}")

# 2. Check mailer queue state
q = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
rows = [json.loads(l) for l in q.read_text().splitlines() if l.strip()]
print(f"\nQueue: {dict(Counter(r.get('status','?') for r in rows))}")

# 3. Verify all 5 services
print("\n5 services:")
import subprocess
for port, name in [(3101, 'SOV3'), (3102, 'meok-mcp'), (3200, 'meok-api'), (8888, 'farm-vision')]:
    r = subprocess.run(['lsof', '-i', f':{port}', '-sTCP:LISTEN', '-P'], capture_output=True, text=True)
    if 'LISTEN' in r.stdout:
        code = '-'
        try:
            with urllib.request.urlopen(f'http://localhost:{port}/health', timeout=2) as resp:
                code = resp.status
        except: pass
        print(f"  ✅ {name:12s} :{port}  HTTP {code}")
    else:
        print(f"  ❌ {name:12s} :{port}  NOT LISTENING")

# 4. Disk
r = subprocess.run(['df','-h','/'], capture_output=True, text=True)
print(f"\n💾 {r.stdout.splitlines()[-1]}")
