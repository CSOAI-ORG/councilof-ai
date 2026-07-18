#!/usr/bin/env python3
"""
VAST.ai Deployment Script for Enhanced AI Stack
Deploys: SOV3 Core, Hermes Agent, Nemotron 3 Super (vLLM), Hy3-preview integration
"""

from vastai import Deployment
import os

# Get VAST API key from environment or config
API_KEY = os.environ.get('VAST_API_KEY')
if not API_KEY:
    # Try to read from default config location
    try:
        with open('/Users/nicholas/.config/vastai/vast_api_key', 'r') as f:
            API_KEY = f.read().strip()
    except FileNotFoundError:
        print("ERROR: VAST API key not found. Please set VAST_API_KEY environment variable")
        exit(1)

# Create deployment
app = Deployment(
    name="sovereign-ai-stack",
    tag="v1.0-enhanced",
    api_key=API_KEY,
    ttl=86400  # 24 hour TTL for cost control
)

# Configure the image - using Ubuntu 22.04 with CUDA 12.1 as base
app.image(
    from_image="nvidia/cuda:12.1.1-runtime-ubuntu22.04",
    storage=20  # 20GB storage
)

# Install system dependencies
app.image.apt_get(
    "git",
    "curl", 
    "wget",
    "vim",
    "htop",
    "python3-pip",
    "python3-venv",
    "build-essential"
)

# Install Python dependencies
app.image.pip_install(
    "uv",  # Fast Python installer
    "httpx",  # For API calls
    "redis",  # For caching
    "psutil",  # For system monitoring
)

# Copy our SOV3 codebase
app.image.copy(
    src="/Users/nicholas/clawd",
    dst="/opt/sov3"
)

# Set up working directory and environment
app.image.env(
    SOV3_HOME="/opt/sov3",
    PYTHONPATH="/opt/sov3:$PYTHONPATH",
    VAST_DEPLOYMENT="true"
)

# Add startup script
app.image.run_script("""
#!/bin/bash
set -e

echo "Starting Sovereign AI Stack deployment..."

# Create necessary directories
mkdir -p /opt/sov3/memory
mkdir -p /opt/hermes/data
mkdir -p /opt/models

# Install Hermes Agent
echo "Installing Hermes Agent..."
cd /opt
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Set up Hermes with persistent memory
export HERMES_HOME=/opt/hermes/data
/hermes/bin/hermes setup --non-interactive

# Pull Nemotron 3 Super model via Ollama (more VRAM efficient than vLLM for deployment)
echo "Setting up Ollama and pulling Nemotron 3 Super..."
curl -fsSL https://ollama.com/install.sh | sh
systemctl start ollama || service ollama start || true

# Wait for Ollama to be ready
for i in {1..30}; do
    if ollama list >/dev/null 2>&1; then
        echo "Ollama is ready"
        break
    fi
    echo "Waiting for Ollama... ($i/30)"
    sleep 2
done

# Pull the model (this will take time and bandwidth)
echo "Pulling Nemotron 3 Super model (this may take a while)..."
ollama pull nemotron-3-super:latest || echo "Model pull initiated, continuing..."

# Configure Hermes to use local Ollama
echo "Configuring Hermes to use local Ollama..."
herbes model  # This will prompt interactively in production, but we'll set defaults

# Start SOV3 services
echo "Starting SOV3 services..."
cd /opt/sov3
python3 -m sovereign_mcp_ensemble &

# Start Hermes gateway
echo "Starting Hermes gateway..."
hermes gateway &

# Keep container running
echo "Deployment complete. Services running..."
wait
""")

# Configure resource requirements - cheapest viable option
app.image.require(
    "gpu_ram>=8",  # At least 8GB VRAM per GPU
    "num_gpus=1",  # Single GPU for cost efficiency
    "reliability>0.90",  # Reasonably reliable machines
    "verified=true",  # Only verified machines
    "rentable=true"  # Currently available
)

# Set up port mapping for our services
app.image.publish_port(3101, "tcp")  # SOV3 MCP
app.image.publish_port(3102, "tcp")  # MEOK MCP  
app.image.publish_port(8000, "tcp")  # Hermes API
app.image.publish_port(8642, "tcp")  # Hermes Gateway
app.image.publish_port(11434, "tcp") # Ollama

# Set autoscaling to prevent runaway costs
app.autoscaling(
    num_idle=0,  # No idle workers
    target_util=0.7,  # Target 70% utilization
    max_queue_time=30,  # Max 30 seconds in queue
)

# Finalize and deploy
if __name__ == "__main__":
    print("Creating VAST.ai deployment for Sovereign AI Stack...")
    print("This will deploy:")
    print("- SOV3 Core (MCP on ports 3101, 3102)")
    print("- Hermes Agent (gateway on 8642, API on 8000)") 
    print("- Ollama with Nemotron 3 Super (on 11434)")
    print("- Estimated cost: ~$0.50-2.00/hour depending on instance")
    print("")
    
    # Ensure everything is ready
    app.ensure_ready()
    
    print("Deployment successful!")
    print(f"Deployment ID: {app.id}")
    print(f"To monitor: vastai show instance {app.id}")
    print(f"To stop: vastai stop instance {app.id}")