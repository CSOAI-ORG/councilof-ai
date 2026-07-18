#!/bin/bash
# MEOK status ping service
# Runs daily at 09:00 (via launchd), checks all critical systems,
# and emails Nick at hello@meok.ai if anything is red.
# Uses email-automation-mcp.send_email (gated on SMTP env vars).
set +e

LOG=/tmp/meok_status_ping.log
ERRORS=""

echo "$(date -u +%FT%TZ) --- MEOK status ping start ---" >> $LOG

# 1. Check SOV3 hub
SOV3=$(curl -s -m 5 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"d","method":"tools/call","params":{"name":"coord_get_dashboard","arguments":{}}}' 2>&1)
if [ -z "$SOV3" ]; then
  ERRORS="${ERRORS}\n- SOV3 hub unreachable (localhost:3101)"
  echo "  SOV3: ❌ unreachable" >> $LOG
else
  SOV3_AGENTS=$(echo "$SOV3" | python3 -c "import json,sys; d=json.load(sys.stdin); c=json.loads(d['result']['content'][0]['text']); print(c['agents']['total'])" 2>/dev/null)
  SOV3_TASKS=$(echo "$SOV3" | python3 -c "import json,sys; d=json.load(sys.stdin); c=json.loads(d['result']['content'][0]['text']); print(c['tasks']['completed'])" 2>/dev/null)
  echo "  SOV3: ✅ $SOV3_AGENTS agents, $SOV3_TASKS tasks" >> $LOG
fi

# 2. Check keystone
KEYSTONE=$(curl -sI -m 5 https://meok-attestation-api.vercel.app/health 2>&1 | head -1)
if echo "$KEYSTONE" | grep -q "200"; then
  echo "  Keystone: ✅ 200" >> $LOG
else
  ERRORS="${ERRORS}\n- Keystone /health returned: $KEYSTONE"
  echo "  Keystone: ❌ $KEYSTONE" >> $LOG
fi

# 3. Check meok.ai (follow redirects — Vercel apex → www is 307)
MEOK_AI=$(curl -sI -L -m 8 https://meok.ai 2>&1 | head -1)
if echo "$MEOK_AI" | grep -q "200"; then
  echo "  meok.ai: ✅ 200" >> $LOG
else
  ERRORS="${ERRORS}\n- meok.ai returned: $MEOK_AI"
  echo "  meok.ai: ❌ $MEOK_AI" >> $LOG
fi

# 4. Check proofof.ai (follow redirects — Vercel apex → www is 307)
PROOFOF=$(curl -sI -L -m 8 https://proofof.ai 2>&1 | head -1)
if echo "$PROOFOF" | grep -q "200"; then
  echo "  proofof.ai: ✅ 200" >> $LOG
else
  ERRORS="${ERRORS}\n- proofof.ai returned: $PROOFOF"
  echo "  proofof.ai: ❌ $PROOFOF" >> $LOG
fi

# 5. Check csoai.org
CSOAI=$(curl -sI -m 5 https://csoai.org 2>&1 | head -1)
if echo "$CSOAI" | grep -q "200"; then
  echo "  csoai.org: ✅ 200" >> $LOG
else
  ERRORS="${ERRORS}\n- csoai.org returned: $CSOAI"
  echo "  csoai.org: ❌ $CSOAI" >> $LOG
fi

# 6. Check disk space
DISK_FREE=$(df -h /Users/nicholas | tail -1 | awk '{print $4}' | sed 's/Gi//')
DISK_PCT=$(df -h /Users/nicholas | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_PCT" -gt 95 ]; then
  ERRORS="${ERRORS}\n- Disk at ${DISK_PCT}% (only ${DISK_FREE}GB free)"
  echo "  Disk: ⚠ ${DISK_PCT}% used (${DISK_FREE}GB free)" >> $LOG
else
  echo "  Disk: ✅ ${DISK_PCT}% used (${DISK_FREE}GB free)" >> $LOG
fi

echo "$(date -u +%FT%TZ) --- MEOK status ping end ---" >> $LOG
echo "" >> $LOG

# If any errors, email Nick
if [ -n "$ERRORS" ]; then
  SUBJECT="🔴 MEOK status: ${DISK_PCT}% disk, some services down"
  BODY="MEOK daily status ping — errors detected:

${ERRORS}

Full log: /tmp/meok_status_ping.log

— MEOK status ping service (auto-fired via launchd)"
  echo "  → ERRORS detected. Would email Nick: $SUBJECT" >> $LOG
  # The actual email send is gated on SMTP env vars
  python3 -c "
import urllib.request, json, os
payload = {
  'jsonrpc': '2.0', 'id': 'ping', 'method': 'tools/call',
  'params': {'name': 'mcp_bridge_call', 'arguments': {
    'server_name': 'email-automation-mcp', 'tool_name': 'send_email',
    'arguments': {
      'to': 'hello@meok.ai',
      'subject': '''$SUBJECT''',
      'body': '''$BODY'''
    }
  }}
}
try:
  req = urllib.request.Request('http://localhost:3101/mcp', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
  with urllib.request.urlopen(req, timeout=10) as r:
    out = r.read().decode()
    if 'preview' in out:
      print('  Email NOT sent (preview mode, SMTP not configured)')
    elif 'sent' in out.lower():
      print('  Email SENT to hello@meok.ai')
    else:
      print('  Email send response: ' + out[:200])
except Exception as e:
  print('  Email send ERROR: ' + str(e))
"
else
  echo "  → All green. No email sent." >> $LOG
fi
