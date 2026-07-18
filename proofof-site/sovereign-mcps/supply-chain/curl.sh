#!/bin/bash
# meok-sovereign-supply-chain-mcp - API examples
# Run: bash curl.sh
#
# CycloneDX/SPDX SBOM + SLSA provenance + OpenTimestamps Bitcoin anchor
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/supply-chain/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/supply-chain/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== Generate SBOM (CycloneDX) ==="
echo "$ curl_call sbom_create '{"package": "meok-sovereign-passport", "version": "0.1.0"}'"

curl_call "sbom_create" '{"package": "meok-sovereign-passport", "version": "0.1.0"}'

echo "=== Attest (SLSA) ==="
echo "$ curl_call attest '{"package": "meok-sovereign-passport", "version": "0.1.0", "build_id": "ci-build-12345"}'"

curl_call "attest" '{"package": "meok-sovereign-passport", "version": "0.1.0", "build_id": "ci-build-12345"}'

echo "=== Anchor to Bitcoin ==="
echo "$ curl_call anchor_bitcoin '{"attestation_id": "ATTESTATION_ID_HERE"}'"

curl_call "anchor_bitcoin" '{"attestation_id": "ATTESTATION_ID_HERE"}'

echo "=== Verify supply chain ==="
echo "$ curl_call supply_chain_verify '{"attestation_id": "ATTESTATION_ID_HERE"}'"

curl_call "supply_chain_verify" '{"attestation_id": "ATTESTATION_ID_HERE"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
