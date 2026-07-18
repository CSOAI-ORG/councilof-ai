#!/bin/bash
# SOVEREIGN PROD DEPLOY — 212 files (156 DEFONEOS pages + more) to Vercel
# ============================================================
# HUMAN GATE: Run this after `vercel login` (one-time browser auth)
#
# PREREQ (one-time):
#   vercel login
#
# THEN:
#   bash ~/clawd/csoai-static-deploy2/SOVEREIGN_DEPLOY.sh
#
# This deploys ALL 212 files to csoai-static-deploy2 on Vercel production.

set -e

export PATH="$HOME/.local/node/bin:$PATH"

DEPLOY_DIR="/Users/nicholas/clawd/csoai-static-deploy2"

echo "🜏 SOVEREIGN PROD DEPLOY"
echo "   Dir: $DEPLOY_DIR"
echo "   Files: $(ls $DEPLOY_DIR/*.html 2>/dev/null | wc -l | tr -d ' ') HTML pages"
echo ""

# Check auth
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Not authenticated. Run: vercel login"
    exit 1
fi

echo "✅ Authenticated as: $(vercel whoami 2>/dev/null)"
echo ""

# Ensure vercel.json exists
if [ ! -f "$DEPLOY_DIR/vercel.json" ]; then
    cat > "$DEPLOY_DIR/vercel.json" << 'VECEOF'
{
  "outputDirectory": ".",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {"source": "/(.*)", "headers": [
      {"key": "X-Content-Type-Options", "value": "nosniff"},
      {"key": "X-Frame-Options", "value": "SAMEORIGIN"}
    ]},
    {"source": "/llms.txt", "headers": [{"key": "Content-Type", "value": "text/plain; charset=utf-8"}]}
  ]
}
VECEOF
    echo "✅ Created vercel.json"
fi

# Deploy
echo "🚀 Deploying to production..."
cd "$DEPLOY_DIR"
vercel deploy --prod --yes 2>&1

echo ""
echo "✅ DEPLOY COMPLETE"
echo ""
echo "=== VERIFY (sample 5 pages) ==="
for page in index.html defoneos-os.html defoneos-sigil.html systemcard.html registry.html; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://csoai-static-deploy2.vercel.app/$page" 2>/dev/null || echo "000")
    echo "  /$page → HTTP $CODE"
done

echo ""
echo "🜏 SIGIL: SOVEREIGN-DEPLOY-READY Ed25519"
