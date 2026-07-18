#!/bin/bash
# meok-sovereign-pond-mcp - API examples
# Run: bash curl.sh
#
# 13mx12m koi pond + care floor (pH/DO/temp/ammonia/nitrite) + 9 malamutes
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/pond/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/pond/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Pond status ==="
echo "$ curl_call pond_status '{}'"

curl_call "pond_status" '{}'

echo "=== Log healthy reading ==="
echo "$ curl_call pond_log '{"ph": 7.4, "do_mgL": 8.2, "temp_C": 22.1, "humidity": 65.0, "source": "esp32-pond-001"}'"

curl_call "pond_log" '{"ph": 7.4, "do_mgL": 8.2, "temp_C": 22.1, "humidity": 65.0, "source": "esp32-pond-001"}'

echo "=== Care action (water change, requires council) ==="
echo "$ curl_call pond_care_action '{"action": "water_change", "reason": "weekly", "requires_council": true}'"

curl_call "pond_care_action" '{"action": "water_change", "reason": "weekly", "requires_council": true}'

echo "=== EMERGENCY (free, no approval) ==="
echo "$ curl_call pond_emergency '{"emergency_type": "ph_crash", "severity": "critical", "actor": "pond-mother"}'"

curl_call "pond_emergency" '{"emergency_type": "ph_crash", "severity": "critical", "actor": "pond-mother"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
