#!/usr/bin/env bash
# fund-watch.sh — poll the burner payer's USDC balance on Base every 5 min; the first time it is > 0,
# run settle-all-doors.py once (then the daily 02:40Z tick owns it). Receipts: /workspace/lanes/logs/fund-watch.log
ADDR=$(grep ^X402_PAYER_ADDRESS= /root/.csoai-keys.env 2>/dev/null | cut -d= -f2); [ -n "$ADDR" ] || ADDR=$(grep ^X402_PAYER_ADDRESS= "$HOME/.csoai-keys.env" | cut -d= -f2)
USDC=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
LOG=/workspace/lanes/logs/fund-watch.log; mkdir -p /workspace/lanes/logs
while :; do
  DATA="0x70a08231000000000000000000000000${ADDR#0x}"
  BAL=$(curl -s --max-time 20 -H 'content-type: application/json' https://mainnet.base.org -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$USDC\",\"data\":\"$DATA\"},\"latest\"]}" | python3 -c 'import json,sys; r=json.load(sys.stdin).get("result"); print(int(r,16) if r else -1)' 2>/dev/null || echo -1)
  echo "$(date -u +%FT%TZ) usdc_atomic=$BAL" >> "$LOG"
  if [ "$BAL" -gt 0 ] 2>/dev/null; then
    echo "$(date -u +%FT%TZ) FUNDED ($BAL atomic) — running settle-all-doors once" >> "$LOG"
    python3 /workspace/lanes/loops/settle-all-doors.py >> "$LOG" 2>&1
    echo "$(date -u +%FT%TZ) settle pass done; exiting watch" >> "$LOG"; exit 0
  fi
  sleep 300
done
