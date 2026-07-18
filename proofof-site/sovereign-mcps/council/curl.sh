#!/bin/bash
# meok-sovereign-council-mcp - API examples
# Run: bash curl.sh
#
# 12-around-1 BFT voting
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/council/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/council/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Council status ==="
echo "$ curl_call sov_council_status '{}'"

curl_call "sov_council_status" '{}'

echo "=== Propose a motion ==="
echo "$ curl_call sov_propose '{"title": "Deploy sovereign OS", "description": "Ship the 22 MCPs to PyPI"}'"

curl_call "sov_propose" '{"title": "Deploy sovereign OS", "description": "Ship the 22 MCPs to PyPI"}'

echo "=== Vote on a motion ==="
echo "$ curl_call sov_vote '{"proposal_id": "PROPOSAL_ID_HERE", "voter": "sovereign", "vote": "yes"}'"

curl_call "sov_vote" '{"proposal_id": "PROPOSAL_ID_HERE", "voter": "sovereign", "vote": "yes"}'

echo "=== Emergency halt (9/12 required) ==="
echo "$ curl_call sov_halt '{"reason": "compromise detected"}'"

curl_call "sov_halt" '{"reason": "compromise detected"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
