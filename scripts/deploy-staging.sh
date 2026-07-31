#!/usr/bin/env bash
# deploy-staging.sh — guards the master-site deploy to STAGING (csoai-site → staging preview).
#
# Why this exists (2026-07-31): same silent-failure pattern as deploy-prod.sh.
# A bare `npx wrangler pages deploy` without --branch=<name> defaults to a preview
# environment, but it gets a random short-id URL and is hard to point at for
# verification. This script locks the staging deploy to the `staging` branch,
# gives it the stable `staging.csoai-site.pages.dev` alias, and verifies the
# served bundle matches the local build.
#
# Relationship to deploy-prod.sh:
#   - deploy-prod.sh  →  --branch=main       →  www.csoai.org
#   - deploy-staging.sh →  --branch=staging   →  staging.csoai-site.pages.dev
#
# Same load-bearing piece: --branch=<name> is required to land in a NAMED
# environment. Drop it and you get a one-shot short-id URL that nobody can
# find again.
#
# Usage:
#   bash scripts/deploy-staging.sh            # build + deploy to staging
#   bash scripts/deploy-staging.sh --dry      # check + show what would run, no deploy
#   bash scripts/deploy-staging.sh --rollback <short_id>
#                                          # roll staging to a previous deployment
#
# First-run note: the `staging` git branch must exist locally. If it doesn't,
# the script creates it from `main`. Pages needs the branch to exist on the
# remote (CF fetches it during deploy).
set -euo pipefail

PROJECT="csoai-site"
BRANCH="staging"
ALIAS="staging.csoai-site.pages.dev"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# ── pre-flight checks ───────────────────────────────────────────────────────
command -v npx >/dev/null 2>&1 || { echo "FATAL: npx not found"; exit 2; }
command -v curl >/dev/null 2>&1 || { echo "FATAL: curl not found"; exit 2; }
command -v git >/dev/null 2>&1 || { echo "FATAL: git not found"; exit 2; }

# Warn on uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "WARN: working tree has uncommitted changes (use --commit-dirty=true if intended)"
fi

# Verify build artifact exists
if [ ! -d "dist/client" ] || [ ! -f "dist/client/index.html" ]; then
  echo "dist/client/ missing — run 'npm run build:client' first"
  exit 3
fi

# Make sure the staging branch exists locally; if not, create from the default branch.
# Pages fetches from the remote during deploy, so the branch must be pushed too.
# Note: councilof-ai's mainline is 'master' even though CF Pages is configured with
# production_branch=main — the prod deploy script explicitly passes --branch=main,
# staging just needs a stable local branch to base off.
DEFAULT_BRANCH="master"
if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Creating local '$BRANCH' branch from '$DEFAULT_BRANCH'..."
  git branch "$BRANCH" "$DEFAULT_BRANCH"
fi

# Check whether the staging branch has been pushed to the remote.
# CF Pages needs it to fetch and build (or wrangler will fall back to ad-hoc preview).
if ! git ls-remote --heads origin "$BRANCH" 2>/dev/null | grep -q "$BRANCH"; then
  echo "Pushing '$BRANCH' to origin (CF Pages fetches from here)..."
  git push -u origin "$BRANCH"
fi

# Pull the current staging deployment (preview env, branch=staging) for diff
STAGING_JSON=$(curl -s --max-time 10 \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:-}" \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID:-52092e4dad74b51759a2f748c8cf2528}/pages/projects/${PROJECT}/deployments?env=preview&branch=${BRANCH}&per_page=3" 2>/dev/null || echo "")

if [ -n "$STAGING_JSON" ]; then
  CURRENT_STAGING=$(echo "$STAGING_JSON" | python3 -c "
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
  if [ -n "$CURRENT_STAGING" ]; then
    echo ""
    echo "Current staging deployment (branch=$BRANCH):"
    echo "$CURRENT_STAGING" | sed 's/^/  /'
    echo ""
  fi
fi

# Verify the build is real
LOCAL_BUNDLE=$(grep -oE 'index-[A-Za-z0-9_-]+\.js' dist/client/index.html 2>/dev/null | head -1)
if [ -z "$LOCAL_BUNDLE" ]; then
  echo "FATAL: could not find main bundle hash in dist/client/index.html — build looks broken"
  exit 4
fi

LOCAL_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")

echo "About to deploy to STAGING:"
echo "  project:  $PROJECT"
echo "  branch:   $BRANCH  (preview environment — alias $ALIAS)"
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
  echo "Rolling staging deployment to $TARGET..."
  # wrangler pages doesn't have a direct rollback-by-short-id command.
  # Workaround: re-trigger the deploy with the old commit checked out on the
  # staging branch, then push.
  echo "FATAL: --rollback not yet supported on staging — restore the old commit on"
  echo "       the '$BRANCH' branch and re-run without --rollback"
  exit 6
fi

# Dry-run flow
if [ "${1:-}" = "--dry" ]; then
  echo "DRY RUN — no deploy fired"
  echo "Would run:"
  echo "  npx wrangler pages deploy dist/client --project-name=$PROJECT --branch=$BRANCH --commit-dirty=true"
  exit 0
fi

# ── pre-deploy smoke test ───────────────────────────────────────────────────
# Same gate as deploy-prod.sh — start a local preview server, run the fast
# Playwright smoke test, block deploy if any uncaught JS exceptions fire.
if [ "${1:-}" != "--skip-test" ]; then
  echo "Running pre-deploy smoke test against local build..."
  npx vite preview --config client/vite.config.ts --port 4173 --strictPort &
  PREVIEW_PID=$!
  for i in $(seq 1 15); do
    if curl -s --max-time 1 http://localhost:4173/ > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  BASE_URL=http://localhost:4173 npx playwright test e2e/tests/pre-deploy-smoke.spec.ts --project=chromium --reporter=line 2>&1 | tail -20
  TEST_RC=${PIPESTATUS[0]}
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
# Missing it = random short-id preview that nobody can find again.
echo "Deploying to STAGING ($BRANCH branch, alias $ALIAS)..."
npx wrangler pages deploy dist/client \
  --project-name="$PROJECT" \
  --branch="$BRANCH" \
  --commit-dirty=true

# ── post-deploy verification ───────────────────────────────────────────────
echo ""
echo "Verifying $ALIAS now serves the new bundle..."
sleep 4
SERVED_BUNDLE=$(curl -s --max-time 10 -L "https://$ALIAS/?$(date +%s%N)" \
  | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)

if [ "$SERVED_BUNDLE" = "$LOCAL_BUNDLE" ]; then
  echo "OK: $ALIAS serves $SERVED_BUNDLE (matches local build)"
else
  echo "FAIL: $ALIAS serves '$SERVED_BUNDLE' but local build is '$LOCAL_BUNDLE'"
  echo "  CF Pages may still be propagating — re-run this script in ~60s"
  exit 5
fi