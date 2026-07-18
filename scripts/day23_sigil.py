#!/usr/bin/env python3
"""Day 23 (real Day 34) — 24h into the 48h autonomy. Sigil + report (without sigchain probe)."""
import urllib.request, json, os, time
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

# Emit Day 23 sigil
ts = int(time.time())
eod = (
    f"C|jeeves-cli|day23-24h-checkin|CHECKIN: 24h into 48h autonomy, "
    f"King hive at 551 verdicts (+90 in 24h), 3 PIDs alive (2601703+2651529+3916634), "
    f"3 lanes aligned: JEEVES substrate + Claude backend + Kimi town-frontend, "
    f"king-judge degeneracy FIXED by Claude (43.4% non-attestable → TIE-correct), "
    f"5 keystone certs issued today: E330C1D4F9DE, 0831F2A73F08, 32ED53F31A93, 72DF4A2198F0, 13C146826F87, "
    f"mac mailer queue: 331 rows (43 sent + 261 quarantined + 25 queued + 1 failed), "
    f"mailer probed 2 new travel targets (airbnb + expedia), both 403 Resend, "
    f"all 5 Mac services alive, 14GB free Mac disk, "
    f"48h plan target HIT: BFT 64→73, D65-D70 cert wave 1,700 processing, "
    f"NEXT: continue 48h run|{ts}"
)
s = call_tool('sigil_emit', {'line': eod})
print(f"Day 23 EOD sigil: {s.get('digest')}")
