#!/bin/bash
# ~/clawd/scripts/sigil_emit_cron.sh — emit a sigil at 06:00 + 18:00 daily
# Continuous Ed25519 chain for audit trail.

set -e
source ~/clawd/sovereign-temple/.venv/bin/activate 2>/dev/null || true
export SSL_CERT_FILE=/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem

# Emit a daily sigil with disk + mailer + cert count
DISK=$(df -h / | tail -1 | awk '{print $4}')
QUEUE=$(python3 -c "
import json
from pathlib import Path
q = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
rows = [json.loads(l) for l in q.read_text().splitlines() if l.strip()]
from collections import Counter
c = Counter(r.get('status','?') for r in rows)
print(','.join(f'{k}={v}' for k,v in c.items()))
")
CERTS=$(grep -c '2026-' /tmp/keystone_daily_cert.log 2>/dev/null || echo 0)
TS=$(date '+%Y-%m-%d %H:%M BST')

LINE="C|jeeves-cron|daily-${TS}|AUTO: disk=$DISK queue=[$QUEUE] week_certs=$CERTS"

python3 -c "
import urllib.request, json
token = open('/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token').read().strip()
body = json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'sigil_emit','arguments':{'line':'$LINE'}}}).encode()
req = urllib.request.Request('http://localhost:3101/mcp', data=body,
    headers={'Content-Type':'application/json','Authorization': f'Bearer {token}'}, method='POST')
try:
    r = json.loads(urllib.request.urlopen(req, timeout=10).read().decode())
    content = r.get('result', {}).get('content', [{}])
    t = json.loads(content[0].get('text','{}'))
    d = t.get('digest', '?')[:16]
    print(f'[sigil-cron] {d}')
except Exception as e:
    print(f'[sigil-cron] err: {e}')
"
