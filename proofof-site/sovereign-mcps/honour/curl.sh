#!/bin/bash
# meok-sovereign-honour-mcp - API examples
# Run: bash curl.sh
#
# 19 Sovereign Factors + 16 care probes + 12-around-1 ethics
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/honour/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/honour/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Assess against 19 factors ==="
echo "$ curl_call sov_honour_assess '{"action": "Read a public document with consent"}'"

curl_call "sov_honour_assess" '{"action": "Read a public document with consent"}'

echo "=== Care floor (all 16 probes 'yes' = pass) ==="
echo "$ curl_call sov_care_validate '{"action": "test", "answers": {"probe_0": "yes", "probe_1": "yes", "probe_2": "yes", "probe_3": "yes", "probe_4": "yes", "probe_5": "yes", "probe_6": "yes", "probe_7": "yes", "probe_8": "yes", "probe_9": "yes", "probe_10": "yes", "probe_11": "yes", "probe_12": "yes", "probe_13": "yes", "probe_14": "yes", "probe_15": "yes"}}'"

curl_call "sov_care_validate" '{"action": "test", "answers": {"probe_0": "yes", "probe_1": "yes", "probe_2": "yes", "probe_3": "yes", "probe_4": "yes", "probe_5": "yes", "probe_6": "yes", "probe_7": "yes", "probe_8": "yes", "probe_9": "yes", "probe_10": "yes", "probe_11": "yes", "probe_12": "yes", "probe_13": "yes", "probe_14": "yes", "probe_15": "yes"}}'

echo "=== Ethics review (12-around-1) ==="
echo "$ curl_call sov_ethics_review '{"action": "Read a public document"}'"

curl_call "sov_ethics_review" '{"action": "Read a public document"}'

echo "=== Honour substrate status ==="
echo "$ curl_call sov_honour_status '{}'"

curl_call "sov_honour_status" '{}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
