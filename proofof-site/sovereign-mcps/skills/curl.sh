#!/bin/bash
# meok-sovereign-skills-mcp - API examples
# Run: bash curl.sh
#
# Skill lifecycle CREATE-EVAL-EDIT-REVIEW-PACKAGE
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/skills/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/skills/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Create skill ==="
echo "$ curl_call sov_skill_create '{"name": "Test Skill", "content": "# Test skill body", "author": "sovereign"}'"

curl_call "sov_skill_create" '{"name": "Test Skill", "content": "# Test skill body", "author": "sovereign"}'

echo "=== Evaluate skill ==="
echo "$ curl_call sov_skill_evaluate '{"skill_id": "SKILL_ID_HERE", "score": 0.85, "criteria": {"clarity": 0.9}}'"

curl_call "sov_skill_evaluate" '{"skill_id": "SKILL_ID_HERE", "score": 0.85, "criteria": {"clarity": 0.9}}'

echo "=== Review skill (approve) ==="
echo "$ curl_call sov_skill_review '{"skill_id": "SKILL_ID_HERE", "reviewer": "councilof", "verdict": "approve"}'"

curl_call "sov_skill_review" '{"skill_id": "SKILL_ID_HERE", "reviewer": "councilof", "verdict": "approve"}'

echo "=== Package skill ==="
echo "$ curl_call sov_skill_package '{"skill_id": "SKILL_ID_HERE"}'"

curl_call "sov_skill_package" '{"skill_id": "SKILL_ID_HERE"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
