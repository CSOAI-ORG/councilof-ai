#!/bin/bash
# meok-sovereign-satellite-mcp - API examples
# Run: bash curl.sh
#
# 6 free satellite sources (Sentinel/Landsat/MODIS/DEM/OSM)
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/satellite/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/satellite/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Query Sentinel-2 for Yorkshire farm ==="
echo "$ curl_call sov_sat_query '{"source": "sentinel-2", "bbox": {"n": 54.0, "s": 53.0, "e": -0.5, "w": -1.5}, "start_date": "2026-06-01", "end_date": "2026-06-30"}'"

curl_call "sov_sat_query" '{"source": "sentinel-2", "bbox": {"n": 54.0, "s": 53.0, "e": -0.5, "w": -1.5}, "start_date": "2026-06-01", "end_date": "2026-06-30"}'

echo "=== List scenes for an AOI ==="
echo "$ curl_call sov_sat_scenes '{"aoi_name": "yorkshire-farm", "source": "sentinel-2"}'"

curl_call "sov_sat_scenes" '{"aoi_name": "yorkshire-farm", "source": "sentinel-2"}'

echo "=== Substrate status (6 free sources) ==="
echo "$ curl_call sov_sat_status '{}'"

curl_call "sov_sat_status" '{}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
