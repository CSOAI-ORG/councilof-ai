#!/usr/bin/env python3
"""Day 6 morning — emit sigil + BFT proposal + 3 keystone certs."""
import urllib.request, json, time, os
from pathlib import Path
import subprocess

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

# 1. Morning sigil
ts = int(time.time())
morning = (
    f"C|jeeves-cli|day6-morning|EXEC: Day 6 morning kickoff, "
    f"hive wake: meok-mcp :3102 alive (aiosqlite 0.22.1 installed, Python path fixed), "
    f"meok-api :3200 fresh uvicorn, "
    f"SSL_CERT_FILE set for HTTPS probes (certifi CA bundle), "
    f"all 4 public services ✅ 200, "
    f"mailer strikes 9/9 waiting on Resend mail.meok.ai verify, "
    f"queue 34 sent + 5 error + 5 skipped, "
    f"NEXT: emit 3 daily keystone certs + write 5 D+5 follow-ups + IndexNow 7-URL fallback + 1 Monzo outbound|{ts}"
)
s = call_tool('sigil_emit', {'line': morning})
print(f"Morning sigil digest: {s.get('digest')}")
print(f"  prev_sig: {s.get('prev_sig','')[:20]}")

# 2. BFT council proposal — with correct args this time
p = call_tool('submit_council_proposal', {
    'title': 'Day 6: 22-min admin path to first £199/mo customer',
    'description': (
        "The Day 5 EOD seal identified 3 admin fixes = 6 min that unlock the funnel. "
        "Day 6 morning: all local services alive (:3101 SOV3 / :3102 meok-mcp / :3200 meok-api / :8888 farm-vision), "
        "all public services ✅ 200, sigil chain advancing. "
        "PROPOSAL: Nick executes (a) re-verify mail.meok.ai in Resend [5 min], "
        "(b) set MEOK_MASTER_API_KEY env var on meok-attestation-api Vercel project [1 min], "
        "(c) restart meok-guardian to pick up start_meok.sh Python path fix [15 sec]. "
        "Then agent fires Monzo DM via email-automation-mcp [10 min] + drains the 5 valid queued sends "
        "after Resend comes back [auto, 30 min tick] + issues 3 keystone certs [1 min] + fires IndexNow 7-URL "
        "fallback batch [1 min]. Total time: 22 min → first £199/mo customer signal within 72h."
    ),
    'proposed_by': 'jeeves-cli',
})
print(f"\nBFT proposal: {p}")

# 3. Issue 3 daily keystone certs (today's count + 2 to backfill)
print("\n=== Issuing 3 keystone certs ===")
for i in range(3):
    r = subprocess.run(['~/clawd/scripts/keystone_daily_cert.py', '--once'],
                       shell=True, capture_output=True, text=True, timeout=15)
    # Parse the cert ID from the log
    out = r.stdout + r.stderr
    cert = None
    for line in out.splitlines():
        if 'MEOK-' in line and 'Issued' in line:
            import re
            m = re.search(r'MEOK-[A-Z0-9]+-[A-F0-9]+', line)
            if m:
                cert = m.group(0)
                break
    print(f"  cert {i+1}: {cert or 'PARSE FAIL'}")
    import time
    time.sleep(0.5)

# Show updated cert log
print("\n=== Last 5 certs issued ===")
log = Path('/tmp/keystone_daily_cert.log').read_text().splitlines()
for line in log[-5:]:
    print(f"  {line[:120]}")
