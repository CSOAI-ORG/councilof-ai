#!/bin/bash
# meok-sovereign-eu-ai-act-kit-mcp - API examples
# Run: bash curl.sh
#
# August 2nd 2026 EU AI Act Survival Kit (Arts. 9/10/12/14/50)
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/eu-ai-act-kit/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/eu-ai-act-kit/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Audit code (kill switch present = pass) ==="
echo "$ curl_call sov_eu_act_audit '{"code_or_system": "def main(): with audit trail and tamper evident logging, kill switch enabled, human in the loop, bias audit performed"}'"

curl_call "sov_eu_act_audit" '{"code_or_system": "def main(): with audit trail and tamper evident logging, kill switch enabled, human in the loop, bias audit performed"}'

echo "=== Generate Annex IV technical documentation ==="
echo "$ curl_call sov_annex_iv_generate '{"system_name": "sovereign-globe-mcp", "description": "Cesium + deck.gl + force-graph"}'"

curl_call "sov_annex_iv_generate" '{"system_name": "sovereign-globe-mcp", "description": "Cesium + deck.gl + force-graph"}'

echo "=== Emit OSCAL policy ==="
echo "$ curl_call sov_oscal_policy '{"system_name": "sovereign-globe-mcp"}'"

curl_call "sov_oscal_policy" '{"system_name": "sovereign-globe-mcp"}'

echo "=== Bias audit ==="
echo "$ curl_call sov_bias_audit '{"system_name": "test-system", "dataset_summary": {"groups": [{"name": "a", "positive_rate": 0.75}, {"name": "b", "positive_rate": 0.74}]}}'"

curl_call "sov_bias_audit" '{"system_name": "test-system", "dataset_summary": {"groups": [{"name": "a", "positive_rate": 0.75}, {"name": "b", "positive_rate": 0.74}]}}'

echo "=== Submit evidence to EU AI Office ==="
echo "$ curl_call sov_submit_evidence '{"audit_ids": ["audit-1", "audit-2"]}'"

curl_call "sov_submit_evidence" '{"audit_ids": ["audit-1", "audit-2"]}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
