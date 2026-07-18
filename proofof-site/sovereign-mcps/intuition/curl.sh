#!/bin/bash
# meok-sovereign-intuition-mcp - API examples
# Run: bash curl.sh
#
# 16-dim Mamba-2 state-space hunch engine (3+ matches = CONFIRMED)
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/intuition/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/intuition/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Observe a 16-dim state ==="
echo "$ curl_call intuition_observe '{"state": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], "source": "sov3"}'"

curl_call "intuition_observe" '{"state": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], "source": "sov3"}'

echo "=== Find similar past states (cosine sim) ==="
echo "$ curl_call intuition_match '{"query_state": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], "limit": 5, "threshold": 0.7}'"

curl_call "intuition_match" '{"query_state": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], "limit": 5, "threshold": 0.7}'

echo "=== Get a hunch (natural language) ==="
echo "$ curl_call intuition_hunch '{"query_state": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], "threshold": 0.7, "min_matches": 3}'"

curl_call "intuition_hunch" '{"query_state": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], "threshold": 0.7, "min_matches": 3}'

echo "=== 16-dim subspace status ==="
echo "$ curl_call intuition_status '{}'"

curl_call "intuition_status" '{}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
