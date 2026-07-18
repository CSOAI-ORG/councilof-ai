#!/bin/bash
# meok-sovereign-governance-mcp - API examples
# Run: bash curl.sh
#
# 5-element Zero Trust + 4-level maturity + killswitch
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/governance/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/governance/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Evaluate policy ==="
echo "$ curl_call policy_evaluate '{"identity": "trader-1", "behavior": "send_payment", "data": ["amount=1000"]}'"

curl_call "policy_evaluate" '{"identity": "trader-1", "behavior": "send_payment", "data": ["amount=1000"]}'

echo "=== Free killswitch (no approval needed) ==="
echo "$ curl_call kill_switch '{"action": "halt", "actor": "operator", "reason": "emergency"}'"

curl_call "kill_switch" '{"action": "halt", "actor": "operator", "reason": "emergency"}'

echo "=== Maturity assess ==="
echo "$ curl_call maturity_assess '{"agent_id": "trader-1", "successful_actions": 1500, "incidents_total": 2, "care_ratio": 0.98}'"

curl_call "maturity_assess" '{"agent_id": "trader-1", "successful_actions": 1500, "incidents_total": 2, "care_ratio": 0.98}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
