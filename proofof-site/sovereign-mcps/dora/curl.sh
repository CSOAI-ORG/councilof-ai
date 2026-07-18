#!/bin/bash
# meok-sovereign-dora-mcp - API examples
# Run: bash curl.sh
#
# EU DORA 5-pillar audit + CTPP classify + incident reporting
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/dora/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/dora/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== 5-pillar audit ==="
echo "$ curl_call dora_audit '{"entity": "CSOAI", "pillar_scores": {"pillar_1": 10, "pillar_2": 10, "pillar_3": 10, "pillar_4": 10, "pillar_5": 10}}'"

curl_call "dora_audit" '{"entity": "CSOAI", "pillar_scores": {"pillar_1": 10, "pillar_2": 10, "pillar_3": 10, "pillar_4": 10, "pillar_5": 10}}'

echo "=== CTPP classify (HSBC 200K employees) ==="
echo "$ curl_call dora_classify '{"entity_type": "HSBC", "employees": 200000, "is_credit_institution": true}'"

curl_call "dora_classify" '{"entity_type": "HSBC", "employees": 200000, "is_credit_institution": true}'

echo "=== ICT incident (ransomware = critical) ==="
echo "$ curl_call dora_incident '{"description": "Ransomware encrypts customer data", "affected_users": 100000}'"

curl_call "dora_incident" '{"description": "Ransomware encrypts customer data", "affected_users": 100000}'

echo "=== Pillar 3 resilience (all 5 tests passed) ==="
echo "$ curl_call dora_resilience '{"test_results": {"vulnerability_assessment": {"passed": true}, "penetration_testing": {"passed": true}, "stress_testing": {"passed": true}, "red_team": {"passed": true}, "scenario_testing": {"passed": true}}}'"

curl_call "dora_resilience" '{"test_results": {"vulnerability_assessment": {"passed": true}, "penetration_testing": {"passed": true}, "stress_testing": {"passed": true}, "red_team": {"passed": true}, "scenario_testing": {"passed": true}}}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
