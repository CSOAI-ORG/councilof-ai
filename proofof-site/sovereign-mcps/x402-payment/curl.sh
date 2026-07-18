#!/bin/bash
# meok-sovereign-x402-payment-mcp - API examples
# Run: bash curl.sh
#
# HTTP 402 micropayments for agent tool calls
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/x402-payment/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/x402-payment/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Create x402 challenge ==="
echo "$ curl_call x402_challenge '{"service": "sov_passport_create", "tier": "pro", "quantity": 1}'"

curl_call "x402_challenge" '{"service": "sov_passport_create", "tier": "pro", "quantity": 1}'

echo "=== Settle x402 invoice ==="
echo "$ curl_call x402_settle '{"invoice_id": "INVOICE_ID_HERE", "payment_method": "stripe"}'"

curl_call "x402_settle" '{"invoice_id": "INVOICE_ID_HERE", "payment_method": "stripe"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
