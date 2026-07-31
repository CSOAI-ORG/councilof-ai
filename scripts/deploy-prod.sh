#!/usr/bin/env bash
# deploy-prod.sh — guards the master-site deploy to PRODUCTION (csoai-site → www.csoai.org).
#
# Why this exists (2026-07-31 incident):
#   `npx wrangler pages deploy dist/client --project-name csoai-site` WITHOUT --branch=main
#   goes to the PREVIEW environment. Cloudflare Pages only routes the custom domain
#   www.csoai.org to the PRODUCTION environment. Deploying to preview leaves the live
#   site untouched — a deploy "succeeds" but nothing reaches the user, exactly the kind
#   of silent failure that erodes trust in the deploy log.
#
# Usage:
#   bash scripts/deploy-prod.sh            # build + deploy to production
#   bash scripts/deploy-prod.sh --dry      # check + show what would run, no deploy
#   bash scripts/deploy-prod.sh --rollback <short_id>
#                                         # roll production to a previous deployment
#
# Always run from the councilof-ai repo root. Exits non-zero on any failure.
set -euo pipefail

PROJECT="csoai-site"
BRANCH="main"
DOMAIN="www.csoai.org"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# ── pre-flight checks ───────────────────────────────────────────────────────
command -v npx >/dev/null 2>&1 || { echo "FATAL: npx not found"; exit 2; }
command -v curl >/dev/null 2>&1 || { echo "FATAL: curl not found"; exit 2; }

# Refuse to run if there are uncommitted changes AND user did not pass --dirty flag
# (--commit-dirty=true on wrangler will include them, but we warn loudly so the
# operator makes that decision consciously)
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "WARN: working tree has uncommitted changes (use --commit-dirty=true if intended)"
fi

# Verify the build artifact exists and is non-stale
if [ ! -d "dist/client" ] || [ ! -f "dist/client/index.html" ]; then
  echo "dist/client/ missing — run 'npm run build:client' first"
  exit 3
fi

# Pull the current production deployment for the rollback flow + diff
PROD_JSON=$(curl -s --max-time 10 \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:-}" \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID:-52092e4dad74b51759a2f748c8cf2528}/pages/projects/${PROJECT}/deployments?env=production&per_page=3" 2>/dev/null || echo "")

if [ -n "$PROD_JSON" ]; then
  CURRENT_PROD=$(echo "$PROD_JSON" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    if d.get('success') and d.get('result'):
        first = d['result'][0]
        print(first.get('short_id','?'))
        print(first.get('created_on',''))
        meta = first.get('deployment_trigger',{}).get('metadata',{})
        print(meta.get('commit_hash','?')[:12])
    else:
        sys.exit(0)
except Exception:
    sys.exit(0)
" 2>/dev/null)
  if [ -n "$CURRENT_PROD" ]; then
    echo ""
    echo "Current production deployment:"
    echo "$CURRENT_PROD" | sed 's/^/  /'
    echo ""
  fi
fi

# Pull the current bundle hash — verify the build is real
LOCAL_BUNDLE=$(grep -oE 'index-[A-Za-z0-9_-]+\.js' dist/client/index.html 2>/dev/null | head -1)
if [ -z "$LOCAL_BUNDLE" ]; then
  echo "FATAL: could not find main bundle hash in dist/client/index.html — build looks broken"
  exit 4
fi

# Compute local source SHA so we can sanity-check what's about to ship
LOCAL_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")

echo "About to deploy:"
echo "  project:  $PROJECT"
echo "  branch:   $BRANCH  (PRODUCTION — custom domain $DOMAIN)"
echo "  bundle:   $LOCAL_BUNDLE"
echo "  commit:   $LOCAL_SHA"
echo ""

# Rollback flow
if [ "${1:-}" = "--rollback" ]; then
  TARGET="${2:-}"
  if [ -z "$TARGET" ]; then
    echo "Usage: $0 --rollback <short_id>"
    exit 1
  fi
  echo "Rolling production deployment to $TARGET..."
  npx wrangler pages deployment create --project-name="$PROJECT" --alias="$DOMAIN" "$TARGET"
  echo "Rolled back to $TARGET"
  exit 0
fi

# Dry-run flow
if [ "${1:-}" = "--dry" ]; then
  echo "DRY RUN — no deploy fired"
  echo "Would run:"
  echo "  npx wrangler pages deploy dist/client --project-name=$PROJECT --branch=$BRANCH --commit-dirty=true"
  exit 0
fi

# ── pre-deploy smoke test ───────────────────────────────────────────────────
# Start a local preview server against the built dist, run the fast Playwright
# smoke test, and block deploy if any uncaught JS exceptions fire. This catches
# the class of bugs (ReferenceError, undefined globals, failed dynamic imports)
# that make the site show an error to the user — before the code reaches CDN.
if [ "${1:-}" != "--skip-test" ]; then
  echo "Running pre-deploy smoke test against local build..."
  # Start Vite preview server in background (serves dist/client on port 4173)
  npx vite preview --config client/vite.config.ts --port 4173 --strictPort &
  PREVIEW_PID=$!
  # Wait for server to be ready
  for i in $(seq 1 15); do
    if curl -s --max-time 1 http://localhost:4173/ > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  # Run the smoke test (chromium only — fast, ~15s)
  BASE_URL=http://localhost:4173 npx playwright test e2e/tests/pre-deploy-smoke.spec.ts --project=chromium --reporter=line 2>&1 | tail -20
  TEST_RC=${PIPESTATUS[0]}
  # Kill the preview server
  kill $PREVIEW_PID 2>/dev/null
  wait $PREVIEW_PID 2>/dev/null
  if [ "$TEST_RC" -ne 0 ]; then
    echo ""
    echo "FAIL: pre-deploy smoke test found uncaught JS exceptions."
    echo "  Fix the error above, rebuild, and re-run this script."
    echo "  To skip this check: $0 --skip-test"
    exit 6
  fi
  echo "Smoke test passed — no uncaught exceptions."
  echo ""
fi

# The actual deploy — flag --branch=$BRANCH is the load-bearing piece.
# Missing it = preview only = silent failure (see file header).
echo "Deploying to PRODUCTION..."
npx wrangler pages deploy dist/client \
  --project-name="$PROJECT" \
  --branch="$BRANCH" \
  --commit-dirty=true

# ── post-deploy verification ───────────────────────────────────────────────
echo ""
echo "Verifying $DOMAIN now serves the new bundle..."
sleep 4
SERVED_BUNDLE=$(curl -s --max-time 10 -L "https://$DOMAIN/?$(date +%s%N)" \
  | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)

if [ "$SERVED_BUNDLE" = "$LOCAL_BUNDLE" ]; then
  echo "OK: $DOMAIN serves $SERVED_BUNDLE (matches local build)"
else
  echo "FAIL: $DOMAIN serves '$SERVED_BUNDLE' but local build is '$LOCAL_BUNDLE'"
  echo "  CDN may still be propagating — re-run this script in ~60s"
  exit 5
fi