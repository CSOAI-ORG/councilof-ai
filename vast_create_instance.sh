#!/bin/bash
# VAST.ai instance creation script for Sovereign AI Stack

echo "=== Creating VAST.ai Instance for Sovereign AI Stack ==="

# Configuration
INSTANCE_NAME="sovereign-ai-stack-v1"
IMAGE_NAME="nvidia/cuda:12.1.1-runtime-ubuntu22.04"
DISK_SIZE=20  # GB

# Search for cheapest suitable instance
echo "Searching for suitable GPU instance..."
INSTANCE_ID=$(vastai search offers 'gpu_ram>=6 reliability>0.85 rented=false num_gpus=1' --order 'dph-' --limit 1 | tail -1 | awk '{print $1}')

if [ -z "$INSTANCE_ID" ]; then
    echo "ERROR: No suitable instances found"
    exit 1
fi

echo "Found instance ID: $INSTANCE_ID"

# Get instance details to confirm specs
echo "Getting instance details..."
vastai show instance $INSTANCE_ID

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
    --image $IMAGE_NAME \
    --disk $DISK_SIZE \
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

# Pull Nemotron 3 Super model
echo "Pulling Nemotron 3 Super model (this will take time)..."
ollama pull nemotron-3-super:latest

# Start services in background
echo "Starting services..."

# Start SOV3 (assuming it's in /opt/sov3)
if [ -d "/opt/sov3" ]; then
    echo "SOV3 directory found, copying local code..."
    # In a real deployment, we'd copy the code here
    # For now, we'll note that SOV3 needs to be deployed separately
    echo "NOTE: SOV3 code needs to be deployed to /opt/sov3"
else
    echo "Creating SOV3 directory structure..."
    mkdir -p /opt/sov3/{memory,agents,mcp-marketplace}
fi

# Start Hermes gateway
echo "Starting Hermes gateway..."
nohup /hermes/bin/hermes gateway > /var/log/hermes-gateway.log 2>&1 &

# Start Ollama API server (already running as service)
echo "Ollama API available at http://localhost:11434"

echo "Deployment complete!"
echo "Services:"
echo "- Ollama (Nemotron 3 Super): http://localhost:11434"
echo "- Hermes Gateway: http://localhost:8642"
echo "- SOV3: To be deployed separately"
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
echo "1. Wait for instance to boot (2-5 minutes)"
echo "2. SSH into instance: ssh root@$(vastai show instance $INSTANCE_CREATED --raw | grep -oP '(?<=host_ip\":\")[^\"]*')"
echo "3. Deploy SOV3 code to /opt/sov3"
echo "4. Configure Hermes to use local Ollama: hermes model (then select Ollama -> nemotron-3-super:latest)"
echo "5. Test the integration"
echo ""
echo "To monitor: vastai show instance $INSTANCE_CREATED"
echo "To stop: vastai stop instance $INSTANCE_CREATED"
echo "To destroy: vastai destroy instance $INSTANCE_CREATED"