#!/bin/bash
# M4 Mesh Gateway - M2 Node Registration Script
# Run this ON THE M4 (or wherever the mesh gateway at :3205 lives)

set -euo pipefail

# Configuration
M2_IP="${M2_IP:-192.168.50.176}"
M2_PORT="${M2_PORT:-11434}"
MESH_GATEWAY="${MESH_GATEWAY:-http://localhost:3205}"
NODE_NAME="${NODE_NAME:-m2-air-node}"

echo "========================================"
echo "  Mesh Node Registration (M4 Gateway)"
echo "========================================"
echo ""
echo "M2 Node:      $M2_IP:$M2_PORT"
echo "Mesh Gateway: $MESH_GATEWAY"
echo "Node Name:    $NODE_NAME"
echo ""

# Step 1: Check M2 is reachable
echo "[1/4] Checking M2 Ollama node is reachable..."
if ! curl -sf "http://$M2_IP:$M2_PORT" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot reach Ollama on $M2_IP:$M2_PORT"
    echo "   Make sure the M2 is on the same network and Ollama is running."
    exit 1
fi
echo "✅ M2 Ollama is reachable"
echo ""

# Step 2: Fetch models from M2
echo "[2/4] Fetching models from M2..."
MODELS_JSON=$(curl -sf "http://$M2_IP:$M2_PORT/api/tags" 2>/dev/null | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    models = [{"name": m["name"], "size": m.get("size", 0), "parameter_size": m.get("details",{}).get("parameter_size","")} for m in data.get("models", [])]
    json.dump(models, sys.stdout)
except Exception as e:
    sys.exit(1)
') || true

if [ -z "$MODELS_JSON" ] || [ "$MODELS_JSON" = "null" ]; then
    echo "⚠️  Could not parse models, using default list"
    MODELS_JSON='[{"name":"qwen3:0.6b"},{"name":"qwen3:1.7b"},{"name":"qwen3:4b"},{"name":"nomic-embed-text:latest"},{"name":"bge-m3:latest"},{"name":"llama3.1:8b"},{"name":"llama3.2:3b"}]'
fi

echo "✅ Models fetched:"
echo "$MODELS_JSON" | python3 -m json.tool 2>/dev/null || echo "$MODELS_JSON"
echo ""

# Step 3: Register with mesh gateway
echo "[3/4] Registering node with mesh gateway..."
PAYLOAD=$(cat <<PAYLOAD
{
    "name": "$NODE_NAME",
    "host": "$M2_IP",
    "port": $M2_PORT,
    "platform": "darwin/arm64",
    "models": $MODELS_JSON,
    "capabilities": ["chat", "embeddings"],
    "status": "active"
}
PAYLOAD
)

RESPONSE=$(curl -sf -X POST "$MESH_GATEWAY/nodes" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" 2>/dev/null) || true

if [ -z "$RESPONSE" ]; then
    echo "⚠️  No response from gateway. Trying alternate endpoint /register..."
    RESPONSE=$(curl -sf -X POST "$MESH_GATEWAY/register" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" 2>/dev/null) || true
fi

if [ -n "$RESPONSE" ]; then
    echo "✅ Gateway response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "⚠️  Could not get a response from $MESH_GATEWAY"
    echo "   You may need to check if the gateway is running."
fi
echo ""

# Step 4: Verify
echo "[4/4] Verifying node list..."
NODES=$(curl -sf "$MESH_GATEWAY/nodes" 2>/dev/null) || true
if [ -n "$NODES" ]; then
    echo "✅ Current nodes:"
    echo "$NODES" | python3 -m json.tool 2>/dev/null || echo "$NODES"
else
    echo "ℹ️  Could not fetch node list (endpoint may differ)"
fi

echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "To test the M2 node from this M4:"
echo "  curl http://$M2_IP:$M2_PORT/api/tags"
echo ""
