#!/bin/bash
# Push the final 18 MCP servers to GitHub to hit 200 repos
# Run this after GitHub repo creation rate limit resets (usually 1-2 hours)

cd /Users/nicholas/clawd/mcp-marketplace

echo "🚀 Pushing final 18 MCP servers to GitHub..."

REPOS=(
  backup-ai-mcp clipboard-ai-mcp diff-ai-mcp encoder-ai-mcp
  faker-ai-mcp geolocation-ai-mcp health-check-ai-mcp icon-generator-ai-mcp
  jwt-ai-mcp lorem-ipsum-ai-mcp mock-server-ai-mcp notification-ai-mcp
  otp-ai-mcp pdf-merge-ai-mcp slugify-ai-mcp uuid-ai-mcp
  validator-ai-mcp webhook-ai-mcp
)

pushed=0
for name in "${REPOS[@]}"; do
  cd "/Users/nicholas/clawd/mcp-marketplace/$name" 2>/dev/null || continue
  gh repo create "CSOAI-ORG/$name" --public --description "MEOK AI Labs — $name MCP server" 2>/dev/null
  git remote remove origin 2>/dev/null
  git remote add origin "https://github.com/CSOAI-ORG/$name.git" 2>/dev/null
  if git push -u origin main 2>/dev/null; then
    echo "✅ $name"
    pushed=$((pushed+1))
  else
    echo "❌ $name"
  fi
  sleep 1
done

echo ""
echo "═══════════════════════════════════════════"
echo "Pushed: $pushed / 18"

current=$(gh repo list CSOAI-ORG --limit 300 2>/dev/null | wc -l)
echo "Total GitHub repos: $current"
if [ "$current" -ge 200 ]; then
  echo "🎉 TARGET HIT: 200+ MCP repos on GitHub!"
else
  echo "⏳ Still need $((200 - current)) more repos"
fi
