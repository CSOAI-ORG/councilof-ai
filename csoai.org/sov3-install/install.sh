#!/bin/bash
# SOV3 Open Hands OS — TUI Installer for Mac/Linux/Windows
# Usage: curl -sSL https://sov3.csoai.org/install.sh | bash

set -e

echo "🜏 SOV3 Open Hands OS — Installer"
echo ""

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$OS" in
  darwin) OS="macos" ;;
  linux) OS="linux" ;;
  mingw*|msys*|cygwin*) OS="windows" ;;
esac

echo "Detected OS: $OS"

# Install Python venv if needed
if ! command -v python3 &> /dev/null; then
  echo "❌ Python 3 not found. Please install Python 3.11+"
  exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Python version: $PYTHON_VERSION"

# Create ~/.sov3
INSTALL_PATH="$HOME/.sov3"
mkdir -p "$INSTALL_PATH"
echo "Install path: $INSTALL_PATH"

# Download SOV3
echo "Downloading SOV3 sovereign substrate..."
curl -sSL https://github.com/CSOAI-ORG/sov3/archive/refs/heads/main.tar.gz -o /tmp/sov3.tar.gz
tar -xzf /tmp/sov3.tar.gz -C "$INSTALL_PATH" --strip-components=1

# Setup venv
echo "Setting up Python venv..."
python3 -m venv "$INSTALL_PATH/venv"
source "$INSTALL_PATH/venv/bin/activate"

# Install deps
pip install --quiet --upgrade pip
pip install --quiet -r "$INSTALL_PATH/requirements.txt"

# Create symlink
if [ "$OS" = "macos" ] || [ "$OS" = "linux" ]; then
  mkdir -p "$HOME/.local/bin"
  ln -sf "$INSTALL_PATH/venv/bin/sov3" "$HOME/.local/bin/sov3"
  echo "Symlink: $HOME/.local/bin/sov3"
fi

# Mark installed
echo "installed_at: $(date)" > "$INSTALL_PATH/INSTALLED"
echo "os: $OS" >> "$INSTALL_PATH/INSTALLED"
echo "python: $PYTHON_VERSION" >> "$INSTALL_PATH/INSTALLED"

echo ""
echo "✅ SOV3 Open Hands OS installed successfully!"
echo ""
echo "Launch with: sov3"
echo "Or: $INSTALL_PATH/venv/bin/sov3"
echo ""
echo "The sovereign AI OS is yours. The minute you launch, it starts working it out."