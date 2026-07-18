#!/bin/bash
# Install Ollama models for MEOK/SOV3
# Run: bash ~/clawd/scripts/install-ollama-models.sh

set -e

echo "🔧 Installing Ollama models for MEOK/SOV3"
echo "========================================"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama is not running at localhost:11434"
    echo "   Start with: ollama serve"
    exit 1
fi

echo ""
echo "📥 Pulling models (this may take a while)..."
echo ""

# HIGH Priority - Required
echo "⏳ Pulling qwen2.5:7b (required for council deliberation)..."
ollama pull qwen2.5:7b

# MEDIUM Priority - Enhancement
echo ""
echo "⏳ Pulling llama3.1:8b (optional enhancement)..."
ollama pull llama3.1:8b

# Verify
echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Installed models:"
ollama list

echo ""
echo "💡 Next steps:"
echo "   1. Verify SOV3 can use Ollama: curl localhost:3101/health"
echo "   2. Test a query through the system"
