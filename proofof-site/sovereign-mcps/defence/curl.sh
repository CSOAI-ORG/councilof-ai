#!/bin/bash
# meok-sovereign-defence-mcp - API examples
# Run: bash curl.sh
#
# Defensive: threat + IWC + JSP 936 + C2 (never offensive)
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/defence/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/defence/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Threat assessment (1-10) ==="
echo "$ curl_call threat_assess '{"description": "Critical infrastructure cyber attack with active insider breach", "evidence": {"active_exploitation": true}}'"

curl_call "threat_assess" '{"description": "Critical infrastructure cyber attack with active insider breach", "evidence": {"active_exploitation": true}}'

echo "=== Information Warfare Capacity ==="
echo "$ curl_call iwc_calculate '{"scans_per_day": 100, "detected_threats": 90, "neutralised": 85}'"

curl_call "iwc_calculate" '{"scans_per_day": 100, "detected_threats": 90, "neutralised": 85}'

echo "=== JSP 936 NATO assurance audit ==="
echo "$ curl_call jsp936_audit '{"organisation": "CSOAI", "pillars": {"Identify critical functions and dependencies": {"documented": true, "tested": true, "incident_history": true}, "Assess threats and vulnerabilities": {"documented": true, "tested": true, "incident_history": true}, "Document and review resilience plans": {"documented": true, "tested": true, "incident_history": true}, "Test, exercise, and validate responses": {"documented": true, "tested": true, "incident_history": true}, "Manage incidents with traceable decisions": {"documented": true, "tested": true, "incident_history": true}}}'"

curl_call "jsp936_audit" '{"organisation": "CSOAI", "pillars": {"Identify critical functions and dependencies": {"documented": true, "tested": true, "incident_history": true}, "Assess threats and vulnerabilities": {"documented": true, "tested": true, "incident_history": true}, "Document and review resilience plans": {"documented": true, "tested": true, "incident_history": true}, "Test, exercise, and validate responses": {"documented": true, "tested": true, "incident_history": true}, "Manage incidents with traceable decisions": {"documented": true, "tested": true, "incident_history": true}}}'

echo "=== Defensive doctrine ==="
echo "$ curl_call doctrine '{}'"

curl_call "doctrine" '{}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
