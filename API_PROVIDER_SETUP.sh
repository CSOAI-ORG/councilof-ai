#!/bin/bash
# API Provider Setup Script - Execute Immediately
# Adds 10 premium LLM providers to OpenClaw

echo "🚀 OpenClaw API Provider Expansion - Starting..."

# Create backup of current config
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.backup.$(date +%Y%m%d_%H%M%S).json

echo "✅ Backup created"

# Copy prepared configuration
cp /Users/nicholas/clawd/openclaw-providers-config.json ~/.openclaw/openclaw.json

echo "✅ New provider configuration installed"

# Restart OpenClaw to load new providers
echo "🔄 Restarting OpenClaw..."
openclaw restart

echo "🎉 OpenClaw Provider Expansion Complete!"
echo ""
echo "NEW PROVIDERS AVAILABLE:"
echo "🅾️  GPT-4o (OpenAI)"
echo "🧩 o1 Reasoner (OpenAI)" 
echo "♊ Gemini 2.5 Pro (Google)"
echo "⚡ Groq Ultra-Fast (Llama 3.3 70B)"
echo "🔍 Perplexity (Search-augmented)"
echo "🐋 DeepSeek V3 (Cost-effective)"
echo "🌬️  Mistral Large (European AI)"
echo "❌ xAI Grok 2 (Twitter AI)"
echo "🤝 Together AI (Open source models)"
echo "🏠 Ollama Local (Your existing models)"
echo ""
echo "NEXT STEPS:"
echo "1. Get API keys from providers you want to use"
echo "2. Add keys to environment variables"
echo "3. Test each provider: openclaw chat [provider] 'test message'"
echo ""
echo "PRIORITY API KEYS TO GET:"
echo "- OpenAI: https://platform.openai.com/api-keys"
echo "- Google: https://makersuite.google.com/app/apikey"  
echo "- Groq: https://console.groq.com/keys"
echo ""
echo "Expected result: 40+ premium models available in OpenClaw!"