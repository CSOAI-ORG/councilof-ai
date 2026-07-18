#!/bin/bash
# Terminal Commands - Ready to Execute
# Run these after getting API keys from browser tabs

echo "🚀 MEOK Revenue Activation - Terminal Commands Ready"
echo ""

# Navigate to correct project directory
echo "📁 Navigating to MEOK UI project..."
cd /Users/nicholas/clawd/meok/ui/

echo "✅ Current directory: $(pwd)"
echo ""

echo "🔑 STEP 1: Add API Keys to Environment"
echo "After getting keys from browser tabs, run these:"
echo ""
echo "# OpenAI API Key:"
echo 'echo "sk-YOUR_OPENAI_KEY" | /Users/nicholas/.local/node/bin/vercel env add OPENAI_API_KEY production'
echo ""
echo "# Google AI Key:"  
echo 'echo "AIza-YOUR_GOOGLE_KEY" | /Users/nicholas/.local/node/bin/vercel env add GOOGLE_AI_API_KEY production'
echo ""
echo "# Groq API Key:"
echo 'echo "gsk_YOUR_GROQ_KEY" | /Users/nicholas/.local/node/bin/vercel env add GROQ_API_KEY production'
echo ""

echo "💰 STEP 2: Add Stripe Keys (after Stripe setup)"  
echo ""
echo "# Stripe Secret Key:"
echo 'echo "sk_live_YOUR_STRIPE_SECRET" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_SECRET_KEY production'
echo ""
echo "# Stripe Publishable Key:"
echo 'echo "pk_live_YOUR_STRIPE_PUBLISHABLE" | /Users/nicholas/.local/node/bin/vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production'
echo ""
echo "# Stripe Price IDs:"
echo 'echo "price_YOUR_SOVEREIGN_PRICE" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_PRICE_SOVEREIGN production'
echo 'echo "price_YOUR_FAMILY_PRICE" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_PRICE_FAMILY production'
echo ""
echo "# Stripe Webhook Secret:"
echo 'echo "whsec_YOUR_WEBHOOK_SECRET" | /Users/nicholas/.local/node/bin/vercel env add STRIPE_WEBHOOK_SECRET production'
echo ""

echo "🚀 STEP 3: Deploy to Production"
echo "/Users/nicholas/.local/node/bin/vercel --prod"
echo ""

echo "🎯 STEP 4: Test Everything"
echo "# Test API providers:"
echo "openclaw chat gpt-4o 'Testing GPT-4o integration'"
echo "openclaw chat gemini 'Testing Gemini 2.5 Pro with 1M context'"  
echo "openclaw chat groq 'Testing ultra-fast Groq inference'"
echo ""
echo "# Test payment flow:"
echo "open https://try.meok.ai"
echo ""

echo "✅ Expected Result:"
echo "- 40+ AI models active in OpenClaw"
echo "- £12-29/month subscriptions live"  
echo "- Production deployment complete"
echo ""
echo "🏆 Ready to execute revenue optimization!"