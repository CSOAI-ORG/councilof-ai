#!/bin/bash
# VAST.ai instance creation script for Sovereign AI Stack (Final Version)

echo "=== Creating VAST.ai Instance for Sovereign AI Stack ==="

# Use the known good instance ID from our search
INSTANCE_ID="32787434"  # GTX 1070 Ti from earlier search
INSTANCE_NAME="sovereign-ai-stack-final"

echo "Using instance ID: $INSTANCE_ID (GTX 1070 Ti)"
echo "Specifications: 8GB VRAM, ~$0.0387/hour"

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
    --label "$INSTANCE_NAME" \
    --startup-script "$(cat <<'EOS'
#!/bin/bash
set -e
echo "Starting Sovereign AI Stack deployment..."

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

# Pull Nemotron 3 Super model (quantized for 8GB VRAM)
echo "Pulling Nemotron 3 Super model (quantized versions)..."
# Try different quantized versions that fit in 8GB VRAM
ollama pull nemotron-3-super:latest-q4_0 2>/dev/null || \
ollama pull nemotron-3-super:latest-q3_K_S 2>/dev/null || \
ollama pull nemotron-3-super:latest-q2_K 2>/dev/null || \
echo "Trying to pull any available version..." && \
ollama pull nemotron-3-super:latest

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
echo "Notes:"
echo "- Using quantized Nemotron 3 Super model to fit in 8GB VRAM"
echo "- Performance adequate for testing and light/moderate usage"
echo "- For heavy production workloads, consider upgrading VRAM"
echo ""
echo "Logs:"
echo "- Hermes: /var/log/hermes-gateway.log"
echo "- Check status: ps aux | grep -E '(hermes|ollama)'"
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
echo "1. Wait for instance to boot (2-3 minutes)"
echo "2. Monitor deployment: vastai show instance $INSTANCE_CREATED"
echo "3. Get connection details when ready:"
echo "   IPASSIGN=\$(vastai show instance $INSTANCE_CREATED --raw 2>/dev/null | grep -oP '(?<=host_ip\\\":\\\\\")[^\"]*')"
echo "   if [ -n \"\$IPASSIGN\" ]; then echo \"SSH: ssh root@\$IPASSIGN\"; fi"
echo "4. Once connected via SSH:"
echo "   a. Deploy SOV3 code to /opt/sov3 (rsync from local)"
echo "   b. Configure Hermes: hermes model (select Ollama -> nemotron-3-super:*)"
echo "   c. Test: hermes \"Hello, verify the integration is working\""
echo ""
echo "Estimated cost: ~$0.0387/hour = ~$0.93/day = ~$28/month"
echo ""
echo "To check status: vastai show instance $INSTANCE_CREATED"
echo "To stop: vastai stop instance $INSTANCE_CREATED"
echo "To destroy: vastai destroy instance $INSTANCE_CREATED"
EOF
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
echo "1. Wait for instance to boot (2-3 minutes)"
echo "2. Monitor deployment: vastai show instance $INSTANCE_CREATED"
echo "3. Get connection details when ready:"
echo "   IPASSIGN=\$(vastai show instance $INSTANCE_CREATED --raw 2>/dev/null | grep -oP '(?<=host_ip\\\":\\\\\")[^\"]*')"
echo "   if [ -n \"\$IPASSIGN\" ]; then echo \"SSH: ssh root@\$IPASSIGN\"; fi"
echo "4. Once connected via SSH:"
echo "   a. Deploy SOV3 code to /opt/sov3 (rsync from local)"
echo "   b. Configure Hermes: hermes model (select Ollama -> nemotron-3-super:*)"
echo "   c. Test: hermes \"Hello, verify the integration is working\""
echo ""
echo "Estimated cost: ~$0.0387/hour = ~$0.93/day = ~$28/month"
echo ""
echo "To check status: vastai show instance $INSTANCE_CREATED"
echo "To stop: vastai stop instance $INSTANCE_CREATED"
echo "To destroy: vastai destroy instance $INSTANCE_CREATED"
EOF