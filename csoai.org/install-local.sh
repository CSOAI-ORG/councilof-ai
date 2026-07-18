#!/bin/bash
# SOV3 Open Hands OS — LOCAL Installer for the Mac
# This is the one that works RIGHT NOW (no internet required, uses local Mac files)
# Usage: bash install-local.sh

set -e

echo "🜏 SOV3 Open Hands OS — LOCAL Installer"
echo ""
echo "This installer works from your local Mac (no internet required)."
echo ""

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$OS" in
  darwin) OS="macos" ;;
  linux) OS="linux" ;;
  mingw*|msys*|cygwin*) OS="windows" ;;
esac
echo "Detected OS: $OS"

if ! command -v python3 &> /dev/null; then
  echo "❌ Python 3 not found."
  exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Python version: $PYTHON_VERSION"

# Find local repo (where the user cloned clawd)
if [ -d "$HOME/clawd/sovereign-temple" ]; then
  LOCAL_REPO="$HOME/clawd"
elif [ -d "/Users/nicholas/clawd/sovereign-temple" ]; then
  LOCAL_REPO="/Users/nicholas/clawd"
else
  echo "❌ clawd repo not found. Clone first:"
  echo "  git clone https://github.com/CSOAI-ORG/clawd-workspace.git ~/clawd"
  exit 1
fi

echo "Local repo: $LOCAL_REPO"

# Install path
INSTALL_PATH="$HOME/.sov3"
mkdir -p "$INSTALL_PATH"

# Copy SOV3 to install path (preserving structure)
echo "Copying SOV3 to $INSTALL_PATH..."
cp -R "$LOCAL_REPO/sovereign-temple/." "$INSTALL_PATH/" 2>/dev/null || cp -R "$LOCAL_REPO/sovereign-temple"/* "$INSTALL_PATH/"
echo "✅ SOV3 copied to $INSTALL_PATH"

# Mark installed
cat > "$INSTALL_PATH/INSTALLED" << EOF
installed_at: $(date)
os: $OS
python: $PYTHON_VERSION
install_method: install-local.sh
repo: $LOCAL_REPO
EOF

# Create launcher
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/sov3" << EOF
#!/bin/bash
# SOV3 sovereign AI OS launcher
INSTALL_PATH="\$HOME/.sov3"
if [ ! -d "\$INSTALL_PATH" ]; then
  echo "❌ SOV3 not installed. Run: bash $LOCAL_REPO/csoai.org/install-local.sh"
  exit 1
fi
echo "🜏 SOV3 Open Hands OS — Sovereign AI OS"
echo ""
echo "Install path: \$INSTALL_PATH"
echo "OS: $OS"
echo "Python: $PYTHON_VERSION"
echo ""
echo "Available tools: 276 SOV3 tools (mind + brain + router + ZAMBA + striving + map + BIG BRAIM + intuition + DORADO + Open Hands)"
echo ""
echo "Test SOV3:"
echo "  python3 \$INSTALL_PATH/sovereign-mcp-server.py"
echo ""
echo "Connect to live SOV3 on VM:"
echo "  curl -s -m 5 http://localhost:3101/mcp -X POST -H 'Content-Type: application/json' \\"
echo "    -d '{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"tools/list\",\"params\":{}}'"
echo ""
echo "Or via local SSH tunnel:"
echo "  ssh -L 3101:localhost:3101 meok-backend (then localhost:3101 works)"
echo ""
echo "🜏 The world is sovereign. Run SOV3 from anywhere."
EOF
chmod +x "$HOME/.local/bin/sov3"

# Add to PATH (zsh + bash)
RC="$HOME/.zshrc"
[ ! -f "$RC" ] && RC="$HOME/.bashrc"
if [ -f "$RC" ] && ! grep -q '.local/bin' "$RC" 2>/dev/null; then
  echo "" >> "$RC"
  echo '# Added by SOV3 Open Hands installer' >> "$RC"
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$RC"
fi

echo ""
echo "✅ SOV3 Open Hands OS installed successfully!"
echo ""
echo "TEST IT NOW:"
echo "  source $RC  # reload shell config"
echo "  sov3"
echo ""
echo "OR:"
echo "  $HOME/.local/bin/sov3"
echo ""
echo "🜏 The sovereign AI OS is installed on your Mac."
echo "   276 tools. Ready. Sovereign."