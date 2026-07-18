#!/bin/bash
# Simple VAST.ai deployment for Sovereign AI Stack

echo "Deploying Sovereign AI Stack to VAST.ai..."
echo "Using cheapest available GPU instance with 6GB+ VRAM"

# Find the absolute cheapest suitable instance
INSTANCE_ID=$(vastai search offers 'gpu_ram>=6 reliability>0.85 rented=false num_gpus=1' --order 'dph+' --limit 1 | tail -1 | awk '{print $1}')

if [ -z "$INSTANCE_ID" ]; then
    echo "Error: No suitable instances found"
    exit 1
fi

echo "Selected instance ID: $INSTANCE_ID"

# Create the instance
INSTANCE_CREATED=$(vastai create instance $INSTANCE_ID \
    --image "nvidia/cuda:12.1.1-runtime-ubuntu22.04" \
    --disk 20 \
    --label "sovereign-ai-stack" \
    --startup-script "#!/bin/bash
apt-get update && apt-get install -y git curl wget python3-pip python3-venv
cd /opt
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
export HERMES_HOME=/opt/hermes/data
mkdir -p $HERMES_HOME
/hermes/bin/hermes setup --non-interactive <<< $'y\nn\nn'
curl -fsSL https://ollama.com/install.sh | sh
systemctl start ollama || service ollama start
sleep 10
ollama pull nemotron-3-super:latest-q4_0
mkdir -p /opt/sov3/{memory,agents}
nohup /hermes/bin/hermes gateway > /var/log/hermes.log 2>&1 &
echo 'Deployment complete. Services:'
echo '  Ollama: localhost:11434'  
echo '  Hermes: localhost:8642'
echo '  SOV3: deploy to /opt/sov3 and run'
")

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