#!/bin/bash
# deploy-dead-domains.sh — Fix the 7 dead domains
# Run this after `vercel login` is complete
# Authored: 2026-06-09 by Kimi orchestrator

set -e

DOMAINS=(
  "diyhelp.ai:/Users/nicholas/diyhelp.ai:prj_7XQmuiE7DBZ8ztsgpPu2qQuDQUo7"
  "pokerhud.ai:/Users/nicholas/pokerhud.ai:prj_7pvGLRN5aGqUCObGKhUFImTkns3t"
  "industrial-hire.ai:/Users/nicholas/industrial-hire-ai:prj_b0mq5InmVc2yrz5t8hemBYXds753"
)

echo "=== MEOK Dead Domain Deploy Script ==="
echo "Time: $(date)"
echo ""

for entry in "${DOMAINS[@]}"; do
  IFS=':' read -r domain dir project_id <<< "$entry"
  echo "--- Deploying $domain ---"
  
  if [ ! -d "$dir" ]; then
    echo "  ❌ Directory not found: $dir"
    continue
  fi
  
  cd "$dir"
  
  # Check if already linked to Vercel
  if [ ! -f .vercel/project.json ]; then
    echo "  🔗 Linking to Vercel project $project_id..."
    vercel link --project-id "$project_id" --yes || true
  fi
  
  # Deploy to production
  echo "  🚀 Deploying $domain to production..."
  vercel --prod --yes || echo "  ⚠️ Deploy failed for $domain"
  
  # Verify
  sleep 3
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$domain" 2>/dev/null || echo "000")
  echo "  📡 https://$domain → HTTP $status"
  echo ""
done

echo "=== Deploy complete ==="
echo ""
echo "Next steps for remaining dead domains:"
echo "  - industrial-domains: Init git + create GitHub repo + deploy"
echo "  - asisecurity-portal: Init git + create GitHub repo + deploy"
echo "  - optomobile.ai: Register domain or remove from list"
