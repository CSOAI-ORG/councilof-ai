#!/usr/bin/env bash
# ci/hf-jobs/deploy.sh — .github/workflows/deploy.yml, run as a Hugging Face Job.
#
#   deploy.sh <source> [ref]
#     <source>  git URL | /path/file.bundle | /dir/with/bundles | hf://datasets/csoai/councilof-ai-mirror
#     [ref]     commit / branch / tag to build (default: master)
#
#   env   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID   job secrets (same names as GitHub)
#         GIT_PUSH_TOKEN   optional — HTTPS read auth for the private GitHub clone
#         HF_TOKEN         optional — needed only for the hf://datasets mirror fallback
#         DRY_RUN=1        run every build step and gate; skip the deploy and the live asserts
#         WORK             scratch dir (default: a mktemp dir)
#
# This is NOT a new pipeline. Every named step of deploy.yml appears below, in order,
# with the same command; ci/hf-jobs/steps-drift.test.mjs fails if the lists diverge.
# The first red gate aborts the run (set -e + explicit exits) exactly as GHA would.
# A hosted job is not a laptop: the "never wrangler from a laptop" rule is honoured.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

SOURCE="${1:-}"; REF="${2:-master}"
[ -n "$SOURCE" ] || die "usage: deploy.sh <source> [ref]" 2
WORK="${WORK:-$(mktemp -d "${TMPDIR:-/tmp}/coai-deploy.XXXXXX")}"
REPO="$WORK/repo"
DRY_RUN="${DRY_RUN:-0}"

echo "councilof-ai deploy via HF Jobs — source=$SOURCE ref=$REF dry_run=$DRY_RUN job=${JOB_ID:-local}"
echo "secrets (presence only):"
secret_state CLOUDFLARE_API_TOKEN
secret_state CLOUDFLARE_ACCOUNT_ID
secret_state GIT_PUSH_TOKEN
secret_state HF_TOKEN
require_secret CLOUDFLARE_API_TOKEN
require_secret CLOUDFLARE_ACCOUNT_ID
for t in node npm npx git; do need_cmd "$t"; done
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "node >= 20 required (deploy.yml uses setup-node 20); found $(node -v)"

prep "checkout (actions/checkout@v4)"
resolve_source "$SOURCE" "$REF" "$REPO"
cd "$REPO"
prep "setup-node 20 (image provides $(node -v))"

step 'One-door guard (AG UI is Council OS)'
node scripts/one-door-guard.mjs

step 'No committed conflict markers (blocks the 2026-08-24 build break)'
node scripts/no-conflict-markers.mjs

step 'Redirects guard — selftest, then the real file'
node scripts/redirects-guard.mjs --selftest
node scripts/redirects-guard.mjs public/_redirects

step 'Pages size guard — 25 MiB per-file limit (source assets)'
node scripts/pages-size-guard.mjs public

step 'Install deps'
if [ "$DRY_RUN" = "1" ] && [ -n "${NODE_MODULES_LINK:-}" ] && [ -d "$NODE_MODULES_LINK" ]; then
  # Local dry-run only: borrow an installed tree instead of a 5-minute npm install.
  ln -s "$NODE_MODULES_LINK" node_modules
  echo "    DRY_RUN: linked node_modules → $NODE_MODULES_LINK (the job runs npm install)"
else
  npm install --no-audit --no-fund
fi

step 'Build client'
npm run build:client

step 'Council OS shell smoke — gating; 12 of 12 must pass on desktop + mobile'
step 'Prerender all routes'
if [ "$(uname -s)" = "Linux" ]; then
  npx playwright install --with-deps chromium
else
  npx playwright install chromium   # macOS dry-run: --with-deps would call brew
fi
bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350

step 'Check prerender report against the filesystem'
node scripts/check-prerender.mjs dist/client

step 'Copy corrected field pages from source into dist (vite skips public/*.html)'
rm -f dist/client/gspc-scoreboard.html
node scripts/place-end-user-aliases.mjs dist/client
for b in carebench conductbench defbench detbench mcpbench machbench ossbench pqcbench provbench swarmbench xrbench arena govbench agibench paper-district claimguard; do
  if [ -f "client/public/$b.html" ]; then
    cp "client/public/$b.html" "dist/client/$b.html"
    mkdir -p "dist/client/$b"
    cp "client/public/$b.html" "dist/client/$b/index.html"
    echo "placed $b (standalone wins over prerendered shell)"
  fi
done

step 'Brand gate — block deploy on any forbidden display string (audit §6.2)'
node scripts/brand-gate.mjs dist/client

step 'Signed-JSON guard — a stub or broken /signed/*.json blocks the deploy'
node scripts/signed-json-guard.mjs dist/client

step 'Price gate — no published price, no unevidenced popularity claim'
node scripts/price-gate.mjs dist/client

step 'Facts gate — no claim may contradict facts.json'
node scripts/facts-gate.mjs dist/client

step 'Dist bundle guard — stranger paths + API functions present'
for p in sov-os/index.html api-docs/index.html os/index.html gspc-verify/index.html; do
  if [ ! -f "dist/client/$p" ]; then
    echo "MISSING dist/client/$p — prerender did not snapshot this route"
    exit 1
  fi
  echo "ok dist/client/$p ($(wc -c < dist/client/$p) bytes)"
done
for fn in functions/api/receipts/latest.ts functions/api/east-west-bench.ts functions/api/evidence-pack.ts functions/api/cards.ts functions/api/axis-register.ts functions/api/auth/[[path]].ts functions/api/dashboard/stats.ts functions/api/_authCrypto.ts functions/api/challenge.ts functions/api/wave-dashboard.ts functions/api/counters.ts functions/api/state.ts functions/api/eunomia-data.ts functions/api/_chatLobby.ts functions/enterprise.ts functions/enterprises.ts functions/chat.ts functions/pricing.ts; do
  test -f "$fn" || (echo "missing $fn" && exit 1)
done

step 'Pages size guard — 25 MiB per-file limit (built tree)'
node scripts/pages-size-guard.mjs dist/client

# Same three alias names deploy.yml writes; identical wrangler invocations.
wrangler_deploy_all() {
  npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=master --commit-dirty=true
  npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=main --commit-dirty=true
  npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=production --commit-dirty=true
}
assert_live() {
  node scripts/assert-prerender-live.mjs --label "$1" \
    --host https://councilof.ai \
    --also https://councilof-ai.pages.dev
}

step 'Deploy → councilof.ai'
if [ "$DRY_RUN" = "1" ]; then
  skipped "DRY_RUN — gated tree built at $REPO/dist/client ($(du -sh dist/client | cut -f1)); nothing uploaded"
  echo; echo "DRY RUN COMPLETE — every gate green through 'Pages size guard (built tree)'."
  echo "Remaining steps are deploy + live assertions and were skipped."
  exit 0
fi
command -v wrangler >/dev/null 2>&1 || echo "    wrangler not preinstalled — npx fetches latest, exactly as deploy.yml does"
with_timeout 480 bash -c "$(declare -f wrangler_deploy_all); wrangler_deploy_all"

step 'Assert apex + production alias received the prerender'
IMMEDIATE=success
sleep 20
with_timeout 300 bash -c "$(declare -f assert_live); assert_live immediate" || IMMEDIATE=failure   # continue-on-error

step 'Recheck after trailing-clobber window'
RECHECK=success
echo "waiting 120s for a Git/Mac overwrite of the production alias..."
sleep 120
with_timeout 300 bash -c "$(declare -f assert_live); assert_live recheck" || RECHECK=failure        # continue-on-error

step 'Anti-clobber — redeploy gated tree if assert or recheck failed'
if [ "$IMMEDIATE" = "failure" ] || [ "$RECHECK" = "failure" ]; then
  echo "RECHECK FAILED — re-stamping master/main/production aliases"
  wrangler_deploy_all
  sleep 30
  assert_live anti-clobber
else
  skipped "immediate=$IMMEDIATE recheck=$RECHECK"
fi

step 'Confirm gated tree still holds'
echo "waiting 90s to confirm the gated tree stuck..."
sleep 90
if assert_live hold; then
  echo "hold: production still fat"
  exit 0
fi
echo "hold lost — rewriting master/main/production"
wrangler_deploy_all
sleep 25
assert_live hold-heal
