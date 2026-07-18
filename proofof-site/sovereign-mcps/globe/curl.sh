#!/bin/bash
# meok-sovereign-globe-mcp - API examples
# Run: bash curl.sh
#
# 33-hive geo-located registry + Cesium + deck.gl + WebGPU
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/globe/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/globe/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== List all 33 hives (filter by layer 0) ==="
echo "$ curl_call hive_registry '{"layer": 0}'"

curl_call "hive_registry" '{"layer": 0}'

echo "=== Full globe scene config ==="
echo "$ curl_call globe_scene_config '{}'"

curl_call "globe_scene_config" '{}'

echo "=== Compose a layer (USGS earthquakes on SOV3 core) ==="
echo "$ curl_call layer_compose '{"hive_id": "sovereign-mom", "data_source_id": "usgs_earthquakes", "visual": "arc"}'"

curl_call "layer_compose" '{"hive_id": "sovereign-mom", "data_source_id": "usgs_earthquakes", "visual": "arc"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
