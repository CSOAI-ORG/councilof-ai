#!/bin/bash
# a100-ollama-tunnel.sh — durable A100->Mac :11434 Ollama tunnel.
# Resolves the pod's live SSH port each run (RunPod reallocates ports on restart),
# so the tunnel survives port drift. KeepAlive relaunches on failure.
POD_ID="qdigrzjp5na1ek"
RPC="/opt/homebrew/bin/runpodctl"
SSHK="$HOME/.runpod/ssh/runpodctl-ssh-key"

INFO=$("$RPC" ssh info "$POD_ID" 2>/dev/null)
read HOST PORT <<< "$(echo "$INFO" | python3 -c 'import sys,json
try:
    d=json.load(sys.stdin); print(d.get("ip",""), d.get("port",""))
except Exception: pass')"
[ -z "$HOST" ] && HOST="38.128.232.57"
[ -z "$PORT" ] && PORT="23166"   # last-known good fallback

echo "$(date -u +%FT%TZ) resolving $POD_ID -> $HOST:$PORT" >> /tmp/ollama-tunnel-runpod.log
exec /usr/bin/ssh -N -L "11434:127.0.0.1:11434" \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new \
  -i "$SSHK" -p "$PORT" "root@$HOST"
