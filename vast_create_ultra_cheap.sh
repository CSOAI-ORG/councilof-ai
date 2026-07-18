#!/bin/bash
# VAST.ai ultra-cheap instance creation script for Sovereign AI Stack

echo "=== Creating Ultra-Cheap VAST.ai Instance for Sovereign AI Stack ==="

# Search for the cheapest suitable instance with at least 6GB VRAM
INSTANCE_ID=$(vastai search offers 'gpu_ram>=6 reliability>0.85 rented=false num_gpus=1' --order 'dph+' --limit 1 | tail -1 | awk '{print $1}')

if [ -z "$INSTANCE_ID" ]; then
    echo "ERROR: No suitable instances found"
    exit 1
fi

# Get instance details to confirm pricing
INSTANCE_INFO=$(vastai search offers "id=$INSTANCE_ID" --limit 1)
HOURLY_RATE=$(echo "$INSTANCE_INFO" | awk '{print $10}')
MODEL_NAME=$(echo "$INSTANCE_INFO" | awk '{print $5}')

echo "Selected instance ID: $INSTANCE_ID"
echo "Model: $MODEL_NAME"
echo "Hourly rate: $HOURLY_RATE"
echo "VRAM: $(echo "$INSTANCE_INFO" | awk '{print $8}') GB"

# Ask for confirmation
read -p "Proceed with creating instance $INSTANCE_ID? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create the instance with our startup script
echo "Creating instance..."
INSTANCE_CREATED=$(vastai create instance $INSTANCE_ID \
    --image "nvidia/cuda:12.1.1-runtime-ubuntu22.04" \
    --disk 20 \
    --label "sovereign-ai-ultra-cheap" \
    --startup-script "$(cat <<'EOS'
#!/bin/bash
set -e
echo "Starting Sovereign AI Stack deployment on ultra-cheap instance..."

# Update system
apt-get update && apt-get upgrade -y

# Install dependencies
apt-get install -y git curl wget vim htop python3-pip python3-venv build-essential

# Install Hermes Agent
echo "Installing Hermes Agent..."
cd /opt
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Set up Hermes with persistent memory
export HERMES_HOME=/opt/hermes/data
mkdir -p $HERMES_HOME
/hermes/bin/hermes setup --non-interactive <<EOF
y
n
n
EOF

# Install and start Ollama
echo "Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh
systemctl start ollama 2>/dev/null || service ollama start 2>/dev/null || true

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
for i in {1..30}; do
    if ollama list >/dev/null 2>&1; then
        echo "Ollama is ready"
        break
    fi
    echo "Waiting for Ollama... ($i/30)"
    sleep 2
done

# Pull Nemotron 3 Super model (will use quantization to fit in 8GB VRAM)
echo "Pulling Nemotron 3 Super model (using 4-bit quantization for 8GB VRAM)..."
# We'll use a quantized version that fits in 8GB VRAM
ollama pull nemotron-3-super:latest || \
echo "Trying quantized version..." && \
ollama pull nemotron-3-super:latest-q4_0 || \
echo "Trying even smaller version..." && \
ollama pull nemotron-3-super:latest-q3_K_S

# Start services in background
echo "Starting services..."

# Create SOV3 directory structure
echo "Creating SOV3 directory structure..."
mkdir -p /opt/sov3/{memory,agents,mcp-marketplace}

# Start Hermes gateway
echo "Starting Hermes gateway..."
nohup /hermes/bin/hermes gateway > /var/log/hermes-gateway.log 2>&1 &

echo "Deployment complete!"
echo "Services:"
echo "- Ollama (Nemotron 3 Super): http://localhost:11434"
echo "- Hermes Gateway: http://localhost:8642"
echo "- SOV3: Deploy code to /opt/sov3 and run"
echo ""
echo "Notes for 8GB VRAM instance:"
echo "- Using quantized Nemotron 3 Super model to fit in VRAM"
echo "- Performance will be adequate for testing and light usage"
echo "- For production, upgrade to instance with 16GB+ VRAM"
echo ""
echo "Logs:"
echo "- Hermes: /var/log/hermes-gateway.log"
EOS
    )"
)

if [ -z "$INSTANCE_CREATED" ]; then
    echo "ERROR: Failed to create instance"
    exit 1
fi

echo "Instance created successfully!"
echo "Instance ID: $INSTANCE_CREATED"
echo ""
echo "Next steps:"
echo "1. Wait for instance to boot (2-3 minutes for this lightweight instance)"
echo "2. Get SSH connection info:"
echo "   vastai show instance $INSTANCE_CREATED"
echo "3. SSH into instance:"
echo "   ssh root@\$(vastai show instance $INSTANCE_CREATED --raw | grep -oP '(?<=host_ip\\\":\\\\\")[^\"]*')"
echo "4. Deploy SOV3 code to /opt/sov3 (you can rsync or scp from your local machine)"
echo "5. Configure Hermes to use local Ollama:"
echo "   hermes model"
echo "   (then select Ollama -> nemotron-3-super:latest or the quantized version)"
echo "6. Test the integration with simple queries"
echo ""
echo "Cost estimate: ~$HOURLY_RATE/hour = ~$(echo "$HOURLY_RATE * 24" | bc)/day = ~$(echo "$HOURLY_RATE * 24 * 30" | bc)/month (if running 24/7)"
echo ""
echo "To monitor: vastai show instance $INSTANCE_CREATED"
echo "To stop: vastai stop instance $INSTANCE_CREATED"
echo "To destroy: vastai destroy instance $INSTANCE_CREATED"
EOF