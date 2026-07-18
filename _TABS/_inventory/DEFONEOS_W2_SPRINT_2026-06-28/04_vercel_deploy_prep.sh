#!/usr/bin/env bash
# Vercel deploy prep for the 2 DEFONEOS pages.
# DO NOT FIRE UNLESS EXPLICITLY AUTHORIZED BY NICK.
# Per meok-ai/AGENTS.md: "Don't ship new Vercel deploys unless the user
# explicitly requests it" (24-48h WAF mitigation window).
#
# When Nick says "deploy", run this script from the appropriate repo.
# When he says "wait", don't.

set -euo pipefail

echo "=== W2 STEP 3: Vercel deploy prep (WAIT FOR NICK'S OK) ==="
echo ""
echo "This script is READY-TO-FIRE. It does NOT auto-execute."
echo "Run the 2 commands below when Nick says 'deploy'."
echo ""

# === meok.ai/defoneos (run from ~/meok-ai/) ===
echo "## meok.ai/defoneos"
echo "cd /Users/nicholas/meok-ai/ui"
echo "npx next build 2>&1 | tail -20"
echo ""
echo "# Pre-alias check (the script Nick uses before every alias):"
echo "/Users/nicholas/clawd/meok.ai/_ops/pre_realias_check.sh <new-vercel-app-url>"
echo ""
echo "# If green: deploy + alias"
echo "vercel deploy --prod --yes --force 2>&1 | tail -10"
echo "# After deploy: confirm /defoneos returns 200"
echo "curl -s -o /dev/null -w '%{http_code}' https://meok.ai/defoneos"
echo ""

# === csoai.org/defoneos (run from ~/clawd/csoai-org-v2/) ===
echo "## csoai.org/defoneos"
echo "cd /Users/nicholas/clawd/csoai-org-v2"
echo "npm run build 2>&1 | tail -20"
echo ""
echo "vercel deploy --prod --yes --force 2>&1 | tail -10"
echo "# After deploy: confirm /defoneos returns 200"
echo "curl -s -o /dev/null -w '%{http_code}' https://csoai.org/defoneos"
echo ""

# === post-deploy verification ===
echo "## post-deploy verification"
echo "1. Open https://meok.ai/defoneos in browser — check BannedTermGate footer"
echo "2. Open https://csoai.org/defoneos in browser — check the 3-curl verify example"
echo "3. Confirm meok.ai/llms.txt + csoai.org/llms.txt include /defoneos"
echo "4. IndexNow submission (if URL changed):"
echo "   curl -X POST https://api.indexnow.org/IndexNow \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"host\":\"meok.ai\",\"key\":\"<indexnow-key>\",\"urlList\":[\"https://meok.ai/defoneos\"]}'"
echo ""

# === rollback plan ===
echo "## rollback (if either page breaks)"
echo "1. Check the meok-ai/AGENTS.md §Vercel deploys block for the 10 mitigations"
echo "2. Revert to the 3h-old deploy (e.g. ui-q1nq7zf8l for meok.ai)"
echo "3. Open the Vercel dashboard > Deployments > click 3h-old > Promote to Production"
echo "4. Then fix the broken page in the worktree + commit + open a new PR"
echo ""

echo "=== FIRE WHEN NICK SAYS DEPLOY. OTHERWISE HOLD. ==="
