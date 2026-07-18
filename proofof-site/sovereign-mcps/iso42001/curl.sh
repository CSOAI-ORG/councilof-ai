#!/bin/bash
# meok-sovereign-iso42001-mcp - API examples
# Run: bash curl.sh
#
# ISO/IEC 42001:2023 AIMS audit + SoA + risk assess (46 clauses)
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/iso42001/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/iso42001/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== AIMS audit (all controls at 10) ==="
echo "$ curl_call isms_audit '{"organisation": "CSOAI", "control_scores": {"A.2.1": 10, "A.2.2": 10, "A.3.1": 10, "A.4.1": 10, "A.5.1": 10, "A.6.1": 10, "A.7.1": 10, "A.8.1": 10, "A.9.1": 10, "A.10.1": 10, "A.11.1": 10}}'"

curl_call "isms_audit" '{"organisation": "CSOAI", "control_scores": {"A.2.1": 10, "A.2.2": 10, "A.3.1": 10, "A.4.1": 10, "A.5.1": 10, "A.6.1": 10, "A.7.1": 10, "A.8.1": 10, "A.9.1": 10, "A.10.1": 10, "A.11.1": 10}}'

echo "=== Statement of Applicability ==="
echo "$ curl_call soa_generate '{"organisation": "CSOAI", "controls": {"A.2": "applicable", "A.3": "applicable", "A.4": "applicable", "A.5": "applicable", "A.6": "applicable", "A.7": "applicable", "A.8": "applicable", "A.9": "applicable", "A.10": "applicable", "A.11": "applicable"}}'"

curl_call "soa_generate" '{"organisation": "CSOAI", "controls": {"A.2": "applicable", "A.3": "applicable", "A.4": "applicable", "A.5": "applicable", "A.6": "applicable", "A.7": "applicable", "A.8": "applicable", "A.9": "applicable", "A.10": "applicable", "A.11": "applicable"}}'

echo "=== Risk assessment (likelihood x impact) ==="
echo "$ curl_call risk_assess '{"system": "trading-bot", "likelihood": 5, "impact": 5}'"

curl_call "risk_assess" '{"system": "trading-bot", "likelihood": 5, "impact": 5}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
