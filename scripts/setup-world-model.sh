#!/bin/bash
# SOV3 WORLD MODEL SETUP — the most powerful setup that fits
# Pulls the optimal model stack for the 43GB Mac + Ollama

set -e

echo "🐉 ============================================"
echo "🐉 SOV3 WORLD MODEL SETUP"
echo "🐉 ============================================"
echo ""

echo "📊 Current models:"
ollama list 2>&1 | head -15
echo ""

echo "📊 Available disk: $(df -h / | tail -1 | awk '{print $4}')"
echo ""

echo "🎯 TARGET STACK (the most powerful that fits in 43GB):"
echo ""
echo "  [REASONING-HEAVY] nemotron-3-nano:30b (32.6GB)"
echo "    → NVIDIA's hybrid Mamba/Transformer (Zamba-like architecture)"
echo "    → SSM layers + MoE + 1M context"
echo "    → Best reasoning/coding/agentic"
echo ""
echo "  [REASONING-LITE] deepseek-r1:7b (already installed)"
echo "    → DeepSeek reasoning chain"
echo ""
echo "  [FAST-ROUTER] qwen2.5:3b (already installed)"
echo "    → Used by the OLM for routing"
echo ""
echo "  [CODE-SPECIALTY] falcon3:7b (already installed)"
echo ""
echo "  [MULTIMODAL] moondream (already installed)"
echo ""
echo "  [EMBEDDING] nomic-embed-text (already installed)"
echo ""

read -p "Pull nemotron-3-nano:30b? (the Zamba-like hybrid) [Y/n]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "📥 Pulling nemotron-3-nano:30b..."
    ollama pull nemotron-3-nano:30b
    echo "✅ nemotron-3-nano:30b pulled"
fi

# Test the new model
echo ""
echo "🧪 Testing the new world model..."
TEST_PROMPT="Explain the EU AI Act Article 50 in 30 words."
echo "Prompt: $TEST_PROMPT"
echo ""

echo "--- nemotron-3-nano:30b ---"
time ollama run nemotron-3-nano:30b "$TEST_PROMPT" 2>&1 | head -20

echo ""
echo "--- deepseek-r1:7b (existing) ---"
time ollama run deepseek-r1:7b "$TEST_PROMPT" 2>&1 | head -20

echo ""
echo "--- qwen2.5:3b (existing) ---"
time ollama run qwen2.5:3b "$TEST_PROMPT" 2>&1 | head -10

echo ""
echo "✅ World model setup complete!"
echo ""
echo "📊 Final model inventory:"
ollama list 2>&1 | head -20