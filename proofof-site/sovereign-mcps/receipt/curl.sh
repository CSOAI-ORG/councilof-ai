#!/bin/bash
# meok-sovereign-receipt-mcp - API examples
# Run: bash curl.sh
#
# Hash-chained tamper-evident audit
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/receipt/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/receipt/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Create receipt ==="
echo "$ curl_call create_receipt '{"event": "user_login", "agent": "trader-1"}'"

curl_call "create_receipt" '{"event": "user_login", "agent": "trader-1"}'

echo "=== Verify receipt ==="
echo "$ curl_call verify_receipt '{"receipt_id": "RECEIPT_ID_HERE"}'"

curl_call "verify_receipt" '{"receipt_id": "RECEIPT_ID_HERE"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
