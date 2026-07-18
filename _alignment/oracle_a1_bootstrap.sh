#!/bin/bash
# oracle_a1_bootstrap.sh — bring up the 24GB Oracle A1 as a full dev box.
# Run ONCE on the new VM after `ssh ubuntu@<ip>`.
# Idempotent: safe to re-run.

set -euo pipefail

echo "=== Oracle A1 bootstrap — Sovereign dev box ==="
echo "Date: $(date)"
echo "Host: $(hostname)"

# ---- 1. SYSTEM UPDATE + ESSENTIAL TOOLS ----
echo "[1/8] apt update + essentials..."
sudo apt update -y
sudo apt install -y build-essential git curl wget unzip     ca-certificates gnupg lsb-release software-properties-common     python3 python3-pip python3-venv htop tmux jq ripgrep fd-find

# ---- 2. NODE 22 LTS (matches Mac setup) ----
echo "[2/8] Node 22..."
if ! command -v node &>/dev/null || [[ "$(node --version)" != v22* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi
node --version
npm --version

# ---- 3. PYTHON 3.11 + UV (matches Mac pyproject tooling) ----
echo "[3/8] Python 3.11 + uv..."
sudo apt install -y python3.11 python3.11-venv
if ! command -v uv &>/dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.local/bin/env
fi
uv --version

# ---- 4. CODE-SERVER (VS Code in browser) ----
echo "[4/8] code-server..."
if ! command -v code-server &>/dev/null; then
    curl -fsSL https://code-server.dev/install.sh | sh
fi
# Configure: bind 0.0.0.0 + no auth (we'll use SSH tunnel)
mkdir -p ~/.config/code-server
cat > ~/.config/code-server/config.yaml << 'EOF'
bind-addr: 127.0.0.1:8080
auth: none
cert: false
EOF
sudo systemctl enable --now code-server@$USER

# ---- 5. CLONE THE REPO ----
echo "[5/8] git clone..."
mkdir -p ~/work
if [[ ! -d ~/work/clawd ]]; then
    cd ~/work
    git clone https://github.com/CSOAI-ORG/clawd-workspace.git
    cd clawd-workspace
else
    cd ~/work/clawd-workspace
    git pull origin m4-handoff-2026-06-24
fi

# ---- 6. PYTHON VENV WITH ML DEPS ----
echo "[6/8] Python venv + ML deps..."
uv venv .venv --python 3.11
source .venv/bin/activate
uv pip install torch transformers peft accelerate datasets     sentencepiece safetensors einops numpy pandas matplotlib     boto3 requests pyyaml python-dotenv rich

# ---- 7. PYTHONPATH + ENV SETUP ----
echo "[7/8] env vars + secrets..."
# ~/.sovereign (sibling's path)
mkdir -p ~/.sovereign/ml-venv/bin
if [[ ! -L ~/.sovereign/ml-venv/bin/python ]]; then
    ln -sf ~/work/clawd-workspace/.venv/bin/python ~/.sovereign/ml-venv/bin/python
fi

# ---- 8. SOVEREIGN CRON + STATE ----
echo "[8/8] sovereign state dirs..."
mkdir -p ~/sovereign-temple/state
mkdir -p ~/.hermes/state
mkdir -p ~/work/clawd-workspace/_alignment
mkdir -p ~/work/clawd-workspace/_alignment/sovereign_merge_kit/models
mkdir -p ~/work/clawd-workspace/_alignment/sovereign_merge_kit/sov_owem_data

echo ""
echo "=== BOOTSTRAP COMPLETE ==="
echo ""
echo "Next steps:"
echo "  1. SSH tunnel: ssh -L 8080:127.0.0.1:8080 ubuntu@<vm-ip>"
echo "  2. Open browser: http://localhost:8080"
echo "  3. code-server auto-suggests installing Python + extensions"
echo "  4. Clone the proofof-site/api and run vercel deploy from VM"
echo ""
echo "Resource check:"
df -h / | tail -1
free -h | head -2
nproc
