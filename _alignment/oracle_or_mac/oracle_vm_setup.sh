#!/bin/bash
# oracle_vm_setup.sh — sovereign substrate setup for Oracle Cloud free-tier ARM VM
# Run on the Oracle VM after SSH login: bash oracle_vm_setup.sh
# Cost: $0/mo FOREVER (always-free tier)

set -e

echo "🥁 Oracle Sovereign Substrate Setup"
echo "==================================="
echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo ""

# 1. Update system
echo "[1/8] apt update + upgrade..."
sudo apt-get update -y
sudo apt-get upgrade -y
echo "  ✓ system up to date"

# 2. Install essentials
echo "[2/8] Installing essentials..."
sudo apt-get install -y curl git build-essential python3-pip python3-venv nginx jq htop
echo "  ✓ curl, git, python3, nginx, jq, htop installed"

# 3. Install Ollama (sovereign Mist 12 pillars substrate)
echo "[3/8] Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
fi
echo "  ✓ Ollama: $(ollama --version 2>&1 | head -1)"

# 4. Pull sovereign Mist 12 pillars substrate models
echo "[4/8] Pulling sovereign Mist 12 pillars substrate models..."
if ! ollama list | grep -q qwen2.5:3b; then
    ollama pull qwen2.5:3b
fi
echo "  ✓ Models installed: $(ollama list | grep qwen | awk '{print $1}' | tr '\n' ' ')"

# 5. Clone sovereign architecture repo
echo "[5/8] Cloning sovereign architecture..."
mkdir -p ~/sovereign
cd ~/sovereign
if [ ! -d sovereign-workspace ]; then
    git clone --depth 1 https://github.com/CSOAI-ORG/clawd-workspace.git sovereign-workspace
    cd sovereign-workspace
else
    cd sovereign-workspace
    git pull
fi
cd ~

# 6. Open firewall for sovereign substrate
echo "[6/8] Opening firewall..."
sudo firewall-cmd --permanent --add-port=22/tcp        # SSH
sudo firewall-cmd --permanent --add-port=80/tcp        # HTTP
sudo firewall-cmd --permanent --add-port=443/tcp       # HTTPS
sudo firewall-cmd --permanent --add-port=11434/tcp     # Ollama local
sudo firewall-cmd --permanent --add-port=3101/tcp      # SOV3
sudo firewall-cmd --permanent --add-port=8000/tcp      # uvicorn
sudo firewall-cmd --reload 2>&1 | head -3 || true  # no firewall-cmd on Ubuntu by default
sudo iptables -I INPUT -p tcp --dport 11434 -j ACCEPT 2>&1 || true
sudo iptables -I INPUT -p tcp --dport 3101 -j ACCEPT 2>&1 || true
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT 2>&1 || true
echo "  ✓ ports 22/80/443/11434/3101/8000 open"

# 7. Set up Cloudflare Tunnel (sovereign web egress)
echo "[7/8] Cloudflare Tunnel (sovereign web egress)..."
if ! command -v cloudflared &> /dev/null; then
    curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
    echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared focal main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
    sudo apt-get update
    sudo apt-get install -y cloudflared
fi
# Owner-gated: run `cloudflared tunnel login` then `cloudflared tunnel create` separately
echo "  ✓ cloudflared installed (run 'cloudflared tunnel login' to use)"

# 8. systemd unit for sovereign DRUM heartbeat
echo "[8/8] Setting up sovereign DRUM as systemd service..."
cat > /tmp/sovereign-drum.service << 'EOF'
[Unit]
Description=Sovereign DRUM Heartbeat
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/sovereign/sovereign-workspace/_alignment/sovereign_merge_kit/drum
ExecStart=/usr/bin/python3 drum_heartbeat.py 3600
Restart=always
RestartSec=5
StandardOutput=append:/home/ubuntu/.sovereign/logs/drum.log
StandardError=append:/home/ubuntu/.sovereign/logs/drum.log

[Install]
WantedBy=multi-user.target
EOF
sudo mv /tmp/sovereign-drum.service /etc/systemd/system/sovereign-drum.service
sudo systemctl daemon-reload
sudo systemctl enable sovereign-drum
# (don't start yet — owner-gated)

echo ""
echo "🥁 Oracle Sovereign Substrate Setup — DONE"
echo "==========================================="
echo ""
echo "Cost: \$0/mo FOREVER (Always-Free tier)"
echo ""
echo "Verify:"
echo "  ollama list"
echo "  curl http://localhost:11434/api/tags"
echo ""
echo "Start sovereign DRUM (24/7):"
echo "  sudo systemctl start sovereign-drum"
echo ""
echo "Set up Cloudflare Tunnel (sovereign web egress):"
echo "  cloudflared tunnel login"
echo "  cloudflared tunnel create sovereign-oracle"
echo "  cloudflared tunnel route dns sovereign-oracle sovereign.macoracle.dev"
echo "  cloudflared tunnel run sovereign-oracle"
echo ""
echo "From Mac, set up the Oracle ↔ Mac tunnel:"
echo "  ssh -f -N -R 11444:localhost:11434 ubuntu@<oracle-public-ip>"
echo "  ssh -f -N -L 11436:localhost:11434 ubuntu@<oracle-public-ip>"
