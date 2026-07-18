#!/bin/bash
# RunPod A100 Deployment Script for MEOK Character Factory
# Run this on your local machine to deploy the pipeline to RunPod

set -e

RUNPOD_API_KEY="${RUNPOD_API_KEY:-}"
RUNPOD_TEMPLATE_ID="${RUNPOD_TEMPLATE_ID:-}"
POD_NAME="meok-character-factory"
GPU_TYPE="NVIDIA RTX A100 80GB"
CLOUD_TYPE="COMMUNITY"

if [ -z "$RUNPOD_API_KEY" ]; then
    echo "ERROR: Set RUNPOD_API_KEY environment variable"
    echo "Get it from: https://www.runpod.io/console/user/settings"
    exit 1
fi

echo "=== MEOK Character Factory — RunPod Deployment ==="
echo "GPU: $GPU_TYPE"
echo "Cloud: $CLOUD_TYPE"
echo ""

# Step 1: Create pod
echo "Creating pod..."
POD_RESPONSE=$(curl -s -X POST https://api.runpod.io/v5/gym/pod \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RUNPOD_API_KEY" \
    -d "{
        \"name\": \"$POD_NAME\",
        \"imageName\": \"runpod/pytorch:2.2.0-py3.10-cuda12.1-devel-ubuntu22.04\",
        \"gpuTypeId\": \"$GPU_TYPE\",
        \"cloudType\": \"$CLOUD_TYPE\",
        \"volumeInGb\": 200,
        \"containerDiskInGb\": 50,
        \"ports\": \"22/tcp,8080/http,8188/http,8081/http\",
        \"startScript\": \"#!/bin/bash\\n\\n# Install system deps\\napt-get update && apt-get install -y git wget rsync libgl1-mesa-glx\\n\\n# Install ComfyUI\\ncd /workspace\\ngit clone https://github.com/comfyanonymous/ComfyUI.git\\ncd ComfyUI\\npip install -r requirements.txt\\n\\n# Install custom nodes\\ncd custom_nodes\\ngit clone https://github.com/comfyanonymous/ComfyUI-PuLID\\ngit clone https://github.com/Marakaya/ComfyUI-3D-Pack\\npip install -r ComfyUI-3D-Pack/requirements.txt\\n\\n# Install TRELLIS.2\\ncd /workspace\\ngit clone https://github.com/microsoft/TRELLIS.git\\ncd TRELLIS\\npip install -r requirements.txt\\n\\n# Install Wan 2.7 (community port)\\npip install wan-2.1\\n\\n# Start ComfyUI in background\\ncd /workspace/ComfyUI\\npython main.py --listen 0.0.0.0 --port 8188 &\\n\\necho 'MEOK Character Factory ready'\\n\"
    }")

POD_ID=$(echo "$POD_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

if [ -z "$POD_ID" ]; then
    echo "ERROR: Failed to create pod"
    echo "Response: $POD_RESPONSE"
    exit 1
fi

echo "Pod created: $POD_ID"
echo ""

# Step 2: Wait for pod to be running
echo "Waiting for pod to start (this takes 2-5 minutes)..."
for i in {1..30}; do
    STATUS=$(curl -s -H "Authorization: Bearer $RUNPOD_API_KEY" \
        "https://api.runpod.io/v5/gym/pod/$POD_ID" | \
        python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
    
    echo "  Status: $STATUS"
    
    if [ "$STATUS" == "RUNNING" ]; then
        break
    fi
    
    sleep 10
done

# Step 3: Get connection details
echo ""
echo "Getting connection details..."
POD_INFO=$(curl -s -H "Authorization: Bearer $RUNPOD_API_KEY" \
    "https://api.runpod.io/v5/gym/pod/$POD_ID")

HOST=$(echo "$POD_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin).get('host',''))" 2>/dev/null)
PORT_SSH=$(echo "$POD_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin).get('port',''))" 2>/dev/null)

echo ""
echo "=== POD READY ==="
echo "Pod ID: $POD_ID"
echo "SSH: ssh root@$HOST -p $PORT_SSH"
echo "ComfyUI: http://$HOST:8188"
echo "FLUX API: http://$HOST:8080"
echo "Wan API: http://$HOST:8081"
echo ""
echo "Save these to your .env file:"
echo "  FLUX_API_URL=http://$HOST:8080"
echo "  TRELLIS_API_URL=http://$HOST:8188"
echo "  COMFYUI_URL=http://$HOST:8188"
echo "  WAN_API_URL=http://$HOST:8081"
echo ""

# Step 4: Sync local pipeline to pod
echo "Syncing pipeline..."
rsync -avz --exclude='.venv' --exclude='outputs' \
    ~/clawd/meok-brand/character-factory/ \
    root@$HOST:$PORT_SSH:/workspace/meok-character-factory/ 2>/dev/null || \
    echo "  (rsync requires SSH key setup — run manually)"

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Next steps:"
echo "  1. SSH into pod and verify ComfyUI is running"
echo "  2. Download FLUX.1 [dev] and TRELLIS.2 checkpoints"
echo "  3. Train MEOKSTYLE LoRA (Day 2 of pipeline)"
echo "  4. Run pipeline.py from local Mac (orchestration)"
