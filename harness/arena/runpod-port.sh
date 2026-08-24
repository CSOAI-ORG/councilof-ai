#!/bin/bash
# runpod-port.sh — discover a pod's current public SSH port from the RunPod API.
# Pods restart + RunPod reassigns ephemeral SSH ports (seen 2026-08-24: A100 23166->14954,
# sink 25804->33982). Never hardcode a stale port.
#   PORT=$(bash runpod-port.sh <podID> <public-ip>)
set -u
POD_ID="${1:?pod id}"
PUB_IP="${2:-}"
API_KEY=$(cat "$HOME/.runpod/api_key" 2>/dev/null | tr -d '[:space:]')
[ -n "$API_KEY" ] || { echo 0; exit 1; }

RESP=$(curl -s --max-time 15 -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"query":"{ myself { pods { id name runtime { ports { ip publicPort privatePort type } } } } }"}' \
  https://api.runpod.io/graphql 2>/dev/null)

# pass RESP via a temp file to avoid pipe+heredoc conflict; parse in python.
TMP=$(mktemp); echo "$RESP" > "$TMP"
RESULT=$(python3 - "$TMP" "$POD_ID" "$PUB_IP" <<'PY'
import json, sys
path, pod_id, pub_ip = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    d = json.load(open(path))
except Exception:
    print(0); sys.exit(0)
for p in d.get('data', {}).get('myself', {}).get('pods', []):
    if p['id'] != pod_id: continue
    ports = (p.get('runtime') or {}).get('ports', []) or []
    tcp = [x for x in ports if x.get('type') == 'tcp']
    if pub_ip:
        tt = [x for x in tcp if x.get('ip') == pub_ip] or tcp
    else:
        tt = tcp
    for x in tt:
        if x.get('publicPort'):
            print(x['publicPort']); sys.exit(0)
print(0)
PY
)
rm -f "$TMP"
echo "$RESULT"
