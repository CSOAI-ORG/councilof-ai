#!/bin/bash
# Fixed VAST.ai deployment for Sovereign AI Stack

echo "Deploying Sovereign AI Stack to VAST.ai..."
echo "Using cheapest available GPU instance with 6GB+ VRAM"

# Find the absolute cheapest suitable instance
INSTANCE_ID=$(vastai search offers 'gpu_ram>=6 reliability>0.85 rented=false num_gpus=1' --order 'dph+' --limit 1 | tail -1 | awk '{print $1}')

if [ -z "$INSTANCE_ID" ]; then
    echo "Error: No suitable instances found"
    exit 1
fi

echo "Selected instance ID: $INSTANCE_ID"

# Read startup script from file to avoid quoting issues
cat > /tmp/startup_script.sh << 'EOF'
#!/bin/bash
set -e
echo "Starting Sovereign AI Stack deployment..."

# Update system
apt-get update && apt-get install -y git curl wget python3-pip python3-venv

# Install Hermes Agent
echo "Installing Hermes Agent..."
cd /opt
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Set up Hermes with persistent memory
export HERMES_HOME=/opt/hermes/data
mkdir -p $HERMES_HOME
echo -e 'y\nn\nn' | /hermes/bin/hermes setup --non-interactive

# Install and start Ollama
echo "Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh
systemctl start ollama || service ollama start

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
echo "Pulling Nemotron 3 Super model..."
ollama pull nemotron-3-super:latest-q4_0

# Create SOV3 directory structure
echo "Creating SOV3 directory structure..."
mkdir -p /opt/sov3/{memory,agents}

# Start Hermes gateway in background
echo "Starting Hermes gateway..."
nohup /hermes/bin/hermes gateway > /var/log/hermes.log 2>&1 &

echo "Deployment complete!"
echo "Services:"
echo "  Ollama (Nemotron 3 Super): http://localhost:11434"
echo "  Hermes Gateway: http://localhost:8642"
echo "  SOV3: Deploy code to /opt/sov3 and run your SOV3 services"
echo ""
echo "Logs:"
echo "  Hermes: /var/log/hermes.log"
EOF

# Make startup script executable
chmod +x /tmp/startup_script.sh

# Create the instance
INSTANCE_CREATED=$(vastai create instance $INSTANCE_ID \
    --image "nvidia/cuda:12.1.1-runtime-ubuntu22.04" \
    --disk 20 \
    --label "sovereign-ai-stack" \
    --startup-script "@/tmp/startup_script.sh")

if [ -z "$INSTANCE_CREATED" ]; then
    echo "Error: Failed to create instance"
    exit 1
fi

echo "Instance created successfully!"
echo "Instance ID: $INSTANCE_CREATED"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for instance to boot"
echo "2. Get connection info with: vastai show instance $INSTANCE_CREATED"
echo "3. SSH into the instance (username is usually 'root')"
echo "4. Once connected:"
echo "   a. Verify services are running"
echo "   b. Deploy your SOV3 code to /opt/sov3"
echo "   c. Test the integration"
echo ""
echo "To monitor: vastai show instance $INSTANCE_CREATED"
echo "To stop: vastai stop instance $INSTANCE_CREATED"
echo "To destroy: vastai destroy instance $INSTANCE_CREATED"

# Cleanup
rm -f /tmp/startup_script.sh