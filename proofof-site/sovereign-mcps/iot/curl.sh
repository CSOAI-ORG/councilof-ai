#!/bin/bash
# meok-sovereign-iot-mcp - API examples
# Run: bash curl.sh
#
# iOK Farm IoT + sensors + MQTT + emergency stop (FREE)
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/iot/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/iot/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Register a device ==="
echo "$ curl_call iot_register '{"device_id": "test-esp32-001", "device_type": "esp32", "name": "Test", "location": "Lab", "sensors": ["pH", "DO (mg/L)"], "actuators": ["pump"], "hive_id": "iok-pond-001"}'"

curl_call "iot_register" '{"device_id": "test-esp32-001", "device_type": "esp32", "name": "Test", "location": "Lab", "sensors": ["pH", "DO (mg/L)"], "actuators": ["pump"], "hive_id": "iok-pond-001"}'

echo "=== Log telemetry (with care-floor pH alert) ==="
echo "$ curl_call iot_telemetry '{"device_id": "test-esp32-001", "readings": {"pH": 5.0, "DO (mg/L)": 8.0}}'"

curl_call "iot_telemetry" '{"device_id": "test-esp32-001", "readings": {"pH": 5.0, "DO (mg/L)": 8.0}}'

echo "=== EMERGENCY STOP (free, no approval) ==="
echo "$ curl_call iot_emergency_stop '{"reason": "pH crash", "actor": "pond-mother"}'"

curl_call "iot_emergency_stop" '{"reason": "pH crash", "actor": "pond-mother"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
