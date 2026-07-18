#!/bin/bash
# meok-sovereign-avatar-mcp - API examples
# Run: bash curl.sh
#
# VRM embodied + local voice (Kokoro TTS + whisper.cpp STT)
#
# All outputs are Ed25519-signed. Each response has a verify_url
# pointing to https://proofof.ai/avatar/<id>

BRIDGE="http://localhost:8765"
TOKEN="b65e6eec0c4629096f1f87ccadff9d12"

curl_call() {
  local tool="$1"
  local payload="$2"
  curl -s -X POST "$BRIDGE/mcp/avatar/$tool" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -m json.tool
}

echo "=== SOV3 dragon speaks ==="
echo "$ curl_call sov_avatar_say '{"text": "Welcome to the sovereign substrate.", "mood": "sovereign"}'"

curl_call "sov_avatar_say" '{"text": "Welcome to the sovereign substrate.", "mood": "sovereign"}'

echo "=== Listen (STT) ==="
echo "$ curl_call sov_avatar_listen '{"audio_path": "/tmp/audio.wav"}'"

curl_call "sov_avatar_listen" '{"audio_path": "/tmp/audio.wav"}'

echo "=== Set mood ==="
echo "$ curl_call sov_avatar_mood '{"mood": "alert"}'"

curl_call "sov_avatar_mood" '{"mood": "alert"}'

echo "=== All examples done. Verify any signature at https://proofof.ai/ ==="
