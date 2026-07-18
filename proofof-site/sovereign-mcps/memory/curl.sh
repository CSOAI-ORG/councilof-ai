#!/bin/bash
# meok-sovereign-memory-mcp - API examples
# Run: bash curl.sh
#
# Episodic + graph + Ebbinghaus temporal decay
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/memory/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/memory/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Store memory ==="
echo "$ curl_call sov_memory_store '{"content": "The koi pond pH dropped to 6.5", "agent_id": "pond-mother", "tags": ["pond", "alert"], "importance": 0.9}'"

curl_call "sov_memory_store" '{"content": "The koi pond pH dropped to 6.5", "agent_id": "pond-mother", "tags": ["pond", "alert"], "importance": 0.9}'

echo "=== Recall memories ==="
echo "$ curl_call sov_memory_recall '{"query": "koi pond water", "limit": 5}'"

curl_call "sov_memory_recall" '{"query": "koi pond water", "limit": 5}'

echo "=== Link two memories ==="
echo "$ curl_call sov_memory_link '{"episode_id_a": "EP_A_HERE", "episode_id_b": "EP_B_HERE"}'"

curl_call "sov_memory_link" '{"episode_id_a": "EP_A_HERE", "episode_id_b": "EP_B_HERE"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
