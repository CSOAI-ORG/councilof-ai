#!/bin/bash
# Complete API Keys + Stripe Deployment Script
# Execute after getting all keys from browser tabs

echo "🚀 MEOK Complete Deployment - Starting..."
echo ""

# Navigate to project directory
cd /Users/nicholas/clawd/meok/ui/
echo "📁 Current directory: $(pwd)"
echo ""

echo "🔑 DEPLOYING API KEYS..."
echo ""

# Prompt for API keys
echo "Enter your OpenAI API key (starts with sk-):"
read -s OPENAI_KEY
echo "✅ OpenAI key received"

echo "Enter your Google AI key (starts with AIza):"  
read -s GOOGLE_KEY
echo "✅ Google AI key received"

echo "Enter your Groq API key (starts with gsk_):"
read -s GROQ_KEY  
echo "✅ Groq key received"

echo ""
echo "🚀 Deploying API keys to Vercel..."

# Deploy API keys
echo "$OPENAI_KEY" | /Users/nicholas/.local/node/bin/vercel env add OPENAI_API_KEY production
echo "✅ OpenAI deployed"

echo "$GOOGLE_KEY" | /Users/nicholas/.local/node/bin/vercel env add GOOGLE_AI_API_KEY production  
echo "✅ Google AI deployed"

echo "$GROQ_KEY" | /Users/nicholas/.local/node/bin/vercel env add GROQ_API_KEY production
echo "✅ Groq deployed"

echo ""
echo "💰 Now let's set up Stripe revenue..."
echo ""
echo "Open this tab: https://dashboard.stripe.com"
echo ""
echo "1. Switch to LIVE mode (top-left toggle)"
echo "2. Go to Products → Create Product:"
echo "   - Name: MEOK Sovereign, Price: £12.00 monthly"
echo "   - Name: MEOK Family, Price: £29.00 monthly" 
echo "3. Go to Developers → API Keys (copy both keys)"
echo "4. Go to Developers → Webhooks → Add endpoint:"
echo "   - URL: https://try.meok.ai/api/stripe/webhook"
echo "   - Copy webhook secret"
echo ""

echo "After Stripe setup, come back and we'll deploy everything!"
echo ""
echo "🎯 Next: Domain portfolio launch for \$60k-120k potential!"