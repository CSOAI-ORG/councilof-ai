#!/bin/bash
# meok-sovereign-immortal-mcp - API examples
# Run: bash curl.sh
#
# Bitcoin-anchored eternal memory ledger (no decay, ever)
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/immortal/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/immortal/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Store to immortal ledger (BTC-anchored) ==="
echo "$ curl_call sov_immortal_store '{"content": "Sovereign dragon never lies", "author": "sovereign"}'"

curl_call "sov_immortal_store" '{"content": "Sovereign dragon never lies", "author": "sovereign"}'

echo "=== Recall from immortal (no decay) ==="
echo "$ curl_call sov_immortal_recall '{"query": "sovereign dragon", "limit": 5}'"

curl_call "sov_immortal_recall" '{"query": "sovereign dragon", "limit": 5}'

echo "=== Get chain state ==="
echo "$ curl_call sov_immortal_chain '{}'"

curl_call "sov_immortal_chain" '{}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
