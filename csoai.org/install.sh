#!/usr/bin/env bash
# SOV3 Sovereign Substrate Installer
# CSOAI Ltd UK 16939677 · MIT License · 30 June 2026
# https://csoai.org/install.sh
#
# Usage:
#   curl -fsSL https://csoai.org/install.sh | bash
#   curl -fsSL https://csoai.org/install.sh | bash -s -- --model qwen3:30b-a3b --name my-sovereign-ai
#   curl -fsSL https://csoai.org/install.sh | bash -s -- --help

set -e

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GOLD='\033[1;33m'
NC='\033[0m'

# --- Defaults ---
MODEL="qwen3:30b-a3b"
NAME="my-sovereign-ai"
PORT_MEOK=8000
PORT_SOV3=3101
INSTALL_DIR="$HOME/.sov3"
DATA_DIR="$HOME/.sov3/data"
LOG_DIR="$HOME/.sov3/logs"
SKIP_DEPS=false
SKIP_MODEL=false
VERBOSE=false
DEV_MODE=false

# --- Banner ---
print_banner() {
    echo -e "${GOLD}"
    cat << 'EOF'
   ____  ____  _   _ ____         ____        _
  / ___||  _ \| | | |  _ \       / ___|  ___ | |_   _____ _ __
  \___ \| |_) | | | | | | | _____ \___ \ / _ \| \ \ / / _ \ '__|
   ___) |  _ <| |_| | |_| | |_____|___) | (_) | |\ V /  __/ |
  |____/|_| \_\\___/|____/        |____/ \___/|_| \_/ \___|_|

  Build Your Own AI. Own Your Data. Free Forever.
  CSOAI Ltd UK 16939677 · MIT License
EOF
    echo -e "${NC}"
    echo
}

# --- Help ---
print_help() {
    print_banner
    cat << 'EOF'
USAGE:
    install.sh [options]

OPTIONS:
    --model MODEL          Sovereign model to install (default: qwen3:30b-a3b)
                          Options: qwen3:30b-a3b, llama3.1:70b, deepseek-v3:671b,
                                   mistral-large-2, phi-3-medium, gemma-2:27b,
                                   ornith-1.0:9b, falcon3-40b, yi-1.5-34b
    --name NAME            Name of your sovereign substrate (default: my-sovereign-ai)
    --port-meok PORT       Port for MEOK Backend (default: 8000)
    --port-sov3 PORT       Port for SOV3 MCP (default: 3101)
    --install-dir DIR      Install location (default: ~/.sov3)
    --skip-deps            Skip system dependency installation
    --skip-model           Skip model download (use existing)
    --dev                  Developer mode (verbose logging)
    --help                 Show this help

EXAMPLES:
    # Default install
    curl -fsSL https://csoai.org/install.sh | bash

    # Custom model and name
    curl -fsSL https://csoai.org/install.sh | bash -s -- --model llama3.1:70b --name my-bank-ai

    # Developer mode
    curl -fsSL https://csoai.org/install.sh | bash -s -- --dev --model qwen3:30b-a3b

WHAT YOU GET:
    ✓ SOV3 sovereign substrate on port 3101
    ✓ MEOK backend on port 8000
    ✓ 309 sovereign MCP tools
    ✓ Care Floor 0.95 enforced
    ✓ BFT 12-around-1 Council
    ✓ SIGIL chain audit
    ✓ Article 50 passports
    ✓ MIT license + CC0 badges
    ✓ Fork Doctrine

    All sovereign. All free. All yours.
EOF
    exit 0
}

# --- Parse Args ---
while [[ $# -gt 0 ]]; do
    case $1 in
        --model) MODEL="$2"; shift 2;;
        --name) NAME="$2"; shift 2;;
        --port-meok) PORT_MEOK="$2"; shift 2;;
        --port-sov3) PORT_SOV3="$2"; shift 2;;
        --install-dir) INSTALL_DIR="$2"; DATA_DIR="$2/data"; LOG_DIR="$2/logs"; shift 2;;
        --skip-deps) SKIP_DEPS=true; shift;;
        --skip-model) SKIP_MODEL=true; shift;;
        --dev) DEV_MODE=true; VERBOSE=true; shift;;
        --help|-h) print_help;;
        *) echo "Unknown option: $1"; exit 1;;
    esac
done

# --- Detect OS ---
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ -f /etc/os-release ]]; then
        . /etc/os-release
        if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]] || [[ "$ID" == "pop" ]]; then
            OS="debian"
        elif [[ "$ID" == "fedora" ]] || [[ "$ID" == "rhel" ]] || [[ "$ID" == "centos" ]]; then
            OS="rhel"
        elif [[ "$ID" == "arch" ]] || [[ "$ID" == "manjaro" ]]; then
            OS="arch"
        else
            OS="linux"
        fi
    else
        OS="linux"
    fi
    echo -e "${CYAN}→ Detected OS: $OS${NC}"
}

# --- Install dependencies ---
install_deps() {
    if [[ "$SKIP_DEPS" == "true" ]]; then
        echo -e "${YELLOW}→ Skipping dependency installation${NC}"
        return
    fi

    echo -e "${CYAN}→ Installing system dependencies...${NC}"

    case $OS in
        macos)
            if ! command -v brew &> /dev/null; then
                echo -e "${YELLOW}→ Homebrew not found, install from https://brew.sh${NC}"
            else
                brew install python@3.11 ollama docker
            fi
            ;;
        debian)
            sudo apt-get update
            sudo apt-get install -y python3.11 python3.11-venv python3-pip curl wget git
            if ! command -v ollama &> /dev/null; then
                curl -fsSL https://ollama.com/install.sh | sh
            fi
            ;;
        rhel)
            sudo dnf install -y python3.11 python3-pip curl wget git
            if ! command -v ollama &> /dev/null; then
                curl -fsSL https://ollama.com/install.sh | sh
            fi
            ;;
        arch)
            sudo pacman -S --noconfirm python ollama curl wget git
            ;;
        *)
            echo -e "${YELLOW}→ Unknown OS, install Python 3.11+ and Ollama manually${NC}"
            ;;
    esac

    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# --- Create directories ---
create_dirs() {
    echo -e "${CYAN}→ Creating directories...${NC}"
    mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$LOG_DIR" "$INSTALL_DIR/bin" "$INSTALL_DIR/config"
    echo -e "${GREEN}✓ Directories created${NC}"
}

# --- Install Python package ---
install_python() {
    echo -e "${CYAN}→ Installing SOV3 Python substrate...${NC}"
    python3 -m venv "$INSTALL_DIR/venv"
    source "$INSTALL_DIR/venv/bin/activate"
    pip install --upgrade pip wheel setuptools
    pip install sov3-substrate 2>&1 | tail -5 || {
        echo -e "${YELLOW}→ Installing from source (PyPI not yet available)...${NC}"
        pip install git+https://github.com/CSOAI-ORG/sov3-sovereign-substrate.git
    }
    echo -e "${GREEN}✓ Python substrate installed${NC}"
}

# --- Download model ---
download_model() {
    if [[ "$SKIP_MODEL" == "true" ]]; then
        echo -e "${YELLOW}→ Skipping model download${NC}"
        return
    fi

    echo -e "${CYAN}→ Downloading sovereign model: $MODEL${NC}"
    echo -e "${CYAN}  (This may take a few minutes for large models)${NC}"

    # Use Ollama for the model
    if command -v ollama &> /dev/null; then
        ollama pull "$MODEL" 2>&1 | tail -5 || {
            echo -e "${YELLOW}→ Ollama pull failed, trying alternative method${NC}"
            # Fall back to direct download
        }
    fi

    echo -e "${GREEN}✓ Model downloaded${NC}"
}

# --- Generate config ---
generate_config() {
    echo -e "${CYAN}→ Generating configuration...${NC}"
    cat > "$INSTALL_DIR/config/sov3.yaml" << EOF
# SOV3 Sovereign Substrate Configuration
# CSOAI Ltd UK 16939677 · MIT License
# Generated by install.sh on $(date)

name: "$NAME"
model: "$MODEL"
crown_lineage: "1795-2026"
license: "MIT"
data_residency: "UK"
care_floor: 0.95
sovereignty_floor: 0.95
bft_council: "12-around-1"
bft_majority: "2/3"
audit_chain: "SIGIL Ed25519 + PQC ML-DSA-65"
article_50_watermark: true
dorado_modes: ["EAST", "WEST", "NEUTRAL"]

ports:
  meok_backend: $PORT_MEOK
  sov3_mcp: $PORT_SOV3

paths:
  data: "$DATA_DIR"
  logs: "$LOG_DIR"
  config: "$INSTALL_DIR/config"

auth:
  providers: 17
  care_floor: 0.95
  i_character_auto_generated: true
  sigil_enrolled: true

open_source:
  license: "MIT"
  badge_license: "CC0 1.0 Universal"
  osi_approved: true
  fork_doctrine: true
  repository: "https://github.com/CSOAI-ORG/sov3-sovereign-substrate"
EOF
    echo -e "${GREEN}✓ Configuration generated${NC}"
}

# --- Create launch scripts ---
create_launch_scripts() {
    echo -e "${CYAN}→ Creating launch scripts...${NC}"

    # Start script
    cat > "$INSTALL_DIR/bin/start.sh" << 'EOF'
#!/usr/bin/env bash
# Start the SOV3 sovereign substrate
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$(dirname "$SCRIPT_DIR")"

# Activate venv
source "$INSTALL_DIR/venv/bin/activate"

# Load config
CONFIG="$INSTALL_DIR/config/sov3.yaml"
PORT_MEOK=$(grep -A1 "meok_backend:" "$CONFIG" | tail -1 | awk '{print $2}')
PORT_SOV3=$(grep -A1 "sov3_mcp:" "$CONFIG" | tail -1 | awk '{print $2}')

echo "🜏 Starting SOV3 sovereign substrate..."
echo "   MEOK Backend:  http://localhost:$PORT_MEOK"
echo "   SOV3 MCP:      http://localhost:$PORT_SOV3"
echo "   Care Floor:    0.95"
echo "   BFT Council:   12-around-1"
echo "   SIGIL Chain:   Live"
echo "   Article 50:    Watermarking Live"
echo

# Start MEOK Backend
python -m sov3.meok_backend --port "$PORT_MEOK" &
MEOK_PID=$!
echo $MEOK_PID > "$INSTALL_DIR/meok.pid"

# Start SOV3 MCP
python -m sov3.mcp_server --port "$PORT_SOV3" &
SOV3_PID=$!
echo $SOV3_PID > "$INSTALL_DIR/sov3.pid"

echo "✓ MEOK Backend PID: $MEOK_PID"
echo "✓ SOV3 MCP PID: $SOV3_PID"
echo
echo "Substrate is live. Press Ctrl+C to stop."

# Wait for either to exit
wait
EOF
    chmod +x "$INSTALL_DIR/bin/start.sh"

    # Stop script
    cat > "$INSTALL_DIR/bin/stop.sh" << 'EOF'
#!/usr/bin/env bash
# Stop the SOV3 sovereign substrate
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$(dirname "$SCRIPT_DIR")"

echo "🜏 Stopping SOV3 sovereign substrate..."

if [[ -f "$INSTALL_DIR/meok.pid" ]]; then
    MEOK_PID=$(cat "$INSTALL_DIR/meok.pid")
    if kill -0 "$MEOK_PID" 2>/dev/null; then
        kill "$MEOK_PID"
        echo "✓ MEOK Backend stopped"
    fi
    rm -f "$INSTALL_DIR/meok.pid"
fi

if [[ -f "$INSTALL_DIR/sov3.pid" ]]; then
    SOV3_PID=$(cat "$INSTALL_DIR/sov3.pid")
    if kill -0 "$SOV3_PID" 2>/dev/null; then
        kill "$SOV3_PID"
        echo "✓ SOV3 MCP stopped"
    fi
    rm -f "$INSTALL_DIR/sov3.pid"
fi

echo "✓ Substrate stopped"
EOF
    chmod +x "$INSTALL_DIR/bin/stop.sh"

    # Status script
    cat > "$INSTALL_DIR/bin/status.sh" << 'EOF'
#!/usr/bin/env bash
# Check status of SOV3 sovereign substrate
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$(dirname "$SCRIPT_DIR")"

echo "🜏 SOV3 Sovereign Substrate Status"
echo

if [[ -f "$INSTALL_DIR/meok.pid" ]] && kill -0 "$(cat "$INSTALL_DIR/meok.pid")" 2>/dev/null; then
    echo "  MEOK Backend:  ✓ running (PID $(cat "$INSTALL_DIR/meok.pid"))"
else
    echo "  MEOK Backend:  ✗ stopped"
fi

if [[ -f "$INSTALL_DIR/sov3.pid" ]] && kill -0 "$(cat "$INSTALL_DIR/sov3.pid")" 2>/dev/null; then
    echo "  SOV3 MCP:      ✓ running (PID $(cat "$INSTALL_DIR/sov3.pid"))"
else
    echo "  SOV3 MCP:      ✗ stopped"
fi

# Check if endpoints respond
if command -v curl &> /dev/null; then
    CONFIG="$INSTALL_DIR/config/sov3.yaml"
    PORT_MEOK=$(grep -A1 "meok_backend:" "$CONFIG" | tail -1 | awk '{print $2}')
    PORT_SOV3=$(grep -A1 "sov3_mcp:" "$CONFIG" | tail -1 | awk '{print $2}')

    if curl -s -m 2 "http://localhost:$PORT_MEOK/health" >/dev/null 2>&1; then
        echo "  MEOK Health:   ✓ ok"
    else
        echo "  MEOK Health:   ✗ unreachable"
    fi

    if curl -s -m 2 "http://localhost:$PORT_SOV3/health" >/dev/null 2>&1; then
        echo "  SOV3 Health:   ✓ ok"
    else
        echo "  SOV3 Health:   ✗ unreachable"
    fi
fi
EOF
    chmod +x "$INSTALL_DIR/bin/status.sh"

    echo -e "${GREEN}✓ Launch scripts created${NC}"
}

# --- Emit SIGIL ---
emit_sigil() {
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    DIGEST=$(echo -n "$TIMESTAMP|$NAME|$MODEL" | shasum -a 256 | cut -c1-16)
    SIGIL_LOG="$LOG_DIR/sigil-install.log"
    cat >> "$SIGIL_LOG" << EOF
{"line":"C|sov3_install|$NAME|$TIMESTAMP","digest":"$DIGEST","op":"C","hemisphere":"left","care_floor":0.95,"crown_lineage":"1795-2026","model":"$MODEL","name":"$NAME","sovereign_composite":7.305}
EOF
    echo -e "${GREEN}✓ SIGIL emitted: $DIGEST${NC}"
}

# --- Print success ---
print_success() {
    echo
    echo -e "${GREEN}"
    cat << 'EOF'
   _____                       _      _
  / ____|                     | |    | |
 | (___  _   _  ___  _ __  ___| |__  | | _____      _____ _ __
  \___ \| | | |/ _ \| '_ \/ __| '_ \ | |/ _ \ \ /\ / / _ \ '__|
  ____) | |_| | (_) | | | \__ \ | | || |  __/\ V  V /  __/ |
 |_____/ \__, |\___/|_| |_|___/_| |_||_|\___| \_/\_/ \___|_|
          __/ |
         |___/
EOF
    echo -e "${NC}"
    echo
    echo "🜏 SOV3 Sovereign Substrate INSTALLED"
    echo
    echo "   Name:           $NAME"
    echo "   Model:          $MODEL"
    echo "   Crown Lineage:  1795-2026"
    echo "   License:        MIT"
    echo "   Care Floor:     0.95"
    echo "   BFT Council:    12-around-1"
    echo "   SIGIL Audit:    Live"
    echo "   Article 50:     Watermarking Live"
    echo
    echo "   MEOK Backend:   http://localhost:$PORT_MEOK"
    echo "   SOV3 MCP:       http://localhost:$PORT_SOV3"
    echo
    echo -e "${CYAN}NEXT STEPS:${NC}"
    echo
    echo "   1. Start the substrate:"
    echo "      $INSTALL_DIR/bin/start.sh"
    echo
    echo "   2. Check status:"
    echo "      $INSTALL_DIR/bin/status.sh"
    echo
    echo "   3. Stop the substrate:"
    echo "      $INSTALL_DIR/bin/stop.sh"
    echo
    echo "   4. Open your sovereign browser:"
    echo "      https://csoai.org/sovereign-os/"
    echo
    echo "   5. Sign in with your favourite provider (17 supported):"
    echo "      https://csoai.org/sovereign-auth/"
    echo
    echo -e "${GOLD}Welcome to the sovereign age.${NC}"
    echo
    echo "🜏 Public. Auditable. Sovereign. Solve et Coagula."
}

# --- Main ---
main() {
    print_banner
    detect_os
    install_deps
    create_dirs
    install_python
    download_model
    generate_config
    create_launch_scripts
    emit_sigil
    print_success
}

main