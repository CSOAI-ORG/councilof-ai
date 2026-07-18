#!/bin/bash
# meok-sovereign-passport-mcp - API examples
# Run: bash curl.sh
#
# Ed25519 agent identity + narrowing-invariant delegation
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/passport/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/passport/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Create passport ==="
echo "$ curl_call create_passport '{"agent_id": "trader-1", "agent_name": "trader", "scopes": ["payments"]}'"

curl_call "create_passport" '{"agent_id": "trader-1", "agent_name": "trader", "scopes": ["payments"]}'

echo "=== Verify passport ==="
echo "$ curl_call verify_passport '{"passport_id": "trader-1"}'"

curl_call "verify_passport" '{"passport_id": "trader-1"}'

echo "=== Create delegation (narrowing invariant) ==="
echo "$ curl_call create_delegation '{"parent_passport_id": "trader-1", "child_agent_id": "trader-1-sub", "scopes": []}'"

curl_call "create_delegation" '{"parent_passport_id": "trader-1", "child_agent_id": "trader-1-sub", "scopes": []}'

echo "=== Evaluate intent ==="
echo "$ curl_call evaluate_intent '{"passport_id": "trader-1", "action": "send_payment", "resource": "/api/payments", "agent_level": "senior", "care_floor_validated": true, "bft_council_id": "c1"}'"

curl_call "evaluate_intent" '{"passport_id": "trader-1", "action": "send_payment", "resource": "/api/payments", "agent_level": "senior", "care_floor_validated": true, "bft_council_id": "c1"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
