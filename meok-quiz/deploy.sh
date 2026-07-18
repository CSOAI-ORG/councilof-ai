#!/bin/bash
# Deploy EU AI Act Readiness Quiz to Vercel
# Usage: ./deploy-quiz.sh

set -e

QUIZ_DIR="$HOME/clawd/meok-quiz"
SEO_DIR="$HOME/clawd/meok-ai-act-pages"

echo "=== MEOK AI Labs — Deployment Script ==="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy quiz
echo ""
echo "📋 Deploying EU AI Act Readiness Quiz..."
cd "$QUIZ_DIR"
QUIZ_URL=$(vercel --prod --yes 2>&1 | grep "https://" | head -1)
echo "✅ Quiz deployed: $QUIZ_URL"

# Deploy SEO pages
echo ""
echo "📊 Deploying 500 SEO pages..."
cd "$SEO_DIR"
SEO_URL=$(vercel --prod --yes 2>&1 | grep "https://" | head -1)
echo "✅ SEO pages deployed: $SEO_URL"

echo ""
echo "=== Deployment Complete ==="
echo "Quiz: $QUIZ_URL"
echo "SEO Pages: $SEO_URL"
echo ""
echo "Next steps:"
echo "1. Add quiz URL to meok.ai navigation"
echo "2. Set up domain alias for SEO pages (meok.ai/eu-ai-act/)"
echo "3. Submit sitemap to Google Search Console"
